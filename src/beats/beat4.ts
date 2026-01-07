/**
 * Beat 4: Dawn
 *
 * The final beat. Direction chosen. Arcs complete or not.
 */

import type { Beat, Choice, GameState, Ending } from '../types.js';
import { nodeIs, getTrust, generateStateSummary } from '../state.js';

// ============================================
// BEAT 4: DAWN
// ============================================

export const beat4Dawn: Beat = {
  id: 'beat_4_dawn',
  name: 'Dawn',
  tension: 0.4,

  onEnter: (state: GameState) => {
    state.timeInNight = 6;
    state.tension = 0.4;
  },

  getProse: (state: GameState) => {
    let prose = `
The light comes slowly. Gray first, then gold, spreading across the
water like something being forgiven.

For a moment, nothing else matters—just the light, and the four of
you floating in it.

Then the moment passes, and the question returns: which way?

But the question is different now. It's not just about direction.
It's about who you've become to each other in the night. What you're
carrying, and for whom.
`;

    // Add character-specific content based on arc states
    if (nodeIs(state, 'mira.the_confession', 'triggered')) {
      prose += `
Mira is standing at the bow, watching the light come. She hasn't slept,
but there's something different in her posture. Less braced. Less ready
to run.

"Beautiful," she says quietly. And you know she's not just talking
about the sunrise.
`;
    } else if (nodeIs(state, 'mira.crack_in_armor', 'triggered')) {
      prose += `
Mira is at the bow, organizing something. Always organizing. But
occasionally she looks at the sunrise, and her hands go still.
Something shifted in the night, even if it didn't break through.
`;
    }

    if (nodeIs(state, 'selin.the_story', 'triggered')) {
      prose += `
Selin is sitting with the bag open in his lap. The documents inside
are spread out, catching the early light. He's looking at them like
he's seeing them for the first time.

"Elif would have loved this," he says. "The sunrise. She was always
talking about light. How it changes things."
`;
    } else if (nodeIs(state, 'selin.partial_truth', 'triggered')) {
      prose += `
Selin is holding the bag, but his grip has eased. Whatever he's
carrying, it's a little lighter now. A little less alone.
`;
    }

    if (nodeIs(state, 'ver.the_reason', 'triggered')) {
      prose += `
Ver is at the stern, face turned toward the light. She's smiling—
not a sad smile. Just complete.

"I wanted to see this," she says. "Thank you. For being here."
`;
    } else if (nodeIs(state, 'ver.the_noticing', 'triggered')) {
      prose += `
Ver is watching the sunrise with that same settled calm. Whatever
she's carrying, she's carrying it with grace.
`;
    }

    return prose;
  },

  getChoices: (state: GameState): Choice[] => {
    const choices: Choice[] = [];

    // Resolution choices based on arc states
    if (nodeIs(state, 'mira.the_confession', 'triggered') &&
        !nodeIs(state, 'mira.decision_to_stay', 'triggered')) {
      choices.push({
        id: 'mira_resolution',
        text: "Talk to Mira. The dawn is asking questions.",
        next: 'beat_4a_mira_resolution',
        effects: {},
      });
    }

    if (nodeIs(state, 'selin.the_story', 'triggered') &&
        !nodeIs(state, 'selin.release', 'triggered') &&
        !nodeIs(state, 'selin.grip', 'triggered')) {
      choices.push({
        id: 'selin_resolution',
        text: "Talk to Selin. About what comes next.",
        next: 'beat_4b_selin_resolution',
        effects: {},
      });
    }

    if (nodeIs(state, 'ver.the_reason', 'triggered') &&
        !nodeIs(state, 'ver.accepted', 'triggered') &&
        !nodeIs(state, 'ver.contested', 'triggered')) {
      choices.push({
        id: 'ver_resolution',
        text: "Talk to Ver. She's watching the sunrise like it's the last one.",
        next: 'beat_4c_ver_resolution',
        effects: {},
      });
    }

    // Direction choice - always available
    choices.push({
      id: 'choose_direction',
      text: "It's time to choose a direction. Together.",
      next: 'beat_4_ending',
      effects: {},
    });

    return choices;
  },
};

// ============================================
// BEAT 4A: MIRA RESOLUTION
// ============================================

