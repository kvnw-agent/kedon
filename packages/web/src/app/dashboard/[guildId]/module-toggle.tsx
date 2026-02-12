'use client';

import { Switch } from '@/components/ui/switch';
import { useState, useTransition } from 'react';
import type { ModuleName } from '@kedon/common';

interface ModuleToggleProps {
  moduleName: ModuleName;
  module: {
    readonly name: string;
    readonly description: string;
    readonly commands: readonly string[];
  };
  enabled: boolean;
  guildId: string;
}

export function ModuleToggle({ moduleName, module, enabled, guildId }: ModuleToggleProps) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (checked: boolean) => {
    setIsEnabled(checked);
    startTransition(async () => {
      // TODO: Call API to update module status
      console.log(`Toggling ${moduleName} to ${checked} for guild ${guildId}`);
    });
  };

  return (
    <div className="group flex items-start gap-4 py-4 px-3 -mx-3 rounded-md hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-sm text-foreground">
            {module.name.toLowerCase()}
          </span>
          {isPending && (
            <span className="font-mono text-xs text-primary animate-pulse">
              saving...
            </span>
          )}
        </div>
        <p className="font-mono text-xs text-muted-foreground mb-2">
          {module.description}
        </p>
        {module.commands.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {module.commands.map((cmd) => (
              <code 
                key={cmd} 
                className="font-mono text-[10px] text-muted-foreground/70 bg-muted/50 px-1.5 py-0.5 rounded"
              >
                /{cmd}
              </code>
            ))}
          </div>
        )}
      </div>
      <Switch 
        checked={isEnabled} 
        onCheckedChange={handleToggle}
        disabled={isPending}
        className="data-[state=checked]:bg-primary/80 data-[state=unchecked]:bg-muted"
      />
    </div>
  );
}
