#!/usr/bin/env node

/**
 * Playthrough Generator - Automated playthroughs for testing and sample generation
 *
 * Generates sample playthroughs using different strategies:
 * - Random: picks choices randomly
 * - Maximize trust: prefers choices that build trust with a specific character
 * - Follow arc: prioritizes advancing a specific character's arc
 * - High drama: follows the field strength (most dramatically appropriate choices)
 * - Completionist: tries to trigger as many arcs as possible
 */

import * as fs from 'fs';
import * as path from 'path';
import type { GameState, Beat, Choice, CharacterName, Ending } from './types.js';
import {
  createInitialState,
  applyChoiceEffects,
  getNode,
  nodeIs,
  getTrust,
  generateStateSummary,
} from './state.js';
import { getBeat, getStartingBeat, beatMap } from './beats/index.js';
import { evaluateChoices, EvaluatedChoice } from './director.js';
import { assembleEnding } from './beats/beat4.js';

// ============================================
// TYPES
// ============================================

export type SelectionStrategy =
  | 'random'
  | 'high_drama'
  | 'maximize_mira_trust'
  | 'maximize_selin_trust'
  | 'maximize_ver_trust'
  | 'mira_full_arc'
  | 'selin_full_arc'
  | 'ver_full_arc'
  | 'completionist'
  | 'gentle_witness'
  | 'curious_catalyst';

export interface PlaythroughStep {
  beatId: string;
  beatName: string;
  prose: string;
  chosenChoice: string;
  choiceText: string;
  stateSnapshot: {
    tension: number;
    timeInNight: number;
    trust: Record<CharacterName, number>;
    triggeredArcs: string[];
  };
}

export interface PlaythroughResult {
  strategy: SelectionStrategy;
  steps: PlaythroughStep[];
  ending: Ending;
  finalState: GameState;
  stats: PlaythroughStats;
}

export interface PlaythroughStats {
  totalChoices: number;
  arcsTriggered: number;
  arcsForeclosed: number;
  averageTrust: number;
  characterTrust: Record<CharacterName, number>;
  playerPattern: {
    curious_vs_pragmatic: number;
    gentle_vs_pressing: number;
    selfless_vs_self_focused: number;
  };
}

// ============================================
// PLAYTHROUGH ENGINE
// ============================================

export class PlaythroughEngine {
  private state: GameState;
  private currentBeat: Beat;
  private steps: PlaythroughStep[];
  private strategy: SelectionStrategy;

  constructor(strategy: SelectionStrategy = 'random') {
    this.state = createInitialState();
    this.currentBeat = getStartingBeat();
    this.steps = [];
    this.strategy = strategy;
  }

