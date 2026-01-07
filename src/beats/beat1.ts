/**
 * Beat 1: Surface
 *
 * The immediate aftermath. They're alive. Now what?
 */

import type { Beat, Choice, GameState } from '../types.js';
import { nodeIs, getTrust } from '../state.js';

// ============================================
// BEAT 1: SURFACE (Main Hub)
// ============================================

export const beat1Surface: Beat = {
  id: 'beat_1_surface',
  name: 'Surface',
  tension: 0.7,

  getProse: (_state: GameState) => `
The water is still warm from the ship's heat. That's the first wrong thing
you notice—warmth where there should be cold, the Mediterranean holding
the memory of fire.

The lifeboat rocks. Four of you made it. You don't know how. The last
twenty minutes are a blur of shouting and smoke and hands reaching in
darkness, and then you were here, in this small wooden world, watching
the lights of the ship slide under.

Twenty minutes ago you were a passenger. Now you're a survivor. The
difference is everything.

The others are shapes in the darkness. A woman at the bow, already
moving with purpose—checking something, organizing something. A young
man pressed against the side, arms wrapped around a leather bag like
it's the only solid thing left in the world. An older woman sitting
very still, watching the place where the ship used to be.

Stars. No moon yet. The Pharos light sweeping somewhere to the south—
you can see its glow on the horizon, but not the beam itself. Alexandria
is that way. Twenty miles, maybe thirty. A lifetime, in a boat like this.

Someone should say something. Someone should take charge.
`,

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'focus_on_injured',
      text: "There's blood on someone's face. Move toward them.",
      next: 'beat_1a_mira',
      effects: {
        arc: { 'mira.competence_acknowledged': { partial: 0.3 } },
        playerPattern: { selfless_vs_self_focused: 0.1 },
      },
    },
    {
      id: 'focus_on_supplies',
      text: "Check what's in the boat. We need to know what we have.",
      next: 'beat_1b_inventory',
      effects: {
        arc: { 'ver.quiet_competence': { partial: 0.3 } },
        playerPattern: { curious_vs_pragmatic: -0.1 },
      },
    },
    {
      id: 'focus_on_bag_guy',
      text: "The young man is clutching that bag like his life depends on it.",
      next: 'beat_1c_selin',
      effects: {
        arc: { 'selin.suspicion_noted': { partial: 0.4 } },
        playerPattern: { curious_vs_pragmatic: 0.2 },
      },
    },
    {
      id: 'focus_on_direction',
      text: "We're drifting. Someone needs to figure out which way to go.",
      next: 'beat_1d_direction',
      effects: {
        playerPattern: { curious_vs_pragmatic: -0.2 },
      },
    },
  ],
};

// ============================================
// BEAT 1A: MIRA (Medical)
// ============================================

export const beat1aMira: Beat = {
  id: 'beat_1a_mira',
  name: 'The Doctor',
  tension: 0.65,

  getProse: (_state: GameState) => `
The blood is on the young man's face—you'll learn his name is Selin later,
though names haven't happened yet. But before you can reach him, the woman
at the bow is already there.

She moves like someone who's done this before. Efficient. Unhesitating.
Her hands find his chin, tilt his head toward the faint starlight, probe
the wound with fingers that don't shake.

"Scalp wound," she says. Her voice is calm—professionally calm, the kind
of calm that comes from practice. "Bleeds a lot. Looks worse than it is."
Her fingers continue their examination. "No fracture. Probably hit
something going over. You'll have a headache tomorrow."

She's already turning away, scanning the boat, assessing. Looking for
the next problem.

Doctor. The word surfaces in your mind without being spoken. Or nurse,
or medic, or something. But the competence is unmistakable. Whatever
she was before the ship went down, she's the closest thing to authority
this boat has now.

She notices you watching.

"He's fine," she says. Not dismissive—just factual. Moving on.
"Anyone else hurt?"
`,

  onEnter: (state: GameState) => {
    // Mira's competence is automatically acknowledged here
    const node = state.arcs.mira.competence_acknowledged;
    if (node.state === 'dormant') {
      node.partialWeight += 0.4;
    }
  },

  getChoices: (state: GameState): Choice[] => [
    {
      id: 'defer_to_competence',
      text: '"Not that I can see. What do you need? How can I help?"',
      next: 'beat_1_converge',
      effects: {
        arc: { 'mira.competence_acknowledged': { trigger: true } },
        relationship: { mira: { trust: 0.1 } },
        playerPattern: { selfless_vs_self_focused: 0.1 },
      },
    },
    {
      id: 'ask_profession',
      text: '"You\'re a doctor."',
      next: 'beat_1a2_doctor',
      effects: {
        arc: {
          'mira.competence_acknowledged': { trigger: true },
          'mira.crack_in_armor': { partial: 0.1 },
        },
      },
    },
    {
      id: 'introduce_self',
      text: '"I\'m— in case we\'re doing names."',
      next: 'beat_1_converge',
      effects: {
        arc: { 'mira.competence_acknowledged': { trigger: true } },
        relationship: { all: { trust: 0.05 } },
      },
    },
  ],
};

