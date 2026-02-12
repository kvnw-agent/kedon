# Kedon Discord Bot

A modern, modular Discord bot framework with web dashboard.

## Features

- 🤖 **Discord.js v14** - Latest Discord API support
- 🧩 **Modular System** - Enable/disable features per server
- 🌐 **Web Dashboard** - Next.js 14 with Discord OAuth2
- 💾 **SQLite + Drizzle** - Simple, file-based database
- 📦 **Monorepo** - pnpm workspaces + Turborepo
- 🐳 **Docker Ready** - Production-ready containers

## Modules

| Module | Description |
|--------|-------------|
| Moderation | Kick, ban, mute, warn with logging |
| Economy | Virtual currency and shop system |
| Leveling | XP and level progression |
| Welcome | Join/leave messages |
| Logging | Audit logs for server actions |
| Utility | General commands (ping, help, etc) |

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 10+
- Discord Bot Token ([Discord Developer Portal](https://discord.com/developers/applications))

### Setup

```bash
# Clone and install
cd ~/projects/kedon
pnpm install

# Copy environment file
cp .env.example .env
# Edit .env with your tokens

# Build packages
pnpm build

# Deploy slash commands
pnpm deploy:commands

# Start development
pnpm dev:bot   # Start bot
pnpm dev:web   # Start dashboard
```

### Environment Variables

```env
# Discord Bot
BOT_TOKEN=your_bot_token
CLIENT_ID=your_app_client_id
GUILD_ID=your_dev_server_id  # Optional, for faster command registration

# Web Dashboard
NEXTAUTH_SECRET=random_secret_here
NEXTAUTH_URL=http://localhost:3000
DISCORD_CLIENT_ID=your_app_client_id
DISCORD_CLIENT_SECRET=your_app_client_secret

# Database
DATABASE_URL=file:./data/kedon.db
```

## Docker

```bash
# Build and run
docker compose up -d

# View logs
docker compose logs -f kedon-bot
```

## Project Structure

```
kedon/
├── packages/
│   ├── bot/          # Discord.js bot
│   │   ├── src/
│   │   │   ├── commands/    # Slash commands
│   │   │   ├── events/      # Discord events
│   │   │   ├── lib/         # Utilities
│   │   │   └── modules/     # Feature modules
│   │   └── package.json
│   ├── web/          # Next.js dashboard
│   │   ├── src/
│   │   │   ├── app/         # App router pages
│   │   │   ├── components/  # UI components
│   │   │   └── lib/         # Utilities
│   │   └── package.json
│   ├── db/           # Drizzle ORM + SQLite
│   │   ├── src/
│   │   │   └── schema/      # Database schema
│   │   └── package.json
│   └── common/       # Shared types
│       └── src/
└── docker-compose.yml
```

## Adding Commands

1. Create a new file in `packages/bot/src/commands/`:

```typescript
import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../lib/types.js';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('mycommand')
    .setDescription('Does something'),
  module: 'utility', // Optional: assign to module
  async execute(interaction) {
    await interaction.reply('Hello!');
  },
};
```

2. Export from `packages/bot/src/commands/index.ts`

3. Deploy: `pnpm deploy:commands`

## License

MIT
