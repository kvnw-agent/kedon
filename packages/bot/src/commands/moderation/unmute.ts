import { SlashCommandBuilder, PermissionFlagsBits, GuildMember } from 'discord.js';
import type { Command } from '../../lib/types.js';
import { canModerate, successEmbed, errorEmbed, logModAction, hasPermission } from '../../lib/moderation.js';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Remove timeout from a user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to unmute')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the unmute')
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
    const reason = interaction.options.getString('reason');

    if (!target) {
      await interaction.reply({ embeds: [errorEmbed('User not found in this server.')], ephemeral: true });
      return;
    }

    // Check if user is actually timed out
    if (!target.isCommunicationDisabled()) {
      await interaction.reply({ embeds: [errorEmbed('This user is not muted.')], ephemeral: true });
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
      await interaction.reply({ embeds: [errorEmbed("I can't unmute this user. Check my permissions and role hierarchy.")], ephemeral: true });
      return;
    }

    await interaction.deferReply();

    try {
      await target.timeout(null, reason || 'No reason provided');

      // Log the action
      await logModAction(
        interaction.guild.id,
        target.id,
        interaction.user.id,
        'unmute',
        reason
      );

      const embed = successEmbed(
        'User Unmuted',
        `**${target.user.tag}** has been unmuted.`
      );

      if (reason) {
        embed.addFields({ name: 'Reason', value: reason });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error unmuting user:', error);
      await interaction.editReply({ embeds: [errorEmbed('Failed to unmute the user. Please try again.')] });
    }
  },
};
