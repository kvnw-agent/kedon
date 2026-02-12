import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../lib/types.js';
import { getLeaderboard } from '@kedon/db';

const MEDALS = ['🥇', '🥈', '🥉'];

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the richest users'),
  module: 'economy',

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const topUsers = await getLeaderboard(10);

      if (topUsers.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle('🏆 Leaderboard')
          .setDescription('No one has any coins yet! Be the first to claim `/daily`.')
          .setColor(0x5865f2);

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // Build leaderboard text
      const leaderboardLines = await Promise.all(
        topUsers.map(async (user, index) => {
          const position = index < 3 ? MEDALS[index] : `**${index + 1}.**`;
          
          // Try to fetch user info
          let displayName = `<@${user.discordId}>`;
          try {
            const discordUser = await interaction.client.users.fetch(user.discordId);
            displayName = discordUser.displayName;
          } catch {
            // Keep the mention format if we can't fetch user
          }

          return `${position} ${displayName} — **${user.balance.toLocaleString()}** coins`;
        })
      );

      // Find user's rank
      let userRank = topUsers.findIndex(u => u.discordId === interaction.user.id);
      let userRankText = '';
      
      if (userRank === -1) {
        // User not in top 10, show their position
        userRankText = '\n\n*You are not in the top 10. Keep earning coins!*';
      } else {
        userRankText = `\n\nYou are ranked **#${userRank + 1}**!`;
      }

      const embed = new EmbedBuilder()
        .setTitle('🏆 Coin Leaderboard')
        .setDescription(leaderboardLines.join('\n') + userRankText)
        .setColor(0xffd700)
        .setTimestamp()
        .setFooter({ text: 'Earn coins with /daily' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      await interaction.editReply({ content: '❌ Failed to fetch leaderboard. Please try again.' });
    }
  },
};
