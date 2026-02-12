import { SlashCommandBuilder, PermissionFlagsBits, GuildMember } from 'discord.js';
import type { Command } from '../../lib/types.js';
import { canModerate, sendModDM, successEmbed, errorEmbed, logModAction, hasPermission } from '../../lib/moderation.js';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to kick')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the kick')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  module: 'moderation',

  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({ embeds: [errorEmbed('This command can only be used in a server.')], ephemeral: true });
      return;
    }

    // Check permissions
    if (!hasPermission(interaction, PermissionFlagsBits.KickMembers)) {
      await interaction.reply({ embeds: [errorEmbed('You need the **Kick Members** permission.')], ephemeral: true });
      return;
    }

    const target = interaction.options.getMember('user') as GuildMember | null;
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

    // Check if user is kickable
    if (!target.kickable) {
      await interaction.reply({ embeds: [errorEmbed("I can't kick this user. Check my permissions and role hierarchy.")], ephemeral: true });
      return;
    }

    await interaction.deferReply();

    // Try to DM the user before kicking
    const dmSent = await sendModDM(target.user, 'kicked', interaction.guild.name, reason);

    try {
      await target.kick(reason || 'No reason provided');

      // Log the action
      await logModAction(
        interaction.guild.id,
        target.id,
        interaction.user.id,
        'kick',
        reason
      );

      const embed = successEmbed(
        'User Kicked',
        `**${target.user.tag}** has been kicked from the server.`
      );

      if (reason) {
        embed.addFields({ name: 'Reason', value: reason });
      }

      embed.addFields({ name: 'DM Notification', value: dmSent ? 'Sent' : 'Failed (DMs disabled)' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error kicking user:', error);
      await interaction.editReply({ embeds: [errorEmbed('Failed to kick the user. Please try again.')] });
    }
  },
};
