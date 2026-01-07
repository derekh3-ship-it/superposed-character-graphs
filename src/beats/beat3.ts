/**
 * Beat 3: The Deep Night
 *
 * Guards down. Intimacy possible. The vulnerable hours.
 */

import type { Beat, Choice, GameState } from '../types.js';
import { nodeIs, getTrust } from '../state.js';

// ============================================
// BEAT 3: DEEP NIGHT (Main Hub)
// ============================================

export const beat3DeepNight: Beat = {
  id: 'beat_3_deep_night',
  name: 'The Deep Night',
  tension: 0.25,

  onEnter: (state: GameState) => {
    state.timeInNight = 4;
    state.tension = 0.25;
  },

  getProse: (_state: GameState) => `
The darkest hour. No moon now—it set an hour ago, leaving only stars.
The boat feels suspended in blackness, the water and sky bleeding into
each other at the horizon.

No one is sleeping. The pretense of watches has faded into something
more honest: four people sitting in darkness, each carrying things
they haven't said.

Ver is at the stern, wrapped in the emergency tarp, looking at the
place where the stars meet the sea. Mira is amidships, hands idle
for once—nothing left to organize, no one left to treat. Selin is
near the bow, the bag still in his lap, but his grip has changed.
Less desperate. More tired.

The exhaustion has stripped something away. The professional masks,
the careful distances. What's left is rawer. More real.

This is the hour when things become speakable that weren't speakable before.
`,

  getChoices: (state: GameState): Choice[] => {
    const choices: Choice[] = [];

    // Share first option - always available, high catalyst potential
    choices.push({
      id: 'share_first',
      text: "Say something true about yourself. Go first into the dark.",
      next: 'beat_3a_player_shares',
      effects: {
        storyState: { player_shared_vulnerability: true },
      },
    });

    // Mira option - available if crack_in_armor triggered or has progress
    if (nodeIs(state, 'mira.crack_in_armor', 'triggered') ||
        state.arcs.mira.crack_in_armor.partialWeight > 0.3) {
      choices.push({
        id: 'approach_mira',
        text: "Move toward Mira. She's been carrying something since the beginning.",
        next: 'beat_3b_mira_deep',
        effects: {
          arc: { 'mira.the_confession': { partial: 0.2 } },
        },
      });
    }

    // Selin option - available if partial_truth triggered or has progress
    if (nodeIs(state, 'selin.partial_truth', 'triggered') ||
        state.arcs.selin.partial_truth.partialWeight > 0.3) {
      choices.push({
        id: 'approach_selin',
        text: "Sit near Selin. He's carrying more than documents.",
        next: 'beat_3c_selin_deep',
        effects: {
          arc: { 'selin.the_story': { partial: 0.2 } },
        },
      });
    }

    // Ver option - available if the_noticing triggered
    if (nodeIs(state, 'ver.the_noticing', 'triggered')) {
      choices.push({
        id: 'approach_ver',
        text: "Join Ver at the stern. You know her secret now.",
        next: 'beat_3d_ver_deep',
        effects: {
          arc: { 'ver.the_reason': { partial: 0.2 } },
        },
      });
    }

    // Wait option
    choices.push({
      id: 'wait_watch',
      text: "Wait. Watch. Let them come to it in their own time.",
      next: 'beat_3_wait',
      effects: {
        playerPattern: { gentle_vs_pressing: 0.2 },
      },
    });

    return choices;
  },
};

// ============================================
// BEAT 3A: PLAYER SHARES
// ============================================

