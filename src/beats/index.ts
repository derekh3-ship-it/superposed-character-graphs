/**
 * Beats Index - All scenes for the Lifeboat scenario
 */

import type { Beat } from '../types.js';
import { beat1Beats } from './beat1.js';
import { beat2Beats } from './beat2.js';
import { beat3Beats } from './beat3.js';
import { beat4Beats } from './beat4.js';

// Combine all beats into a single map
const allBeats: Beat[] = [
  ...beat1Beats,
  ...beat2Beats,
  ...beat3Beats,
  ...beat4Beats,
];

// Create a map for quick lookup
export const beatMap = new Map<string, Beat>();
for (const beat of allBeats) {
  beatMap.set(beat.id, beat);
}

/**
 * Get a beat by ID
 */
export function getBeat(id: string): Beat | undefined {
  return beatMap.get(id);
}

/**
 * Get the starting beat
 */
export function getStartingBeat(): Beat {
  return beatMap.get('beat_1_surface')!;
}

export { beat1Beats, beat2Beats, beat3Beats, beat4Beats };
