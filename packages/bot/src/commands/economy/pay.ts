import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../lib/types.js';
import { transferBalance, getBalance } from '@kedon/db';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('pay')
    .setDescription('Transfer coins to another user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to pay')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Amount of coins to transfer')
        .setRequired(true)
        .setMinValue(1)
    ),
  module: 'economy',

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user', true);
    const amount = interaction.options.getInteger('amount', true);

    // Can't pay yourself
    if (targetUser.id === interaction.user.id) {
      await interaction.reply({ content: "❌ You can't pay yourself!", ephemeral: true });
      return;
    }

    // Can't pay bots
    if (targetUser.bot) {
      await interaction.reply({ content: "❌ You can't pay bots!", ephemeral: true });
      return;
    }

    try {
      const success = await transferBalance(interaction.user.id, targetUser.id, amount);

      if (!success) {
        const balance = await getBalance(interaction.user.id);
        const embed = new EmbedBuilder()
          .setTitle('❌ Insufficient Funds')
          .setDescription(`You don't have enough coins!\nYou have **${balance.toLocaleString()}** coins.`)
          .setColor(0xed4245);

        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      // Get new balances
      const senderBalance = await getBalance(interaction.user.id);
      const receiverBalance = await getBalance(targetUser.id);

      const embed = new EmbedBuilder()
        .setTitle('💸 Transfer Complete')
        .setDescription(`You sent **${amount.toLocaleString()}** coins to **${targetUser.displayName}**!`)
        .setColor(0x57f287)
        .addFields(
          { name: 'Your Balance', value: `${senderBalance.toLocaleString()} coins`, inline: true },
          { name: `${targetUser.displayName}'s Balance`, value: `${receiverBalance.toLocaleString()} coins`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error transferring coins:', error);
      await interaction.reply({ content: '❌ Failed to transfer coins. Please try again.', ephemeral: true });
    }
  },
};