export const beat3aPlayerShares: Beat = {
  id: 'beat_3a_player_shares',
  name: 'Going First',
  tension: 0.25,

  getProse: (_state: GameState) => `
"I keep thinking about the ship," you say. Into the dark, to no one
in particular. To everyone.

The words come slowly at first. Then faster.

You tell them something true. Not everything—but something real.
Why you were on that ship. What you were running from, or toward.
The thing you haven't said out loud.

When you finish, the silence has a different quality. Charged. Waiting.

Ver is the first to move. A slight shift in the darkness, turning
toward you.

"Thank you," she says quietly. "For going first."

Mira hasn't moved. But you can feel her attention—sharp, focused.
Like you've opened a door she's been standing outside.

Selin's grip on the bag has loosened. He's looking at you with something
that might be recognition. The look of someone who also has something
they haven't said.

The dark is patient. It can hold more than one truth tonight.
`,

  getChoices: (state: GameState): Choice[] => {
    const choices: Choice[] = [];

    // Options now have reduced resistance due to player sharing first
    if (state.arcs.mira.crack_in_armor.partialWeight > 0 ||
        nodeIs(state, 'mira.crack_in_armor', 'triggered')) {
      choices.push({
        id: 'turn_to_mira',
        text: "Look at Mira. The door is open.",
        next: 'beat_3b_mira_deep',
        effects: {
          arc: { 'mira.the_confession': { partial: 0.3 } },
        },
      });
    }

    if (state.arcs.selin.partial_truth.partialWeight > 0 ||
        nodeIs(state, 'selin.partial_truth', 'triggered')) {
      choices.push({
        id: 'turn_to_selin',
        text: "Look at Selin. He has something to say.",
        next: 'beat_3c_selin_deep',
        effects: {
          arc: { 'selin.the_story': { partial: 0.3 } },
        },
      });
    }

    choices.push({
      id: 'let_silence',
      text: "Let the silence hold. See who speaks.",
      next: 'beat_3_wait',
      effects: {
        arc: {
          'mira.the_confession': { partial: 0.15 },
          'selin.the_story': { partial: 0.15 },
        },
      },
    });

    return choices;
  },
};

// ============================================
// BEAT 3B: MIRA DEEP
// ============================================

export const beat3bMiraDeep: Beat = {
  id: 'beat_3b_mira_deep',
  name: 'Mira in the Dark',
  tension: 0.25,

  getProse: (state: GameState) => {
    const hasProgress = nodeIs(state, 'mira.crack_in_armor', 'triggered') ||
                       state.storyState['mira_admitted_running'];

    if (hasProgress) {
      return `
Mira is sitting very still, looking at nothing. In the starlight,
her face is unguarded in a way it hasn't been before.

She knows you're there. She doesn't tell you to go away.

"I keep thinking about timing," she says. Quietly. Like she's talking
to herself. "If the ship had gone down an hour earlier. An hour later.
If I'd taken a different ship. If I'd stayed."

"Stayed where?"

A long pause.

"Where I was running from." She looks at you. In the darkness, you
can barely see her face. Maybe that makes it easier. "There was a
patient. There's always a patient, isn't there? The one you don't save."
`;
    } else {
      return `
Mira is sitting alone, arms wrapped around her knees. The competence
is still there—you can see it in how she's positioned herself to
watch everything. But something else is there too.

She notices you approach. The mask comes back, but slower than before.

"Can't sleep?"

"No. You?"

"I don't sleep much." A pause. "Anymore."

She looks back at the water. There's a door there, if you can find
the right key.
`;
    }
  },

  getChoices: (state: GameState): Choice[] => {
    const hasProgress = nodeIs(state, 'mira.crack_in_armor', 'triggered') ||
                       state.storyState['mira_admitted_running'];

    if (hasProgress) {
      return [
        {
          id: 'listen',
          text: "Listen. Let her tell it.",
          next: 'beat_3b2_mira_confession',
          effects: {
            arc: { 'mira.the_confession': { partial: 0.4 } },
          },
        },
        {
          id: 'share_parallel',
          text: "Share something of your own. Meet her in the dark.",
          next: 'beat_3b2_mira_confession',
          effects: {
            arc: { 'mira.the_confession': { partial: 0.5 } },
            relationship: { mira: { trust: 0.1 } },
          },
        },
      ];
    } else {
      return [
        {
          id: 'gentle_presence',
          text: "Sit with her. Don't push.",
          next: 'beat_3_converge',
          effects: {
            arc: { 'mira.crack_in_armor': { partial: 0.2 } },
            relationship: { mira: { trust: 0.1 } },
            playerPattern: { gentle_vs_pressing: 0.1 },
          },
        },
        {
          id: 'ask_directly',
          text: '"What are you running from?"',
          next: 'beat_3b2_mira_confession',
          effects: {
            arc: { 'mira.crack_in_armor': { partial: 0.3 } },
          },
          availableIf: (s) => getTrust(s, 'mira') >= 0.2,
        },
      ];
    }
  },
};

