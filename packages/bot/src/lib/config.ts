import 'dotenv/config';

export const config = {
  botToken: process.env.BOT_TOKEN!,
  clientId: process.env.CLIENT_ID!,
  guildId: process.env.GUILD_ID, // Optional: for dev command registration
  databaseUrl: process.env.DATABASE_URL || 'file:./data/kedon.db',
};

// Validate required config
const required = ['BOT_TOKEN', 'CLIENT_ID'] as const;
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
