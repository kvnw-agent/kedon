import { command as kick } from './kick.js';
import { command as ban } from './ban.js';
import { command as unban } from './unban.js';
import { command as warn } from './warn.js';
import { command as warnings } from './warnings.js';
import { command as clearwarning } from './clearwarning.js';
import { command as mute } from './mute.js';
import { command as unmute } from './unmute.js';
import { command as purge } from './purge.js';
import type { Command } from '../../lib/types.js';

export const moderationCommands: Command[] = [
  kick,
  ban,
  unban,
  warn,
  warnings,
  clearwarning,
  mute,
  unmute,
  purge,
];
