import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions, getUserGuilds } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Settings, Plus } from 'lucide-react';

function getGuildIcon(guildId: string, iconHash: string | null) {
  if (!iconHash) return null;
  return `https://cdn.discordapp.com/icons/${guildId}/${iconHash}.png`;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  let guilds: Awaited<ReturnType<typeof getUserGuilds>> = [];
  try {
    guilds = await getUserGuilds(session.accessToken!);
  } catch (error) {
    console.error('Error fetching guilds:', error);
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Kedon Dashboard</h1>
          <div className="flex items-center gap-4">
            <Avatar className="h-8 w-8">
              <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
              <AvatarFallback>{session.user?.name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{session.user?.name}</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Select a Server</h2>
          <p className="text-muted-foreground mt-1">
            Choose a server to manage. You can only manage servers where you have the &quot;Manage Server&quot; permission.
          </p>
        </div>

        {guilds.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No servers found. Make sure you have &quot;Manage Server&quot; permission in at least one server.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {guilds.map((guild) => (
              <Card key={guild.id} className="hover:border-primary transition-colors">
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={getGuildIcon(guild.id, guild.icon) || ''} alt={guild.name} />
                    <AvatarFallback>{guild.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate">{guild.name}</CardTitle>
                    <CardDescription>
                      {guild.owner ? 'Owner' : 'Manager'}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  {guild.botInGuild ? (
                    <Button asChild className="w-full">
                      <Link href={`/dashboard/${guild.id}`}>
                        <Settings className="mr-2 h-4 w-4" />
                        Manage
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" asChild>
                      <a
                        href={`https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&permissions=8&scope=bot%20applications.commands&guild_id=${guild.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Bot
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
