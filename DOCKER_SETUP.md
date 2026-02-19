# Docker Setup Guide

This guide explains how to run the ParkEase application using Docker and Docker Compose.

## Prerequisites

- Docker 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- Docker Compose 2.0+ (included with Docker Desktop)
- 2GB+ available RAM
- 5GB+ available disk space

## Quick Start

### 1. Prepare Environment Variables

```bash
# Copy the Docker environment template
cp .env.docker .env.docker.local

# Edit with your values (optional for local development)
nano .env.docker.local
```

### 2. Start All Services

```bash
# Build images and start services
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app
docker-compose logs -f db
docker-compose logs -f redis
```

### 3. Verify Services Are Running

```bash
# Check service status
docker-compose ps

# Expected output:
# NAME               STATUS              PORTS
# parkease-app       Up (healthy)        0.0.0.0:3000->3000/tcp
# parkease-db        Up (healthy)        0.0.0.0:5432->5432/tcp
# parkease-redis     Up (healthy)        0.0.0.0:6379->6379/tcp
```

### 4. Access the Application

- **Next.js App**: http://localhost:3000
- **PostgreSQL**: `localhost:5432` (via psql or tools)
- **Redis**: `localhost:6379` (via redis-cli or tools)

---

## Services Overview

### App Service (parkease-app)

- **Image**: Built from `Dockerfile`
- **Port**: `3000:3000`
- **Command**: `npm run dev` (development mode with hot reload)
- **Volumes**: Source code mounted for live reload
- **Dependencies**: Waits for healthy `db` service
- **Env Vars**: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, etc.

### Database Service (parkease-db)

- **Image**: `postgres:15-alpine`
- **Port**: `5432:5432`
- **Volume**: `postgres_data` (persisted between restarts)
- **Health Check**: Checks database connectivity every 10 seconds
- **Initial Setup**: Runs `scripts/init.sql` on first start (if exists)
- **Env Vars**:
  - `POSTGRES_USER`: Database user (default: `parkease`)
  - `POSTGRES_PASSWORD`: Database password (default: `parkease_dev`)
  - `POSTGRES_DB`: Database name (default: `parkease_dev`)

### Redis Service (parkease-redis)

- **Image**: `redis:7-alpine`
- **Port**: `6379:6379`
- **Volume**: `redis_data` (persisted between restarts)
- **Command**: `redis-server --appendonly yes` (persistence enabled)
- **Health Check**: Redis ping every 10 seconds

---

## Network Architecture

All services communicate over a shared Docker network (`parkease-network`):

```
┌─────────────────────────────────────────┐
│     parkease-network (bridge)           │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐                       │
│  │  parkease-app│                       │
│  │  :3000       │                       │
│  │  (localhost) │                       │
│  └──────────────┘                       │
│         │                               │
│    ┌────┴──────┬─────────┐              │
│    │           │         │              │
│    ▼           ▼         ▼              │
│  ┌────────┐ ┌──────┐ ┌────────┐        │
│  │parkease│ │park  │ │parkease│        │
│  │  -db   │ │ease  │ │ -redis │        │
│  │ :5432  │ │-redis│ │ :6379  │        │
│  │        │ │:6379 │ │        │        │
│  └────────┘ └──────┘ └────────┘        │
│                                         │
└─────────────────────────────────────────┘
```

**Service Hostnames** (within Docker network):
- Database: `db` or `db:5432`
- Redis: `redis` or `redis:6379`

---

## Common Tasks

### View Service Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f db

# Last 100 lines
docker-compose logs -f --tail=100 app

# Filter by keyword
docker-compose logs -f app | grep ERROR
```

### Stop Services

```bash
# Stop all services (keep data)
docker-compose stop

# Stop and remove containers (keep volumes)
docker-compose down

# Stop, remove containers, AND remove volumes
docker-compose down -v
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart app

# Restart and view logs
docker-compose restart app && docker-compose logs -f app
```

### Database Management

#### Access PostgreSQL CLI

```bash
# Using docker-compose
docker-compose exec db psql -U parkease -d parkease_dev

# Or directly
psql postgresql://parkease:parkease_dev@localhost:5432/parkease_dev

# Common commands in psql:
# \dt                - List tables
# \d table_name      - Describe table
# \l                 - List databases
# \du                - List users
# \q                 - Quit
```

#### View Database Logs

```bash
docker-compose logs -f db
```

#### Reset Database

```bash
# Remove database volume and restart
docker-compose down -v
docker-compose up -d db

# Wait for database to be ready
docker-compose exec db pg_isready
```

### Redis Management

#### Access Redis CLI

```bash
# Using docker-compose
docker-compose exec redis redis-cli

# Or directly
redis-cli -h localhost -p 6379

