/**
 * Director - Field calculations and choice evaluation
 *
 * The Director calculates the "field strength" of each available choice
 * based on arc states, catalysis, trust levels, and player patterns.
 */

import type { GameState, Choice, Beat } from './types.js';
import {
  getNode,
  getNodeThreshold,
  checkPrerequisites,
  getCatalysisModifier,
} from './state.js';

// ============================================
// CHOICE FIELD EVALUATION
// ============================================

export interface EvaluatedChoice {
  choice: Choice;
  fieldStrength: number;
  pull: number;
  push: number;
  patternBonus: number;
  available: boolean;
}

/**
 * Evaluate all choices for a beat, calculating field strengths
 * and filtering by availability
 */
export function evaluateChoices(
  state: GameState,
  beat: Beat
): EvaluatedChoice[] {
  const choices = beat.getChoices(state);
  const evaluated: EvaluatedChoice[] = [];

  for (const choice of choices) {
    // Check availability
    const available = choice.availableIf ? choice.availableIf(state) : true;

    // Calculate field components
    const pull = calculatePull(state, choice);
    const push = calculatePush(state, choice);
    const patternBonus = calculatePatternBonus(state, choice);

    const fieldStrength = pull - push + patternBonus;

    evaluated.push({
      choice,
      fieldStrength,
      pull,
      push,
      patternBonus,
      available,
    });
  }

  // Sort by field strength (highest first)
  evaluated.sort((a, b) => b.fieldStrength - a.fieldStrength);

  return evaluated;
}

/**
 * Calculate pull - how strongly arcs want this choice
 */
function calculatePull(state: GameState, choice: Choice): number {
  let pull = 0;

  if (!choice.effects?.arc) return pull;

  for (const [nodeId, effect] of Object.entries(choice.effects.arc)) {
    const node = getNode(state, nodeId);
    if (!node) continue;
    if (node.state === 'foreclosed') continue;

    const threshold = getNodeThreshold(nodeId);

    // Higher pull if node has partial progress (momentum)
    if (node.state === 'partial' || node.partialWeight > 0) {
      pull += 0.3 * (node.partialWeight / threshold);
    }

    // Higher pull if prerequisites just triggered (ready to advance)
    if (checkPrerequisites(state, nodeId) && node.state === 'dormant') {
      pull += 0.4;
    }

    // Higher pull if being catalyzed
    const catMod = getCatalysisModifier(state, nodeId);
    if (catMod > 1.0) {
      pull += 0.2 * (catMod - 1.0);
    }

    // Direct trigger has high pull
    if (effect.trigger) {
      pull += 0.5;
    }

    // Partial progress has moderate pull
    if (effect.partial) {
      pull += 0.2 * (effect.partial / threshold);
    }
  }

  return pull;
}

/**
 * Calculate push - resistance to this choice
 */
function calculatePush(state: GameState, choice: Choice): number {
  let push = 0;

  if (!choice.effects?.arc) return push;

  for (const [nodeId, effect] of Object.entries(choice.effects.arc)) {
    // Higher push for confession nodes when tension is high
    if (nodeId.includes('confession') || nodeId.includes('story') || nodeId.includes('reason')) {
      if (state.tension > 0.5) {
        push += 0.2 * state.tension;
      }
    }

    // Push if trust is low for deep revelations
    if (effect.trigger || (effect.partial && effect.partial > 0.3)) {
      const [char] = nodeId.split('.');
      const trust = state.relationships[char as keyof typeof state.relationships]?.trust ?? 0;
      if (trust < 0.2) {
        push += 0.15;
      }
    }
  }

  return push;
}

/**
 * Calculate pattern bonus - alignment with established player pattern
 */
function calculatePatternBonus(state: GameState, choice: Choice): number {
  let bonus = 0;

  if (!choice.effects?.playerPattern) return bonus;

  for (const [dim, delta] of Object.entries(choice.effects.playerPattern)) {
    const current = state.playerPattern[dim as keyof typeof state.playerPattern];
    // Bonus if choice aligns with established pattern
    if (Math.sign(delta) === Math.sign(current) && Math.abs(current) > 0.1) {
      bonus += 0.05 * Math.abs(current);
    }
  }

  return bonus;
}

// ============================================
// BEAT SELECTION
// ============================================

