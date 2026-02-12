# KEDON Deployment Guide

## Overview

KEDON is a modular Discord bot with a Next.js web dashboard. It uses:
- **Bot**: Node.js 22 + Discord.js v14
- **Web**: Next.js 15 (standalone output)
- **Database**: SQLite with Drizzle ORM
- **Container**: Docker with multi-stage builds

## Quick Deploy (via Infra)

```bash
cd ~/projects/infra
./deploy.sh
# Or deploy just kedon:
./deploy-service.sh kedon-bot
./deploy-service.sh kedon-web
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Discord Bot (Required)
BOT_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_application_id
GUILD_ID=your_dev_server_id          # Optional: faster command registration

# Database
DATABASE_URL=file:./data/kedon.db    # Local dev path

# Web Dashboard (Required)
NEXTAUTH_SECRET=random_32_char_secret  # Generate: openssl rand -base64 32
NEXTAUTH_URL=https://awesomebot.local  # Your domain
DISCORD_CLIENT_ID=your_discord_application_id
DISCORD_CLIENT_SECRET=your_discord_oauth_secret
```

### Getting Discord Credentials

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create or select your application
3. **Bot Tab**: Copy `BOT_TOKEN`
4. **OAuth2 Tab**: Copy `CLIENT_ID` and `CLIENT_SECRET`
5. **OAuth2 > Redirects**: Add `https://awesomebot.local/api/auth/callback/discord`

## Database

### Schema Changes

When you modify `packages/db/src/schema/`:

```bash
# Generate migration files (optional, for tracking)
pnpm db:generate

# Apply schema to database (creates tables/columns)
pnpm db:push
```

### Database in Docker

The SQLite database persists via Docker volume:
- **Volume**: `kedon-data` → `/app/data/kedon.db`
- **Backup location**: Check with `docker volume inspect kedon-data`

#### Manual Database Operations

```bash
# Access database inside container
docker exec -it kedon-bot sh
cd /app/data
sqlite3 kedon.db

# Backup database
docker cp kedon-bot:/app/data/kedon.db ./backup-$(date +%Y%m%d).db

# Restore database
docker cp ./backup.db kedon-bot:/app/data/kedon.db
docker restart kedon-bot
```

### Migrations on First Deploy

Drizzle uses `db:push` which automatically creates tables. The bot initializes the database on startup. No explicit migration step needed for new deployments.

For existing databases with schema changes:
```bash
# Run from host before deploy
cd ~/projects/kedon
DATABASE_URL=file:./data/kedon.db pnpm db:push
```

## Slash Commands

### Deploy Commands (Required on First Setup)

```bash
# Deploy to all servers (global, takes up to 1 hour)
pnpm deploy:commands

# Deploy to dev server only (instant, uses GUILD_ID)
GUILD_ID=your_server_id pnpm deploy:commands
```

### When to Redeploy Commands

- Adding new commands
- Changing command names, descriptions, or options
- Changing command permissions

**Note**: Code changes to command handlers don't require redeployment—just restart the bot.

## Docker Build & Deploy

### Build Locally

```bash
# Build both images
docker compose build

# Build specific service
docker compose build kedon-bot
docker compose build kedon-web
```

### Run Standalone (Development)

```bash
# Start both services
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

### Deploy via Infra (Production)

```bash
cd ~/projects/infra

# Deploy all services
./deploy.sh

# Deploy just kedon
./deploy-service.sh kedon-bot
./deploy-service.sh kedon-web

# View kedon logs
docker compose logs -f kedon-bot kedon-web
```

## Domain Setup (OpenCan)

The web dashboard is accessible at `https://awesomebot.local`

### Configure OpenCan

Add to OpenCan proxy config:

| Domain | Target | Port |
|--------|--------|------|
| awesomebot.local | localhost | 3600 |

### Verify Setup

```bash
# Check container is running
docker ps | grep kedon-web

# Test direct access
curl http://localhost:3600

# Test via OpenCan
curl https://awesomebot.local
```

## Health Checks

Both services have health checks configured:

```bash
# Check health status
docker inspect kedon-bot --format='{{.State.Health.Status}}'
docker inspect kedon-web --format='{{.State.Health.Status}}'
```

## Troubleshooting

### Bot not connecting

```bash
# Check logs
docker compose logs kedon-bot

# Verify token
docker exec kedon-bot env | grep BOT_TOKEN
```

### Web dashboard 500 errors

```bash
# Check NextAuth configuration
docker compose logs kedon-web | grep -i auth

# Verify environment
docker exec kedon-web env | grep -E 'NEXTAUTH|DISCORD'
```

### Database errors

```bash
# Check database file exists
docker exec kedon-bot ls -la /app/data/

# Verify permissions
docker exec kedon-bot stat /app/data/kedon.db
```

### Rebuild after changes

```bash
# Full rebuild (no cache)
docker compose build --no-cache

# Rebuild and restart
docker compose up -d --build
```

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   kedon-bot     │     │   kedon-web     │
│  (Discord.js)   │     │   (Next.js)     │
│   Port: N/A     │     │   Port: 3600    │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
              ┌──────┴──────┐
              │   SQLite    │
              │  (volume)   │
              └─────────────┘
                     │
              ┌──────┴──────┐
              │   OpenCan   │
              │    Proxy    │
              └──────┬──────┘
                     │
         https://awesomebot.local
```

## Files Reference

| File | Purpose |
|------|---------|
| `Dockerfile.bot` | Bot container build |
| `Dockerfile.web` | Web container build |
| `docker-compose.yml` | Local development compose |
| `~/projects/infra/docker-compose.yml` | Production compose |
| `.env` | Environment variables |
| `packages/db/src/schema/` | Database schema (Drizzle) |
| `packages/bot/src/commands/` | Slash command handlers |
