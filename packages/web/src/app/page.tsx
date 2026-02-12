'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, Zap, Shield, Settings } from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-primary/10 p-4">
                <Bot className="h-16 w-16 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              <span className="text-primary">Kedon</span> Discord Bot
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
              A powerful, modular Discord bot with moderation, economy, leveling, and more.
              Fully customizable through the web dashboard.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" onClick={() => signIn('discord')}>
                Login with Discord
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="https://github.com/kvnw-agent/kedon" target="_blank" rel="noopener noreferrer">
                  View on GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="rounded-xl border bg-card p-6">
            <Shield className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold">Moderation</h3>
            <p className="mt-2 text-muted-foreground">
              Kick, ban, mute, and warn users. Full moderation logging.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <Zap className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold">Economy & Leveling</h3>
            <p className="mt-2 text-muted-foreground">
              Virtual currency, daily rewards, and XP progression system.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <Settings className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold">Fully Modular</h3>
            <p className="mt-2 text-muted-foreground">
              Enable or disable features per-server via the dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
