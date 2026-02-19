# Docker Quick Reference

## Start & Stop

```bash
# Start all services in background
docker-compose up -d

# View running services
docker-compose ps

# Stop all services
docker-compose stop

# Stop and remove containers (keeps volumes)
docker-compose down

# Stop and remove everything (including volumes)
docker-compose down -v
```

## Logs & Debugging

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app
docker-compose logs -f db
docker-compose logs -f redis

# View last 100 lines
docker-compose logs -f --tail=100 app

# Exit logs view: Ctrl+C
```

## Database Commands

```bash
# Access PostgreSQL CLI
docker-compose exec db psql -U parkease -d parkease_dev

# In psql:
# \dt                    - List tables
# \d table_name          - Show table schema
# SELECT * FROM users;   - Query data
# \q                     - Exit

# Or use external client:
psql postgresql://parkease:parkease_dev@localhost:5432/parkease_dev
```

## Redis Commands

```bash
# Access Redis CLI
docker-compose exec redis redis-cli

# In redis-cli:
# PING                   - Test connection
# KEYS *                 - List all keys
# GET key_name           - Get value
# DEL key_name           - Delete key
# FLUSHALL               - Clear all cache
# INFO                   - Server info
# EXIT or Ctrl+C         - Quit
```

## Running Commands in Container

```bash
# Run npm commands
docker-compose exec app npm run build
docker-compose exec app npm run lint
docker-compose exec app npm run format

# Run arbitrary commands
docker-compose exec app sh        # Shell access
docker-compose exec app pwd       # Print working directory
```

## Rebuild & Update

```bash
# Rebuild images after changing Dockerfile
docker-compose build

# Rebuild without cache
docker-compose build --no-cache

# Build and restart
docker-compose up -d --build

# Rebuild specific service
docker-compose build app
```

## Troubleshooting

```bash
# Check service health
docker-compose ps

# View detailed logs
docker-compose logs app 2>&1 | grep -i error

# Check Docker resource usage
docker stats

# Restart failed service
docker-compose restart app

# Remove dangling volumes
docker volume prune

# Clean up everything unused
docker system prune -a
```

## Environment Variables

```bash
# Copy Docker env template
cp .env.docker .env.docker.local

# Edit variables
nano .env.docker.local

# Variables are loaded automatically from .env.docker.local
```

## Port Access

```bash
# App: http://localhost:3000
# DB:  localhost:5432
# Redis: localhost:6379

# Test connectivity:
curl http://localhost:3000              # App health
psql -h localhost -U parkease          # DB connection
redis-cli -h localhost ping            # Redis connection
```

---

For more details, see [DOCKER_SETUP.md](./DOCKER_SETUP.md)
