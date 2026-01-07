/**
 * Superposed Character Graphs - Type Definitions
 *
 * An arc-based interactive fiction system where character arcs
 * can attract, repel, catalyze, and foreclose each other.
 */

// ============================================
// ARC NODE TYPES
// ============================================

export type NodeState = 'dormant' | 'partial' | 'triggered' | 'foreclosed';

export interface ArcNode {
  state: NodeState;
  partialWeight: number;
  triggeredAtBeat?: string;
}

export interface ArcNodeDefinition {
  id: string;
  name: string;
  description: string;
  threshold: number;
  prerequisites: string[];
  sufficient: string[];
  foreclosedBy: string[];
  catalyzes: Array<{ node: string; modifier: number }>;
  resistance: (state: GameState) => number;
}

// ============================================
// CHARACTER TYPES
// ============================================

export type CharacterName = 'mira' | 'selin' | 'ver';

export interface CharacterMemory {
  what: string;
  beat: string;
  significance?: string;
  feeling?: string;
}

export interface Relationship {
  trust: number;
  history: string[];
}

// ============================================
// PLAYER TYPES
// ============================================

export interface PlayerPattern {
  curious_vs_pragmatic: number;    // positive = curious
  gentle_vs_pressing: number;      // positive = gentle
  selfless_vs_self_focused: number; // positive = selfless
}

// ============================================
// CHOICE & BEAT TYPES
// ============================================

export interface ChoiceEffect {
  arc?: Record<string, { partial?: number; trigger?: boolean; foreclose?: boolean }>;
  relationship?: Record<string, { trust: number }>;
  playerPattern?: Partial<PlayerPattern>;
  storyState?: Record<string, boolean | string>;
  memory?: { character: CharacterName; memory: CharacterMemory };
}

export interface Choice {
  id: string;
  text: string;
  next?: string;
  effects: ChoiceEffect;
  availableIf?: (state: GameState) => boolean;
}

export interface Beat {
  id: string;
  name: string;
  tension: number;
  getProse: (state: GameState) => string;
  getChoices: (state: GameState) => Choice[];
  onEnter?: (state: GameState) => void;
}

// ============================================
// CATALYSIS TYPES
// ============================================

export interface CatalysisEffect {
  source: string;
  modifier: number;
}

// ============================================
// GAME STATE
// ============================================

export interface GameState {
  // Temporal
  currentBeat: string;
  beatHistory: string[];
  timeInNight: number;
  tension: number;

  // Arc states per character
  arcs: {
    mira: {
      competence_acknowledged: ArcNode;
      crack_in_armor: ArcNode;
      the_confession: ArcNode;
      decision_to_stay: ArcNode;
    };
    selin: {
      suspicion_noted: ArcNode;
      partial_truth: ArcNode;
      the_story: ArcNode;
      release: ArcNode;
      grip: ArcNode;
    };
    ver: {
      quiet_competence: ArcNode;
      the_noticing: ArcNode;
      the_reason: ArcNode;
      accepted: ArcNode;
      contested: ArcNode;
    };
  };

  // Relationships
  relationships: Record<CharacterName, Relationship>;

  // Player pattern
  playerPattern: PlayerPattern;

  // Story flags
  storyState: Record<string, boolean | string>;

  // Character memories
  characterMemory: Record<CharacterName | 'player', CharacterMemory[]>;

  // Active catalysis effects
  activeCatalysis: Record<string, CatalysisEffect[]>;

  // Instrumental interaction count (for foreclosure)
  instrumentalInteractions: number;
}

// ============================================
// ENDING TYPES
// ============================================

export interface ArcResolution {
  arc: string;
  description: string;
}

export interface Ending {
  mira: ArcResolution;
  selin: ArcResolution;
  ver: ArcResolution;
  player: ArcResolution;
  overall: {
    tone: string;
    description: string;
  };
}
