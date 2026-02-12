import { command as balance } from './balance.js';
import { command as daily } from './daily.js';
import { command as pay } from './pay.js';
import { command as leaderboard } from './leaderboard.js';
import type { Command } from '../../lib/types.js';

export const economyCommands: Command[] = [
  balance,
  daily,
  pay,
  leaderboard,
];
