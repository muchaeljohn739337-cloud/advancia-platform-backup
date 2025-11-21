# RabbitMQ Background Job Queue

## Overview

RabbitMQ message queue system for handling asynchronous background jobs, starting with notification processing. This enables team collaboration by decoupling job producers from consumers.

## Architecture

```
┌─────────────┐       ┌─────────────┐       ┌──────────────┐
│   Backend   │──────▶│  RabbitMQ   │──────▶│    Worker    │
│   (API)     │ Queue │   Server    │ Poll  │  (Consumer)  │
└─────────────┘       └─────────────┘       └──────────────┘
     │                                              │
     │                                              ▼
     │                                      ┌──────────────┐
     └─────────────────────────────────────▶│  PostgreSQL  │
                                            └──────────────┘
```

## Components

### 1. Queue Utility (`backend/src/utils/queue.ts`)

Core RabbitMQ wrapper with:

- **initQueue()**: Initialize connection and channels
- **sendToQueue(queueName, message)**: Publish messages
- **consumeQueue(queueName, handler)**: Consume messages
- **closeQueue()**: Graceful shutdown

### 2. Notification Worker (`backend/src/workers/notificationWorker.ts`)

Processes notification jobs:

- Validates user exists
- Sends via notification service (Socket.IO, push, email)
- Records in database
- Handles failures with retry

### 3. Backend Integration (`backend/src/index.ts`)

- Initializes queue on startup
- Closes connection on shutdown (SIGINT/SIGTERM)
- Non-blocking: continues if RabbitMQ unavailable

## Setup

### 1. Environment Variables

Add to `backend/.env`:

```bash
# RabbitMQ Configuration
RABBITMQ_URL=amqp://advancia:rabbitmq_pass_change_in_prod@localhost:5672

# For production, use a secure password:
# RABBITMQ_URL=amqp://username:strong_password@rabbitmq-host:5672
```

### 2. Docker Setup

Start RabbitMQ with Docker Compose:

```bash
docker-compose up rabbitmq -d
```

This starts:

- RabbitMQ server on port **5672** (AMQP)
- Management UI on port **15672** (HTTP)

Access Management UI:

- URL: http://localhost:15672
- Username: `advancia`
- Password: `rabbitmq_pass_change_in_prod`

### 3. Backend Setup

The backend automatically initializes the queue on startup. No additional configuration needed.

### 4. Worker Setup

Start the notification worker in a separate terminal:

```bash
cd backend
npm run worker
```

Or with PM2 for production:

```bash
pm2 start src/workers/notificationWorker.ts --name notification-worker --interpreter ts-node
```

## Usage

### Sending Jobs to Queue

From any route or service:

```typescript
import { sendToQueue } from "../utils/queue";

// Send notification job
await sendToQueue("notifications", {
  userId: 123,
  type: "payment_success",
  title: "Payment Received",
  message: "Your payment of $50 was successful",
  priority: "high",
  metadata: {
    transactionId: "tx_123456",
    amount: 50,
  },
});
```

### Job Payload Structure

```typescript
interface NotificationJob {
  userId: number; // Target user ID
  type: string; // Notification type
  title: string; // Notification title
  message: string; // Notification content
  priority?: "high" | "normal" | "low";
  metadata?: Record<string, any>;
}
```

## Testing

### Quick Test

Run the test script:

```bash
cd backend
node test-queue.js
```

This will:

1. Connect to RabbitMQ
2. Send test notifications
3. Verify queue is working

### Integration Test

1. Start RabbitMQ:

   ```bash
   docker-compose up rabbitmq -d
   ```

2. Start backend:

   ```bash
   cd backend
   npm run dev
   ```

3. Start worker (separate terminal):

   ```bash
   cd backend
   npm run worker
   ```

4. Send test notification:

   ```bash
   node test-queue.js
   ```

5. Check worker logs to see processing

## Monitoring

### RabbitMQ Management UI

Access: http://localhost:15672

Features:

- View queues and message counts
- Monitor consumer connections
- Track message rates
- Inspect message contents
- View connection details

### Queue Metrics

Important metrics to monitor:

- **Messages Ready**: Queued jobs waiting
- **Messages Unacknowledged**: Jobs being processed
- **Consumer Count**: Active workers
- **Publish Rate**: Jobs/second being added
- **Delivery Rate**: Jobs/second being processed

### Logs

Backend logs:

```bash
# Docker logs
docker-compose logs backend -f

# PM2 logs
pm2 logs advancia-backend
```

Worker logs:

```bash
pm2 logs notification-worker
```

## Production Deployment

### 1. Secure Credentials

Update `docker-compose.yml` or use environment variables:

```yaml
rabbitmq:
  environment:
    RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
    RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASS}
```

### 2. Persistent Storage

Already configured in `docker-compose.yml`:

```yaml
volumes:
  - rabbitmq_data:/var/lib/rabbitmq
```