export const beat4aMiraResolution: Beat = {
  id: 'beat_4a_mira_resolution',
  name: 'Mira at Dawn',
  tension: 0.35,

  getProse: (_state: GameState) => `
Mira is at the bow, watching the light spread across the water.
When you join her, she doesn't turn, but she shifts to make room.

"I've been thinking," she says. "About David. About the new job.
About what I was running from."

A pause. The light strengthens.

"I was so sure I needed to get away. Start over. Somewhere no one
knew what I'd done." She finally looks at you. "But that's the thing.
I know. I'll always know. Running doesn't change that."

She looks at the horizon. The direction of Alexandria. The direction
of everywhere and nowhere.

"I'm not going to take the new job. If we make it back—when we make
it back—I'm going to find his wife. Tell her what I should have told
her months ago." She pauses. "And then... I don't know. Figure out
what staying looks like. Instead of running."

She almost smiles.

"I might be terrible at it. Staying. I've been running for so long."

"You won't be alone," you say. "If you don't want to be."
`,

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'support_decision',
      text: '"That sounds like a beginning."',
      next: 'beat_4_dawn',
      effects: {
        arc: { 'mira.decision_to_stay': { trigger: true } },
        relationship: { mira: { trust: 0.15 } },
      },
    },
    {
      id: 'offer_presence',
      text: '"Whatever you decide, I\'ll be there. If you want."',
      next: 'beat_4_dawn',
      effects: {
        arc: { 'mira.decision_to_stay': { trigger: true } },
        relationship: { mira: { trust: 0.2 } },
      },
    },
  ],
};

// ============================================
// BEAT 4B: SELIN RESOLUTION
// ============================================

export const beat4bSelinResolution: Beat = {
  id: 'beat_4b_selin_resolution',
  name: 'Selin at Dawn',
  tension: 0.35,

  getProse: (_state: GameState) => `
Selin is looking at the documents in the morning light. His eyes are
red—he's been crying again—but there's something different in his
face. Something like clarity.

"I've been thinking about what you said. About not being alone with it."

He carefully gathers the papers, places them back in the bag.

"I don't know where to take them. I don't know who Elif's family is.
I don't know anything except that she trusted me." He looks at you.
"But I know I can't figure it out by myself."

He holds out the bag. Not offering it—just showing.

"Will you help me? When we get there? Help me figure out where these
need to go?"

It's the first time he's asked for anything.
`,

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'accept_help_role',
      text: '"Yes. We\'ll figure it out together."',
      next: 'beat_4_dawn',
      effects: {
        arc: { 'selin.release': { trigger: true } },
        relationship: { selin: { trust: 0.2 } },
      },
    },
    {
      id: 'bring_others_in',
      text: '"All of us. Mira, Ver—we\'ll all help."',
      next: 'beat_4_dawn',
      effects: {
        arc: { 'selin.release': { trigger: true } },
        relationship: { selin: { trust: 0.2 }, mira: { trust: 0.05 }, ver: { trust: 0.05 } },
      },
    },
  ],
};

// ============================================
// BEAT 4C: VER RESOLUTION
// ============================================

export const beat4cVerResolution: Beat = {
  id: 'beat_4c_ver_resolution',
  name: 'Ver at Dawn',
  tension: 0.35,

  getProse: (state: GameState) => {
    let prose = `
Ver is at the stern, wrapped in the tarp, watching the sunrise with
perfect stillness.

"I've seen a lot of sunrises," she says. "This might be the most
beautiful."

She turns to look at you.

"Thank you. For listening. For not making it harder than it needs to be."
`;

    if (state.storyState['player_fights_for_ver']) {
      prose += `
"I know you want to fight for me. I can see it." She smiles gently.
"It's kind. But this is my choice."

She reaches out, takes your hand.

"Will you let me have it? The choice, I mean. Will you let me decide
how I want to spend whatever time is left?"
`;
    } else {
      prose += `
"I don't have regrets. Not really. Forty-three years with Ahmet.
A daughter who turned out well. Grandchildren I'll get to see,
if we make it." She pauses. "Even this—the shipwreck, the boat,
all of you. It's been... good. Strange to say, but good."

She looks at the sunrise.

"I want to spend whatever time is left like this. Present. With people.
Not fighting the inevitable."
`;
    }

    return prose;
  },

  getChoices: (state: GameState): Choice[] => {
    if (state.storyState['player_fights_for_ver']) {
      return [
        {
          id: 'accept_her_choice',
          text: '"Yes. It\'s your choice. I\'ll honor it."',
          next: 'beat_4_dawn',
          effects: {
            arc: { 'ver.accepted': { trigger: true } },
            relationship: { ver: { trust: 0.2 } },
          },
        },
        {
          id: 'contest_gently',
          text: '"I\'ll try. But I can\'t promise not to hope."',
          next: 'beat_4_dawn',
          effects: {
            arc: { 'ver.contested': { trigger: true } },
            relationship: { ver: { trust: 0.1 } },
          },
        },
      ];
    } else {
      return [
        {
          id: 'honor_peace',
          text: '"Then let\'s watch the sunrise. Together."',
          next: 'beat_4_dawn',
          effects: {
            arc: { 'ver.accepted': { trigger: true } },
            relationship: { ver: { trust: 0.2 } },
          },
        },
        {
          id: 'offer_fight',
          text: '"What if I\'m not ready to let you go?"',
          next: 'beat_4_dawn',
          effects: {
            arc: { 'ver.contested': { trigger: true } },
            relationship: { ver: { trust: 0.05 } },
          },
        },
      ];
    }
  },
};

