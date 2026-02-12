import { event as ready } from './ready.js';
import { event as interactionCreate } from './interactionCreate.js';
import type { Event } from '../lib/types.js';

export const events: Event[] = [ready, interactionCreate];
