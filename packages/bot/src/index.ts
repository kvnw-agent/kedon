import { config } from './lib/config.js';
import { getClient } from './lib/client.js';
import { getDb } from '@kedon/db';
import { commands } from './commands/index.js';
import { events } from './events/index.js';

async function main() {
  console.log('🤖 Starting Kedon bot...');

  // Initialize database
  console.log('📦 Connecting to database...');
  getDb(config.databaseUrl);

  // Get client
  const client = getClient();

  // Register commands
  console.log(`📝 Registering ${commands.length} commands...`);
  for (const command of commands) {
    client.registerCommand(command);
  }

  // Register events
  console.log(`🎧 Registering ${events.length} events...`);
  for (const event of events) {
    client.registerEvent(event);
  }

  // Login
  console.log('🔐 Logging in...');
  await client.login(config.botToken);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  const client = getClient();
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down...');
  const client = getClient();
  client.destroy();
  process.exit(0);
});
