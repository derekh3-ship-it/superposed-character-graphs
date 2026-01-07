/**
 * Beat 2: Settling
 *
 * The adrenaline fades. They take stock. First conversations.
 */

import type { Beat, Choice, GameState } from '../types.js';
import { nodeIs, getTrust } from '../state.js';

// ============================================
// BEAT 2: SETTLING (Main Hub)
// ============================================

export const beat2Settling: Beat = {
  id: 'beat_2_settling',
  name: 'Settling',
  tension: 0.5,

  onEnter: (state: GameState) => {
    state.timeInNight = 1.5;
    state.tension = 0.5;
  },

  getProse: (_state: GameState) => `
The moon rises. Half full, silver-white, enough light to see faces now
instead of just shapes. The boat feels smaller in the moonlight—the
four of you closer together, the sea larger all around.

Someone has found a more comfortable position. Someone else has stopped
shivering, or started. The immediate crisis is past, but the longer
crisis—the one measured in hours and water rations and distance to
shore—is just beginning to make itself known.

Mira is sitting near the bow, watchful. Even resting, she has the
posture of someone ready to respond. Ver is at the stern, looking at
the stars the way someone might look at old friends. Selin is between
them, the bag still in his lap, though his grip has eased from desperate
to merely protective.

The silence isn't uncomfortable. Not yet. But it's full of things unsaid.
`,

  getChoices: (state: GameState): Choice[] => {
    const choices: Choice[] = [
      {
        id: 'practical_talk',
        text: '"We should talk about the plan. Rowing shifts, water rationing."',
        next: 'beat_2a_practical',
        effects: {
          playerPattern: { curious_vs_pragmatic: -0.2 },
        },
      },
      {
        id: 'learn_people',
        text: '"We\'re going to be here a while. We might as well know each other."',
        next: 'beat_2b_personal',
        effects: {
          relationship: { all: { trust: 0.05 } },
        },
      },
    ];

    // Mira option - more available if we noticed her pause
    if (nodeIs(state, 'mira.competence_acknowledged', 'triggered')) {
      choices.push({
        id: 'talk_to_mira',
        text: "Mira has been in charge since the beginning. See what she thinks.",
        next: 'beat_2c_mira',
        effects: {
          arc: { 'mira.crack_in_armor': { partial: 0.1 } },
        },
      });
    }

    // Selin option - different based on earlier interaction
    if (nodeIs(state, 'selin.suspicion_noted', 'triggered')) {
      choices.push({
        id: 'talk_to_selin',
        text: "Sit near Selin. He's been quiet. Wary.",
        next: 'beat_2d_selin',
        effects: {
          relationship: { selin: { trust: 0.05 } },
        },
      });
    }

    // Ver option - especially if we noticed something
    choices.push({
      id: 'talk_to_ver',
      text: "Join Ver at the stern. She seems like someone who knows how to wait.",
      next: 'beat_2e_ver',
      effects: {
        arc: { 'ver.the_noticing': { partial: 0.15 } },
      },
    });

    return choices;
  },
};

// ============================================
// BEAT 2A: PRACTICAL
// ============================================

export const beat2aPractical: Beat = {
  id: 'beat_2a_practical',
  name: 'Practical Matters',
  tension: 0.45,

  getProse: (_state: GameState) => `
"Plan." Mira nods, straightening slightly. Back in her element.
"We have maybe three days of water if we're careful. Two oars. Four
people who can row."

She's already calculating. "Two on, two off. Four-hour shifts. We row
toward the lighthouse—that's south. The current is against us, but
not badly."

Ver speaks up. "I can take a shift. Don't let the gray hair fool you."

"And me," Selin says. Quiet, but firm. He's still holding the bag,
but he's meeting eyes now.

Mira looks at you. "You'll row?"

It's not really a question. In a crisis, everyone contributes.
Something to do. Something concrete.

But you notice she didn't ask if anyone had other skills. If anyone
had anything to offer besides muscle. The practical swept everything
else aside.
`,

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'accept_role',
      text: '"I\'ll row. Whatever we need."',
      next: 'beat_2_converge',
      effects: {
        relationship: { mira: { trust: 0.1 } },
      },
    },
    {
      id: 'add_dimension',
      text: '"I\'ll row. But we should also talk. About more than just logistics."',
      next: 'beat_2b_personal',
      effects: {
        playerPattern: { curious_vs_pragmatic: 0.2 },
        relationship: { all: { trust: 0.05 } },
      },
    },
  ],
};

