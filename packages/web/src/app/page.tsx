'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

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
      <div className="flex min-h-screen items-center justify-center bg-grid">
        <div className="h-1 w-8 bg-primary/50 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-grid overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none" />
      
      {/* Subtle radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative flex flex-col items-center justify-center min-h-screen px-6">
        {/* Logo/Wordmark */}
        <div className="animate-fade-in">
          <h1 className="font-mono text-4xl font-semibold tracking-tight">
            <span className="text-primary">kedon</span>
          </h1>
        </div>

        {/* Tagline */}
        <p className="mt-4 text-muted-foreground text-center max-w-md animate-fade-in-delay-1 font-mono text-sm">
          modular discord bot. manage your server.
        </p>

        {/* Login Button */}
        <div className="mt-10 animate-fade-in-delay-2">
          <Button 
            onClick={() => signIn('discord')}
            className="font-mono text-sm px-6 py-5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:border-primary/40 transition-all"
          >
            login with discord
          </Button>
        </div>

        {/* Footer hint */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center animate-fade-in-delay-3">
          <span className="font-mono text-xs text-muted-foreground/50">
            v0.1.0
          </span>
        </div>
      </div>
    </div>
  );
}
