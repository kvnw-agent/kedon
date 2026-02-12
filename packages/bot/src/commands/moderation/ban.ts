import { SlashCommandBuilder, PermissionFlagsBits, GuildMember } from 'discord.js';
import type { Command } from '../../lib/types.js';
import { canModerate, sendModDM, successEmbed, errorEmbed, logModAction, hasPermission } from '../../lib/moderation.js';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to ban')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option
        .setName('delete_days')
        .setDescription('Days of messages to delete (0-7)')
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(7)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  module: 'moderation',

  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({ embeds: [errorEmbed('This command can only be used in a server.')], ephemeral: true });
      return;
    }

    if (!hasPermission(interaction, PermissionFlagsBits.BanMembers)) {
      await interaction.reply({ embeds: [errorEmbed('You need the **Ban Members** permission.')], ephemeral: true });
      return;
    }

    const targetUser = interaction.options.getUser('user', true);
    const target = interaction.options.getMember('user') as GuildMember | null;
    const reason = interaction.options.getString('reason');
    const deleteDays = interaction.options.getInteger('delete_days') ?? 0;

    // If user is in guild, check moderation hierarchy
    if (target) {
      const moderator = interaction.member as GuildMember;
      const check = canModerate(moderator, target);
      if (!check.can) {
        await interaction.reply({ embeds: [errorEmbed(check.reason!)], ephemeral: true });
        return;
      }

      if (!target.bannable) {
        await interaction.reply({ embeds: [errorEmbed("I can't ban this user. Check my permissions and role hierarchy.")], ephemeral: true });
        return;
      }
    }

    await interaction.deferReply();

    // Try to DM the user before banning (only if they're in the server)
    const dmSent = target ? await sendModDM(targetUser, 'banned', interaction.guild.name, reason) : false;

    try {
      await interaction.guild.members.ban(targetUser, {
        reason: reason || 'No reason provided',
        deleteMessageSeconds: deleteDays * 24 * 60 * 60,
      });

      // Log the action
      await logModAction(
        interaction.guild.id,
        targetUser.id,
        interaction.user.id,
        'ban',
        reason
      );

      const embed = successEmbed(
        'User Banned',
        `**${targetUser.tag}** has been banned from the server.`
      );

      if (reason) {
        embed.addFields({ name: 'Reason', value: reason });
      }

      if (deleteDays > 0) {
        embed.addFields({ name: 'Messages Deleted', value: `${deleteDays} day(s)` });
      }

      if (target) {
        embed.addFields({ name: 'DM Notification', value: dmSent ? 'Sent' : 'Failed (DMs disabled)' });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error banning user:', error);
      await interaction.editReply({ embeds: [errorEmbed('Failed to ban the user. Please try again.')] });
    }
  },
};