### 3. Worker Scaling

Run multiple workers for high throughput:

```bash
pm2 start src/workers/notificationWorker.ts -i 3 --name notification-worker
```

### 4. Health Checks

RabbitMQ healthcheck configured in `docker-compose.yml`:

```yaml
healthcheck:
  test: ["CMD", "rabbitmq-diagnostics", "ping"]
  interval: 10s
  timeout: 5s
  retries: 5
```

Backend startup handles RabbitMQ unavailability gracefully.

## Adding New Queue Types

### 1. Define Job Interface

```typescript
// backend/src/types/jobs.ts
interface EmailJob {
  to: string;
  subject: string;
  body: string;
  template?: string;
}
```

### 2. Create Worker

```typescript
// backend/src/workers/emailWorker.ts
import { consumeQueue } from "../utils/queue";

async function processEmail(job: EmailJob) {
  // Process email
}

consumeQueue("emails", async (message) => {
  const job = JSON.parse(message.content.toString());
  await processEmail(job);
  return true; // ACK
});
```

### 3. Send Jobs

```typescript
import { sendToQueue } from "../utils/queue";

await sendToQueue("emails", {
  to: "user@example.com",
  subject: "Welcome",
  body: "Welcome to Advancia!",
});
```

### 4. Add Worker Script

```json
// package.json
{
  "scripts": {
    "worker:email": "ts-node src/workers/emailWorker.ts"
  }
}
```

## Queue Patterns

### High Priority Jobs

```typescript
await sendToQueue(
  "notifications",
  {
    userId: 123,
    type: "security_alert",
    title: "Security Alert",
    message: "Suspicious login detected",
    priority: "high",
  },
  { priority: 10 } // RabbitMQ priority (0-10)
);
```

### Delayed Jobs

```typescript
// Requires RabbitMQ delayed message plugin
await sendToQueue(
  "notifications",
  { userId: 123, type: "reminder", title: "Reminder", message: "..." },
  { headers: { "x-delay": 60000 } } // 60 seconds delay
);
```

### Dead Letter Queue (DLQ)

Configure automatic retry and DLQ in queue setup:

```typescript
await channel.assertQueue("notifications", {
  durable: true,
  arguments: {
    "x-dead-letter-exchange": "dlx",
    "x-dead-letter-routing-key": "notifications.dlq",
    "x-message-ttl": 300000, // 5 minutes
  },
});
```

## Troubleshooting

### Connection Failed

**Error**: `Error: connect ECONNREFUSED 127.0.0.1:5672`

**Solution**:

```bash
# Check if RabbitMQ is running
docker-compose ps rabbitmq

# Start RabbitMQ
docker-compose up rabbitmq -d

# Check logs
docker-compose logs rabbitmq
```

### Authentication Failed

**Error**: `Error: ACCESS_REFUSED - Login was refused`

**Solution**: Verify credentials in `.env` match `docker-compose.yml`

### Messages Not Processing

**Checklist**:

1. Is worker running? `pm2 list`
2. Is worker connected? Check Management UI → Connections
3. Are messages in queue? Check Management UI → Queues
4. Check worker logs: `pm2 logs notification-worker`

### High Memory Usage

**Solution**: Limit prefetch count in worker:

```typescript
await channel.prefetch(10); // Process max 10 messages at once
```

## Best Practices

1. **Idempotent Jobs**: Design jobs to be safely retried
2. **Timeout Handling**: Set reasonable timeouts for long operations
3. **Error Logging**: Log failures with context for debugging
4. **Monitoring**: Set up alerts for queue depth and processing rates
5. **Graceful Shutdown**: Always close connections properly
6. **Message Validation**: Validate job payloads before processing
7. **Dead Letter Queues**: Configure DLQ for failed messages
8. **Worker Scaling**: Scale workers based on queue depth

## Resources

- [RabbitMQ Docs](https://www.rabbitmq.com/documentation.html)
- [amqplib NPM](https://www.npmjs.com/package/amqplib)
- [RabbitMQ Management Plugin](https://www.rabbitmq.com/management.html)

## Team Collaboration

### Development Workflow

1. **Local Development**: Each developer runs own RabbitMQ instance
2. **Shared Dev Environment**: Use cloud-hosted RabbitMQ (CloudAMQP, AWS MQ)
3. **Testing**: Use test queue names with developer prefix (`dev_john_notifications`)

### Adding New Workers

1. Create worker file in `backend/src/workers/`
2. Add script to `package.json`
3. Document in this README
4. Add to PM2 ecosystem config
5. Deploy with backend

### Monitoring Access

Grant team access to Management UI with appropriate roles:

- **Admin**: Full access (production team only)
- **Monitoring**: Read-only access (all developers)
- **Management**: Create/delete queues (backend team)

---

**Last Updated**: 2025-11-21
**Maintainer**: Backend Team