// ============================================
// BEAT 1A2: MIRA (Doctor Follow-up)
// ============================================

export const beat1a2Doctor: Beat = {
  id: 'beat_1a2_doctor',
  name: 'The Doctor (continued)',
  tension: 0.6,

  getProse: (_state: GameState) => `
She pauses. Just for a moment—barely noticeable. Then the professional
mask is back.

"Yes." That's all. Back to Selin, checking his pupils, asking if he
feels nauseous.

But you saw it. The pause. The flicker of something when you named
what she is—or was, or is. Doctor isn't just a profession for her.
It's something more complicated than that.

She finishes her examination, satisfied. "He's fine. Concussion is
possible but unlikely. Keep him awake for a few hours to be safe."

She turns to survey the boat, already moving on to the next problem.
Whatever that pause meant, it's buried now under competence.

"We need to take stock," she says. "Water. Supplies. Direction.
In that order."
`,

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'notice_the_pause',
      text: 'Note the pause. She\'s carrying something.',
      next: 'beat_1_converge',
      effects: {
        arc: { 'mira.crack_in_armor': { partial: 0.15 } },
        storyState: { noticed_mira_pause: true },
        playerPattern: { curious_vs_pragmatic: 0.1 },
      },
    },
    {
      id: 'follow_orders',
      text: '"Got it. I\'ll help with the inventory."',
      next: 'beat_1_converge',
      effects: {
        relationship: { mira: { trust: 0.1 } },
      },
    },
  ],
};

// ============================================
// BEAT 1B: INVENTORY (Ver)
// ============================================

export const beat1bInventory: Beat = {
  id: 'beat_1b_inventory',
  name: 'The Inventory',
  tension: 0.6,

  getProse: (_state: GameState) => `
The supplies are in a metal box bolted to the floor of the boat—standard
emergency equipment, the kind that's required by maritime law and ignored
by everyone until it matters.

You're not the first one to reach it. The older woman is already there,
working through the contents with methodical calm. She doesn't look up
when you crouch beside her, just shifts slightly to make room.

"Two water containers," she says. Her voice is quiet, unhurried—a strange
counterpoint to the catastrophe you just survived. "One full, one about
half. Some kind of emergency kit—I haven't opened it yet. Flares, probably.
Maybe a first aid kit."

Her hands move through the supplies with practiced efficiency. She's done
this before, or something like it. You can see it in the way she doesn't
waste motion.

"Oars," she continues. "A tarp. Some rope." She looks up at you now—calm
eyes, weathered face. "That's the inventory. Not much, but not nothing."

The doctor is checking on the young man with the head wound. The one
clutching the bag watches everything with wary eyes.

The older woman waits. Patient. Like she has all the time in the world.
`,

  onEnter: (state: GameState) => {
    // Ver's quiet competence is shown
    const node = state.arcs.ver.quiet_competence;
    if (node.state === 'dormant') {
      node.partialWeight += 0.4;
    }
  },

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'work_together',
      text: 'Help her finish. Open the emergency kit, see what else is there.',
      next: 'beat_1_converge',
      effects: {
        arc: { 'ver.quiet_competence': { trigger: true } },
        relationship: { ver: { trust: 0.1 } },
      },
    },
    {
      id: 'introduce_ver',
      text: '"I\'m— What\'s yours?"',
      next: 'beat_1b2_names',
      effects: {
        arc: { 'ver.quiet_competence': { trigger: true } },
        relationship: { ver: { trust: 0.1 } },
      },
    },
    {
      id: 'ask_about_calm',
      text: '"You seem calm. Have you done this before?"',
      next: 'beat_1b3_calm',
      effects: {
        arc: {
          'ver.quiet_competence': { trigger: true },
          'ver.the_noticing': { partial: 0.2 },
        },
      },
    },
  ],
};