// ============================================
// BEAT 3B2: MIRA'S CONFESSION
// ============================================

export const beat3b2MiraConfession: Beat = {
  id: 'beat_3b2_mira_confession',
  name: "Mira's Confession",
  tension: 0.2,

  getProse: (_state: GameState) => `
Mira is quiet for a long moment. You can see her deciding—the war
between the walls she's built and whatever is behind them.

"There was a patient." Her voice is flat. Controlled. "His name was
David. Forty-three. Came in with chest pain."

She pauses. The boat rocks gently.

"I was tired. Double shift. Eighteen hours. I missed something—a
shadow on the scan that I should have seen." Her voice cracks, just
slightly. "He died two days later. Massive coronary. The kind that
might have killed him anyway, but—"

"But you'll never know."

"No." Very quiet. "I'll never know. Because I was tired. Because I
was human. Because humans make mistakes and my mistake killed someone."

She finally looks at you. Her eyes are dry, but something in them
is drowning.

"His wife looked at me. After. She didn't say anything. She just
looked at me." A pause. "I couldn't walk past his room anymore.
Couldn't walk through the hospital. So I ran."

She laughs, but it's not a laugh.

"And now I'm here. In the middle of the sea. Turns out you can't
run far enough."

Silence. The stars wheel overhead.

"I haven't said that out loud before." Her voice is strange. Lighter,
maybe. Or just emptier. "To anyone. Not once."
`,

  onEnter: (state: GameState) => {
    // This triggers the confession
    if (state.arcs.mira.the_confession.state !== 'triggered') {
      state.arcs.mira.the_confession.partialWeight += 0.5;
    }
  },

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'acknowledge_weight',
      text: '"That\'s a heavy thing to carry. Thank you for telling me."',
      next: 'beat_3_converge',
      effects: {
        arc: {
          'mira.the_confession': { trigger: true },
          'mira.decision_to_stay': { partial: 0.3 },
        },
        relationship: { mira: { trust: 0.2 } },
        memory: {
          character: 'mira',
          memory: {
            what: 'the patient she lost - David, 43, missed diagnosis',
            beat: 'beat_3b2_mira_confession',
            significance: 'why she was running',
            feeling: 'first time saying it aloud',
          },
        },
      },
    },
    {
      id: 'offer_perspective',
      text: '"Eighteen hours. You were set up to fail. That\'s not just on you."',
      next: 'beat_3_converge',
      effects: {
        arc: {
          'mira.the_confession': { trigger: true },
          'mira.decision_to_stay': { partial: 0.2 },
        },
        relationship: { mira: { trust: 0.1 } },
      },
    },
    {
      id: 'just_presence',
      text: "Don't say anything. Just sit with her in it.",
      next: 'beat_3_converge',
      effects: {
        arc: {
          'mira.the_confession': { trigger: true },
          'mira.decision_to_stay': { partial: 0.25 },
        },
        relationship: { mira: { trust: 0.15 } },
        playerPattern: { gentle_vs_pressing: 0.2 },
      },
    },
  ],
};

// ============================================
// BEAT 3C: SELIN DEEP
// ============================================

