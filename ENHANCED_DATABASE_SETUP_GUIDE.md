# Enhanced Test Database Setup Guide

## Overview

The enhanced test database setup system provides robust, production-ready database management for development and testing environments. It includes comprehensive error handling, environment validation, and interactive management tools.

## 🚀 Quick Start

### Setup Database

```bash
# Quick setup
npm run test:db:setup

# Or using the original script
npm run db:setup:test:docker
```

### Interactive Management

```bash
# Launch interactive menu
npm run test:db
```

### Individual Operations

```bash
npm run test:db:health     # Health checks
npm run test:db:reset      # Reset database
npm run test:db:seed       # Add test data
npm run test:db:benchmark  # Performance tests
npm run test:db:cleanup    # Remove container
```

## 📁 Files Structure

```
backend/scripts/
├── setup-test-db-docker.js     # Enhanced setup script
├── test-db-runner.js           # Interactive management tool
├── setup-test-db-local.js      # Legacy local setup
├── setup-test-db-simple.js     # Simple setup option
└── setup-test-db.js           # Original setup script
```

## 🔧 Configuration

The system uses environment variables and intelligent defaults:

```javascript
// Configuration object
const CONFIG = {
  CONTAINER_NAME: "postgres-test",
  POSTGRES_PORT: process.env.POSTGRES_PORT || 5433,
  POSTGRES_USER: "postgres",
  POSTGRES_PASSWORD: "postgres",
  POSTGRES_DB: "advancia_payledger_test",
  POSTGRES_TIMEOUT: 30000,
  DATABASE_URL:
    "postgresql://postgres:postgres@localhost:5433/advancia_payledger_test",
};
```

### Environment File (.env.test)

The setup automatically creates `.env.test` with necessary variables:

```env
NODE_ENV=test
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/advancia_payledger_test
POSTGRES_PORT=5433
JWT_SECRET=test-secret-key
API_KEY=test-api-key
```

## ✨ Key Features

### 1. Enhanced Error Handling

- **Docker Troubleshooting**: Automatic detection and guidance for Docker issues
- **Port Conflicts**: Intelligent port conflict resolution
- **Connection Issues**: Timeout handling with exponential backoff
- **Prisma Errors**: Detailed migration and schema error reporting

### 2. Environment Validation

- **Dependency Checks**: Verifies Docker, Node.js, npm, and Prisma availability
- **File Validation**: Ensures required configuration files exist
- **Network Validation**: Checks port availability and container connectivity

### 3. Graceful Cleanup

- **Signal Handlers**: Properly handles SIGINT, SIGTERM, and uncaught exceptions
- **Automatic Cleanup**: Removes orphaned containers and temporary files
- **Resource Management**: Prevents memory leaks and hanging processes

### 4. Performance Monitoring

- **Connection Benchmarks**: Measures database connection speed
- **Query Performance**: Tests read/write operation timing
- **Resource Usage**: Monitors container memory and CPU usage

### 5. Interactive Management

- **Menu-Driven Interface**: User-friendly command selection
- **Real-time Feedback**: Live status updates and progress indicators
- **Help System**: Contextual troubleshooting guides

## 🎯 Usage Scenarios

### Development Workflow

```bash
# 1. Initial setup
npm run test:db:setup

# 2. Development work...
npm run dev

# 3. Run tests
npm test

# 4. Reset when needed
npm run test:db:reset
```

### Testing Pipeline

```bash
# CI/CD Integration
npm run test:db:setup
npm run test:coverage
npm run test:db:cleanup
```

### Debugging Issues

```bash
# Health diagnostics
npm run test:db:health

# Check logs
npm run test:db --logs

# Performance analysis
npm run test:db:benchmark
```

## 🔍 Troubleshooting

### Common Issues

#### Docker Not Running

```
❌ Docker not found. Install with: winget install Docker.DockerDesktop
💡 Or use CI environment with PostgreSQL
```

**Solution**: Install Docker Desktop and ensure it's running

#### Port Conflicts

```
❌ Port 5433 is already in use
```