// ============================================
// BEAT 2B: PERSONAL
// ============================================

export const beat2bPersonal: Beat = {
  id: 'beat_2b_personal',
  name: 'Getting to Know',
  tension: 0.45,

  getProse: (_state: GameState) => `
"Know each other." Mira's voice is neutral. Professional. "Is that
important right now?"

"It might be." You settle into a more comfortable position. "If we're
going to be rowing in shifts, trusting each other to keep watch—
seems like knowing who we are isn't the worst use of time."

A silence. Ver is watching you with something like approval. Selin
is watching with something like alarm.

"I'll start," you offer. "I was on the ship because—"

You tell them something true. Not everything—but something. Where
you were going. Why it mattered. Enough to be real.

When you finish, the silence has a different quality. Not empty. Waiting.

Ver speaks first. "I was going to visit my daughter. She lives in
Cyrene now. I hadn't seen her in—too long."

She doesn't say anything else. Doesn't mention a return trip.

Mira's turn. She's quiet for a long moment.

"Work," she says finally. "New position. New city." Her voice is flat.
"That's why I was on the ship."

The shortest answer. The one that says the least. But she answered.

Selin is last. You can see him wrestling with it.

"I was—" He stops. "Courier work. Sort of. I was delivering something."

His hands tighten on the bag. The obvious question hangs in the air.

No one asks it.
`,

  getChoices: (state: GameState): Choice[] => {
    const choices: Choice[] = [];

    // Ver follow-up
    choices.push({
      id: 'follow_up_ver',
      text: "Ver mentioned her daughter but not coming back. That's interesting.",
      next: 'beat_2b2_ver_follow',
      effects: {
        arc: { 'ver.the_noticing': { partial: 0.3 } },
      },
    });

    // Mira follow-up
    choices.push({
      id: 'follow_up_mira',
      text: "Mira's answer was very short. Like she was avoiding something.",
      next: 'beat_2b3_mira_follow',
      effects: {
        arc: { 'mira.crack_in_armor': { partial: 0.2 } },
      },
    });

    // Selin follow-up - but gently
    if (!state.storyState['selin_very_defensive']) {
      choices.push({
        id: 'follow_up_selin',
        text: "Selin said 'courier work.' The bag is obviously more than that.",
        next: 'beat_2b4_selin_follow',
        effects: {
          arc: { 'selin.partial_truth': { partial: 0.2 } },
        },
      });
    }

    // Let it be
    choices.push({
      id: 'let_it_be',
      text: "Leave it there. They shared what they wanted to share.",
      next: 'beat_2_converge',
      effects: {
        relationship: { all: { trust: 0.1 } },
        playerPattern: { gentle_vs_pressing: 0.2 },
      },
    });

    return choices;
  },
};

// ============================================
// BEAT 2B2: VER FOLLOW-UP
// ============================================

export const beat2b2VerFollow: Beat = {
  id: 'beat_2b2_ver_follow',
  name: 'Ver Follow-up',
  tension: 0.4,

  getProse: (_state: GameState) => `
"Your daughter in Cyrene," you say. "That's a long trip. Were you
planning to stay a while?"

Ver's expression doesn't change. But something in her posture shifts—
a subtle closing, or maybe just a settling.

"Long enough," she says. "I wanted to see her. Meet my grandchildren
properly. Watch them grow up a little, if I could."

"If you could?"

She's quiet for a moment. The moonlight catches her face—the lines
there, the settled patience.

"At my age, you stop making long plans." She says it easily, like
she's commenting on the weather. "You take what comes. You're grateful
for it."

Mira is watching her now. The doctor's eyes—professional, assessing.
You can see her noting something, filing it away.

"That's wise," you say.

"That's old." Ver smiles slightly. "Wisdom is just what we call it
when old people get lucky and happen to be right."

She turns to look at the stars again. Subject closed. But the door
is open now, if anyone wants to walk through it later.
`,

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'continue',
      text: "Let the conversation drift to other things.",
      next: 'beat_2_converge',
      effects: {
        storyState: { mira_noticed_ver: true },
      },
    },
  ],
};

// ============================================
// BEAT 2B3: MIRA FOLLOW-UP
// ============================================

