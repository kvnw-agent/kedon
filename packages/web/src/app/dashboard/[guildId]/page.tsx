import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { MODULES, type ModuleName } from '@kedon/common';
import Link from 'next/link';
import { ModuleToggle } from './module-toggle';

interface Props {
  params: Promise<{ guildId: string }>;
}

export default async function GuildSettingsPage({ params }: Props) {
  const { guildId } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  // TODO: Fetch actual module status from API
  const moduleStatus: Record<ModuleName, boolean> = {
    moderation: true,
    economy: true,
    leveling: true,
    welcome: false,
    logging: true,
    utility: true,
  };

  const moduleEntries = Object.entries(MODULES) as [ModuleName, typeof MODULES[ModuleName]][];

  return (
    <div className="min-h-screen bg-grid">
      {/* Gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-background/30 to-background pointer-events-none" />
      
      <div className="relative max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="flex items-center gap-2 pb-6 mb-8 border-b border-border animate-fade-in">
          <Link href="/" className="font-mono text-lg font-semibold text-primary hover:opacity-80 transition-opacity">
            kedon
          </Link>
          <span className="text-muted-foreground/30">/</span>
          <Link href="/dashboard" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors">
            dashboard
          </Link>
          <span className="text-muted-foreground/30">/</span>
          <span className="font-mono text-sm text-muted-foreground truncate max-w-[200px]">
            {guildId}
          </span>
        </header>

        {/* Server ID */}
        <div className="mb-8 animate-fade-in-delay-1">
          <div className="font-mono text-xs text-muted-foreground/70">
            <span className="text-muted-foreground/50">id:</span> {guildId}
          </div>
        </div>

        {/* Modules Section */}
        <section className="animate-fade-in-delay-1">
          <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-6">
            Modules
          </h2>
          
          <ul className="space-y-1">
            {moduleEntries.map(([key, module], index) => (
              <li 
                key={key} 
                style={{ animationDelay: `${150 + index * 50}ms` }} 
                className="animate-fade-in opacity-0"
              >
                <ModuleToggle
                  moduleName={key}
                  module={module}
                  enabled={moduleStatus[key]}
                  guildId={guildId}
                />
              </li>
            ))}
          </ul>
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-border animate-fade-in-delay-3">
          <p className="font-mono text-xs text-muted-foreground/50">
            changes save automatically
          </p>
        </footer>
      </div>
    </div>
  );
}
