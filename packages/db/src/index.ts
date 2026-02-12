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

// Warning functions
export async function addWarning(warning: schema.NewWarning) {
  const db = getDb();
  await getOrCreateGuild(warning.guildId);
  return db.insert(schema.warnings).values(warning).returning();
}

export async function getWarnings(guildId: string, userId: string) {
  const db = getDb();
  return db.query.warnings.findMany({
    where: and(
      eq(schema.warnings.guildId, guildId),
      eq(schema.warnings.userId, userId),
      eq(schema.warnings.active, true)
    ),
    orderBy: (warnings, { desc }) => [desc(warnings.createdAt)],
  });
}

export async function getWarningById(id: number) {
  const db = getDb();
  return db.query.warnings.findFirst({
    where: eq(schema.warnings.id, id),
  });
}

export async function clearWarning(id: number) {
  const db = getDb();
  return db
    .update(schema.warnings)
    .set({ active: false })
    .where(eq(schema.warnings.id, id))
    .returning();
}

// Economy functions
export async function getBalance(discordId: string): Promise<number> {
  const user = await getOrCreateUser(discordId);
  return user.balance;
}

export async function updateBalance(discordId: string, amount: number) {
  const db = getDb();
  await getOrCreateUser(discordId);
  return db
    .update(schema.users)
    .set({ balance: amount })
    .where(eq(schema.users.discordId, discordId))
    .returning();
}

export async function addBalance(discordId: string, amount: number) {
  const db = getDb();
  const user = await getOrCreateUser(discordId);
  const newBalance = user.balance + amount;
  return db
    .update(schema.users)
    .set({ balance: newBalance })
    .where(eq(schema.users.discordId, discordId))
    .returning();
}

export async function transferBalance(fromId: string, toId: string, amount: number): Promise<boolean> {
  const db = getDb();
  const fromUser = await getOrCreateUser(fromId);
  
  if (fromUser.balance < amount) {
    return false;
  }
  
  await getOrCreateUser(toId);
  
  // Subtract from sender
  await db
    .update(schema.users)
    .set({ balance: fromUser.balance - amount })
    .where(eq(schema.users.discordId, fromId));
  
  // Add to receiver
  const toUser = await getOrCreateUser(toId);
  await db
    .update(schema.users)
    .set({ balance: toUser.balance + amount })
    .where(eq(schema.users.discordId, toId));
  
  return true;
}

export async function getLeaderboard(limit: number = 10) {
  const db = getDb();
  return db.query.users.findMany({
    orderBy: (users, { desc }) => [desc(users.balance)],
    limit,
  });
}

// Daily reward functions
const DAILY_REWARD_BASE = 100;
const DAILY_REWARD_STREAK_BONUS = 10;
const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const STREAK_RESET_MS = 48 * 60 * 60 * 1000; // 48 hours

export interface DailyClaimResult {
  success: boolean;
  reason?: string;
  amount?: number;
  streak?: number;
  newBalance?: number;
  nextClaimTime?: Date;
}

export async function claimDaily(discordId: string): Promise<DailyClaimResult> {
  const db = getDb();
  const user = await getOrCreateUser(discordId);
  
  // Get or create daily record
  let daily = await db.query.dailyRewards.findFirst({
    where: eq(schema.dailyRewards.discordId, discordId),
  });
  
  const now = Date.now();
  
  if (daily) {
    const lastClaimed = (daily.lastClaimed as Date).getTime();
    const timeSince = now - lastClaimed;
    
    // Check if still on cooldown
    if (timeSince < DAILY_COOLDOWN_MS) {
      const nextClaim = new Date(lastClaimed + DAILY_COOLDOWN_MS);
      return {
        success: false,
        reason: 'cooldown',
        nextClaimTime: nextClaim,
      };
    }
    
    // Check if streak should reset (missed more than 48h)
    let newStreak = daily.streak + 1;
    if (timeSince > STREAK_RESET_MS) {
      newStreak = 1;
    }
    
    // Calculate reward with streak bonus (cap streak bonus at 100)
    const streakBonus = Math.min(newStreak - 1, 100) * DAILY_REWARD_STREAK_BONUS;
    const amount = DAILY_REWARD_BASE + streakBonus;
    
    // Update daily record
    await db
      .update(schema.dailyRewards)
      .set({ lastClaimed: new Date(), streak: newStreak })
      .where(eq(schema.dailyRewards.discordId, discordId));
    
    // Add balance
    const newBalance = user.balance + amount;
    await db
      .update(schema.users)
      .set({ balance: newBalance })
      .where(eq(schema.users.discordId, discordId));
    
    return {
      success: true,
      amount,
      streak: newStreak,
      newBalance,
    };
  } else {
    // First time claiming
    await db.insert(schema.dailyRewards).values({
      discordId,
      lastClaimed: new Date(),
      streak: 1,
    });
    
    const amount = DAILY_REWARD_BASE;
    const newBalance = user.balance + amount;
    
    await db
      .update(schema.users)
      .set({ balance: newBalance })
      .where(eq(schema.users.discordId, discordId));
    
    return {
      success: true,
      amount,
      streak: 1,
      newBalance,
    };
  }
}