export interface BeatScore {
  beat: Beat;
  score: number;
}

/**
 * Calculate which beats would be most dramatically appropriate
 * based on current arc states
 */
export function scoreBeatOpportunities(
  state: GameState,
  beats: Beat[]
): BeatScore[] {
  const scores: BeatScore[] = [];

  for (const beat of beats) {
    let score = 0;

    // Get choices for this beat
    const choices = beat.getChoices(state);

    // Score based on arc opportunities in choices
    for (const choice of choices) {
      if (!choice.effects?.arc) continue;

      for (const [nodeId, effect] of Object.entries(choice.effects.arc)) {
        const node = getNode(state, nodeId);
        if (!node) continue;
        if (node.state === 'foreclosed' || node.state === 'triggered') continue;

        // Score based on readiness
        let readiness = 0;

        if (checkPrerequisites(state, nodeId)) {
          readiness += 0.3;
        }

        if (node.partialWeight > 0) {
          const threshold = getNodeThreshold(nodeId);
          readiness += 0.3 * (node.partialWeight / threshold);
        }

        const catMod = getCatalysisModifier(state, nodeId);
        if (catMod > 1.0) {
          readiness += 0.2;
        }

        // Weight by effect strength
        const effectStrength = effect.trigger ? 1.0 : (effect.partial ?? 0) * 2;
        score += readiness * effectStrength;
      }
    }

    scores.push({ beat, score });
  }

  scores.sort((a, b) => b.score - a.score);
  return scores;
}

// ============================================
// ARC FIELD VISUALIZATION
// ============================================

/**
 * Generate a visualization of current arc field state
 */
export function visualizeArcField(state: GameState): string {
  const lines: string[] = [];
  lines.push('\n╔═══════════════════════════════════════════════════════════════╗');
  lines.push('║                     ARC FIELD STATE                           ║');
  lines.push('╠═══════════════════════════════════════════════════════════════╣');

  for (const [char, arcs] of Object.entries(state.arcs)) {
    lines.push(`║ ${char.toUpperCase().padEnd(62)}║`);

    for (const [nodeName, node] of Object.entries(arcs)) {
      const nodeId = `${char}.${nodeName}`;
      const threshold = getNodeThreshold(nodeId);
      const progress = Math.min(node.partialWeight / threshold, 1);
      const catalysis = getCatalysisModifier(state, nodeId);

      // Create progress bar
      const barWidth = 20;
      const filled = Math.round(progress * barWidth);
      const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);

      // Status indicator
      let status = '';
      if (node.state === 'triggered') status = '✓ TRIGGERED';
      else if (node.state === 'foreclosed') status = '✗ FORECLOSED';
      else if (catalysis > 1.0) status = `⚡ ${catalysis.toFixed(1)}x`;
      else status = `${(progress * 100).toFixed(0)}%`;

      const line = `║   ${nodeName.padEnd(20)} [${bar}] ${status.padEnd(14)}║`;
      lines.push(line);
    }

    lines.push('║                                                               ║');
  }

  // Trust levels
  lines.push('╠═══════════════════════════════════════════════════════════════╣');
  lines.push('║ TRUST LEVELS                                                  ║');
  for (const [char, rel] of Object.entries(state.relationships)) {
    const trustBar = '●'.repeat(Math.round((rel.trust + 1) * 5)) +
                    '○'.repeat(10 - Math.round((rel.trust + 1) * 5));
    lines.push(`║   ${char.padEnd(10)} [${trustBar}] ${rel.trust.toFixed(2).padStart(6)}             ║`);
  }

  lines.push('╚═══════════════════════════════════════════════════════════════╝');

  return lines.join('\n');
}

// ============================================
// CATALYSIS CHAIN DETECTION
// ============================================

/**
 * Detect and report active catalysis chains
 */
export function detectCatalysisChains(state: GameState): string[] {
  const chains: string[] = [];

  for (const [targetNode, effects] of Object.entries(state.activeCatalysis)) {
    if (effects.length > 0) {
      const sources = effects.map((e) => `${e.source}(${e.modifier.toFixed(1)}x)`).join(' + ');
      const totalMod = effects.reduce((acc, e) => acc * e.modifier, 1);
      chains.push(`${targetNode} ← ${sources} = ${totalMod.toFixed(2)}x`);
    }
  }

  return chains;
}
