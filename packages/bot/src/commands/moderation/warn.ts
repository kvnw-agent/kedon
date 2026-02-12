import { SlashCommandBuilder, PermissionFlagsBits, GuildMember } from 'discord.js';
import type { Command } from '../../lib/types.js';
import { canModerate, sendModDM, successEmbed, errorEmbed, logModAction, hasPermission } from '../../lib/moderation.js';
import { addWarning, getWarnings } from '@kedon/db';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to warn')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the warning')
        .setRequired(true)
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
    const reason = interaction.options.getString('reason', true);

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

    await interaction.deferReply();

    try {
      // Add warning to database
      const [warning] = await addWarning({
        guildId: interaction.guild.id,
        userId: target.id,
        moderatorId: interaction.user.id,
        reason,
      });

      // Log the action
      await logModAction(
        interaction.guild.id,
        target.id,
        interaction.user.id,
        'warn',
        reason
      );

      // Get total warnings for this user
      const allWarnings = await getWarnings(interaction.guild.id, target.id);
      const warningCount = allWarnings.length;

      // Try to DM the user
      const dmSent = await sendModDM(target.user, 'warned', interaction.guild.name, reason);

      const embed = successEmbed(
        'User Warned',
        `**${target.user.tag}** has been warned.`
      );

      embed.addFields(
        { name: 'Reason', value: reason },
        { name: 'Warning ID', value: `#${warning.id}`, inline: true },
        { name: 'Total Warnings', value: `${warningCount}`, inline: true },
        { name: 'DM Notification', value: dmSent ? 'Sent' : 'Failed (DMs disabled)', inline: true }
      );

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error warning user:', error);
      await interaction.editReply({ embeds: [errorEmbed('Failed to warn the user. Please try again.')] });
    }
  },
};
