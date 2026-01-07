/**
 * State Management for Superposed Character Graphs
 *
 * Handles arc progression, catalysis, resistance, and state updates.
 */

import type {
  GameState,
  ArcNode,
  ChoiceEffect,
  CharacterName,
  CatalysisEffect,
} from './types.js';

// ============================================
// INITIAL STATE FACTORY
// ============================================

export function createInitialState(): GameState {
  const createNode = (): ArcNode => ({
    state: 'dormant',
    partialWeight: 0,
  });

  return {
    currentBeat: 'beat_1_surface',
    beatHistory: [],
    timeInNight: 0,
    tension: 0.7,

    arcs: {
      mira: {
        competence_acknowledged: createNode(),
        crack_in_armor: createNode(),
        the_confession: createNode(),
        decision_to_stay: createNode(),
      },
      selin: {
        suspicion_noted: createNode(),
        partial_truth: createNode(),
        the_story: createNode(),
        release: createNode(),
        grip: createNode(),
      },
      ver: {
        quiet_competence: createNode(),
        the_noticing: createNode(),
        the_reason: createNode(),
        accepted: createNode(),
        contested: createNode(),
      },
    },

    relationships: {
      mira: { trust: 0, history: [] },
      selin: { trust: 0, history: [] },
      ver: { trust: 0, history: [] },
    },

    playerPattern: {
      curious_vs_pragmatic: 0,
      gentle_vs_pressing: 0,
      selfless_vs_self_focused: 0,
    },

    storyState: {},

    characterMemory: {
      mira: [],
      selin: [],
      ver: [],
      player: [],
    },

    activeCatalysis: {},

    instrumentalInteractions: 0,
  };
}

// ============================================
// ARC NODE OPERATIONS
// ============================================

/**
 * Get an arc node by its full ID (e.g., "mira.the_confession")
 */
export function getNode(state: GameState, nodeId: string): ArcNode | undefined {
  const [char, nodeName] = nodeId.split('.') as [string, string];
  const charArcs = state.arcs[char as keyof typeof state.arcs];
  if (!charArcs) return undefined;
  return charArcs[nodeName as keyof typeof charArcs] as ArcNode | undefined;
}

/**
 * Get the threshold for a node (default 1.0)
 */
export function getNodeThreshold(nodeId: string): number {
  // Most nodes have threshold 1.0, early nodes have lower
  const lowThresholdNodes = [
    'mira.competence_acknowledged',
    'selin.suspicion_noted',
    'ver.quiet_competence',
  ];
  return lowThresholdNodes.includes(nodeId) ? 0.5 : 1.0;
}

/**
 * Check if prerequisites for a node are met
 */
export function checkPrerequisites(state: GameState, nodeId: string): boolean {
  const prerequisites = getPrerequisites(nodeId);
  return prerequisites.every((prereq) => {
    const node = getNode(state, prereq);
    return node?.state === 'triggered';
  });
}

/**
 * Get prerequisite nodes for a given node
 */
function getPrerequisites(nodeId: string): string[] {
  const prereqMap: Record<string, string[]> = {
    'mira.competence_acknowledged': [],
    'mira.crack_in_armor': ['mira.competence_acknowledged'],
    'mira.the_confession': ['mira.crack_in_armor'],
    'mira.decision_to_stay': ['mira.the_confession'],

    'selin.suspicion_noted': [],
    'selin.partial_truth': ['selin.suspicion_noted'],
    'selin.the_story': ['selin.partial_truth'],
    'selin.release': ['selin.the_story'],
    'selin.grip': ['selin.the_story'],

    'ver.quiet_competence': [],
    'ver.the_noticing': [],
    'ver.the_reason': ['ver.the_noticing'],
    'ver.accepted': ['ver.the_reason'],
    'ver.contested': ['ver.the_reason'],
  };
  return prereqMap[nodeId] ?? [];
}

/**
 * Calculate total catalysis modifier for a node
 */
export function getCatalysisModifier(state: GameState, nodeId: string): number {
  const effects = state.activeCatalysis[nodeId] ?? [];
  return effects.reduce((mod, effect) => mod * effect.modifier, 1.0);
}

/**
 * Trigger a node - mark it as triggered and apply side effects
 */