export const beat3cSelinDeep: Beat = {
  id: 'beat_3c_selin_deep',
  name: 'Selin in the Dark',
  tension: 0.25,

  getProse: (state: GameState) => {
    const hasProgress = nodeIs(state, 'selin.partial_truth', 'triggered');

    if (hasProgress) {
      return `
Selin is curled against the side of the boat, the bag pressed to his
chest. He's not asleep—you can see his eyes reflecting starlight.

He knows you're there. He doesn't pull away.

"I keep thinking about her," he says. Quietly. "Elif. That was her
name. I didn't tell you before."

He looks at the bag.

"I don't even know what's in most of them. Her research. Her life's
work. And I don't understand any of it." His voice breaks. "She gave
me everything, and I don't even understand it."
`;
    } else {
      return `
Selin is sitting alone, the bag clutched to his chest. In the darkness,
he looks younger than before. Smaller.

He sees you approach. The wariness flickers, but doesn't fully engage.

"Can't sleep," he says. Not a question.

"No. You?"

"I keep—" He stops. Starts again. "I keep thinking about things
I should have done differently."
`;
    }
  },

  getChoices: (state: GameState): Choice[] => {
    const hasProgress = nodeIs(state, 'selin.partial_truth', 'triggered');

    if (hasProgress) {
      return [
        {
          id: 'ask_about_elif',
          text: '"Tell me about her. Elif."',
          next: 'beat_3c2_selin_story',
          effects: {
            arc: { 'selin.the_story': { partial: 0.5 } },
          },
        },
        {
          id: 'acknowledge_weight',
          text: '"You\'re carrying something that wasn\'t meant for you. That\'s hard."',
          next: 'beat_3c2_selin_story',
          effects: {
            arc: { 'selin.the_story': { partial: 0.4 } },
            relationship: { selin: { trust: 0.1 } },
          },
        },
      ];
    } else {
      return [
        {
          id: 'sit_quietly',
          text: "Sit near him. Don't push.",
          next: 'beat_3_converge',
          effects: {
            arc: { 'selin.partial_truth': { partial: 0.2 } },
            relationship: { selin: { trust: 0.1 } },
          },
        },
        {
          id: 'gentle_question',
          text: '"What would you have done differently?"',
          next: 'beat_3_converge',
          effects: {
            arc: { 'selin.partial_truth': { partial: 0.25 } },
          },
        },
      ];
    }
  },
};

// ============================================
// BEAT 3C2: SELIN'S STORY
// ============================================

export const beat3c2SelinStory: Beat = {
  id: 'beat_3c2_selin_story',
  name: "Selin's Story",
  tension: 0.2,

  getProse: (_state: GameState) => `
"Her name was Elif." His voice is steadier now, like saying it out
loud has made it more real. "She was a history professor. Ottoman
legal documents—that's what she studied."

He's crying now. Quietly, trying to hide it.

"We sat together at dinner the first night. She talked about her
work for two hours. I didn't understand half of it, but she made
it sound... important. Beautiful, even."

He holds the bag tighter.

"When the water started coming in, she gave them to me. She said
'You're young. You'll make it.' She didn't even try to get to a
lifeboat. She just made sure I had the bag."

A pause. The stars wheel overhead.

"She wasn't my teacher. She wasn't my friend. She was just...
someone I met at dinner. And she gave me everything."

His voice cracks.

"I don't even know where to take them. I don't know who her family is.
I don't know anything except that she trusted me and I can't—"

He stops. Can't finish.
`,

  onEnter: (state: GameState) => {
    // This triggers the story
    if (state.arcs.selin.the_story.state !== 'triggered') {
      state.arcs.selin.the_story.partialWeight += 0.5;
    }
  },

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'honor_elif',
      text: '"She chose well. She saw something in you worth trusting."',
      next: 'beat_3_converge',
      effects: {
        arc: {
          'selin.the_story': { trigger: true },
          'selin.release': { partial: 0.3 },
        },
        relationship: { selin: { trust: 0.2 } },
        memory: {
          character: 'selin',
          memory: {
            what: 'Elif - history professor, Ottoman documents, gave him everything, didn\'t save herself',
            beat: 'beat_3c2_selin_story',
            significance: 'carrying her life\'s work',
            feeling: 'grief, guilt, obligation',
          },
        },
      },
    },
    {
      id: 'offer_help',
      text: '"We\'ll figure it out together. You\'re not alone with this."',
      next: 'beat_3_converge',
      effects: {
        arc: {
          'selin.the_story': { trigger: true },
          'selin.release': { partial: 0.4 },
        },
        relationship: { selin: { trust: 0.25 } },
      },
    },
    {
      id: 'just_witness',
      text: "Let him cry. Bear witness. That's enough.",
      next: 'beat_3_converge',
      effects: {
        arc: {
          'selin.the_story': { trigger: true },
          'selin.release': { partial: 0.25 },
        },
        relationship: { selin: { trust: 0.15 } },
        playerPattern: { gentle_vs_pressing: 0.15 },
      },
    },
  ],
};