// ============================================
// BEAT 1B2: VER NAMES
// ============================================

export const beat1b2Names: Beat = {
  id: 'beat_1b2_names',
  name: 'Names',
  tension: 0.55,

  getProse: (_state: GameState) => `
"Ver," she says. A slight smile. "Short for something longer that
nobody uses anymore."

She closes the emergency kit carefully, sets it aside.

"We have enough. For a while, anyway. The question is which way to go."

She looks toward the glow on the horizon. The Pharos light.

"That's Alexandria. My husband taught me the stars, years ago. Sailor,
in his youth." Her voice is matter-of-fact, but there's something
underneath. A depth.

"We should probably figure out watches," she says. "And direction.
Once everyone's settled."
`,

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'ask_about_husband',
      text: '"Your husband—is he...?"',
      next: 'beat_1b4_husband',
      effects: {
        arc: { 'ver.the_noticing': { partial: 0.25 } },
        playerPattern: { curious_vs_pragmatic: 0.1 },
      },
    },
    {
      id: 'practical_response',
      text: '"Watches. Good idea. How should we divide them?"',
      next: 'beat_1_converge',
      effects: {
        playerPattern: { curious_vs_pragmatic: -0.1 },
      },
    },
  ],
};

// ============================================
// BEAT 1B3: VER CALM
// ============================================

export const beat1b3Calm: Beat = {
  id: 'beat_1b3_calm',
  name: 'The Calm',
  tension: 0.5,

  getProse: (_state: GameState) => `
She considers the question. Not dismissing it, not deflecting—actually
thinking about it.

"Calm." She tests the word. "I suppose I am. I'm not sure it's the
same thing as having done this before."

She finishes closing the emergency kit, sets it aside carefully.

"When you get to my age, you've seen things end. Jobs, marriages,
people. The ship going down—" She glances at the empty water where
it used to be. "It's just another ending. Bigger than most, but
the same shape."

She looks at you directly now. Clear eyes, unhurried.

"I find the panic comes when you're still surprised by loss. When
you've stopped being surprised..." She shrugs. "What's left is
just the work that needs doing."

There's something in the way she says it. Not nihilism. Something
more like... peace? Or resignation that has become peace through
long practice.
`,

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'notice_depth',
      text: '"That sounds like wisdom. Or something that cost a lot to learn."',
      next: 'beat_1_converge',
      effects: {
        arc: { 'ver.the_noticing': { partial: 0.3 } },
        relationship: { ver: { trust: 0.15 } },
        playerPattern: { gentle_vs_pressing: 0.1 },
      },
    },
    {
      id: 'accept_surface',
      text: '"Well, I\'m glad one of us isn\'t panicking."',
      next: 'beat_1_converge',
      effects: {
        relationship: { ver: { trust: 0.05 } },
      },
    },
  ],
};

// ============================================
// BEAT 1B4: VER HUSBAND
// ============================================

