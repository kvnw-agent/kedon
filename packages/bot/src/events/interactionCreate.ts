import type { Interaction } from 'discord.js';
import { getClient } from '../lib/client.js';
import { isModuleEnabled } from '@kedon/db';
import type { Event } from '../lib/types.js';

export const event: Event = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const client = getClient();
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.warn(`Unknown command: ${interaction.commandName}`);
      return;
    }

    // Check if module is enabled for this guild
    if (command.module && interaction.guildId) {
      const enabled = await isModuleEnabled(interaction.guildId, command.module);
      if (!enabled) {
        await interaction.reply({
          content: `❌ The **${command.module}** module is disabled in this server.`,
          ephemeral: true,
        });
        return;
      }
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing command ${interaction.commandName}:`, error);

      const content = '❌ An error occurred while executing this command.';
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content, ephemeral: true });
      } else {
        await interaction.reply({ content, ephemeral: true });
      }
    }
  },
};