// ============================================
// BEAT 3D: VER DEEP
// ============================================

export const beat3dVerDeep: Beat = {
  id: 'beat_3d_ver_deep',
  name: 'Ver in the Dark',
  tension: 0.2,

  getProse: (_state: GameState) => `
Ver hasn't slept at all. She's sitting very still, watching the
stars, and there's something in her stillness that feels like prayer.
Or goodbye.

She knows you're there.

"Beautiful night," she says. "One of the most beautiful I've seen."

She's not talking about the circumstances. She's talking about the
stars, the darkness, the quiet. The gift of being here to see it.

"I told you earlier," she says. "About the doctors. About stopping
making long plans."

"You did."

"I didn't tell you all of it." She turns to look at you. In the
starlight, her face is peaceful. "I have maybe a month. Maybe less.
The trip to see my daughter—it was goodbye. I just hadn't told her yet."
`,

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'receive_truth',
      text: '"Thank you for telling me."',
      next: 'beat_3d2_ver_reason',
      effects: {
        arc: { 'ver.the_reason': { partial: 0.5 } },
        relationship: { ver: { trust: 0.1 } },
      },
    },
    {
      id: 'ask_how_she_feels',
      text: '"How do you feel? About all of it."',
      next: 'beat_3d2_ver_reason',
      effects: {
        arc: { 'ver.the_reason': { partial: 0.4 } },
        relationship: { ver: { trust: 0.15 } },
      },
    },
  ],
};

// ============================================
// BEAT 3D2: VER'S REASON
// ============================================

export const beat3d2VerReason: Beat = {
  id: 'beat_3d2_ver_reason',
  name: "Ver's Reason",
  tension: 0.2,

  getProse: (_state: GameState) => `
"How do I feel?" She considers the question. Really considers it.

"Grateful, mostly. I've had a good life. A long one. Longer than I
expected—the doctors gave me two years about four years ago." She
almost smiles. "I've been stealing time."

She looks at the stars.

"My husband died in the spring. Forty-three years, and then he was
gone." A pause. "I'm not sure what I'd do with more time. I had my time.
I had my love. The book is written."

She turns to face you.

"I'm not sad. I'm not being brave. I'm just... finished. Does that
make sense? The story is complete. Now I'm just reading the epilogue."

Her voice is calm. Settled. At peace.

"I look at you three and I think: you have so much story left.
Mira running from her ghosts. That young man carrying someone else's
life's work. You, whoever you are, whatever brought you here."

She reaches out, touches your hand briefly.

"I want to see you get to it. That's all I want now. To see you
reach shore. To know the story continues."
`,

  onEnter: (state: GameState) => {
    if (state.arcs.ver.the_reason.state !== 'triggered') {
      state.arcs.ver.the_reason.partialWeight += 0.5;
    }
  },

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'accept_peace',
      text: '"Thank you. For telling me. For being here."',
      next: 'beat_3_converge',
      effects: {
        arc: {
          'ver.the_reason': { trigger: true },
          'ver.accepted': { partial: 0.3 },
        },
        relationship: { ver: { trust: 0.2 } },
        memory: {
          character: 'ver',
          memory: {
            what: 'diagnosis - a month or less, making peace, the book is written',
            beat: 'beat_3d2_ver_reason',
            significance: 'her choice, her ending',
            feeling: 'peaceful acceptance',
          },
        },
      },
    },
    {
      id: 'gentle_contest',
      text: '"I hear you. But I\'m not ready to let you go without a fight."',
      next: 'beat_3_converge',
      effects: {
        arc: {
          'ver.the_reason': { trigger: true },
          'ver.contested': { partial: 0.3 },
        },
        relationship: { ver: { trust: 0.1 } },
        storyState: { player_fights_for_ver: true },
      },
    },
    {
      id: 'ask_what_she_wants',
      text: '"What do you want? For yourself. Not for us."',
      next: 'beat_3_converge',
      effects: {
        arc: {
          'ver.the_reason': { trigger: true },
          'ver.accepted': { partial: 0.2 },
          'ver.contested': { partial: 0.1 },
        },
        relationship: { ver: { trust: 0.2 } },
      },
    },
  ],
};