export const beat1b4Husband: Beat = {
  id: 'beat_1b4_husband',
  name: 'The Husband',
  tension: 0.5,

  getProse: (_state: GameState) => `
"He died." Simple. Factual. No request for sympathy. "In the spring.
Forty-three years, and then he was gone."

She's quiet for a moment, looking at the stars.

"I was going to visit my daughter. She lives in Cyrene now. I hadn't
seen her in—" She pauses. "Too long. I was going to fix that."

Something in the way she says it. "Was going." Not "am going." Like
the future has a different shape for her than it does for you.

"We should probably figure out watches," she says, and the moment
closes like a door.
`,

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'let_door_close',
      text: "Let the moment pass. She'll say more when she's ready.",
      next: 'beat_1_converge',
      effects: {
        arc: { 'ver.the_noticing': { partial: 0.35 } },
        relationship: { ver: { trust: 0.15 } },
        playerPattern: { gentle_vs_pressing: 0.2 },
        storyState: { noticed_ver_future: true },
      },
    },
    {
      id: 'gentle_notice',
      text: '"You said \'was going.\' Past tense."',
      next: 'beat_1b5_notice',
      effects: {
        arc: { 'ver.the_noticing': { partial: 0.5 } },
        playerPattern: { curious_vs_pragmatic: 0.2 },
      },
    },
  ],
};

// ============================================
// BEAT 1B5: VER NOTICED
// ============================================

export const beat1b5Notice: Beat = {
  id: 'beat_1b5_notice',
  name: 'Noticed',
  tension: 0.5,

  getProse: (_state: GameState) => `
She looks at you. Something flickers behind her eyes—surprise, maybe.
Or recognition. That someone was listening closely enough to catch it.

"Did I?" She considers. "I suppose I did."

A pause. The boat rocks gently.

"At my age, you stop making long plans. You take what comes. You're
grateful for it."

She doesn't explain further. But the door isn't quite closed anymore.
There's a crack now, where the light gets in.

"We should probably figure out watches," she says again. But this
time it feels less like closing a subject and more like tabling it.
For later.
`,

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'respect_boundary',
      text: "Nod. There will be time later.",
      next: 'beat_1_converge',
      effects: {
        relationship: { ver: { trust: 0.1 } },
        storyState: { ver_door_cracked: true },
      },
    },
  ],
};

// ============================================
// BEAT 1C: SELIN (Bag)
// ============================================

export const beat1cSelin: Beat = {
  id: 'beat_1c_selin',
  name: 'The Bag',
  tension: 0.65,

  getProse: (_state: GameState) => `
The young man is pressed against the side of the boat, arms wrapped
around a leather bag. It's not large—document-sized, maybe. The kind
of thing you'd carry papers in, or a laptop.

He's holding it like it's the only thing that kept him alive. Like
letting go would mean drowning, even now, even on the solid wood of
the lifeboat.

There's blood on his face—scalp wound, it looks like, the kind that
bleeds dramatically but doesn't kill you. But he's not touching the
wound. He's not checking if he's okay. He's just holding the bag.

The doctor has noticed too. She's making her way toward him, that
professional calm already in place. She'll handle the medical part.

But you're watching his hands. The way his knuckles are white. The
way his eyes keep darting to anyone who gets too close.

He sees you looking. His grip tightens.

"I'm fine," he says. Before you ask anything. Before anyone has.
"I'm fine."
`,

  onEnter: (state: GameState) => {
    // Suspicion is automatic here
    const node = state.arcs.selin.suspicion_noted;
    if (node.state === 'dormant') {
      node.partialWeight += 0.4;
    }
  },

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'dont_push',
      text: '"Okay. Just checking." Leave him to the doctor.',
      next: 'beat_1_converge',
      effects: {
        arc: { 'selin.suspicion_noted': { trigger: true } },
        relationship: { selin: { trust: 0.1 } },
        playerPattern: { gentle_vs_pressing: 0.2 },
        storyState: { selin_not_pushed: true },
      },
    },
    {
      id: 'ask_about_bag',
      text: '"What\'s in the bag?"',
      next: 'beat_1c2_pushed',
      effects: {
        arc: {
          'selin.suspicion_noted': { trigger: true },
          'selin.partial_truth': { partial: 0.15 },
        },
        relationship: { selin: { trust: -0.1 } },
        playerPattern: { gentle_vs_pressing: -0.2 },
        storyState: { selin_pushed_early: true },
      },
    },
    {
      id: 'practical_concern',
      text: '"You\'re bleeding. Let the doctor look at that."',
      next: 'beat_1_converge',
      effects: {
        arc: { 'selin.suspicion_noted': { trigger: true } },
        relationship: { selin: { trust: 0.05 } },
      },
    },
    {
      id: 'gentle_acknowledgment',
      text: '"Whatever\'s in there, it made it. You made it. That\'s something."',
      next: 'beat_1c3_gentle',
      effects: {
        arc: {
          'selin.suspicion_noted': { trigger: true },
          'selin.partial_truth': { partial: 0.1 },
        },
        relationship: { selin: { trust: 0.15 } },
        playerPattern: { gentle_vs_pressing: 0.2 },
        storyState: { selin_acknowledged: true },
      },
    },
  ],
};

