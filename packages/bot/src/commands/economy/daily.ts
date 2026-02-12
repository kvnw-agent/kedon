import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../lib/types.js';
import { claimDaily } from '@kedon/db';

function formatTimeUntil(date: Date): string {
  const now = Date.now();
  const diff = date.getTime() - now;
  
  if (diff <= 0) return 'now';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily coin reward'),
  module: 'economy',

  async execute(interaction) {
    try {
      const result = await claimDaily(interaction.user.id);

      if (!result.success) {
        if (result.reason === 'cooldown' && result.nextClaimTime) {
          const embed = new EmbedBuilder()
            .setTitle('⏰ Daily Already Claimed')
            .setDescription(`You've already claimed your daily reward!\nCome back in **${formatTimeUntil(result.nextClaimTime)}**`)
            .setColor(0xffa500)
            .setTimestamp();

          await interaction.reply({ embeds: [embed], ephemeral: true });
          return;
        }
      }

      const embed = new EmbedBuilder()
        .setTitle('🎁 Daily Reward Claimed!')
        .setDescription(`You received **${result.amount!.toLocaleString()}** coins!`)
        .setColor(0x57f287)
        .addFields(
          { name: '🔥 Streak', value: `${result.streak!} day${result.streak! > 1 ? 's' : ''}`, inline: true },
          { name: '💰 New Balance', value: `${result.newBalance!.toLocaleString()} coins`, inline: true }
        )
        .setTimestamp();

      if (result.streak! > 1) {
        const bonusAmount = result.amount! - 100;
        if (bonusAmount > 0) {
          embed.addFields({
            name: '✨ Streak Bonus',
            value: `+${bonusAmount} coins`,
            inline: true,
          });
        }
      }

      embed.setFooter({ text: 'Come back tomorrow to continue your streak!' });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error claiming daily:', error);
      await interaction.reply({ content: '❌ Failed to claim daily reward. Please try again.', ephemeral: true });
    }
  },
};
