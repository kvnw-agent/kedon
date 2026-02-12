import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions, getUserGuilds } from '@/lib/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { GuildList } from './guild-list';

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
    <div className="min-h-screen bg-grid">
      {/* Gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-background/30 to-background pointer-events-none" />
      
      <div className="relative max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="flex items-center justify-between pb-6 mb-8 border-b border-border animate-fade-in">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-mono text-lg font-semibold text-primary hover:opacity-80 transition-opacity">
              kedon
            </Link>
            <span className="text-muted-foreground/30">/</span>
            <span className="font-mono text-sm text-muted-foreground">dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7 border border-border">
                <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                <AvatarFallback className="bg-muted text-xs font-mono">
                  {session.user?.name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="font-mono text-sm text-muted-foreground hidden sm:inline">
                {session.user?.name}
              </span>
            </div>
            <Link 
              href="/api/auth/signout"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {/* Guild List with refresh functionality */}
        <GuildList 
          initialGuilds={guilds} 
          clientId={process.env.DISCORD_CLIENT_ID!}
        />
      </div>
    </div>
  );
}