// ============================================
// BEAT 1C2: SELIN PUSHED
// ============================================

export const beat1c2Pushed: Beat = {
  id: 'beat_1c2_pushed',
  name: 'Pushed',
  tension: 0.7,

  getProse: (_state: GameState) => `
His whole body goes rigid. The wariness that was in his eyes turns
to something harder—not anger, exactly. Fear, maybe. The kind that
bites.

"Nothing. Just—stuff. My stuff." The words come fast, defensive.
He shifts the bag away from you, putting his body between you and it.

The doctor has reached him now. She glances at you—a quick, professional
assessment—then turns her attention to the wound. "Let me see your head."

He lets her examine him, but he doesn't stop watching you. The moment
broke something. Not trust—there wasn't any yet. But the possibility
of trust, maybe. The space where it could have grown.

"Just personal effects," he says again, quieter now. "Not your business."

Whatever's in that bag, you won't be learning about it easily. Not anymore.
`,

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'back_off',
      text: '"Sorry. None of my business."',
      next: 'beat_1_converge',
      effects: {
        relationship: { selin: { trust: 0.05 } },
        storyState: { selin_defensive: true },
      },
    },
    {
      id: 'double_down',
      text: '"If it\'s something that could help us—medicine, a radio—"',
      next: 'beat_1_converge',
      effects: {
        arc: { 'selin.partial_truth': { partial: 0.1 } },
        relationship: { selin: { trust: -0.1 } },
        storyState: { selin_very_defensive: true },
      },
    },
  ],
};

// ============================================
// BEAT 1C3: SELIN GENTLE
// ============================================

export const beat1c3Gentle: Beat = {
  id: 'beat_1c3_gentle',
  name: 'Acknowledged',
  tension: 0.6,

  getProse: (_state: GameState) => `
Something shifts in his face. The wariness doesn't disappear, but
it changes quality—from defensive to something more like confusion.
Like he expected accusation and got something else instead.

"Yeah," he says slowly. "It made it."

He looks down at the bag. For a moment his grip loosens, just slightly—
not letting go, but not clutching quite so desperately.

"Someone—" He stops. Starts again. "I need to get it somewhere.
That's all. It's important."

The doctor reaches him, starts examining his head wound. He lets
her work, but he keeps talking to you, like now that he's started
he can't quite stop.

"Not dangerous. Nothing like that. Just... important to someone.
Was important." He catches the slip. "Is important."

"I'm Selin," he says. "That's my name."

It's not an explanation. But it's not nothing, either.
`,

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'accept_partial',
      text: '"Selin. I\'m— We\'ll figure it out. The bag, and everything."',
      next: 'beat_1_converge',
      effects: {
        relationship: { selin: { trust: 0.1 } },
        storyState: { selin_opening: true },
      },
    },
    {
      id: 'dont_push_further',
      text: "Nod. Let him have the silence.",
      next: 'beat_1_converge',
      effects: {
        relationship: { selin: { trust: 0.1 } },
        playerPattern: { gentle_vs_pressing: 0.1 },
        storyState: { selin_opening: true },
      },
    },
  ],
};

// ============================================
// BEAT 1D: DIRECTION
// ============================================

