import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, GuildMember } from 'discord.js';
import type { Command } from '../../lib/types.js';
import { errorEmbed, hasPermission } from '../../lib/moderation.js';
import { getWarnings } from '@kedon/db';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription("View a user's warnings")
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to check')
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
    const targetUser = interaction.options.getUser('user', true);

    await interaction.deferReply();

    try {
      const warnings = await getWarnings(interaction.guild.id, targetUser.id);

      if (warnings.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle('📋 Warnings')
          .setDescription(`**${targetUser.tag}** has no active warnings.`)
          .setColor(0x57f287)
          .setThumbnail(targetUser.displayAvatarURL());

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`📋 Warnings for ${targetUser.tag}`)
        .setDescription(`This user has **${warnings.length}** active warning(s).`)
        .setColor(0xffa500)
        .setThumbnail(targetUser.displayAvatarURL())
        .setTimestamp();

      // Add up to 10 most recent warnings
      const displayWarnings = warnings.slice(0, 10);
      for (const warning of displayWarnings) {
        const date = new Date(warning.createdAt as Date).toLocaleDateString();
        embed.addFields({
          name: `Warning #${warning.id}`,
          value: `**Reason:** ${warning.reason}\n**Moderator:** <@${warning.moderatorId}>\n**Date:** ${date}`,
        });
      }

      if (warnings.length > 10) {
        embed.setFooter({ text: `Showing 10 of ${warnings.length} warnings` });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching warnings:', error);
      await interaction.editReply({ embeds: [errorEmbed('Failed to fetch warnings. Please try again.')] });
    }
  },
};
