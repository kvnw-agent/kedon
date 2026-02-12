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
  action: text('action', { enum: ['kick', 'ban', 'mute', 'warn', 'unmute', 'unban'] }).notNull(),
  reason: text('reason'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
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
