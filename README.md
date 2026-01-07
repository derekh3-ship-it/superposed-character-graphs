# Superposed Character Graphs

An experimental interactive fiction prototype demonstrating arc-based narrative mechanics where character arcs can attract, repel, catalyze, and foreclose each other.

## The Concept

In traditional interactive fiction, player choices branch the narrative directly. In this system, choices influence *character arc fields* - accumulating progress toward or away from pivotal moments. The arcs of different characters exist in superposition until player engagement collapses them into specific outcomes.

### Key Mechanics

- **Arc Nodes**: Character development milestones (e.g., "Mira confesses what she's running from")
- **Partial Progress**: Choices accumulate partial weight toward node triggers
- **Catalysis**: Triggered nodes can amplify progress on other nodes (heavy truths invite heavy truths)
- **Foreclosure**: Some paths can close off others permanently
- **Resistance**: Context-sensitive barriers (confession is harder under high tension)
- **Cross-Arc Dynamics**: Characters' arcs shape conditions for each other

## The Scenario: Lifeboat

Three survivors. One night. A boat drifting on dark water.

**Mira** - A doctor running from something she won't name. Her arc is about whether anyone sees past the competence to the person running away.

**Selin** - A young man with a bag he won't let go of. His arc is about whether he trusts anyone with what he's carrying and why.

**Ver** - An older woman who isn't fighting for herself. Her arc is about whether she reveals why, and whether anyone earns the right to fight for her.

**You** - The fourth survivor. No pre-authored arc. Your story emerges from how you engage with theirs.

## Running the Prototype

```bash
# Install dependencies
npm install

# Run the game
npm start
```

### In-Game Commands

- **1-N**: Select a choice by number
- **d** or **debug**: Toggle debug mode (shows arc field visualization)
- **s** or **state**: Show current arc state summary
- **q** or **quit**: Exit the game

## Architecture

```
src/
├── types.ts        # Type definitions for arcs, beats, state
├── state.ts        # State management, arc progression, catalysis
├── director.ts     # Field calculations, choice evaluation
├── index.ts        # CLI game loop
└── beats/
    ├── index.ts    # Beat registry
    ├── beat1.ts    # Surface (immediate aftermath)
    ├── beat2.ts    # Settling (first conversations)
    ├── beat3.ts    # Deep Night (vulnerable hours, confessions)
    └── beat4.ts    # Dawn (resolutions, endings)
```

### Arc Node States

- **dormant**: Not yet engaged
- **partial**: Has accumulated weight, not yet triggered
- **triggered**: Pivotal moment has occurred
- **foreclosed**: Path is permanently closed

### How Catalysis Works

When a node triggers, it can catalyze other nodes with a multiplier:

```
Ver reveals her diagnosis (ver.the_reason triggers)
  → mira.the_confession gets 1.3x multiplier
  → selin.the_story gets 1.3x multiplier
  → Heavy truths invite heavy truths
```

### Resistance System

Nodes have context-sensitive resistance:

- High tension (crisis) blocks vulnerability
- Low trust blocks deep revelations
- Premature attempts increase resistance

## Design Notes

This prototype explores several questions:

1. **Can arc fields replace branching?** Instead of explicit branches, the narrative emerges from accumulated arc states.

2. **Can character interdependence be mechanical?** The catalysis system makes characters' openness genuinely affect each other.

3. **Can player pattern matter?** The system tracks whether you're curious/pragmatic, gentle/pressing, and adjusts both available choices and their likelihood of success.

4. **Can endings be emergent?** The final scene generates from the combination of which arcs triggered, rather than following a preset branch.

## Extending the Prototype

To add new scenarios or characters:

1. Define arc nodes in `types.ts`
2. Add initial state in `state.ts`
3. Define prerequisites and catalysis relationships
4. Create beats with dynamic prose based on arc state
5. Design choices that advance arcs with appropriate weights

## License

MIT