export const beat2b3MiraFollow: Beat = {
  id: 'beat_2b3_mira_follow',
  name: 'Mira Follow-up',
  tension: 0.45,

  getProse: (_state: GameState) => `
"New city," you say. "That's a big change. Good opportunity?"

Mira's face is very still. For a moment you think she won't answer
at all.

"Yes," she says finally. "Good opportunity." The words are correct.
The tone is empty.

"You don't sound excited about it."

She turns to look at you directly. There's a warning in her eyes—
not hostile, just clear. A boundary.

"It's a job. Jobs are jobs." A pause. "Does it matter? We're in a
lifeboat. Where I was going isn't particularly relevant anymore."

"Fair point."

But you saw something. The way she deflected. The flatness in her
voice when she talked about where she was going—not the enthusiasm
of someone heading toward something good. The exhaustion of someone
running from something bad.

She knows you saw it. She's choosing to pretend you didn't.

"We should probably figure out a watch schedule," she says. Changing
the subject. Taking back control.

She's good at that.
`,

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'let_her_deflect',
      text: "Let her change the subject. For now.",
      next: 'beat_2_converge',
      effects: {
        storyState: { mira_deflected: true },
        playerPattern: { gentle_vs_pressing: 0.1 },
      },
    },
    {
      id: 'gentle_acknowledge',
      text: '"Okay. But—I see you. Whenever you want to talk."',
      next: 'beat_2_converge',
      effects: {
        arc: { 'mira.crack_in_armor': { partial: 0.15 } },
        relationship: { mira: { trust: 0.1 } },
        storyState: { mira_acknowledged: true },
      },
    },
  ],
};

// ============================================
// BEAT 2B4: SELIN FOLLOW-UP
// ============================================

export const beat2b4SelinFollow: Beat = {
  id: 'beat_2b4_selin_follow',
  name: 'Selin Follow-up',
  tension: 0.5,

  getProse: (state: GameState) => {
    const wasGentle = state.storyState['selin_opening'] || state.storyState['selin_not_pushed'];

    if (wasGentle) {
      return `
"Courier work," you say. Not accusatory. Just acknowledging.

Selin looks at you. Something in his face is different than before—
less defensive. The gentleness earlier bought you something.

"Sort of," he says. "I mean—yes. But also no."

He looks down at the bag. His grip loosens slightly.

"Someone asked me to take it somewhere. Someone who—" He stops.
"Someone who couldn't do it themselves. Anymore."

The bag. Not just documents. Something entrusted. Something heavy.

"I promised," he says quietly. "I have to get it there."

"We'll try," you say.

He nods. It's not much. But it's something.
`;
    } else {
      return `
"Courier work," you say.

Selin's face closes immediately. The bag gets tighter against his chest.

"I said what I said." His voice is flat. "It's courier work. That's all."

The earlier pushback cost you. He's not going to open that door again.
Not easily. Maybe not at all.

Mira clears her throat. "We should probably figure out watches."

The subject changes. Selin's eyes stay wary.
`;
    }
  },

  getChoices: (state: GameState): Choice[] => {
    const wasGentle = state.storyState['selin_opening'] || state.storyState['selin_not_pushed'];

    if (wasGentle) {
      return [
        {
          id: 'dont_push_more',
          text: "Don't push further. He shared what he could.",
          next: 'beat_2_converge',
          effects: {
            arc: { 'selin.partial_truth': { partial: 0.25 } },
            relationship: { selin: { trust: 0.1 } },
            playerPattern: { gentle_vs_pressing: 0.1 },
          },
        },
        {
          id: 'ask_who',
          text: '"Who was it? Who asked you?"',
          next: 'beat_2_converge',
          effects: {
            arc: { 'selin.partial_truth': { partial: 0.15 } },
            relationship: { selin: { trust: -0.05 } },
            playerPattern: { curious_vs_pragmatic: 0.1 },
          },
        },
      ];
    } else {
      return [
        {
          id: 'back_off',
          text: "Let it go.",
          next: 'beat_2_converge',
          effects: {
            storyState: { selin_closed: true },
          },
        },
      ];
    }
  },
};

// ============================================
// BEAT 2C: MIRA DIRECT
// ============================================