# Common commands in redis-cli:
# PING              - Test connection
# KEYS *            - List all keys
# GET key           - Get key value
# DEL key           - Delete key
# FLUSHALL          - Clear all data
# MONITOR           - Monitor commands in real-time
# INFO              - Server information
```

#### Clear All Cache

```bash
docker-compose exec redis redis-cli FLUSHALL
```

### Rebuild Images

```bash
# Rebuild all images
docker-compose build

# Rebuild specific service
docker-compose build app

# Rebuild without cache
docker-compose build --no-cache

# Rebuild and restart
docker-compose up -d --build
```

### View Resource Usage

```bash
# CPU, memory, network, I/O stats
docker stats

# Specific container
docker stats parkease-app
```

---

## Development Workflow

### 1. Make Code Changes

Code changes are automatically reloaded since the source directory is mounted:
```bash
# Edit src/app/page.tsx
# Next.js dev server automatically recompiles
# Refresh browser to see changes
```

### 2. Run Code Quality Checks

```bash
# Lint and format inside app container
docker-compose exec app npm run lint
docker-compose exec app npm run format

# Type checking
docker-compose exec app npm run type-check
```

### 3. Test Database Queries

```bash
# Access database
docker-compose exec db psql -U parkease -d parkease_dev

# Run SQL
parkease_dev=# SELECT version();
```

### 4. Monitor Logs During Development

```bash
# Watch app logs while developing
docker-compose logs -f app

# In another terminal, make changes
# Logs will show Next.js recompilation
```

---

## Troubleshooting

### Services Won't Start

**Problem**: `docker-compose up` fails

**Solution**:
```bash
# Check logs
docker-compose logs

# Common issues:
# 1. Port already in use
docker ps  # Check running containers
# Kill process: lsof -ti:3000 | xargs kill -9

# 2. Disk space full
docker system prune  # Clean up unused images/volumes

# 3. Permissions issue
sudo chown -R $USER:$USER .
```

### Database Connection Failed

**Problem**: App can't connect to database

**Solution**:
```bash
# Check if db service is healthy
docker-compose ps

# Check database logs
docker-compose logs db

# Test database connectivity
docker-compose exec app psql postgresql://parkease:parkease_dev@db:5432/parkease_dev

# Wait for database to be ready
docker-compose exec db pg_isready
```

### Out of Memory

**Problem**: Docker containers running out of memory

**Solution**:
```bash
# Check memory usage
docker stats

# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Increase Docker Desktop memory limit:
# Docker Desktop → Preferences → Resources → Memory
```

### Persistent Volume Issues

**Problem**: Data not persisting between restarts

**Solution**:
```bash
# Check volume status
docker volume ls

# Inspect volume
docker volume inspect parkease_postgres_data

# Check volume mount in container
docker inspect parkease-db | grep -A 5 Mounts
```

### Port Already in Use

**Problem**: `Bind for 0.0.0.0:3000 failed`

**Solution**:
```bash
# Find process using port
lsof -ti:3000

# Kill process
kill -9 <PID>

# Or change docker-compose port mapping
# Edit docker-compose.yml: "3001:3000"
```

---

## Production Considerations

### Security

1. **Use strong passwords** in environment variables
2. **Don't commit** `.env.docker.local` (add to `.gitignore`)
3. **Use secrets management** (Docker Secrets, Kubernetes, HashiCorp Vault)
4. **Run as non-root** (app container uses `nextjs` user)
5. **Use environment-specific configs** (prod, staging, dev)

### Performance

1. **Multi-stage builds** in Dockerfile optimize image size
2. **Alpine images** reduce container size
3. **Volume mounts** for development only (use COPY for production)
4. **Health checks** ensure service availability

### Monitoring

```bash
# Resource monitoring
docker stats

# Log aggregation (ELK Stack, Splunk, etc.)
docker-compose logs --follow

# Container health
docker-compose ps
```

---

## Docker Compose Reference

```bash
# Start services (create and start)
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose stop

# Stop and remove
docker-compose down

# View status
docker-compose ps

# View logs
docker-compose logs -f

# Execute command in container
docker-compose exec app npm run build

# Rebuild images
docker-compose build

# Remove volumes on down
docker-compose down -v

# Remove all unused containers/images/volumes
docker system prune -a

# Inspect service configuration
docker-compose config
```

---

## Next Steps

1. ✅ Run `docker-compose up -d`
2. ✅ Verify services: `docker-compose ps`
3. ✅ Access app: http://localhost:3000
4. ✅ Check logs: `docker-compose logs -f app`
5. ⏭️ **Next**: Set up database migrations with Prisma
   ```bash
   docker-compose exec app npx prisma migrate dev --name init
   ```

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file)
- [PostgreSQL Docker Documentation](https://hub.docker.com/_/postgres)
- [Redis Docker Documentation](https://hub.docker.com/_/redis)
- [Node.js Docker Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

---

**Last Updated**: February 19, 2026
**Docker Version**: 20.10+
**Docker Compose Version**: 2.0+
