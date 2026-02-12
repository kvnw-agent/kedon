import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { MODULES } from '@kedon/common';
import type { Command } from '../lib/types.js';
import { getClient } from '../lib/client.js';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('List all commands')
    .addStringOption((option) =>
      option
        .setName('command')
        .setDescription('Get help for a specific command')
        .setRequired(false)
    ),
  module: 'utility',
  async execute(interaction) {
    const client = getClient();
    const commandName = interaction.options.getString('command');

    if (commandName) {
      // Show help for specific command
      const cmd = client.commands.get(commandName);
      if (!cmd) {
        await interaction.reply({
          content: `❌ Command \`${commandName}\` not found.`,
          ephemeral: true,
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`📖 /${cmd.data.name}`)
        .setDescription(cmd.data.description)
        .setColor(0x5865f2);

      if (cmd.module) {
        embed.addFields({
          name: 'Module',
          value: MODULES[cmd.module].name,
          inline: true,
        });
      }

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // Show all commands grouped by module
    const embed = new EmbedBuilder()
      .setTitle('📚 Kedon Commands')
      .setDescription('All available commands grouped by module.')
      .setColor(0x5865f2);

    // Group commands by module
    const byModule = new Map<string, string[]>();

    for (const [name, cmd] of client.commands) {
      const moduleName = cmd.module || 'general';
      if (!byModule.has(moduleName)) {
        byModule.set(moduleName, []);
      }
      byModule.get(moduleName)!.push(`\`/${name}\``);
    }

    for (const [moduleName, commands] of byModule) {
      const moduleInfo = MODULES[moduleName as keyof typeof MODULES];
      embed.addFields({
        name: moduleInfo?.name || 'General',
        value: commands.join(', '),
        inline: false,
      });
    }

    embed.setFooter({ text: 'Use /help <command> for more info' });

    await interaction.reply({ embeds: [embed] });
  },
};
