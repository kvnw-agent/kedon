'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RefreshCw } from 'lucide-react';
import type { APIGuild } from '@kedon/common';

interface GuildListProps {
  initialGuilds: APIGuild[];
  clientId: string;
}

function getGuildIcon(guildId: string, iconHash: string | null) {
  if (!iconHash) return null;
  return `https://cdn.discordapp.com/icons/${guildId}/${iconHash}.png`;
}

export function GuildList({ initialGuilds, clientId }: GuildListProps) {
  const [guilds, setGuilds] = useState(initialGuilds);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const refreshGuilds = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/guilds');
      if (response.ok) {
        const data = await response.json();
        setGuilds(data.guilds);
        setLastRefresh(Date.now());
      }
    } catch (error) {
      console.error('Failed to refresh guilds:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Auto-refresh on window focus (after returning from Discord OAuth)
  useEffect(() => {
    const handleFocus = () => {
      // Only refresh if more than 5 seconds since last refresh
      if (Date.now() - lastRefresh > 5000) {
        refreshGuilds();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshGuilds, lastRefresh]);

  // Check URL for refresh param (after adding bot)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('refresh') === 'true') {
      refreshGuilds();
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [refreshGuilds]);

  const guildsWithBot = guilds.filter(g => g.botInGuild);
  const guildsWithoutBot = guilds.filter(g => !g.botInGuild);

  return (
    <>
      {/* Refresh Button */}
      <div className="flex items-center justify-between mb-6 animate-fade-in-delay-1">
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse-glow" />
          <span>bot online</span>
        </div>
        <button
          onClick={refreshGuilds}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'refreshing...' : 'refresh'}</span>
        </button>
      </div>

      {/* Servers with bot */}
      {guildsWithBot.length > 0 && (
        <section className="mb-8 animate-fade-in-delay-1">
          <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-4">
            Your Servers
          </h2>
          <ul className="space-y-1">
            {guildsWithBot.map((guild, index) => (
              <li key={guild.id} style={{ animationDelay: `${150 + index * 50}ms` }} className="animate-fade-in opacity-0">
                <Link 
                  href={`/dashboard/${guild.id}`}
                  className="group flex items-center gap-3 py-3 px-3 -mx-3 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src={getGuildIcon(guild.id, guild.icon) || ''} alt={guild.name} />
                    <AvatarFallback className="bg-muted text-xs font-mono">
                      {guild.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-sm text-foreground group-hover:text-primary transition-colors truncate block">
                      {guild.name}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
                    {guild.owner ? 'owner' : 'admin'}
                  </span>
                  <span className="font-mono text-muted-foreground/30 group-hover:text-muted-foreground transition-colors">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Servers without bot */}
      {guildsWithoutBot.length > 0 && (
        <section className="animate-fade-in-delay-2">
          <h2 className="font-mono text-xs text-muted-foreground/70 uppercase tracking-wider mb-4">
            Add Bot
          </h2>
          <ul className="space-y-1">
            {guildsWithoutBot.map((guild, index) => (
              <li key={guild.id} style={{ animationDelay: `${250 + index * 50}ms` }} className="animate-fade-in opacity-0">
                <a
                  href={`https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands&guild_id=${guild.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 py-3 px-3 -mx-3 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-8 w-8 border border-border opacity-50 group-hover:opacity-100 transition-opacity">
                    <AvatarImage src={getGuildIcon(guild.id, guild.icon) || ''} alt={guild.name} />
                    <AvatarFallback className="bg-muted text-xs font-mono">
                      {guild.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate block">
                      {guild.name}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-primary/70 group-hover:text-primary transition-colors">
                    + add
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Empty state */}
      {guilds.length === 0 && (
        <div className="py-12 text-center animate-fade-in-delay-1">
          <p className="font-mono text-sm text-muted-foreground">
            no servers found
          </p>
          <p className="font-mono text-xs text-muted-foreground/70 mt-2">
            you need "manage server" permission
          </p>
        </div>
      )}
    </>
  );
}
