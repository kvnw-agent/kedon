import { SlashCommandBuilder, PermissionFlagsBits, TextChannel, NewsChannel, VoiceChannel } from 'discord.js';
import type { Command } from '../../lib/types.js';
import { successEmbed, errorEmbed, logModAction, hasPermission } from '../../lib/moderation.js';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk delete messages')
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Only delete messages from this user')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  module: 'moderation',

  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({ embeds: [errorEmbed('This command can only be used in a server.')], ephemeral: true });
      return;
    }

    if (!hasPermission(interaction, PermissionFlagsBits.ManageMessages)) {
      await interaction.reply({ embeds: [errorEmbed('You need the **Manage Messages** permission.')], ephemeral: true });
      return;
    }

    const channel = interaction.channel;
    if (!channel || !('bulkDelete' in channel)) {
      await interaction.reply({ embeds: [errorEmbed('Cannot delete messages in this channel.')], ephemeral: true });
      return;
    }

    const amount = interaction.options.getInteger('amount', true);
    const filterUser = interaction.options.getUser('user');

    await interaction.deferReply({ ephemeral: true });

    try {
      // Fetch messages
      const messages = await channel.messages.fetch({ limit: amount });
      
      // Filter by user if specified
      let toDelete = messages;
      if (filterUser) {
        toDelete = messages.filter(msg => msg.author.id === filterUser.id);
      }

      // Filter out messages older than 14 days (Discord limitation)
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const deletable = toDelete.filter(msg => msg.createdTimestamp > twoWeeksAgo);

      if (deletable.size === 0) {
        await interaction.editReply({ 
          embeds: [errorEmbed('No messages found to delete. Messages older than 14 days cannot be bulk deleted.')] 
        });
        return;
      }

      // Bulk delete
      const deleted = await (channel as TextChannel | NewsChannel | VoiceChannel).bulkDelete(deletable, true);

      // Log the action
      await logModAction(
        interaction.guild.id,
        filterUser?.id || 'bulk',
        interaction.user.id,
        'purge',
        filterUser ? `Deleted ${deleted.size} messages from ${filterUser.tag}` : `Deleted ${deleted.size} messages`
      );

      const embed = successEmbed(
        'Messages Deleted',
        `Successfully deleted **${deleted.size}** message(s).`
      );

      if (filterUser) {
        embed.addFields({ name: 'Filtered by', value: filterUser.tag });
      }

      if (deletable.size < toDelete.size) {
        embed.addFields({ 
          name: 'Note', 
          value: `${toDelete.size - deletable.size} message(s) were older than 14 days and couldn't be deleted.` 
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error purging messages:', error);
      await interaction.editReply({ embeds: [errorEmbed('Failed to delete messages. Please try again.')] });
    }
  },
};
