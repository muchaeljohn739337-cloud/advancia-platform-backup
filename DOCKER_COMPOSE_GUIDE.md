# Docker Compose Helper Scripts

## Quick Commands

### Start all services (detached mode)

```powershell
docker-compose up -d
```

### Start with logs visible

```powershell
docker-compose up
```

### View logs

```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Stop all services

```powershell
docker-compose down
```

### Stop and remove volumes (clean slate)

```powershell
docker-compose down -v
```

### Restart a specific service

```powershell
docker-compose restart backend
```

### Rebuild services after code changes

```powershell
docker-compose up -d --build
```

### Check service status

```powershell
docker-compose ps
```

### Execute commands in containers

```powershell
# Backend shell
docker-compose exec backend bash

# Run Prisma migrations
docker-compose exec backend npx prisma migrate dev

# Frontend shell
docker-compose exec frontend sh

# PostgreSQL shell
docker-compose exec db psql -U postgres -d advancia

# Redis CLI
docker-compose exec redis redis-cli -a redis_dev_password
```

## Service URLs

| Service             | URL                    | Description                                                           |
| ------------------- | ---------------------- | --------------------------------------------------------------------- |
| Frontend            | <http://localhost:3000>  | Next.js web app                                                       |
| Backend API         | <http://localhost:4000>  | Express REST API                                                      |
| PostgreSQL          | localhost:5433         | Database (port changed to avoid conflict)                             |
| Redis               | localhost:6379         | Cache & sessions                                                      |
| RabbitMQ Management | <http://localhost:15672> | Message queue UI (user: advancia, pass: rabbitmq_pass_change_in_prod) |
| Node Debugger       | localhost:9229         | VS Code remote debugging                                              |

## Development Workflow

### 1. First Time Setup

```powershell
# Start all services
docker-compose up -d

# Wait for services to be healthy
docker-compose ps

# Run database migrations
docker-compose exec backend npx prisma migrate dev

# Generate Prisma client
docker-compose exec backend npx prisma generate

# Seed database (if you have seed script)
docker-compose exec backend npx prisma db seed
```

### 2. Daily Development

```powershell
# Start services
docker-compose up -d

# View logs in real-time
docker-compose logs -f backend frontend

# Make code changes (auto-reload enabled in docker-compose.override.yml)

# Stop when done
docker-compose down
```

### 3. Database Management

```powershell
# Connect to PostgreSQL
docker-compose exec db psql -U postgres -d advancia

# Run SQL commands
docker-compose exec db psql -U postgres -d advancia -c "SELECT * FROM \"User\" LIMIT 5;"

# Backup database
docker-compose exec db pg_dump -U postgres advancia > backup.sql

# Restore database
docker-compose exec -T db psql -U postgres advancia < backup.sql

# Reset database (CAUTION: deletes all data)
docker-compose exec backend npx prisma migrate reset
```

### 4. Troubleshooting

```powershell
# View service health status
docker-compose ps

# Check specific service logs
docker-compose logs backend --tail=100

# Restart unhealthy service
docker-compose restart backend

# Rebuild service from scratch
docker-compose up -d --build --force-recreate backend

# Remove all containers and volumes (nuclear option)
docker-compose down -v --remove-orphans
docker system prune -a
```

## Port Conflicts

If you get "port already in use" errors:

### PostgreSQL Port 5433

```powershell
# Check what's using port 5433
netstat -ano | findstr :5433

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Backend Port 4000

```powershell
# Find process using port 4000
Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess

# Stop PM2 if running
pm2 stop all
pm2 delete all
```

### Frontend Port 3000

```powershell
# Find and kill process on port 3000
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
```

## Environment Variables

### Backend (.env)

The backend container uses environment variables from `docker-compose.yml`. For local development outside Docker, use `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/advancia?schema=public
REDIS_URL=redis://:redis_dev_password@localhost:6379
RABBITMQ_URL=amqp://advancia:rabbitmq_pass_change_in_prod@localhost:5672
NODE_ENV=development
PORT=4000
```

### Frontend (.env.local)

For local development outside Docker:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
NEXT_TELEMETRY_DISABLED=1
```

## VS Code Integration

### Attach Debugger to Backend

Add to `.vscode/launch.json`:

```json
{
  "name": "Attach to Docker Backend",
  "type": "node",
  "request": "attach",
  "port": 9229,
  "address": "localhost",
  "localRoot": "${workspaceFolder}/backend",
  "remoteRoot": "/app",
  "protocol": "inspector",
  "restart": true,
  "skipFiles": ["<node_internals>/**"]
}
```

### Docker Extension

Install the Docker extension for VS Code to manage containers from the UI.

## Performance Tips

### Speed up builds

```powershell
# Use BuildKit for faster builds
$env:DOCKER_BUILDKIT=1
$env:COMPOSE_DOCKER_CLI_BUILD=1
docker-compose build
```

### Clean up unused resources

```powershell
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a --volumes
```

## Production Deployment

For production, use:

```powershell
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

This will:

-   Disable hot reload
-   Use production builds
-   Enable optimizations
-   Use production environment variables

## Monitoring

### Check container resource usage

```powershell
docker stats
```

### View container details

```powershell
docker-compose ps
docker inspect advancia_backend
```

### Health checks

```powershell
# All services
docker-compose ps

# Specific service
docker inspect advancia_backend | Select-String -Pattern "Health"
```

## WSL Integration (When WSL is fixed)

Once WSL is working, you can run Docker from WSL for better performance:

```bash
# In WSL
cd /mnt/c/Users/mucha.DESKTOP-H7T9NPM/-modular-saas-platform
docker-compose up -d
```

## Common Issues

### "Error response from daemon: Conflict"

```powershell
docker-compose down
docker-compose up -d
```

### "Port is already allocated"

Change the port mapping in docker-compose.yml or stop the conflicting service.

### "Cannot connect to Docker daemon"

Ensure Docker Desktop is running:

```powershell
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

### Containers keep restarting

Check logs for errors:

```powershell
docker-compose logs backend
```

Common causes:

-   Database migrations failed
-   Environment variables missing
-   Port conflicts
-   Build errors