export const beat2cMira: Beat = {
  id: 'beat_2c_mira',
  name: 'Talking to Mira',
  tension: 0.45,

  getProse: (_state: GameState) => `
Mira is sitting near the bow, knees drawn up, watching the water.
The competence is still there in her posture—alert, ready—but
something else too. Something tired.

She hears you approach but doesn't turn.

"Can't settle?"

"Something like that." You sit near her. Not too close. "You've been
in charge since the beginning. How are you holding up?"

She almost smiles. Almost. "Holding up. That's a good way to put it."

A pause. The boat rocks gently.

"I've done this before. Not—" she gestures at the empty sea "—this
exactly. But crisis. The part where you just keep moving because
stopping isn't an option."

"And after? When stopping becomes an option?"

She's quiet for a long moment.

"I'll let you know when I figure that out."
`,

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'give_space',
      text: "Stay quiet. Let the silence be comfortable.",
      next: 'beat_2_converge',
      effects: {
        arc: { 'mira.crack_in_armor': { partial: 0.2 } },
        relationship: { mira: { trust: 0.1 } },
        playerPattern: { gentle_vs_pressing: 0.15 },
      },
    },
    {
      id: 'ask_destination',
      text: '"Where were you going? Before all this."',
      next: 'beat_2c2_destination',
      effects: {
        arc: { 'mira.crack_in_armor': { partial: 0.25 } },
        playerPattern: { curious_vs_pragmatic: 0.1 },
      },
    },
  ],
};

// ============================================
// BEAT 2C2: MIRA DESTINATION
// ============================================

export const beat2c2Destination: Beat = {
  id: 'beat_2c2_destination',
  name: 'Mira Destination',
  tension: 0.45,

  getProse: (_state: GameState) => `
She doesn't answer immediately. You can see her deciding how much to say.

"New position. Different hospital. Different city." Each word is
careful. Measured.

"Running toward something? Or away?"

The question lands. You see it hit.

"Does it matter?"

"Maybe. Maybe not. But you asked me to row with you. Seems like I
should know who I'm rowing with."

She turns to look at you. In the moonlight, her face is hard to read.
But something is there—a crack, maybe. A consideration.

"Away," she says finally. Very quiet. "Running away."

She doesn't say from what. But she said that much. Which is more
than she's said to anyone else.

"Thank you," you say. "For being honest."

"Don't thank me yet." A ghost of dark humor. "You don't know what
I'm running from."

"When you're ready to tell me, I'll listen."

She nods. Once. The moment passes, but something has shifted.
`,

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'continue_quiet',
      text: "Let the conversation settle.",
      next: 'beat_2_converge',
      effects: {
        arc: { 'mira.crack_in_armor': { partial: 0.3 } },
        relationship: { mira: { trust: 0.15 } },
        storyState: { mira_admitted_running: true },
      },
    },
  ],
};

// ============================================
// BEAT 2D: SELIN DIRECT
// ============================================

export const beat2dSelin: Beat = {
  id: 'beat_2d_selin',
  name: 'Talking to Selin',
  tension: 0.5,

  getProse: (state: GameState) => {
    const wasGentle = state.storyState['selin_opening'] || state.storyState['selin_not_pushed'];

    if (wasGentle) {
      return `
You sit near Selin—not too close. He's still holding the bag, but
his grip has eased. The wariness is there, but muted.

"You okay?" you ask.

"Okay." He tests the word. "I'm alive. We're alive. That's something."

He looks down at the bag.

"I keep thinking about what would have happened if I'd lost it.
In the water. If I'd had to choose between—" He stops.

"You didn't have to choose. It made it. You made it."

"Yeah." He's quiet for a moment. "She'd be glad. The person who—
she'd be glad I made it."

It's the most he's said about whoever gave him the bag.
`;
    } else {
      return `
You sit near Selin. He immediately shifts the bag to his far side,
putting his body between you and it.

"I'm fine," he says. Before you ask anything.

The earlier interaction still hangs between you. He's not hostile,
but he's closed. Watchful.

Whatever trust could have been built—it's going to take time now.
If it's possible at all.
`;
    }
  },

  getChoices: (state: GameState): Choice[] => {
    const wasGentle = state.storyState['selin_opening'] || state.storyState['selin_not_pushed'];

    if (wasGentle) {
      return [
        {
          id: 'ask_about_her',
          text: '"She? Who was she?"',
          next: 'beat_2d2_selin_her',
          effects: {
            arc: { 'selin.partial_truth': { partial: 0.3 } },
          },
        },
        {
          id: 'dont_push',
          text: "Don't push. Just sit with him.",
          next: 'beat_2_converge',
          effects: {
            relationship: { selin: { trust: 0.1 } },
            playerPattern: { gentle_vs_pressing: 0.15 },
          },
        },
      ];
    } else {
      return [
        {
          id: 'give_space',
          text: "Give him space.",
          next: 'beat_2_converge',
          effects: {},
        },
      ];
    }
  },
};