export function triggerNode(state: GameState, nodeId: string): void {
  const [char, nodeName] = nodeId.split('.') as [string, string];
  const charArcs = state.arcs[char as keyof typeof state.arcs];
  if (!charArcs) return;

  const node = charArcs[nodeName as keyof typeof charArcs] as ArcNode;
  if (!node || node.state === 'triggered' || node.state === 'foreclosed') return;

  node.state = 'triggered';
  node.triggeredAtBeat = state.currentBeat;

  // Add catalysis effects to other nodes
  const catalysisEffects = getCatalysisFor(nodeId);
  for (const effect of catalysisEffects) {
    if (!state.activeCatalysis[effect.node]) {
      state.activeCatalysis[effect.node] = [];
    }
    state.activeCatalysis[effect.node].push({
      source: nodeId,
      modifier: effect.modifier,
    });
  }

  console.log(`\n  [ARC TRIGGERED] ${nodeId}`);
}

/**
 * Get what a node catalyzes when triggered
 */
function getCatalysisFor(nodeId: string): Array<{ node: string; modifier: number }> {
  const catalysisMap: Record<string, Array<{ node: string; modifier: number }>> = {
    'mira.competence_acknowledged': [{ node: 'ver.the_noticing', modifier: 1.2 }],
    'mira.crack_in_armor': [
      { node: 'selin.the_story', modifier: 1.2 },
      { node: 'ver.the_reason', modifier: 1.15 },
    ],
    'mira.the_confession': [
      { node: 'selin.the_story', modifier: 1.3 },
      { node: 'ver.the_reason', modifier: 1.3 },
      { node: 'mira.decision_to_stay', modifier: 1.2 },
    ],

    'selin.partial_truth': [{ node: 'mira.crack_in_armor', modifier: 1.2 }],
    'selin.the_story': [
      { node: 'mira.the_confession', modifier: 1.3 },
      { node: 'mira.decision_to_stay', modifier: 1.2 },
      { node: 'ver.contested', modifier: 1.2 },
    ],
    'selin.release': [{ node: 'ver.contested', modifier: 1.3 }],

    'ver.quiet_competence': [],
    'ver.the_noticing': [{ node: 'mira.crack_in_armor', modifier: 1.15 }],
    'ver.the_reason': [
      { node: 'mira.the_confession', modifier: 1.3 },
      { node: 'mira.decision_to_stay', modifier: 1.4 },
      { node: 'selin.the_story', modifier: 1.3 },
    ],
    'ver.contested': [{ node: 'mira.decision_to_stay', modifier: 1.5 }],
  };
  return catalysisMap[nodeId] ?? [];
}

/**
 * Foreclose a node and cascade to dependent nodes
 */
export function forecloseNode(state: GameState, nodeId: string): void {
  const [char, nodeName] = nodeId.split('.') as [string, string];
  const charArcs = state.arcs[char as keyof typeof state.arcs];
  if (!charArcs) return;

  const node = charArcs[nodeName as keyof typeof charArcs] as ArcNode;
  if (!node || node.state === 'triggered') return;

  node.state = 'foreclosed';
  console.log(`\n  [ARC FORECLOSED] ${nodeId}`);

  // Cascade to nodes that depend on this one
  const dependents = getDependentNodes(nodeId);
  for (const dep of dependents) {
    forecloseNode(state, dep);
  }
}

/**
 * Get nodes that depend on this one (would be foreclosed if this is)
 */
function getDependentNodes(nodeId: string): string[] {
  const dependencyMap: Record<string, string[]> = {
    'mira.competence_acknowledged': ['mira.crack_in_armor'],
    'mira.crack_in_armor': ['mira.the_confession'],
    'mira.the_confession': ['mira.decision_to_stay'],
    'selin.suspicion_noted': ['selin.partial_truth'],
    'selin.partial_truth': ['selin.the_story'],
    'selin.the_story': ['selin.release', 'selin.grip'],
    'ver.the_noticing': ['ver.the_reason'],
    'ver.the_reason': ['ver.accepted', 'ver.contested'],
  };
  return dependencyMap[nodeId] ?? [];
}

// ============================================
// APPLYING EFFECTS
// ============================================

/**
 * Apply the effects of a choice to the game state
 */
