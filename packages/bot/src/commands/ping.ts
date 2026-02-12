import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../lib/types.js';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency'),
  module: 'utility',
  async execute(interaction) {
    const sent = await interaction.reply({
      content: '🏓 Pinging...',
      fetchReply: true,
    });

    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
    const wsHeartbeat = interaction.client.ws.ping;

    await interaction.editReply(
      `🏓 **Pong!**\n` +
      `📡 Roundtrip: \`${roundtrip}ms\`\n` +
      `💓 WebSocket: \`${wsHeartbeat}ms\``
    );
  },
};