// ============================================
// BEAT 2D2: SELIN HER
// ============================================

export const beat2d2SelinHer: Beat = {
  id: 'beat_2d2_selin_her',
  name: 'Selin - Her',
  tension: 0.5,

  getProse: (_state: GameState) => `
He's quiet for a long moment. You can see him deciding.

"Someone I met on the ship. Just—someone." He looks at the bag.
"A professor. History. She was going to a conference."

He pauses.

"She talked about her work all through dinner. Documents. Old legal
records. I didn't understand half of it, but she made it sound..."
He struggles for the word. "Important. Beautiful, even."

"And the bag?"

"Her research. All of it. She gave it to me when—" His voice catches.
"When the water started coming in. She said I was young. Said I'd make it."

The words hang in the air.

"She didn't make it," you say. Not a question.

"No." Very quiet. "She didn't even try. She just made sure I had the
bag, and then she was gone."

His grip tightens. Not defensive anymore. Protective. Of something
that isn't his but that he's carrying anyway.
`,

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'honor_burden',
      text: '"That\'s a heavy thing to carry."',
      next: 'beat_2_converge',
      effects: {
        arc: { 'selin.partial_truth': { trigger: true } },
        relationship: { selin: { trust: 0.15 } },
        memory: {
          character: 'selin',
          memory: {
            what: 'told about the professor, her research, her death',
            beat: 'beat_2d2_selin_her',
            significance: 'first time sharing the full weight',
          },
        },
      },
    },
    {
      id: 'offer_help',
      text: '"We\'ll get it where it needs to go. Together."',
      next: 'beat_2_converge',
      effects: {
        arc: {
          'selin.partial_truth': { trigger: true },
          'selin.the_story': { partial: 0.2 },
        },
        relationship: { selin: { trust: 0.2 } },
      },
    },
  ],
};

// ============================================
// BEAT 2E: VER DIRECT
// ============================================

export const beat2eVer: Beat = {
  id: 'beat_2e_ver',
  name: 'Talking to Ver',
  tension: 0.4,

  getProse: (_state: GameState) => `
Ver is sitting at the stern, looking at the stars. Not searching them—
just looking. The way you might look at a painting you've seen a
hundred times but still enjoy.

She doesn't seem surprised when you join her. Just shifts slightly
to make room.

"Beautiful night," she says. "Wrong circumstances, but beautiful."

"You mentioned your husband taught you the stars."

"Mm." A soft sound. "He sailed when he was young. Before I knew him.
He'd tell me about the constellations when we couldn't sleep."

She points. "That's Polaris. The North Star. Everything else moves,
but that one stays fixed. And those—" she traces a pattern "—that's
Orion. The hunter."

"You know them well."

"After forty-three years of listening to the same stories? You'd
know them too." There's warmth in her voice. And something else.
A loss, carried lightly.
`,

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'ask_about_him',
      text: '"Tell me about him."',
      next: 'beat_2e2_ver_husband',
      effects: {
        arc: { 'ver.the_noticing': { partial: 0.25 } },
        relationship: { ver: { trust: 0.1 } },
      },
    },
    {
      id: 'enjoy_stars',
      text: "Just look at the stars with her.",
      next: 'beat_2_converge',
      effects: {
        relationship: { ver: { trust: 0.1 } },
        playerPattern: { gentle_vs_pressing: 0.1 },
      },
    },
  ],
};

// ============================================
// BEAT 2E2: VER HUSBAND
// ============================================

export const beat2e2VerHusband: Beat = {
  id: 'beat_2e2_ver_husband',
  name: 'Ver - Her Husband',
  tension: 0.35,

  getProse: (_state: GameState) => `
She's quiet for a moment. But it's a comfortable quiet—remembering,
not avoiding.

"Ahmet. He was—" She laughs softly. "He was impossible, really.
Stubborn. Loud when he was happy, which was most of the time.
Completely certain he was right about everything."

"Sounds like a handful."

"The best kind." She looks at the stars. "He died in the spring.
Quickly, thank God. He would have hated being slow about it."

"I'm sorry."

"Don't be. Forty-three years is a fortune. More than most people get."
She turns to look at you. "I'm not sad. I'm grateful. Does that make sense?"

It does and it doesn't. But you nod.

"I was going to see my daughter. Tell her things I should have told
her years ago. Make sure she knew—" She stops. "Make sure she knew
everything she needed to know."

The way she says it. Like she's tying up loose ends.
`,

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'notice_phrasing',
      text: '"Everything she needed to know. That sounds... final."',
      next: 'beat_2e3_ver_final',
      effects: {
        arc: { 'ver.the_noticing': { partial: 0.4 } },
      },
    },
    {
      id: 'respect_boundary',
      text: "Let the moment rest.",
      next: 'beat_2_converge',
      effects: {
        relationship: { ver: { trust: 0.1 } },
        playerPattern: { gentle_vs_pressing: 0.15 },
      },
    },
  ],
};