**Solutions**:

- Stop conflicting containers: `docker stop postgres-test`
- Use different port: Set `POSTGRES_PORT=5434` in `.env.test`
- Check port usage: `netstat -an | findstr :5433`

#### Connection Timeouts

```
❌ Connection failed: timeout
```

**Solutions**:

- Increase timeout: Modify `POSTGRES_TIMEOUT` in CONFIG
- Check container status: `docker ps -a`
- View container logs: `docker logs postgres-test`

#### Migration Errors

```
❌ Prisma migrate failed
```

**Solutions**:

- Regenerate client: `npx prisma generate`
- Reset database: `npm run test:db:reset`
- Check schema: `npx prisma format`

### Advanced Troubleshooting

#### Manual Container Management

```bash
# Check container status
docker ps -a

# Access container directly
docker exec -it postgres-test psql -U postgres -d advancia_payledger_test

# View detailed logs
docker logs postgres-test --follow

# Remove problematic container
docker rm -f postgres-test
```

#### Alternative Setup Methods

```bash
# Use Docker Compose
docker-compose -f docker-compose.dev-db.yml up

# Use external PostgreSQL
export DATABASE_URL="postgresql://user:pass@host:port/db"

# Use SQLite for testing
# Update schema.prisma provider to 'sqlite'
```

## 🚀 Frontend Integration

### Environment Setup

Add to `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

### CORS Configuration

Ensure `backend/src/config/index.ts` includes your frontend URL:

```javascript
allowedOrigins: [
  "http://localhost:3000", // Next.js dev server
  "http://127.0.0.1:3000", // Alternative localhost
  // ... other origins
];
```

### Socket.IO Client

```javascript
// frontend/lib/socket.js
import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
  autoConnect: false,
});

export default socket;
```

## 📊 Performance Benchmarks

The system includes built-in performance testing:

```bash
npm run test:db:benchmark
```

**Expected Results**:

- Connection: < 50ms
- Read (100 users): < 100ms
- Write (audit log): < 50ms
- Total: < 200ms

**Performance Tips**:

- Use connection pooling in production
- Index frequently queried columns
- Monitor slow queries with `EXPLAIN ANALYZE`
- Consider read replicas for heavy workloads

## 🔄 Migration from Legacy Setup

### Step 1: Backup Current Database

```bash
# Export current data
docker exec postgres-test pg_dump -U postgres advancia_payledger_test > backup.sql
```

### Step 2: Switch to Enhanced Setup

```bash
# Remove old container
npm run test:db:cleanup

# Setup with enhanced script
npm run test:db:setup
```

### Step 3: Restore Data (if needed)

```bash
# Import backup
docker exec -i postgres-test psql -U postgres advancia_payledger_test < backup.sql
```

## 💡 Tips and Best Practices

### Development

- Use interactive menu (`npm run test:db`) for daily development
- Run health checks before important testing sessions
- Keep Docker Desktop updated for best performance

### Testing

- Reset database between test suites for isolation
- Use seeded data for consistent test results
- Monitor performance benchmarks for regression detection

### Production Readiness

- Never use test database configuration in production
- Use proper connection pooling and SSL in production
- Implement proper backup and disaster recovery procedures

### Debugging

- Check logs first: `docker logs postgres-test`
- Use health checks to identify issues quickly
- Monitor resource usage during heavy operations

## 🆘 Support and Resources

### Quick Help Commands

```bash
# Get container status
docker ps -a | grep postgres-test

# Check database size
docker exec postgres-test psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('advancia_payledger_test'));"

# View active connections
docker exec postgres-test psql -U postgres -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"
```

### Documentation Links

- [Docker Desktop Installation](https://www.docker.com/products/docker-desktop/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Project-Specific Help

- Backend README: `backend/README.md`
- Deployment Guide: `DEPLOYMENT_GUIDE.md`
- Architecture Overview: `ARCHITECTURE.md`

---

**Last Updated**: $(date)
**Version**: 2.0.0
**Compatibility**: Node.js 18+, Docker 20+, PostgreSQL 15+
