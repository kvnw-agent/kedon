import type { NextAuthOptions, Session } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import type { APIGuild } from '@kedon/common';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    id?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'identify email guilds',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.id = (profile as { id?: string })?.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      if (token.id) {
        session.user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
};

// Fetch guilds the bot is in using bot token
async function getBotGuilds(): Promise<Set<string>> {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) {
    console.warn('BOT_TOKEN not set, cannot check bot guild membership');
    return new Set();
  }

  try {
    const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      console.error('Failed to fetch bot guilds:', response.status);
      return new Set();
    }

    const guilds = await response.json();
    return new Set(guilds.map((g: { id: string }) => g.id));
  } catch (error) {
    console.error('Error fetching bot guilds:', error);
    return new Set();
  }
}

export async function getUserGuilds(accessToken: string): Promise<APIGuild[]> {
  // Fetch user's guilds and bot's guilds in parallel
  const [userGuildsResponse, botGuildIds] = await Promise.all([
    fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
    getBotGuilds(),
  ]);

  if (!userGuildsResponse.ok) {
    throw new Error('Failed to fetch guilds');
  }

  const guilds = await userGuildsResponse.json();

  // Filter to guilds where user has MANAGE_GUILD permission
  const MANAGE_GUILD = 0x20;
  return guilds
    .filter((guild: APIGuild) => {
      const perms = BigInt(guild.permissions);
      return (perms & BigInt(MANAGE_GUILD)) === BigInt(MANAGE_GUILD) || guild.owner;
    })
    .map((guild: APIGuild) => ({
      ...guild,
      botInGuild: botGuildIds.has(guild.id),
    }));
}
