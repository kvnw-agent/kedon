import type { Client } from 'discord.js';
import type { Event } from '../lib/types.js';

export const event: Event = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);
    console.log(`📊 Serving ${client.guilds.cache.size} guilds`);

    // Set presence
    client.user.setPresence({
      activities: [{ name: '/help', type: 0 }],
      status: 'online',
    });
  },
};
