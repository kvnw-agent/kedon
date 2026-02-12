import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq, and } from 'drizzle-orm';
import * as schema from './schema/index.js';

export * from './schema/index.js';
export { eq, and } from 'drizzle-orm';

// Database connection
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let sqlite: Database.Database | null = null;

export function getDb(url?: string) {
  if (!db) {
    const dbUrl = url || process.env.DATABASE_URL || 'file:./data/kedon.db';
    const dbPath = dbUrl.replace('file:', '');
    sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');
    db = drizzle(sqlite, { schema });
  }
  return db;
}

export function closeDb() {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    db = null;
  }
}

// Helper functions
export async function getOrCreateGuild(guildId: string) {
  const db = getDb();
  let guild = await db.query.guilds.findFirst({
    where: eq(schema.guilds.id, guildId),
  });

  if (!guild) {
    await db.insert(schema.guilds).values({ id: guildId });
    guild = await db.query.guilds.findFirst({
      where: eq(schema.guilds.id, guildId),
    });
  }

  return guild!;
}

export async function isModuleEnabled(guildId: string, moduleName: string): Promise<boolean> {
  const db = getDb();
  const module = await db.query.guildModules.findFirst({
    where: and(
      eq(schema.guildModules.guildId, guildId),
      eq(schema.guildModules.moduleName, moduleName)
    ),
  });

  // Default to enabled if no record exists
  return module?.enabled ?? true;
}

export async function setModuleEnabled(guildId: string, moduleName: string, enabled: boolean) {
  const db = getDb();
  await getOrCreateGuild(guildId);

  const existing = await db.query.guildModules.findFirst({
    where: and(
      eq(schema.guildModules.guildId, guildId),
      eq(schema.guildModules.moduleName, moduleName)
    ),
  });

  if (existing) {
    await db
      .update(schema.guildModules)
      .set({ enabled })
      .where(eq(schema.guildModules.id, existing.id));
  } else {
    await db.insert(schema.guildModules).values({ guildId, moduleName, enabled });
  }
}

export async function getGuildModules(guildId: string) {
  const db = getDb();
  return db.query.guildModules.findMany({
    where: eq(schema.guildModules.guildId, guildId),
  });
}

export async function getOrCreateUser(discordId: string) {
  const db = getDb();
  let user = await db.query.users.findFirst({
    where: eq(schema.users.discordId, discordId),
  });

  if (!user) {
    await db.insert(schema.users).values({ discordId });
    user = await db.query.users.findFirst({
      where: eq(schema.users.discordId, discordId),
    });
  }

  return user!;
}

export async function addModerationLog(log: schema.NewModerationLog) {
  const db = getDb();
  await getOrCreateGuild(log.guildId);
  return db.insert(schema.moderationLogs).values(log).returning();
}
