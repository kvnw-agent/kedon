import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import type { Command } from '../../lib/types.js';
import { successEmbed, errorEmbed, hasPermission } from '../../lib/moderation.js';
import { getWarningById, clearWarning } from '@kedon/db';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('clearwarning')
    .setDescription('Clear a specific warning')
    .addIntegerOption(option =>
      option
        .setName('id')
        .setDescription('The warning ID to clear')
        .setRequired(true)
        .setMinValue(1)
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

    const warningId = interaction.options.getInteger('id', true);

    await interaction.deferReply();

    try {
      // Get the warning
      const warning = await getWarningById(warningId);

      if (!warning) {
        await interaction.editReply({ embeds: [errorEmbed(`Warning #${warningId} not found.`)] });
        return;
      }

      // Check if warning belongs to this guild
      if (warning.guildId !== interaction.guild.id) {
        await interaction.editReply({ embeds: [errorEmbed(`Warning #${warningId} not found.`)] });
        return;
      }

      // Check if already cleared
      if (!warning.active) {
        await interaction.editReply({ embeds: [errorEmbed(`Warning #${warningId} has already been cleared.`)] });
        return;
      }

      // Clear the warning
      await clearWarning(warningId);

      const embed = successEmbed(
        'Warning Cleared',
        `Warning #${warningId} has been cleared.`
      );

      embed.addFields(
        { name: 'User', value: `<@${warning.userId}>`, inline: true },
        { name: 'Original Reason', value: warning.reason, inline: true }
      );

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error clearing warning:', error);
      await interaction.editReply({ embeds: [errorEmbed('Failed to clear the warning. Please try again.')] });
    }
  },
};