// ============================================
// BEAT 2E3: VER FINAL
// ============================================

export const beat2e3VerFinal: Beat = {
  id: 'beat_2e3_ver_final',
  name: 'Ver - Final',
  tension: 0.35,

  getProse: (_state: GameState) => `
She looks at you. Really looks. Like she's deciding something.

"You notice things," she says. "I appreciate that."

A pause. The boat rocks.

"At my age, everything is final. Every goodbye could be the last one.
Every trip might not have a return." She says it simply. Factually.
"I've made my peace with that."

"That sounds—"

"Don't say brave. I'm not brave. I'm just old." She almost smiles.
"Old enough to know that fighting the inevitable is exhausting.
Old enough to prefer spending my energy on things that matter."

She looks at you directly.

"The water rations. The decisions about who needs what. When those
conversations happen—I want you to know that I'm not the priority.
I've had my time. You three haven't."

"Ver—"

"I'm not asking for pity. I'm asking for respect." Her voice is gentle
but firm. "This is my choice. The last choice I have. Let me make it."
`,

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'accept_choice',
      text: '"I hear you. I won\'t make promises I can\'t keep."',
      next: 'beat_2_converge',
      effects: {
        arc: { 'ver.the_noticing': { trigger: true } },
        relationship: { ver: { trust: 0.15 } },
        storyState: { ver_told_player: true },
      },
    },
    {
      id: 'gentle_pushback',
      text: '"I hear you. But I\'m not ready to give up on you either."',
      next: 'beat_2_converge',
      effects: {
        arc: { 'ver.the_noticing': { trigger: true } },
        relationship: { ver: { trust: 0.1 } },
        storyState: { ver_told_player: true, player_contested_ver: true },
      },
    },
  ],
};

// ============================================
// BEAT 2 CONVERGENCE
// ============================================

export const beat2Converge: Beat = {
  id: 'beat_2_converge',
  name: 'End of Beat 2',
  tension: 0.4,

  getProse: (state: GameState) => {
    let prose = `
The moon is higher now. Two hours since the ship went down, maybe three.
The adrenaline has faded completely, replaced by the heavy tiredness
that comes after crisis.

Mira organizes watches—two on, two off, rotating every few hours.
No one argues. The structure is a relief after the chaos.
`;

    if (state.storyState['mira_admitted_running']) {
      prose += `
Mira catches your eye when no one else is looking. A nod. Acknowledgment
of something shared.
`;
    }

    if (nodeIs(state, 'selin.partial_truth', 'triggered')) {
      prose += `
Selin is different now. Still holding the bag, but not clutching it.
The weight is still there, but it's a weight he's chosen to let you see.
`;
    }

    if (state.storyState['ver_told_player']) {
      prose += `
Ver is watching the stars with that same settled calm. But now you know
what it means. What she's carrying beneath the peace.
`;
    }

    prose += `
The night stretches ahead. The stars wheel overhead.

You're learning who these people are. What they're carrying.
The question is what you'll do with that knowledge.
`;

    return prose;
  },

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'continue_to_beat3',
      text: "Let the second hour pass. The deep night is coming.",
      next: 'beat_3_deep_night',
      effects: {
        storyState: { beat_2_complete: true },
      },
    },
  ],
};

// ============================================
// EXPORT ALL BEAT 2 SCENES
// ============================================

export const beat2Beats: Beat[] = [
  beat2Settling,
  beat2aPractical,
  beat2bPersonal,
  beat2b2VerFollow,
  beat2b3MiraFollow,
  beat2b4SelinFollow,
  beat2cMira,
  beat2c2Destination,
  beat2dSelin,
  beat2d2SelinHer,
  beat2eVer,
  beat2e2VerHusband,
  beat2e3VerFinal,
  beat2Converge,
];