// ============================================
// BEAT 3 WAIT
// ============================================

export const beat3Wait: Beat = {
  id: 'beat_3_wait',
  name: 'Waiting',
  tension: 0.2,

  getProse: (state: GameState) => {
    let prose = `
You wait. Watch. Let the darkness do its work.

The boat rocks gently. The stars wheel overhead. Time passes differently
in the deep night—stretched and compressed at once.
`;

    // Add dynamic content based on who's ready to speak
    if (nodeIs(state, 'mira.crack_in_armor', 'triggered') &&
        !nodeIs(state, 'mira.the_confession', 'triggered')) {
      prose += `
Mira shifts in the darkness. Opens her mouth. Closes it. There's something
she wants to say. You can feel it.
`;
    }

    if (nodeIs(state, 'selin.partial_truth', 'triggered') &&
        !nodeIs(state, 'selin.the_story', 'triggered')) {
      prose += `
Selin is crying quietly. You can hear it in his breathing. The bag is
pressed against his chest like a wound.
`;
    }

    prose += `
The night holds its secrets loosely now. Ready to release them to
whoever is patient enough to wait.
`;

    return prose;
  },

  getChoices: (state: GameState): Choice[] => {
    const choices: Choice[] = [];

    if (nodeIs(state, 'mira.crack_in_armor', 'triggered') &&
        !nodeIs(state, 'mira.the_confession', 'triggered')) {
      choices.push({
        id: 'go_to_mira',
        text: "Go to Mira. She's ready.",
        next: 'beat_3b_mira_deep',
        effects: {},
      });
    }

    if (nodeIs(state, 'selin.partial_truth', 'triggered') &&
        !nodeIs(state, 'selin.the_story', 'triggered')) {
      choices.push({
        id: 'go_to_selin',
        text: "Go to Selin. He needs someone.",
        next: 'beat_3c_selin_deep',
        effects: {},
      });
    }

    choices.push({
      id: 'let_night_pass',
      text: "Let the night pass. Dawn will come.",
      next: 'beat_3_converge',
      effects: {},
    });

    return choices;
  },
};

// ============================================
// BEAT 3 CONVERGENCE
// ============================================

export const beat3Converge: Beat = {
  id: 'beat_3_converge',
  name: 'End of Deep Night',
  tension: 0.3,

  getProse: (state: GameState) => {
    let prose = `
The deep night passes. The darkness holds what was said, what was
shared, what was revealed.
`;

    if (nodeIs(state, 'mira.the_confession', 'triggered')) {
      prose += `
Mira is different now. The competence is still there, but something
underneath has shifted. She's been seen. The running might not be over,
but it's harder to pretend it isn't happening.
`;
    }

    if (nodeIs(state, 'selin.the_story', 'triggered')) {
      prose += `
Selin's grip on the bag has changed again. Still protective, but not
desperate. The weight is still there, but it's a weight that's been
named, acknowledged. Shared.
`;
    }

    if (nodeIs(state, 'ver.the_reason', 'triggered')) {
      prose += `
Ver is watching the horizon. Calm. Complete. Whatever time she has left,
she's choosing how to spend it. And she's choosing to spend it here,
with you, watching the sun come up.
`;
    }

    prose += `
The eastern sky is lightening. Not dawn yet, but the promise of it.

The night did something to all of you. The question is whether it
was enough.
`;

    return prose;
  },

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'continue_to_dawn',
      text: "Watch the dawn approach.",
      next: 'beat_4_dawn',
      effects: {
        storyState: { beat_3_complete: true },
      },
    },
  ],
};

// ============================================
// EXPORT ALL BEAT 3 SCENES
// ============================================

export const beat3Beats: Beat[] = [
  beat3DeepNight,
  beat3aPlayerShares,
  beat3bMiraDeep,
  beat3b2MiraConfession,
  beat3cSelinDeep,
  beat3c2SelinStory,
  beat3dVerDeep,
  beat3d2VerReason,
  beat3Wait,
  beat3Converge,
];