// ============================================
// BEAT 4 ENDING
// ============================================

export const beat4Ending: Beat = {
  id: 'beat_4_ending',
  name: 'The Ending',
  tension: 0.4,

  getProse: (state: GameState) => {
    const ending = assembleEnding(state);
    return generateEndingProse(ending, state);
  },

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'finish',
      text: "[The story ends here]",
      next: 'game_over',
      effects: {},
    },
  ],
};

// ============================================
// ENDING ASSEMBLY
// ============================================

export function assembleEnding(state: GameState): Ending {
  const ending: Ending = {
    mira: { arc: 'unknown', description: '' },
    selin: { arc: 'unknown', description: '' },
    ver: { arc: 'unknown', description: '' },
    player: { arc: 'unknown', description: '' },
    overall: { tone: 'neutral', description: '' },
  };

  // Mira's resolution
  if (nodeIs(state, 'mira.decision_to_stay', 'triggered')) {
    ending.mira = {
      arc: 'decision_to_stay',
      description: 'Found a reason to stop running. Staying is a choice now, not a default.',
    };
  } else if (nodeIs(state, 'mira.the_confession', 'triggered')) {
    ending.mira = {
      arc: 'confession',
      description: 'Spoke the truth. The running continues, but lighter now.',
    };
  } else if (nodeIs(state, 'mira.crack_in_armor', 'triggered')) {
    ending.mira = {
      arc: 'crack',
      description: 'The armor cracked, but held. Maybe next time.',
    };
  } else {
    ending.mira = {
      arc: 'closed',
      description: 'Still running. Still alone. Some walls stay up.',
    };
  }

  // Selin's resolution
  if (nodeIs(state, 'selin.release', 'triggered')) {
    ending.selin = {
      arc: 'release',
      description: 'Let others help carry the burden. Elif\'s work will reach its destination—together.',
    };
  } else if (nodeIs(state, 'selin.grip', 'triggered')) {
    ending.selin = {
      arc: 'grip',
      description: 'Still holding on alone. The bag is his, the burden is his.',
    };
  } else if (nodeIs(state, 'selin.the_story', 'triggered')) {
    ending.selin = {
      arc: 'story',
      description: 'Told the story. The grief is shared, even if the burden isn\'t.',
    };
  } else {
    ending.selin = {
      arc: 'closed',
      description: 'The bag stays closed. The story stays untold.',
    };
  }

  // Ver's resolution
  if (nodeIs(state, 'ver.accepted', 'triggered')) {
    ending.ver = {
      arc: 'accepted',
      description: 'Her peace was honored. Grace at the ending.',
    };
  } else if (nodeIs(state, 'ver.contested', 'triggered')) {
    ending.ver = {
      arc: 'contested',
      description: 'Fought for. New stakes now—people who won\'t let her go quietly.',
    };
  } else if (nodeIs(state, 'ver.the_reason', 'triggered')) {
    ending.ver = {
      arc: 'reason',
      description: 'Revealed her truth. The choice is still being made.',
    };
  } else {
    ending.ver = {
      arc: 'private',
      description: 'Her choice remains her own. The others never knew.',
    };
  }

  // Player arc (based on pattern)
  const p = state.playerPattern;
  if (p.gentle_vs_pressing > 0.3 && p.curious_vs_pragmatic > 0.2) {
    ending.player = {
      arc: 'witness',
      description: 'You watched. You listened. Sometimes that\'s the gift people need most.',
    };
  } else if (p.selfless_vs_self_focused > 0.2) {
    ending.player = {
      arc: 'catalyst',
      description: 'You went first into the dark. Your vulnerability made theirs possible.',
    };
  } else {
    ending.player = {
      arc: 'survivor',
      description: 'You survived. You were present. That was enough.',
    };
  }

  // Overall tone
  let resolved = 0;
  if (ending.mira.arc === 'decision_to_stay') resolved++;
  if (ending.selin.arc === 'release') resolved++;
  if (ending.ver.arc === 'accepted' || ending.ver.arc === 'contested') resolved++;

  const avgTrust = (getTrust(state, 'mira') + getTrust(state, 'selin') + getTrust(state, 'ver')) / 3;

  if (resolved >= 2 && avgTrust > 0.3) {
    ending.overall = {
      tone: 'hopeful',
      description: 'Dawn came. Something changed in the night—not everything, but enough.',
    };
  } else if (resolved >= 1) {
    ending.overall = {
      tone: 'bittersweet',
      description: 'Dawn came. Some doors opened. Others stayed closed.',
    };
  } else {
    ending.overall = {
      tone: 'quiet',
      description: 'Dawn came. You survived. What comes next is still unwritten.',
    };
  }

  return ending;
}

