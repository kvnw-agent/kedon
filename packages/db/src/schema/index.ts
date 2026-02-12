import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Guilds table
export const guilds = sqliteTable('guilds', {
  id: text('id').primaryKey(), // Discord guild ID
  settings: text('settings', { mode: 'json' }).$type<Record<string, unknown>>().default({}),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Guild modules table
export const guildModules = sqliteTable('guild_modules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  guildId: text('guild_id')
    .notNull()
    .references(() => guilds.id, { onDelete: 'cascade' }),
  moduleName: text('module_name').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
});

// Users table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  discordId: text('discord_id').notNull().unique(),
  balance: integer('balance').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Moderation logs table
export const moderationLogs = sqliteTable('moderation_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  guildId: text('guild_id')
    .notNull()
    .references(() => guilds.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  moderatorId: text('moderator_id').notNull(),
  action: text('action', { enum: ['kick', 'ban', 'mute', 'warn', 'unmute', 'unban', 'purge'] }).notNull(),
  reason: text('reason'),
  duration: integer('duration'), // Duration in seconds for mutes
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Warnings table (separate from logs for easy querying)
export const warnings = sqliteTable('warnings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  guildId: text('guild_id')
    .notNull()
    .references(() => guilds.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  moderatorId: text('moderator_id').notNull(),
  reason: text('reason').notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Daily rewards tracking
export const dailyRewards = sqliteTable('daily_rewards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  discordId: text('discord_id').notNull().unique(),
  lastClaimed: integer('last_claimed', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  streak: integer('streak').notNull().default(1),
});

// Type exports
export type Guild = typeof guilds.$inferSelect;
export type NewGuild = typeof guilds.$inferInsert;
export type GuildModule = typeof guildModules.$inferSelect;
export type NewGuildModule = typeof guildModules.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ModerationLog = typeof moderationLogs.$inferSelect;
export type NewModerationLog = typeof moderationLogs.$inferInsert;
export type Warning = typeof warnings.$inferSelect;
export type NewWarning = typeof warnings.$inferInsert;
export type DailyReward = typeof dailyRewards.$inferSelect;
export type NewDailyReward = typeof dailyRewards.$inferInsert;
