import { EmbedBuilder, GuildMember, User, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';
import { addModerationLog } from '@kedon/db';

// Duration parsing - supports formats like: 1h, 30m, 1d, 1w, etc.
const DURATION_REGEX = /^(\d+)(s|m|h|d|w)$/i;

const DURATION_MULTIPLIERS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 60 * 60 * 24,
  w: 60 * 60 * 24 * 7,
};

export function parseDuration(input: string): number | null {
  const match = input.match(DURATION_REGEX);
  if (!match) return null;

  const [, amount, unit] = match;
  const multiplier = DURATION_MULTIPLIERS[unit.toLowerCase()];
  return parseInt(amount) * multiplier * 1000; // Return milliseconds
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

// Permission checks
export function canModerate(moderator: GuildMember, target: GuildMember): { can: boolean; reason?: string } {
  // Can't moderate yourself
  if (moderator.id === target.id) {
    return { can: false, reason: "You can't moderate yourself." };
  }

  // Can't moderate the server owner
  if (target.id === target.guild.ownerId) {
    return { can: false, reason: "You can't moderate the server owner." };
  }

  // Can't moderate someone with higher/equal role
  if (moderator.roles.highest.position <= target.roles.highest.position && moderator.id !== target.guild.ownerId) {
    return { can: false, reason: "You can't moderate someone with an equal or higher role." };
  }

  // Bot can't moderate someone with higher/equal role
  const botMember = target.guild.members.me;
  if (botMember && botMember.roles.highest.position <= target.roles.highest.position) {
    return { can: false, reason: "I can't moderate someone with an equal or higher role than me." };
  }

  return { can: true };
}

// Try to send DM to user
export async function sendModDM(
  user: User,
  action: string,
  guildName: string,
  reason?: string | null,
  duration?: string | null
): Promise<boolean> {
  try {
    const embed = new EmbedBuilder()
      .setTitle(`You have been ${action}`)
      .setDescription(`**Server:** ${guildName}`)
      .setColor(action === 'warned' ? 0xffa500 : 0xff0000)
      .setTimestamp();

    if (reason) {
      embed.addFields({ name: 'Reason', value: reason });
    }
    if (duration) {
      embed.addFields({ name: 'Duration', value: duration });
    }

    await user.send({ embeds: [embed] });
    return true;
  } catch {
    // User has DMs disabled or bot is blocked
    return false;
  }
}

// Create success embed
export function successEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setColor(0x57f287)
    .setTimestamp();
}

// Create error embed
export function errorEmbed(description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('❌ Error')
    .setDescription(description)
    .setColor(0xed4245);
}

// Log moderation action
export async function logModAction(
  guildId: string,
  userId: string,
  moderatorId: string,
  action: 'kick' | 'ban' | 'mute' | 'warn' | 'unmute' | 'unban' | 'purge',
  reason?: string | null,
  duration?: number | null
) {
  await addModerationLog({
    guildId,
    userId,
    moderatorId,
    action,
    reason: reason || null,
    duration: duration ? Math.floor(duration / 1000) : null, // Store in seconds
  });
}

// Check if user has required permissions
export function hasPermission(
  interaction: ChatInputCommandInteraction,
  permission: bigint
): boolean {
  const member = interaction.member as GuildMember;
  return member.permissions.has(permission);
}
