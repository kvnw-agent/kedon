import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../lib/types.js';
import { getBalance } from '@kedon/db';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your coin balance')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Check another user\'s balance')
        .setRequired(false)
    ),
  module: 'economy',

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const isSelf = targetUser.id === interaction.user.id;

    try {
      const balance = await getBalance(targetUser.id);

      const embed = new EmbedBuilder()
        .setTitle('💰 Balance')
        .setDescription(
          isSelf
            ? `You have **${balance.toLocaleString()}** coins`
            : `**${targetUser.displayName}** has **${balance.toLocaleString()}** coins`
        )
        .setColor(0x5865f2)
        .setThumbnail(targetUser.displayAvatarURL())
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching balance:', error);
      await interaction.reply({ content: '❌ Failed to fetch balance. Please try again.', ephemeral: true });
    }
  },
};
