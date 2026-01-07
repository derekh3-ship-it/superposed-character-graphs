#!/usr/bin/env node

/**
 * Superposed Character Graphs - Interactive Fiction Prototype
 *
 * A lifeboat scenario demonstrating arc-based narrative mechanics
 * where character arcs attract, repel, catalyze, and foreclose each other.
 */

import * as readline from 'readline';
import type { GameState, Beat, Choice } from './types.js';
import { createInitialState, applyChoiceEffects, generateStateSummary } from './state.js';
import { getBeat, getStartingBeat } from './beats/index.js';
import { evaluateChoices, visualizeArcField, detectCatalysisChains } from './director.js';

// ============================================
// TERMINAL UI HELPERS
// ============================================

const CLEAR = '\x1B[2J\x1B[0;0H';
const BOLD = '\x1B[1m';
const DIM = '\x1B[2m';
const RESET = '\x1B[0m';
const CYAN = '\x1B[36m';
const YELLOW = '\x1B[33m';
const GREEN = '\x1B[32m';
const MAGENTA = '\x1B[35m';

function clearScreen(): void {
  process.stdout.write(CLEAR);
}

function printHeader(): void {
  console.log(`
${CYAN}╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   ${BOLD}SUPERPOSED CHARACTER GRAPHS${RESET}${CYAN}                                          ║
║                                                                           ║
║   ${DIM}An arc-based interactive fiction prototype${RESET}${CYAN}                           ║
║   ${DIM}The Lifeboat Scenario${RESET}${CYAN}                                                 ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝${RESET}
`);
}

function printBeatHeader(beat: Beat, state: GameState): void {
  console.log(`
${YELLOW}───────────────────────────────────────────────────────────────────────────${RESET}
${BOLD}${beat.name}${RESET}   ${DIM}[Tension: ${(state.tension * 100).toFixed(0)}%  |  Hour: ${state.timeInNight.toFixed(1)}]${RESET}
${YELLOW}───────────────────────────────────────────────────────────────────────────${RESET}
`);
}

function printProse(prose: string): void {
  // Word-wrap prose at 75 characters
  const lines = prose.trim().split('\n');
  for (const line of lines) {
    if (line.length <= 75) {
      console.log(line);
    } else {
      // Simple word wrap
      const words = line.split(' ');
      let current = '';
      for (const word of words) {
        if ((current + ' ' + word).length > 75) {
          console.log(current);
          current = word;
        } else {
          current = current ? current + ' ' + word : word;
        }
      }
      if (current) console.log(current);
    }
  }
}

function printChoices(
  choices: Array<{ choice: Choice; available: boolean; fieldStrength: number }>,
  showDebug: boolean
): void {
  console.log(`\n${CYAN}What do you do?${RESET}\n`);

  let num = 1;
  for (const { choice, available, fieldStrength } of choices) {
    if (available) {
      const debugInfo = showDebug ? ` ${DIM}[field: ${fieldStrength.toFixed(2)}]${RESET}` : '';
      console.log(`  ${GREEN}${num}.${RESET} ${choice.text}${debugInfo}`);
      num++;
    }
  }

  console.log();
}

function printCatalysisChains(state: GameState): void {
  const chains = detectCatalysisChains(state);
  if (chains.length > 0) {
    console.log(`\n${MAGENTA}Active Catalysis:${RESET}`);
    for (const chain of chains) {
      console.log(`  ${DIM}${chain}${RESET}`);
    }
  }
}

// ============================================
// GAME LOOP
// ============================================

class Game {
  private state: GameState;
  private rl: readline.Interface;
  private currentBeat: Beat;
  private showDebug: boolean = false;

  constructor() {
    this.state = createInitialState();
    this.currentBeat = getStartingBeat();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async start(): Promise<void> {
    clearScreen();
    printHeader();

    console.log(`${DIM}
Three survivors. One night. A lifeboat drifting on dark water.

Each of them carries something—a secret, a burden, a choice they haven't
made yet. Their stories can intersect, attract, repel, transform each
other. How they end depends on what you notice, what you ask, what you
let pass in silence.

The arcs are superposed. Your choices collapse them into story.

Press Enter to begin...${RESET}`);

    await this.waitForEnter();
    await this.gameLoop();
  }

  private async gameLoop(): Promise<void> {
    while (true) {
      clearScreen();

      // Execute onEnter if present
      if (this.currentBeat.onEnter) {
        this.currentBeat.onEnter(this.state);
      }

      // Update state
      this.state.currentBeat = this.currentBeat.id;
      this.state.beatHistory.push(this.currentBeat.id);

      // Display beat
      printBeatHeader(this.currentBeat, this.state);
      printProse(this.currentBeat.getProse(this.state));

      // Check for game over
      if (this.currentBeat.id === 'game_over') {
        console.log(`\n${CYAN}Thank you for playing.${RESET}\n`);
        break;
      }

      // Get and display choices
      const evaluatedChoices = evaluateChoices(this.state, this.currentBeat);
      const availableChoices = evaluatedChoices.filter((c) => c.available);

      if (availableChoices.length === 0) {
        console.log(`\n${DIM}[No choices available - ending]${RESET}`);
        break;
      }

      // Show debug info if enabled
      if (this.showDebug) {
        console.log(visualizeArcField(this.state));
        printCatalysisChains(this.state);
      }

      printChoices(availableChoices, this.showDebug);

      // Get player input
      const input = await this.getInput();

      // Handle special commands
      if (input.toLowerCase() === 'd' || input.toLowerCase() === 'debug') {
        this.showDebug = !this.showDebug;
        console.log(`${DIM}Debug mode: ${this.showDebug ? 'ON' : 'OFF'}${RESET}`);
        await this.waitForEnter();
        continue;
      }

      if (input.toLowerCase() === 's' || input.toLowerCase() === 'state') {
        console.log(generateStateSummary(this.state));
        await this.waitForEnter();
        continue;
      }

      if (input.toLowerCase() === 'q' || input.toLowerCase() === 'quit') {
        console.log(`\n${CYAN}Goodbye.${RESET}\n`);
        break;
      }

      // Parse choice
      const choiceNum = parseInt(input, 10);
      if (isNaN(choiceNum) || choiceNum < 1 || choiceNum > availableChoices.length) {
        console.log(`${DIM}Please enter a number 1-${availableChoices.length}, or 'd' for debug, 's' for state, 'q' to quit${RESET}`);
        await this.waitForEnter();
        continue;
      }

      // Apply choice
      const selected = availableChoices[choiceNum - 1];
      if (!selected) continue;

      console.log(`\n${DIM}> ${selected.choice.text}${RESET}`);

      // Apply effects
      applyChoiceEffects(this.state, selected.choice.effects);

      // Navigate to next beat
      if (selected.choice.next) {
        const nextBeat = getBeat(selected.choice.next);
        if (nextBeat) {
          this.currentBeat = nextBeat;
        } else {
          console.log(`${DIM}[Beat not found: ${selected.choice.next}]${RESET}`);
        }
      }

      await this.pause(500);
    }

    this.rl.close();
  }

  private getInput(): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(`${CYAN}>${RESET} `, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  private waitForEnter(): Promise<void> {
    return new Promise((resolve) => {
      this.rl.question('', () => {
        resolve();
      });
    });
  }

  private pause(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================
// MAIN
// ============================================

async function main(): Promise<void> {
  const game = new Game();

  try {
    await game.start();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
