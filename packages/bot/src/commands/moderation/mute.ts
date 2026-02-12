import { SlashCommandBuilder, PermissionFlagsBits, GuildMember } from 'discord.js';
import type { Command } from '../../lib/types.js';
import { canModerate, sendModDM, successEmbed, errorEmbed, logModAction, hasPermission, parseDuration, formatDuration } from '../../lib/moderation.js';

// Discord's maximum timeout duration (28 days in milliseconds)
const MAX_TIMEOUT = 28 * 24 * 60 * 60 * 1000;

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Timeout a user (prevent them from sending messages)')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to mute')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('duration')
        .setDescription('Duration (e.g., 10m, 1h, 1d, 1w). Max: 28d')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the mute')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  module: 'moderation',

  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({ embeds: [errorEmbed('This command can only be used in a server.')], ephemeral: true });
      return;
    }

    if (!hasPermission(interaction, PermissionFlagsBits.ModerateMembers)) {
      await interaction.reply({ embeds: [errorEmbed('You need the **Moderate Members** permission.')], ephemeral: true });
      return;
    }

    const target = interaction.options.getMember('user') as GuildMember | null;
    const durationStr = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason');

    if (!target) {
      await interaction.reply({ embeds: [errorEmbed('User not found in this server.')], ephemeral: true });
      return;
    }

    // Check if we can moderate this user
    const moderator = interaction.member as GuildMember;
    const check = canModerate(moderator, target);
    if (!check.can) {
      await interaction.reply({ embeds: [errorEmbed(check.reason!)], ephemeral: true });
      return;
    }

    // Check if user is moderatable
    if (!target.moderatable) {
      await interaction.reply({ embeds: [errorEmbed("I can't timeout this user. Check my permissions and role hierarchy.")], ephemeral: true });
      return;
    }

    // Parse duration (default to 1 hour if not specified)
    let duration = 60 * 60 * 1000; // 1 hour default
    if (durationStr) {
      const parsed = parseDuration(durationStr);
      if (!parsed) {
        await interaction.reply({ 
          embeds: [errorEmbed('Invalid duration format. Use formats like: `10m`, `1h`, `1d`, `1w`')], 
          ephemeral: true 
        });
        return;
      }
      duration = parsed;
    }

    if (duration > MAX_TIMEOUT) {
      await interaction.reply({ embeds: [errorEmbed('Maximum timeout duration is 28 days.')], ephemeral: true });
      return;
    }

    await interaction.deferReply();

    // Try to DM the user before muting
    const dmSent = await sendModDM(target.user, 'muted', interaction.guild.name, reason, formatDuration(duration));

    try {
      await target.timeout(duration, reason || 'No reason provided');

      // Log the action
      await logModAction(
        interaction.guild.id,
        target.id,
        interaction.user.id,
        'mute',
        reason,
        duration
      );

      const embed = successEmbed(
        'User Muted',
        `**${target.user.tag}** has been muted.`
      );

      embed.addFields(
        { name: 'Duration', value: formatDuration(duration), inline: true },
        { name: 'DM Notification', value: dmSent ? 'Sent' : 'Failed', inline: true }
      );

      if (reason) {
        embed.addFields({ name: 'Reason', value: reason });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error muting user:', error);
      await interaction.editReply({ embeds: [errorEmbed('Failed to mute the user. Please try again.')] });
    }
  },
};
