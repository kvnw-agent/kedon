import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../../lib/types.js';
import { successEmbed, errorEmbed, logModAction, hasPermission } from '../../lib/moderation.js';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user from the server')
    .addStringOption(option =>
      option
        .setName('user')
        .setDescription('User ID to unban')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the unban')
        .setRequired(false)
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

    const userId = interaction.options.getString('user', true);
    const reason = interaction.options.getString('reason');

    // Validate user ID format
    if (!/^\d{17,19}$/.test(userId)) {
      await interaction.reply({ embeds: [errorEmbed('Invalid user ID format. Please provide a valid Discord user ID.')], ephemeral: true });
      return;
    }

    await interaction.deferReply();

    try {
      // Check if user is actually banned
      const bans = await interaction.guild.bans.fetch();
      const ban = bans.get(userId);

      if (!ban) {
        await interaction.editReply({ embeds: [errorEmbed('This user is not banned.')] });
        return;
      }

      await interaction.guild.members.unban(userId, reason || 'No reason provided');

      // Log the action
      await logModAction(
        interaction.guild.id,
        userId,
        interaction.user.id,
        'unban',
        reason
      );

      const embed = successEmbed(
        'User Unbanned',
        `**${ban.user.tag}** has been unbanned from the server.`
      );

      if (reason) {
        embed.addFields({ name: 'Reason', value: reason });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error unbanning user:', error);
      await interaction.editReply({ embeds: [errorEmbed('Failed to unban the user. Make sure the ID is correct.')] });
    }
  },
};
