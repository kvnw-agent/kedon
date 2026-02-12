import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { MODULES, type ModuleName } from '@kedon/common';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">Server Settings</h1>
            <p className="text-sm text-muted-foreground">Guild ID: {guildId}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Modules</h2>
          <p className="text-muted-foreground mt-1">
            Enable or disable bot features for this server.
          </p>
        </div>

        <div className="grid gap-4">
          {(Object.entries(MODULES) as [ModuleName, typeof MODULES[ModuleName]][]).map(
            ([key, module]) => (
              <Card key={key}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>{module.name}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </div>
                  <Switch checked={moduleStatus[key]} />
                </CardHeader>
                {module.commands.length > 0 && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Commands:{' '}
                      {module.commands.map((cmd) => (
                        <code key={cmd} className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">
                          /{cmd}
                        </code>
                      ))}
                    </p>
                  </CardContent>
                )}
              </Card>
            )
          )}
        </div>
      </main>
    </div>
  );
}
