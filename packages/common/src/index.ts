// Module definitions
export const MODULES = {
  moderation: {
    name: 'Moderation',
    description: 'Kick, ban, mute, warn, and moderation logging',
    commands: ['kick', 'ban', 'mute', 'warn', 'case'],
  },
  economy: {
    name: 'Economy',
    description: 'Virtual currency, shop, and economy features',
    commands: ['balance', 'daily', 'pay', 'shop', 'buy'],
  },
  leveling: {
    name: 'Leveling',
    description: 'XP and level progression system',
    commands: ['rank', 'leaderboard', 'levels'],
  },
  welcome: {
    name: 'Welcome',
    description: 'Welcome and goodbye messages',
    commands: [],
  },
  logging: {
    name: 'Logging',
    description: 'Audit logs for server actions',
    commands: ['setlogchannel'],
  },
  utility: {
    name: 'Utility',
    description: 'Utility commands like ping, help, serverinfo',
    commands: ['ping', 'help', 'serverinfo', 'userinfo'],
  },
} as const;

export type ModuleName = keyof typeof MODULES;
export const MODULE_NAMES = Object.keys(MODULES) as ModuleName[];

// Shared types
export interface GuildSettings {
  prefix?: string;
  welcomeChannel?: string;
  welcomeMessage?: string;
  logChannel?: string;
  modLogChannel?: string;
}

export interface User {
  id: number;
  discordId: string;
  balance: number;
  createdAt: Date;
}

export interface Guild {
  id: string;
  settings: GuildSettings;
  createdAt: Date;
}

export interface GuildModule {
  guildId: string;
  moduleName: ModuleName;
  enabled: boolean;
}

export interface ModerationLog {
  id: number;
  guildId: string;
  userId: string;
  moderatorId: string;
  action: 'kick' | 'ban' | 'mute' | 'warn' | 'unmute' | 'unban';
  reason: string | null;
  createdAt: Date;
}

// API types for web
export interface APIGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  botInGuild: boolean;
}

export interface SessionUser {
  id: string;
  name: string;
  email?: string;
  image?: string;
  accessToken: string;
}