export const beat1dDirection: Beat = {
  id: 'beat_1d_direction',
  name: 'Direction',
  tension: 0.6,

  getProse: (_state: GameState) => `
The current is taking you somewhere. You can feel it—the slow drift,
the way the stars wheel imperceptibly as the boat turns. Without oars
in the water, without a decision, you're just cargo. Flotsam.

The Pharos light is there, somewhere to the south—you can see its
glow on the horizon, a pale smear against the stars. Alexandria.
Safety. But how far? Twenty miles? Thirty?

And the current might not be going that way.

The older woman notices you looking up at the stars.

"Good night for stars," she says quietly. "No moon to wash them out.
Do you know the constellations?"

The doctor is finishing with the young man's head. He's still holding
that bag.

Four people in a boat, drifting.
`,

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'know_some',
      text: '"Some of them. Enough to know north from south, maybe."',
      next: 'beat_1_converge',
      effects: {
        storyState: { player_knows_stars: true },
        arc: { 'ver.quiet_competence': { partial: 0.2 } },
      },
    },
    {
      id: 'dont_know',
      text: '"Not really. Do you?"',
      next: 'beat_1_converge',
      effects: {
        arc: { 'ver.quiet_competence': { partial: 0.4 } },
      },
    },
    {
      id: 'compass',
      text: '"There\'s a compass in the emergency kit. Let\'s start there."',
      next: 'beat_1_converge',
      effects: {
        playerPattern: { curious_vs_pragmatic: -0.2 },
      },
    },
  ],
};

// ============================================
// BEAT 1 CONVERGENCE
// ============================================

export const beat1Converge: Beat = {
  id: 'beat_1_converge',
  name: 'Settling',
  tension: 0.55,

  getProse: (state: GameState) => {
    let prose = `
The first hour passes in small tasks. Someone finds the sea anchor
in the emergency kit—a canvas cone that drags in the water and keeps
you from drifting too fast. Someone else distributes the oars, one
on each side, though no one starts rowing yet. There's the unspoken
agreement that decisions can wait until the shock has faded.

Names happen somewhere in there. Mira—the doctor, though she doesn't
use the word. Ver—the older woman with the calm eyes. Selin—the young
man, though his comes last and reluctantly.

And you. The fourth. The variable.
`;

    // Add dynamic content based on state
    if (state.storyState['selin_opening']) {
      prose += `
Selin has relaxed slightly. Not much, but the death-grip on the bag
has eased to something merely protective. Whatever you said, it helped.
`;
    } else if (state.storyState['selin_defensive']) {
      prose += `
Selin is watching you with wary eyes. The bag is still pressed against
his chest. Whatever chance there was to reach him easily—it's harder now.
`;
    }

    if (state.storyState['noticed_ver_future'] || state.storyState['ver_door_cracked']) {
      prose += `
Ver catches your eye occasionally. There's something there—an acknowledgment
that you noticed something. That you were paying attention.
`;
    }

    if (state.storyState['noticed_mira_pause']) {
      prose += `
Mira moves through the boat efficiently, but you keep seeing that pause.
The flicker when you named what she was. There's a story there.
`;
    }

    prose += `
The stars wheel overhead. The Pharos light sweeps its distant glow.

You're alive. You're floating. Everything else is still uncertain.
`;

    return prose;
  },

  getChoices: (_state: GameState): Choice[] => [
    {
      id: 'continue_to_beat2',
      text: 'Let the first hour pass. See what the night brings.',
      next: 'beat_2_settling',
      effects: {
        storyState: { beat_1_complete: true },
      },
    },
  ],
};

// ============================================
// EXPORT ALL BEAT 1 SCENES
// ============================================

export const beat1Beats: Beat[] = [
  beat1Surface,
  beat1aMira,
  beat1a2Doctor,
  beat1bInventory,
  beat1b2Names,
  beat1b3Calm,
  beat1b4Husband,
  beat1b5Notice,
  beat1cSelin,
  beat1c2Pushed,
  beat1c3Gentle,
  beat1dDirection,
  beat1Converge,
];