// ============================================
// ENDING PROSE GENERATION
// ============================================

function generateEndingProse(ending: Ending, state: GameState): string {
  let prose = `
═══════════════════════════════════════════════════════════════════
                              DAWN
═══════════════════════════════════════════════════════════════════

The sun is fully up now. The lighthouse is visible on the horizon—
closer than you feared, farther than you hoped.

Someone picks up an oar. Someone else takes the second.

`;

  // Mira section
  prose += `MIRA\n`;
  if (ending.mira.arc === 'decision_to_stay') {
    prose += `
She's at the bow, watching the horizon. But for the first time,
she's watching it like a destination, not an escape.

"I'm not going to the new job," she says. "When we get there—I'm
going to find his wife. Tell her what I should have told her months ago."

She looks at you. Almost smiles.

"And then... we'll see. Maybe staying isn't as hard as I thought."
`;
  } else if (ending.mira.arc === 'confession') {
    prose += `
She's at the bow, organizing supplies. Still moving. But something
is different—the competence is still there, but it's lighter somehow.
The confession didn't solve anything, but it changed the weight.
`;
  } else {
    prose += `
She's at the bow, already planning the next steps. Efficient.
Professional. Whatever she's carrying, she's carrying it alone.
`;
  }

  // Selin section
  prose += `\nSELIN\n`;
  if (ending.selin.arc === 'release') {
    prose += `
He's holding the bag differently now. Still careful, still protective—
but not desperate. Not alone.

"We'll figure it out," he says. "Where they need to go. Together."

For the first time since you met him, he looks his age. Young.
But not helpless.
`;
  } else if (ending.selin.arc === 'story') {
    prose += `
The bag is still in his lap. But his grip has changed. The story
has been told, even if the burden hasn't been shared. That's something.
`;
  } else {
    prose += `
He's clutching the bag, watching the horizon. Whatever he's carrying,
he's carrying it alone. Maybe that's how he wants it.
`;
  }

  // Ver section
  prose += `\nVER\n`;
  if (ending.ver.arc === 'accepted') {
    prose += `
She's at the stern, watching the sunrise with perfect stillness.
Peaceful. Complete.

"Thank you," she says. "For understanding. For not making it a fight."

She smiles—not sad, not brave. Just finished. In the best way.
`;
  } else if (ending.ver.arc === 'contested') {
    prose += `
She's at the stern, watching the sunrise. But now she's watching
it with people who won't let her go quietly.

"I still think you're foolish," she says. But she's smiling.
"Wonderfully, beautifully foolish."
`;
  } else {
    prose += `
She's at the stern, watching the sunrise with that same settled calm.
Whatever she's carrying, she carries it with grace.
`;
  }

  // Overall conclusion
  prose += `
═══════════════════════════════════════════════════════════════════

${ending.overall.description}

The shore is that way. Whatever comes after the shore—that's still
unwritten.

But you're not facing it alone.

═══════════════════════════════════════════════════════════════════
                         ENDINGS SUMMARY
═══════════════════════════════════════════════════════════════════

MIRA: ${ending.mira.description}

SELIN: ${ending.selin.description}

VER: ${ending.ver.description}

YOU: ${ending.player.description}

═══════════════════════════════════════════════════════════════════

${generateStateSummary(state)}
`;

  return prose;
}

// ============================================
// EXPORT ALL BEAT 4 SCENES
// ============================================

export const beat4Beats: Beat[] = [
  beat4Dawn,
  beat4aMiraResolution,
  beat4bSelinResolution,
  beat4cVerResolution,
  beat4Ending,
];