  /**
   * Run a complete playthrough using the configured strategy
   */
  run(): PlaythroughResult {
    while (true) {
      // Execute onEnter if present
      if (this.currentBeat.onEnter) {
        this.currentBeat.onEnter(this.state);
      }

      // Update state
      this.state.currentBeat = this.currentBeat.id;
      this.state.beatHistory.push(this.currentBeat.id);

      // Get prose
      const prose = this.currentBeat.getProse(this.state);

      // Check for game over
      if (this.currentBeat.id === 'game_over') {
        break;
      }

      // Get and evaluate choices
      const evaluatedChoices = evaluateChoices(this.state, this.currentBeat);
      const availableChoices = evaluatedChoices.filter((c) => c.available);

      if (availableChoices.length === 0) {
        break;
      }

      // Select choice based on strategy
      const selected = this.selectChoice(availableChoices);
      if (!selected) break;

      // Record step
      this.steps.push({
        beatId: this.currentBeat.id,
        beatName: this.currentBeat.name,
        prose: prose.trim(),
        chosenChoice: selected.choice.id,
        choiceText: selected.choice.text,
        stateSnapshot: this.captureStateSnapshot(),
      });

      // Apply effects
      applyChoiceEffects(this.state, selected.choice.effects);

      // Navigate to next beat
      if (selected.choice.next) {
        const nextBeat = getBeat(selected.choice.next);
        if (nextBeat) {
          this.currentBeat = nextBeat;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    // Assemble ending
    const ending = assembleEnding(this.state);
    const stats = this.calculateStats();

    return {
      strategy: this.strategy,
      steps: this.steps,
      ending,
      finalState: this.state,
      stats,
    };
  }

  /**
   * Select a choice based on the current strategy
   */
  private selectChoice(choices: EvaluatedChoice[]): EvaluatedChoice | undefined {
    if (choices.length === 0) return undefined;

    switch (this.strategy) {
      case 'random':
        return this.selectRandom(choices);
      case 'high_drama':
        return this.selectHighDrama(choices);
      case 'maximize_mira_trust':
        return this.selectMaximizeTrust(choices, 'mira');
      case 'maximize_selin_trust':
        return this.selectMaximizeTrust(choices, 'selin');
      case 'maximize_ver_trust':
        return this.selectMaximizeTrust(choices, 'ver');
      case 'mira_full_arc':
        return this.selectFollowArc(choices, 'mira');
      case 'selin_full_arc':
        return this.selectFollowArc(choices, 'selin');
      case 'ver_full_arc':
        return this.selectFollowArc(choices, 'ver');
      case 'completionist':
        return this.selectCompletionist(choices);
      case 'gentle_witness':
        return this.selectGentleWitness(choices);
      case 'curious_catalyst':
        return this.selectCuriousCatalyst(choices);
      default:
        return this.selectRandom(choices);
    }
  }

  /**
   * Random selection
   */
  private selectRandom(choices: EvaluatedChoice[]): EvaluatedChoice {
    const index = Math.floor(Math.random() * choices.length);
    return choices[index];
  }

  /**
   * Select the highest field strength choice (most dramatically appropriate)
   */
  private selectHighDrama(choices: EvaluatedChoice[]): EvaluatedChoice {
    // Already sorted by field strength
    return choices[0];
  }

  /**
   * Select choices that maximize trust with a specific character
   */
  private selectMaximizeTrust(
    choices: EvaluatedChoice[],
    character: CharacterName
  ): EvaluatedChoice {
    let best = choices[0];
    let bestScore = -Infinity;

    for (const choice of choices) {
      let score = 0;

      // Score based on trust effects
      const trustEffect = choice.choice.effects?.relationship?.[character]?.trust ?? 0;
      const allTrustEffect = choice.choice.effects?.relationship?.['all']?.trust ?? 0;
      score += (trustEffect + allTrustEffect) * 10;

      // Prefer gentle approaches
      const gentleEffect = choice.choice.effects?.playerPattern?.gentle_vs_pressing ?? 0;
      if (gentleEffect > 0) score += gentleEffect * 2;

      // Small bonus for arc progress with this character
      if (choice.choice.effects?.arc) {
        for (const nodeId of Object.keys(choice.choice.effects.arc)) {
          if (nodeId.startsWith(character + '.')) {
            score += 1;
          }
        }
      }

      // Add field strength as tiebreaker
      score += choice.fieldStrength * 0.1;

      if (score > bestScore) {
        bestScore = score;
        best = choice;
      }
    }

    return best;
  }

  /**
   * Select choices that advance a specific character's arc toward completion
   */
  private selectFollowArc(
    choices: EvaluatedChoice[],
    character: CharacterName
  ): EvaluatedChoice {
    // Define the target terminal nodes for each character
    const terminalNodes: Record<CharacterName, string[]> = {
      mira: ['mira.decision_to_stay'],
      selin: ['selin.release'],
      ver: ['ver.accepted', 'ver.contested'],
    };

    // Define the arc progression path
    const arcPath: Record<CharacterName, string[]> = {
      mira: [
        'mira.competence_acknowledged',
        'mira.crack_in_armor',
        'mira.the_confession',
        'mira.decision_to_stay',
      ],
      selin: [
        'selin.suspicion_noted',
        'selin.partial_truth',
        'selin.the_story',
        'selin.release',
      ],
      ver: [
        'ver.quiet_competence',
        'ver.the_noticing',
        'ver.the_reason',
        'ver.accepted',
      ],
    };

    // Beats that lead to specific characters - for navigation (only positive/neutral paths)
    const characterBeats: Record<CharacterName, string[]> = {
      mira: ['beat_1a_mira', 'beat_1a2_doctor', 'beat_2c_mira', 'beat_2c2_destination',
             'beat_3b_mira_deep', 'beat_3b2_mira_confession', 'beat_4a_mira_resolution'],
      selin: ['beat_1c_selin', 'beat_1c3_gentle', 'beat_2d_selin',  // removed beat_1c2_pushed (confrontational)
              'beat_2d2_selin_her', 'beat_3c_selin_deep', 'beat_3c2_selin_story', 'beat_4b_selin_resolution'],
      ver: ['beat_1b_inventory', 'beat_1b2_names', 'beat_1b3_calm', 'beat_1b4_husband', 'beat_1b5_notice',
            'beat_2e_ver', 'beat_2e2_ver_husband', 'beat_2e3_ver_final', 'beat_3d_ver_deep',
            'beat_3d2_ver_reason', 'beat_4c_ver_resolution'],
    };

    let best = choices[0];
    let bestScore = -Infinity;

    for (const choice of choices) {
      let score = 0;

      // Heavy weight for navigating to character-specific beats
      if (choice.choice.next && characterBeats[character].includes(choice.choice.next)) {
        score += 30;
      }

      // Also check for text hints about approaching the character
      const text = choice.choice.text.toLowerCase();
      if (character === 'mira' && (text.includes('mira') || text.includes('doctor') || text.includes('blood') || text.includes('injured'))) {
        score += 15;
      }
      if (character === 'selin' && (text.includes('selin') || text.includes('bag') || text.includes('young man'))) {
        score += 15;
      }
      if (character === 'ver' && (text.includes('ver') || text.includes('older woman') || text.includes('supplies') || text.includes('inventory') || text.includes('stern'))) {
        score += 15;
      }

      if (choice.choice.effects?.arc) {
        for (const [nodeId, effect] of Object.entries(choice.choice.effects.arc)) {
          if (nodeId.startsWith(character + '.')) {
            // Heavy weight for arc effects on target character
            if (effect.trigger) score += 20;
            if (effect.partial) score += effect.partial * 15;

            // Extra weight for terminal nodes
            if (terminalNodes[character].includes(nodeId)) {
              score *= 2;
            }

            // Weight based on arc progression path
            const pathIndex = arcPath[character].indexOf(nodeId);
            if (pathIndex >= 0) {
              score += (pathIndex + 1) * 2;
            }
          }
        }
      }

      // Strong weight for trust with target character - penalize negative trust heavily
      const trustEffect = choice.choice.effects?.relationship?.[character]?.trust ?? 0;
      if (trustEffect < 0) {
        score -= Math.abs(trustEffect) * 50; // Heavy penalty for damaging trust
      } else {
        score += trustEffect * 10;
      }

      // Add field strength as tiebreaker
      score += choice.fieldStrength * 0.1;

      if (score > bestScore) {
        bestScore = score;
        best = choice;
      }
    }

    return best;
  }

  /**
   * Select choices that maximize total arc progression across all characters
   */
  private selectCompletionist(choices: EvaluatedChoice[]): EvaluatedChoice {
    let best = choices[0];
    let bestScore = -Infinity;

    for (const choice of choices) {
      let score = 0;

      if (choice.choice.effects?.arc) {
        for (const [nodeId, effect] of Object.entries(choice.choice.effects.arc)) {
          // Score all arc progress
          if (effect.trigger) score += 10;
          if (effect.partial) score += effect.partial * 8;
          if (effect.foreclose) score -= 15; // Avoid foreclosure
        }
      }

      // Bonus for trust building with all characters
      if (choice.choice.effects?.relationship) {
        for (const [char, effect] of Object.entries(choice.choice.effects.relationship)) {
          if (effect.trust > 0) score += effect.trust * 3;
        }
      }

      // Add field strength
      score += choice.fieldStrength * 0.5;

      if (score > bestScore) {
        bestScore = score;
        best = choice;
      }
    }

    return best;
  }

  /**
   * Select choices that emphasize gentleness and witnessing
   */
  private selectGentleWitness(choices: EvaluatedChoice[]): EvaluatedChoice {
    let best = choices[0];
    let bestScore = -Infinity;

    for (const choice of choices) {
      let score = 0;

      // Strong preference for gentle approaches
      const gentleEffect = choice.choice.effects?.playerPattern?.gentle_vs_pressing ?? 0;
      if (gentleEffect > 0) score += gentleEffect * 20;
      if (gentleEffect < 0) score -= 10; // Penalize pressing

      // Prefer curious over pragmatic
      const curiousEffect = choice.choice.effects?.playerPattern?.curious_vs_pragmatic ?? 0;
      if (curiousEffect > 0) score += curiousEffect * 10;

      // Still want trust
      if (choice.choice.effects?.relationship) {
        for (const effect of Object.values(choice.choice.effects.relationship)) {
          score += effect.trust * 5;
        }
      }

      // Look for "wait", "listen", "let", "don't push" type choices
      const text = choice.choice.text.toLowerCase();
      if (text.includes('listen') || text.includes('wait') || text.includes("don't push")) {
        score += 5;
      }
      if (text.includes('let') && (text.includes('silence') || text.includes('moment'))) {
        score += 3;
      }

      score += choice.fieldStrength * 0.1;

      if (score > bestScore) {
        bestScore = score;
        best = choice;
      }
    }

    return best;
  }

  /**
   * Select choices that emphasize curiosity and selfless catalysis
   */
  private selectCuriousCatalyst(choices: EvaluatedChoice[]): EvaluatedChoice {
    let best = choices[0];
    let bestScore = -Infinity;

    for (const choice of choices) {
      let score = 0;

      // Strong preference for curiosity
      const curiousEffect = choice.choice.effects?.playerPattern?.curious_vs_pragmatic ?? 0;
      if (curiousEffect > 0) score += curiousEffect * 20;

      // Preference for selflessness
      const selflessEffect = choice.choice.effects?.playerPattern?.selfless_vs_self_focused ?? 0;
      if (selflessEffect > 0) score += selflessEffect * 15;

      // Weight arc progression
      if (choice.choice.effects?.arc) {
        for (const effect of Object.values(choice.choice.effects.arc)) {
          if (effect.trigger) score += 5;
          if (effect.partial) score += effect.partial * 3;
        }
      }

      // Look for question and sharing type choices
      const text = choice.choice.text.toLowerCase();
      if (text.includes('?') || text.includes('ask') || text.includes('tell me')) {
        score += 5;
      }
      if (text.includes('share') || text.includes('go first')) {
        score += 8;
      }

      score += choice.fieldStrength * 0.1;

      if (score > bestScore) {
        bestScore = score;
        best = choice;
      }
    }

    return best;
  }

  /**
   * Capture current state snapshot for the step record
   */
  private captureStateSnapshot(): PlaythroughStep['stateSnapshot'] {
    const triggeredArcs: string[] = [];

    for (const [char, arcs] of Object.entries(this.state.arcs)) {
      for (const [nodeName, node] of Object.entries(arcs)) {
        if (node.state === 'triggered') {
          triggeredArcs.push(`${char}.${nodeName}`);
        }
      }
    }

    return {
      tension: this.state.tension,
      timeInNight: this.state.timeInNight,
      trust: {
        mira: this.state.relationships.mira.trust,
        selin: this.state.relationships.selin.trust,
        ver: this.state.relationships.ver.trust,
      },
      triggeredArcs,
    };
  }

  /**
   * Calculate final statistics
   */
  private calculateStats(): PlaythroughStats {
    let arcsTriggered = 0;
    let arcsForeclosed = 0;

    for (const arcs of Object.values(this.state.arcs)) {
      for (const node of Object.values(arcs)) {
        if (node.state === 'triggered') arcsTriggered++;
        if (node.state === 'foreclosed') arcsForeclosed++;
      }
    }

    const trustValues = Object.values(this.state.relationships).map((r) => r.trust);
    const averageTrust = trustValues.reduce((a, b) => a + b, 0) / trustValues.length;

    return {
      totalChoices: this.steps.length,
      arcsTriggered,
      arcsForeclosed,
      averageTrust,
      characterTrust: {
        mira: this.state.relationships.mira.trust,
        selin: this.state.relationships.selin.trust,
        ver: this.state.relationships.ver.trust,
      },
      playerPattern: { ...this.state.playerPattern },
    };
  }
}

// ============================================
// OUTPUT FORMATTERS
// ============================================

/**
 * Format a playthrough result as a readable text document
 */
export function formatPlaythroughAsText(result: PlaythroughResult): string {
  const lines: string[] = [];

  // Header
  lines.push('═'.repeat(75));
  lines.push('SUPERPOSED CHARACTER GRAPHS - PLAYTHROUGH');
  lines.push('═'.repeat(75));
  lines.push('');
  lines.push(`Strategy: ${result.strategy}`);
  lines.push(`Total Choices: ${result.stats.totalChoices}`);
  lines.push(`Arcs Triggered: ${result.stats.arcsTriggered}`);
  lines.push(`Average Trust: ${result.stats.averageTrust.toFixed(2)}`);
  lines.push('');
  lines.push('─'.repeat(75));
  lines.push('');

  // Steps
  for (let i = 0; i < result.steps.length; i++) {
    const step = result.steps[i];

    lines.push(`SCENE ${i + 1}: ${step.beatName}`);
    lines.push(`[Tension: ${(step.stateSnapshot.tension * 100).toFixed(0)}% | Hour: ${step.stateSnapshot.timeInNight.toFixed(1)}]`);
    lines.push('');

    // Prose (word-wrapped)
    const proseLines = wordWrap(step.prose, 75);
    lines.push(...proseLines);
    lines.push('');

    // Choice made
    lines.push(`  > ${step.choiceText}`);
    lines.push('');

    // State update
    const { trust, triggeredArcs } = step.stateSnapshot;
    lines.push(`  [Trust - Mira: ${trust.mira.toFixed(2)}, Selin: ${trust.selin.toFixed(2)}, Ver: ${trust.ver.toFixed(2)}]`);
    if (triggeredArcs.length > 0) {
      lines.push(`  [Triggered: ${triggeredArcs.join(', ')}]`);
    }
    lines.push('');
    lines.push('─'.repeat(75));
    lines.push('');
  }

  // Ending
  lines.push('═'.repeat(75));
  lines.push('ENDING');
  lines.push('═'.repeat(75));
  lines.push('');
  lines.push(`Overall Tone: ${result.ending.overall.tone.toUpperCase()}`);
  lines.push(result.ending.overall.description);
  lines.push('');
  lines.push('CHARACTER RESOLUTIONS:');
  lines.push('');
  lines.push(`MIRA: ${result.ending.mira.arc}`);
  lines.push(`  ${result.ending.mira.description}`);
  lines.push('');
  lines.push(`SELIN: ${result.ending.selin.arc}`);
  lines.push(`  ${result.ending.selin.description}`);
  lines.push('');
  lines.push(`VER: ${result.ending.ver.arc}`);
  lines.push(`  ${result.ending.ver.description}`);
  lines.push('');
  lines.push(`PLAYER: ${result.ending.player.arc}`);
  lines.push(`  ${result.ending.player.description}`);
  lines.push('');

  // Final stats
  lines.push('═'.repeat(75));
  lines.push('STATISTICS');
  lines.push('═'.repeat(75));
  lines.push('');
  lines.push(`Total Choices Made: ${result.stats.totalChoices}`);
  lines.push(`Arcs Triggered: ${result.stats.arcsTriggered}`);
  lines.push(`Arcs Foreclosed: ${result.stats.arcsForeclosed}`);
  lines.push('');
  lines.push('Final Trust Levels:');
  lines.push(`  Mira: ${result.stats.characterTrust.mira.toFixed(2)}`);
  lines.push(`  Selin: ${result.stats.characterTrust.selin.toFixed(2)}`);
  lines.push(`  Ver: ${result.stats.characterTrust.ver.toFixed(2)}`);
  lines.push(`  Average: ${result.stats.averageTrust.toFixed(2)}`);
  lines.push('');
  lines.push('Player Pattern:');
  lines.push(`  Curious vs Pragmatic: ${result.stats.playerPattern.curious_vs_pragmatic.toFixed(2)}`);
  lines.push(`  Gentle vs Pressing: ${result.stats.playerPattern.gentle_vs_pressing.toFixed(2)}`);
  lines.push(`  Selfless vs Self-focused: ${result.stats.playerPattern.selfless_vs_self_focused.toFixed(2)}`);
  lines.push('');
  lines.push('═'.repeat(75));

  return lines.join('\n');
}

/**
 * Format a compact summary of multiple playthroughs
 */
export function formatPlaythroughSummary(results: PlaythroughResult[]): string {
  const lines: string[] = [];

  lines.push('═'.repeat(75));
  lines.push('PLAYTHROUGH SUMMARY');
  lines.push('═'.repeat(75));
  lines.push('');

  for (const result of results) {
    lines.push(`Strategy: ${result.strategy}`);
    lines.push(`  Ending: ${result.ending.overall.tone}`);
    lines.push(`  Mira: ${result.ending.mira.arc} | Selin: ${result.ending.selin.arc} | Ver: ${result.ending.ver.arc}`);
    lines.push(`  Arcs: ${result.stats.arcsTriggered} triggered, ${result.stats.arcsForeclosed} foreclosed`);
    lines.push(`  Trust: ${result.stats.averageTrust.toFixed(2)} avg`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Word wrap helper
 */
function wordWrap(text: string, width: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split('\n');

  for (const para of paragraphs) {
    if (para.trim() === '') {
      lines.push('');
      continue;
    }

    const words = para.split(/\s+/);
    let current = '';

    for (const word of words) {
      if ((current + ' ' + word).trim().length > width) {
        if (current) lines.push(current.trim());
        current = word;
      } else {
        current = current ? current + ' ' + word : word;
      }
    }

    if (current.trim()) lines.push(current.trim());
  }

  return lines;
}

// ============================================
// FILE OUTPUT
// ============================================

/**
 * Save a playthrough result to a text file
 */
export function savePlaythrough(
  result: PlaythroughResult,
  outputDir: string,
  filename?: string
): string {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate filename if not provided
  const name = filename || `playthrough_${result.strategy}_${Date.now()}.txt`;
  const filepath = path.join(outputDir, name);

  // Write file
  const content = formatPlaythroughAsText(result);
  fs.writeFileSync(filepath, content, 'utf-8');

  return filepath;
}

/**
 * Save multiple playthroughs to files
 */
export function saveMultiplePlaythroughs(
  results: PlaythroughResult[],
  outputDir: string
): string[] {
  const files: string[] = [];

  for (const result of results) {
    const filepath = savePlaythrough(result, outputDir);
    files.push(filepath);
  }

  // Also save a summary
  const summaryPath = path.join(outputDir, 'summary.txt');
  fs.writeFileSync(summaryPath, formatPlaythroughSummary(results), 'utf-8');
  files.push(summaryPath);

  return files;
}

// ============================================
// CLI INTERFACE
// ============================================

const STRATEGIES: SelectionStrategy[] = [
  'random',
  'high_drama',
  'maximize_mira_trust',
  'maximize_selin_trust',
  'maximize_ver_trust',
  'mira_full_arc',
  'selin_full_arc',
  'ver_full_arc',
  'completionist',
  'gentle_witness',
  'curious_catalyst',
];

function printUsage(): void {
  console.log(`
Superposed Character Graphs - Playthrough Generator

Usage:
  npx tsx src/generator.ts [options]

Options:
  --strategy <name>   Run a specific strategy (see list below)
  --all               Run all strategies
  --random <n>        Run n random playthroughs
  --output <dir>      Output directory (default: ./playthroughs)
  --help              Show this help

Strategies:
  ${STRATEGIES.join('\n  ')}

Examples:
  npx tsx src/generator.ts --strategy mira_full_arc
  npx tsx src/generator.ts --all --output ./samples
  npx tsx src/generator.ts --random 5
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    printUsage();
    return;
  }

  let outputDir = './playthroughs';
  let strategies: SelectionStrategy[] = [];
  let randomCount = 0;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--output' && args[i + 1]) {
      outputDir = args[++i];
    } else if (arg === '--strategy' && args[i + 1]) {
      const strat = args[++i] as SelectionStrategy;
      if (STRATEGIES.includes(strat)) {
        strategies.push(strat);
      } else {
        console.error(`Unknown strategy: ${strat}`);
        process.exit(1);
      }
    } else if (arg === '--all') {
      strategies = [...STRATEGIES];
    } else if (arg === '--random' && args[i + 1]) {
      randomCount = parseInt(args[++i], 10);
    }
  }

  // Add random playthroughs if requested
  for (let i = 0; i < randomCount; i++) {
    strategies.push('random');
  }

  if (strategies.length === 0) {
    strategies = ['random'];
  }

  console.log(`Generating ${strategies.length} playthrough(s)...`);
  console.log(`Output directory: ${outputDir}`);
  console.log('');

  const results: PlaythroughResult[] = [];

  for (const strategy of strategies) {
    console.log(`Running strategy: ${strategy}...`);
    const engine = new PlaythroughEngine(strategy);
    const result = engine.run();
    results.push(result);
    console.log(`  -> Ending: ${result.ending.overall.tone}, Arcs: ${result.stats.arcsTriggered}`);
  }

  console.log('');
  console.log('Saving playthroughs...');

  const files = saveMultiplePlaythroughs(results, outputDir);

  console.log('');
  console.log('Generated files:');
  for (const file of files) {
    console.log(`  ${file}`);
  }
  console.log('');
  console.log('Done!');
}

// Run if executed directly
main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