export function applyChoiceEffects(state: GameState, effects: ChoiceEffect): void {
  // Apply relationship changes
  if (effects.relationship) {
    for (const [char, change] of Object.entries(effects.relationship)) {
      if (char === 'all') {
        for (const c of ['mira', 'selin', 'ver'] as CharacterName[]) {
          state.relationships[c].trust += change.trust;
          state.relationships[c].trust = Math.max(-1, Math.min(1, state.relationships[c].trust));
        }
      } else {
        const rel = state.relationships[char as CharacterName];
        if (rel) {
          rel.trust += change.trust;
          rel.trust = Math.max(-1, Math.min(1, rel.trust));
        }
      }
    }
  }

  // Apply arc effects
  if (effects.arc) {
    for (const [nodeId, change] of Object.entries(effects.arc)) {
      applyArcEffect(state, nodeId, change);
    }
  }

  // Apply player pattern changes
  if (effects.playerPattern) {
    for (const [dim, delta] of Object.entries(effects.playerPattern)) {
      const key = dim as keyof typeof state.playerPattern;
      state.playerPattern[key] += delta;
      state.playerPattern[key] = Math.max(-1, Math.min(1, state.playerPattern[key]));
    }
  }

  // Apply story state flags
  if (effects.storyState) {
    Object.assign(state.storyState, effects.storyState);
  }

  // Add memory
  if (effects.memory) {
    state.characterMemory[effects.memory.character].push(effects.memory.memory);
  }
}

/**
 * Apply an effect to a specific arc node
 */
function applyArcEffect(
  state: GameState,
  nodeId: string,
  change: { partial?: number; trigger?: boolean; foreclose?: boolean }
): void {
  const node = getNode(state, nodeId);
  if (!node) return;
  if (node.state === 'foreclosed') return;

  // Handle foreclosure
  if (change.foreclose) {
    forecloseNode(state, nodeId);
    return;
  }

  // Handle direct trigger
  if (change.trigger) {
    if (checkPrerequisites(state, nodeId)) {
      triggerNode(state, nodeId);
    }
    return;
  }

  // Handle partial weight
  if (change.partial && change.partial > 0) {
    // Apply catalysis modifier
    const catalysis = getCatalysisModifier(state, nodeId);
    const actualWeight = change.partial * catalysis;

    node.partialWeight += actualWeight;
    if (node.state === 'dormant') {
      node.state = 'partial';
    }

    // Check if threshold reached
    const threshold = getNodeThreshold(nodeId);
    if (node.partialWeight >= threshold && checkPrerequisites(state, nodeId)) {
      triggerNode(state, nodeId);
    }
  }
}

// ============================================
// STATE QUERIES
// ============================================

/**
 * Check if a node is in a specific state
 */
export function nodeIs(state: GameState, nodeId: string, nodeState: string): boolean {
  const node = getNode(state, nodeId);
  return node?.state === nodeState;
}

/**
 * Get current trust level with a character
 */
export function getTrust(state: GameState, char: CharacterName): number {
  return state.relationships[char].trust;
}

/**
 * Generate a summary of current arc states
 */
export function generateStateSummary(state: GameState): string {
  const lines: string[] = [];
  lines.push('\n=== ARC STATE SUMMARY ===');
  lines.push(`Beat: ${state.currentBeat} | Tension: ${state.tension.toFixed(2)}`);

  for (const [char, arcs] of Object.entries(state.arcs)) {
    const triggered: string[] = [];
    const inProgress: string[] = [];
    const foreclosed: string[] = [];

    for (const [name, node] of Object.entries(arcs)) {
      const arcNode = node as ArcNode;
      if (arcNode.state === 'triggered') {
        triggered.push(name);
      } else if (arcNode.state === 'foreclosed') {
        foreclosed.push(name);
      } else if (arcNode.partialWeight > 0) {
        const threshold = getNodeThreshold(`${char}.${name}`);
        const pct = Math.round((arcNode.partialWeight / threshold) * 100);
        inProgress.push(`${name}(${pct}%)`);
      }
    }

    const trust = state.relationships[char as CharacterName]?.trust ?? 0;
    lines.push(`\n${char.toUpperCase()} [trust: ${trust.toFixed(2)}]`);
    if (triggered.length) lines.push(`  Triggered: ${triggered.join(', ')}`);
    if (inProgress.length) lines.push(`  In Progress: ${inProgress.join(', ')}`);
    if (foreclosed.length) lines.push(`  Foreclosed: ${foreclosed.join(', ')}`);
  }

  lines.push('========================\n');
  return lines.join('\n');
}
