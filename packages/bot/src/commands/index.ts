import { command as ping } from './ping.js';
import { command as help } from './help.js';
import type { Command } from '../lib/types.js';

export const commands: Command[] = [ping, help];
