import { REST, Routes } from 'discord.js';
import { config } from './lib/config.js';
import { commands } from './commands/index.js';

const rest = new REST().setToken(config.botToken);

async function deployCommands() {
  try {
    console.log(`🔄 Refreshing ${commands.length} application commands...`);

    const commandData = commands.map((cmd) => cmd.data.toJSON());

    if (config.guildId) {
      // Deploy to specific guild (faster, for development)
      const data = await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: commandData }
      );
      console.log(`✅ Successfully registered ${(data as unknown[]).length} guild commands`);
    } else {
      // Deploy globally (slower, takes up to an hour to propagate)
      const data = await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: commandData }
      );
      console.log(`✅ Successfully registered ${(data as unknown[]).length} global commands`);
    }
  } catch (error) {
    console.error('Error deploying commands:', error);
    process.exit(1);
  }
}

deployCommands();
