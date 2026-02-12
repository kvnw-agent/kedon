import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import type { Command, Event } from './types.js';

export class KedonClient extends Client {
  commands = new Collection<string, Command>();

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
      ],
      partials: [Partials.Channel, Partials.Message],
    });
  }

  registerCommand(command: Command) {
    this.commands.set(command.data.name, command);
  }

  registerEvent(event: Event) {
    if (event.once) {
      this.once(event.name, (...args) => event.execute(...args));
    } else {
      this.on(event.name, (...args) => event.execute(...args));
    }
  }
}

// Singleton
let client: KedonClient | null = null;

export function getClient(): KedonClient {
  if (!client) {
    client = new KedonClient();
  }
  return client;
}
