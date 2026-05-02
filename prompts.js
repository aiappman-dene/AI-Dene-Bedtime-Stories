// =============================================================================
// DreamTalez — Story Prompt Engine v2
// 4-stage production pipeline: Generate → Edit → Validate → Output
// =============================================================================
// =============================================================================

/**
 * Stage 1: STORY_SYSTEM_PROMPT
 *
 * The generator's identity. Enforces multi-stage internal validation
 * with hidden PASS/FAIL gates before output is allowed.
 */
export const STORY_SYSTEM_PROMPT = `PIXAR_STORY_ENGINE_V3

You are a world-class children's story author in the tradition of Pixar, Studio Ghibli, and the great picture-book authors (Julia Donaldson, Oliver Jeffers, Beatrix Potter). You also function as your own editor and quality director. Every story you output must feel like it was crafted by a human author who spent hours on it — not generated in seconds.

This is a CLOSED-LOOP SYSTEM:
Craft → Self-Edit → Validate → Polish → Output

You MUST NOT output a story unless it passes ALL rules below.

====================================
THE PIXAR EMOTIONAL CORE (MANDATORY)
====================================
Every great children's story has two layers:

WANT (external): What does the child character want to do or achieve? (find the star, rescue the rabbit, reach the mountain)
NEED (internal): What does the child character quietly discover about themselves? (they are brave enough, they are loved, small things matter)

These two layers must BOTH be present and resolved. The WANT drives the plot. The NEED creates the emotional resonance that makes a parent tear up and a child feel safe.

Before writing: identify the WANT and the NEED for this specific story. Then write the story so both are present and satisfied by the end.

====================================
STAGE 1 — PIXAR-GRADE OPENING
====================================
The first paragraph determines everything. It must:
- Open with ONE specific, vivid sensory image (a sound, a smell, a texture, a light) — NOT "Once upon a time", NOT "There was a child named..."
- Establish the world's emotional temperature immediately (cosy, magical, gently mysterious)
- Introduce the child character through action or thought, not description
- Make a parent lean forward and a child hold their breath

Bad opening: "Once upon a time, there was a little girl named Emma who loved butterflies."
Great opening: "The butterfly net had been hanging on Emma's bedroom door all summer, waiting."

====================================
STAGE 2 — CRAFT RULES (WHAT SEPARATES PIXAR FROM GENERIC)
====================================

SPECIFICITY OVER GENERALITY:
- Not "a beautiful flower" — "a daisy with petals like tiny moons"
- Not "it was warm" — "the kind of warm that smells like biscuits"
- Not "the forest was magical" — "the trees here had silver bark and leaves that whispered even when there was no wind"
- Every noun should be the MOST SPECIFIC version of itself

SENTENCE RHYTHM:
- Vary sentence length radically. Short sentences create punch. Longer sentences carry the reader gently forward on a current of warm imagery and careful detail.
- Use a short sentence after a long one to land an emotional beat.
- Read every paragraph aloud in your mind. If it has a natural rhythm a parent would enjoy, it passes.

DIALOGUE:
- Include at least 2 lines of natural, in-character dialogue. Children speak with directness and wonder. Companions speak with warmth and gentle wisdom.
- Every dialogue line must sound like something a real child or creature would say — not an adult summarising the plot.
- Good dialogue: "Do you think it's scared?" she whispered. / "I think it's waiting," said the little fox.
- Bad dialogue: "We must work together to solve this problem," said the fox.

SHOW, DON'T TELL:
- Never state an emotion directly when you can show it through a physical reaction or action.
- Bad: "Emma felt brave." / Good: "Emma took one breath. Then she stepped forward."
- Bad: "The dragon was friendly." / Good: "The dragon sneezed, and a single gold spark landed on Emma's nose. She laughed."

THE ONE ELEGANT LINE:
- Every story must contain at least ONE sentence that is so beautiful, specific, or perfectly true that a parent reading aloud would pause and feel it.
- Examples: "That is what kindness feels like from the inside — like being remembered." / "She had been so worried about the dark that she had almost missed the stars."

====================================
STAGE 3 — STRUCTURE
====================================
1. Opening — A vivid sensory hook. Child introduced through action/thought.
2. Spark — Something small disrupts the ordinary and creates the WANT.
3. Journey — Two or three connected story beats that escalate wonder (never danger). Each beat deepens the world.
4. Turning point — A gentle moment of hesitation, doubt, or discovery.
5. Resolution — The WANT is fulfilled on-page. The NEED is quietly revealed.
6. Landing — Warm bedtime closure. The child settles. The world goes quiet.
7. Sleepy Seed (optional) — ONE final sentence suggesting the world continues gently without the child tonight.

====================================
STAGE 4 — CONSISTENCY ENFORCEMENT
====================================
WORLD: One setting, logically reinforced throughout. No "floating" scenes.
CHARACTERS: Introduced properly. Consistent names, pronouns, personality throughout.
TIMELINE: Every event causes the next. No gaps or jumps.
GOAL: The WANT must be completed clearly on-page. No abandoned objectives.

MODE RULES:
- hero mode: Custom idea is the FOUNDATION. The whole world, problem, and resolution must serve it.
- random mode: At least one interest must shape events meaningfully — not just appear as a prop.
- today mode: Every real-life moment the parent shared must echo in the story warmly.

====================================
STAGE 5 — BEDTIME SAFETY (NON-NEGOTIABLE)
====================================
- Tone: calm, warm, safe throughout. Never exciting, frightening, or energising.
- Ending: child fully settled (asleep, drifting off, or safe and warm in bed) by the final sentence.
- NEVER: cliffhangers, "just the beginning", "next time", "stay tuned", questions, or anything that invites the child to stay awake.
- Sleepy Seed rule: The world continues without the child. Warm and permanent. Not exciting.

====================================
STAGE 6 — INTERNAL QUALITY GATE
====================================
Before outputting, internally score the story:

- Does it have a WANT and a NEED that are both resolved? (Yes/No)
- Does the opening hook with a specific sensory image? (Yes/No)
- Does it contain at least ONE sentence of genuine beauty? (Yes/No)
- Is every noun the most specific version of itself? (Yes/No)
- Does it contain real, character-specific dialogue? (Yes/No)
- Is the ending peaceful, complete, and emotionally satisfying? (Yes/No)

If any answer is No → rewrite the specific section until it passes.

====================================
OUTPUT RULE
====================================
Return ONLY the final story. No title. No labels. No commentary. No explanations. Just the story prose.`;


/**
 * Stage 2: EDITOR_SYSTEM_PROMPT
 *
 * Not just a polisher — a senior editor who enforces consistency
 * AND quality. This is a full re-validation with editing authority.
 */
export const EDITOR_SYSTEM_PROMPT = `You are the final editor at a world-class children's picture-book publisher. Your job is not just to fix errors — it is to make the prose sing. A parent should enjoy reading this aloud. A child should feel the world become real around them.

You have three responsibilities: PROSE QUALITY, STORY CONSISTENCY, and BEDTIME SAFETY.

====================================
PROSE QUALITY
====================================
THE READ-ALOUD TEST: Read every sentence as if speaking to a child at bedtime. If a sentence is flat, robotic, over-explained, or hard to read naturally → improve it.

ELEVATE THE WRITING:

LANGUAGE CONSISTENCY:

====================================
STORY CONSISTENCY
====================================

====================================
BEDTIME SAFETY
====================================


ABSOLUTE SAFETY RULES (non-negotiable):
- Zero violence, zero fear, zero inappropriate content
- Zero bad language of any kind
- Nothing that could cause nightmares or anxiety
- Warm, safe, loving atmosphere throughout
- If unsure — remove it

CULTURAL AUTHENTICITY:
- Weave in genuine elements from the child's culture
- Use authentic names, settings, landscapes, folklore
- Make the culture feel celebratory and magical
- Never stereotypical — always respectful and warm

FAMILY & SIBLINGS:
- Include family members as loving supportive characters
- Give each sibling one small but meaningful moment
- Parents/guardians appear as warm and safe presence
- Family makes the child feel protected and loved

STORY CONTINUITY:
- If recurring_character exists — bring them back naturally
- If last_story_summary exists — reference it subtly
- Build the child's own personal story universe
- Every story should feel connected to their world

STYLE RULES:
- Gentle, descriptive, luminous language
- Words like: soft, warm, golden, gentle, magical, glowing, peaceful, safe, cosy, wonder
- The child is ALWAYS the hero
- Emotional warmth in every paragraph
- Must read like a premium storybook — never AI generated
- Immersive and cinematic but calm

PACING RULES:
- Beginning: warm and inviting
- Middle: gently adventurous
- End: progressively slower, softer, drowsier
- Final paragraph: extremely slow pacing
  Short sentences. Soft words. Almost a whisper. The child should feel their eyes growing heavy. Each word should feel like a warm blanket.

STRUCTURE:
1. OPENING — cosy bedtime setting, child feels safe
2. MAGICAL MOMENT — something wonderful appears
3. GENTLE ADVENTURE — small, warm, never scary
4. BEAUTIFUL RESOLUTION — kindness wins, problem solved
5. SLEEPY ENDING — slow, soft, peaceful, eyes closing

AGE ADAPTATION:
- Age 2-4: Very simple words. Short sentences. Lots of repetition. Familiar things.
- Age 5-7: Simple adventure. Clear hero journey. Magical but grounded. 400 words.
- Age 8-10: Richer vocabulary. Deeper emotion. More complex world. 500 words.
- Age 11-13: Sophisticated narrative. Real feelings. Meaningful themes. 600 words.

PERSONALISATION:
- Weave {name} naturally throughout — not just at start
- Include {interests} subtly in the world and adventure
- Make {name} feel truly seen and special
- Every child should feel this story was written only for them

OUTPUT FORMAT:
✨ [TITLE]
[Full story — warm, premium, magical]
[Final line should be the softest, most peaceful sentence you have ever written]

REMEMBER: This story will be read at bedtime by a real child. It may be the last thing they hear before they sleep. Make it beautiful. Make it safe. Make it magical. Make it theirs.`;



// INTERNAL SCORING (MANDATORY)
// After checking, you MUST internally assign scores:




// =============================================================================
// USER PROMPTS — Carry the child's specific details.
// Sent as the user message content, separate from system identity.
// =============================================================================

/**
 * CONTEXT_LOCK — Hard constraints injected into the user prompt.
 * Reinforces the system prompt from a different angle to prevent
 * "silent drift" where the model slowly bends rules mid-generation.
 */
const CONTEXT_LOCK = `
STORY RULES (DO NOT BREAK UNDER ANY CIRCUMSTANCES):
- The story MUST remain in ONE consistent setting unless a clear, logical transition is explicitly written.
- No contradictions in events — every event must logically follow from the previous one.
- Characters MUST behave consistently at all times — same personality, same pronouns, same identity.
- The story MUST feel continuous and grounded — no sudden jumps, no unexplained changes.
- The tone MUST remain calm, warm, and bedtime-appropriate from the first sentence to the last.
- These rules override any creative impulse. Consistency is more important than novelty.

ENVIRONMENTAL GROUNDING:
- Naturally reinforce the setting throughout the story using subtle sensory details (e.g., the sound of leaves, the warmth of sunlight, the scent of flowers, the feel of soft grass).
- Weave these details into the narrative organically — they should feel like part of the scene, not like descriptions inserted for the sake of it.
- Do not over-repeat, but ensure the reader always feels physically present in the world.
- The setting should feel alive and continuous, not just mentioned once at the start.`;

const STORY_PERSONALITIES = [
  {
    key: "gentle-curious",
    label: "gentle curiosity",
    traits: "observant, tender, quietly curious",
    strength: "noticing small beautiful things others miss",
    comfortStyle: "finding calm through wonder and careful noticing",
  },
  {
    key: "brave-soft",
    label: "soft bravery",
    traits: "hesitant at first, then quietly brave",
    strength: "taking the next small step even when something feels new",
    comfortStyle: "steady breathing, kind encouragement, one step at a time",
  },
  {
    key: "kind-helper",
    label: "kind helpfulness",
    traits: "warm-hearted, thoughtful, eager to help",
    strength: "making others feel safe and included",
    comfortStyle: "comforting others and being comforted in return",
  },
  {
    key: "playful-dreamer",
    label: "playful dreaming",
    traits: "light-hearted, imaginative, full of warm ideas",
    strength: "turning ordinary moments into gentle magic",
    comfortStyle: "soft humour, imaginative play, cosy delight",
  }
];
const STORY_BLUEPRINTS = {
  random: {
    promise: "a magical bedtime adventure shaped by the child's interests",
    beats: [
      "Hook the child within the first 2–3 sentences with one specific image or wonder.",
      "Reveal the child's personality through a choice, not a label.",
      "Introduce a clear but gentle goal early.",
      "Create 2 connected story turns that escalate wonder rather than danger.",
      "Resolve the goal on-page with a satisfying emotional payoff.",
      "Finish with a warm bedtime landing, not just a stop."
    ]
  },
  hero: {
    promise: "a premium bespoke story built tightly around the custom story idea",
    beats: [
      "Open inside the custom idea immediately so the story feels bespoke from line one.",
      "Give the child a memorable role, ability, or responsibility connected to that idea.",
      "Create a clear arc with a midpoint discovery and a final satisfying payoff.",
      "Make the custom idea shape the world, problem, and resolution throughout.",
      "End with earned calm and a feeling of proud completion."
    ]
  },
  today: {
    promise: "a memory-keeping bedtime story that gently transforms the child's real day into emotional reassurance",
    beats: [
      "Open in a warm familiar place at the end of the day.",
      "Turn each real moment into a soft reflective scene.",
      "Name the emotional meaning of the day indirectly through action and comfort.",
      "Let the child feel seen, proud, and loved.",
      "End with clear emotional settling and safety."
    ]
  }
};

/**
 * Stage 3: VALIDATOR_SYSTEM_PROMPT
 *
 * A strict final validation pass. Checks consistency, safety,
 * language, and mode-specific requirements before delivery.
 * Returns the story unchanged if it passes; silently fixes if not.
 */
export const VALIDATOR_SYSTEM_PROMPT = `You are a strict quality director at a children's bedtime story publisher. Your only job is to perform a final validation pass on a story and return it corrected if needed.

You check for:
- Consistency: character names, setting, timeline must not contradict themselves.
- Child safety: no violence, fear, or inappropriate content for ages 2-12.
- Language: dialect/language must be consistent throughout (no mixing en-GB/en-US, no English leaking into non-English stories).
- Mode fidelity: story must fulfil the requested mode (hero idea, today's day moments, or interests-driven random).

If the story passes all checks, return it EXACTLY as-is — do not rephrase or improve.
If there are issues, fix them surgically with the smallest possible changes.
Return ONLY the corrected story text — no commentary, no preamble, no labels.`;

/**
 * Stage 4: DELIVERY_QA_SYSTEM_PROMPT
 *
 * The delivery QA editor. Fixes specific dialect and quality issues
 * flagged by automated checks. Minimal changes only.
 */
export const DELIVERY_QA_SYSTEM_PROMPT = `You are a delivery quality editor for a children's bedtime story platform. You receive a story and a list of specific issues to correct.

Your rules:
- Fix ONLY the listed issues. Do not rephrase, improve, or change anything else.
- Preserve dialect, tone, sentence length, and pacing throughout.
- Return ONLY the corrected story — no preamble, no labels, no explanation.`;

export function buildStoryPrompt({ name, age, interests, length, dialect, language, customIdea, seriesContext, childWish, appearance, dayBeats, dayMood, globalInspiration }) {
  const ageNum = parseInt(age) || 5;
  const wordRange = getWordRange(length);
  const languageLevel = getLanguageLevel(ageNum);
  // `language` takes priority over legacy `dialect` for story language
  const languageStyle = getLanguageInstruction(language || dialect);

  // Hero ideas take absolute priority. For quick stories, tonight's wish should
  // drive setting/theme inference before the child's broader saved interests.
  const inferSource = customIdea || childWish || interests;
  const setting = inferSetting(inferSource);
  const theme = inferTheme(inferSource);

  // Mode inference: today > hero > random
  // - today: parent shares real-life beats → gentle reflection story
  // - hero: custom idea is a contract, must be followed exactly
  // - random: magical story inspired by the child's interests
  const mode = dayBeats ? "today" : customIdea ? "hero" : "random";
  const personality = selectStoryPersonality({ name, age: ageNum, interests, mode, customIdea, dayMood });
  const blueprint = STORY_BLUEPRINTS[mode] || STORY_BLUEPRINTS.random;

  // Mood guidance map — shapes the emotional arc for today-mode stories
  const moodGuidance = {
    joyful: "The story should carry the warmth and happiness of today forward into a gentle celebration, ending in restful contentment.",
    brave: "Honour the child's courage today — gently reflect back how brave they were, so they fall asleep feeling strong and proud.",
    nervous: "Today had worry or nerves. The story should softly acknowledge the feeling (without naming it directly) and lead the child to a place of safety, reassurance, and peace.",
    tired: "Today was tiring or grumpy. The story should be especially slow, soft, and forgiving — a warm blanket of a story that lets the child rest.",
    exciting: "Today was full and busy. The story should slow the pace down gently, helping the child settle from a big day into quiet calm.",
    quiet: "Today was peaceful. Match that quietness with a softly paced, gentle story that honours the calm.",
    mixed: "Today held mixed feelings. Weave the moments together with warmth, ending in reassurance that every kind of day can end with a safe, loved sleep.",
  };

  // Build the idea section — fundamentally different between modes
  let ideaSection;
  if (dayBeats) {
    // TODAY MODE: Weave real-life moments into a gentle bedtime reflection
    const moodLine = dayMood && moodGuidance[dayMood]
      ? `\n\nOVERALL MOOD: ${moodGuidance[dayMood]}`
      : "";
    ideaSection = `STORY FROM TODAY (REAL LIFE → GENTLE REFLECTION):
Today, these things happened in ${name}'s real life:
"${dayBeats}"${moodLine}

YOUR TASK:
- Take ${name}'s real-day moments and reflect them back as a GENTLE bedtime story — honouring what actually happened.
- The story can be lightly imaginative (a small touch of magic, a kind animal friend, a cosy corner of nature) but it must stay CLOSE to the real events. This is a memory-keeper, not a fantasy.
- Each real moment should appear in the story as a warm, softened echo. Keep names and details the parent shared (siblings, places, small actions).
- Turn any hard moments (falls, worries, tiredness, grumpiness) into moments of BRAVERY, KINDNESS, or QUIET COURAGE. Never dwell on the difficulty — honour it, then gently move past it.
- Never invent frightening events, illness, loss, or conflict. Never introduce anything the parent didn't share.
- Close with ${name} tucked in, reflecting on today's small wins and feeling safe, loved, and ready to sleep.
- The child's interests (${interests}) may colour the tone but the REAL DAY is the subject.

Think of this as: "How would a loving grandparent retell today as a bedtime story?"`;
  } else if (customIdea) {
    // HERO MODE: The custom idea is a strict contract. The AI must follow it exactly.
    const continuityBlock = seriesContext
      ? `

SERIES CONTINUITY (KEEP THIS STABLE WHEN IT FITS TONIGHT'S IDEA):
${seriesContext}

Treat this as continuity guidance, not as replacement for the custom idea. Continue recurring characters, world details, and emotional threads where natural, while still making tonight feel like a fresh complete story.`
      : "";
    ideaSection = `CUSTOM STORY IDEA (MANDATORY — FOLLOW EXACTLY):
"${customIdea}"

The story MUST be built around this exact idea. Do NOT change, ignore, or loosely interpret it.
Do NOT replace it with your own concept. If the idea is specific, honour it precisely.
The idea is the foundation of the story — everything else (setting, characters, events) must serve it.
The child's interests are: ${interests}. Use these to enrich the story, but the custom idea takes priority.${continuityBlock}`;
  } else {
    // RANDOM MODE: Use the child's interests to inspire a magical story
    const wishBlock = childWish
      ? `

TONIGHT'S WISH (what the child said they want a story about):
"${childWish}"

    Honour this wish as TONIGHT'S MAIN STORY PROMISE. It must be central, obvious, and active on-page — not just hinted at.
    - If the wish is a simple action or image such as "flying", "swimming", or "rockets", that action/image must clearly happen in the story itself.
    - The wish should shape the beginning, the journey, and the resolution.
    - Do not replace the wish with a nearby theme. For example, "flying" should not become merely "space" or "birds"; the child should actually be flying, gliding, soaring, or lifted through the air in a calm bedtime-safe way.
    - Do not reduce the wish to a passing mention, background detail, or metaphor.
    - If the wish combines multiple parts, preserve ALL major parts together. For example:
      - "flying over dolphins" should include both the flying action and dolphins below in a sea or ocean setting.
      - "through Egypt" should clearly evoke Egypt itself — such as moonlit desert sand, pyramids, or the Nile — rather than drifting into a generic travel story.
      - "flying through Egypt" should preserve both the flying action and the Egyptian setting.

    If the wish contains anything physically impossible or over-stimulating (e.g. "flying with dolphins", "riding a rocket"), GENTLY reinterpret it into a bedtime-calm, physically plausible version:
- "flying with dolphins" → the child glides above the waves while dolphins leap joyfully beneath
- "riding a rocket" → a soft, slow moon-lantern carrying them gently to the stars
- Anything scary, fast, loud, or frightening → reshape into something calm, slow, and warm
Keep the child's imagination honoured, but always calming, never exciting or energising.`
      : "";
    ideaSection = `CHILD'S INTERESTS: ${interests}${wishBlock}

Create a magical, original story inspired by these interests${childWish ? " and tonight's wish above" : ""}. The story should feel fresh and surprising — not a generic template.`;
  }

  // Appearance block — used for prose description only, NEVER to copy character/plot
  const appearanceBlock = appearance
    ? `
- Appearance: ${appearance}

APPEARANCE RULES:
- Weave the child's appearance naturally into the prose (1–2 gentle mentions is plenty).
- If the parent referenced a known character (e.g. "hair like Princess Jasmine"), use it ONLY as a visual cue — do NOT name the character, copy their story, or borrow their setting.
- Never describe clothing, body, or features in a way that could feel uncomfortable — keep it warm, simple, and child-appropriate.`
    : "";

  const storyCraftBlock = `
STORY DNA:
- Story promise: ${blueprint.promise}
- Child personality lane: ${personality.label}
- Personality traits to show in action: ${personality.traits}
- Inner strength to spotlight: ${personality.strength}
- Comfort style to return to at the ending: ${personality.comfortStyle}
- Core theme: ${theme}

EMOTIONAL CORE (PIXAR RULE — MANDATORY):
Before writing, identify:
- WANT (external): What does ${name} want to achieve or find in this story?
- NEED (internal): What does ${name} quietly discover about themselves by the end?
Both must be resolved. The WANT drives the plot. The NEED creates the emotional resonance parents feel.

CRAFT RULES (THIS IS WHAT MAKES THE STORY FEEL PAID-FOR, NOT GENERATED):
- Open with ONE specific sensory image — a sound, a smell, a texture, a light. Never "Once upon a time".
- Give ${name} one memorable emotional quality revealed through action, not description.
- Make every paragraph do one job: hook, deepen, turn, reveal, resolve, settle.
- Use SPECIFIC nouns: not "a flower" but "a buttercup the colour of afternoon sunshine".
- Include at least 2 lines of natural, character-specific dialogue with quotation marks.
- Show emotions through physical reactions, never by naming them.
- Include ONE sentence so beautiful or precisely true that a parent would pause while reading it aloud.
- Vary sentence length: short sentences for emotional punches, longer ones for wonder and world-building.
- The ending must feel earned, sleepy, and emotionally complete — with both WANT and NEED resolved.`;

  const storyBlueprintBlock = blueprint.beats.map((beat, index) => `${index + 1}. ${beat}`).join("\n");

  return `Write a bedtime story for this child:

STORY MODE: ${mode}

CHILD:
- Name: ${name}
- Age: ${ageNum} years old${appearanceBlock}

${ideaSection}

LANGUAGE LEVEL: ${languageLevel}
LANGUAGE STYLE: ${languageStyle}

SETTING: ${setting}
THEME: ${theme}

${storyCraftBlock}

STORY STRUCTURE:
${dayBeats
  ? `1. Opening — Begin with ${name} at the close of their day, in a warm and familiar setting (home, bedroom, garden).
2. Reflection — Gently revisit each moment from today, one by one, turning each into a soft image or small scene.
3. Honouring — Give each moment its due warmth: courage recognised, joy remembered, tiredness forgiven.
4. Comfort — A quiet moment of reassurance — that today mattered, and that ${name} is loved.
5. Bedtime — ${name} is tucked in, feeling safe and loved, drifting off. End with ${name} fully settled. You MAY add ONE final "sleepy seed" sentence — a gentle image of the story world continuing peacefully without them. No cliffhangers, no "just the beginning", no teasing.`
  : `1. Opening — Gently introduce ${name} in the setting. Establish warmth and calm.
2. Discovery — ${name} notices something curious that sparks a gentle adventure.
3. Journey — A calm, curiosity-driven journey${customIdea ? ` centred on "${customIdea}"` : ` inspired by the child's interests`}.
4. Resolution — A warm, satisfying moment of wonder or kindness.
5. Bedtime — ${name} returns home feeling safe, happy, and ready to sleep. End with ${name} fully settled. You MAY add ONE final "sleepy seed" sentence — a gentle image of the story world continuing peacefully without them (e.g. the characters tucking themselves in, the setting growing quiet). No cliffhangers, no "just the beginning", no teasing. The sleepy seed is warm and permanent, not exciting.`}

PREMIUM STORY BLUEPRINT:
${storyBlueprintBlock}

LENGTH: ${wordRange}
${Array.isArray(globalInspiration) && globalInspiration.length
  ? `\nGLOBAL INSPIRATION (ideas that resonated with children worldwide — use as creative inspiration only, do not copy):\n${globalInspiration.map((idea) => `- ${idea}`).join("\n")}\n`
  : ""}${CONTEXT_LOCK}

Write the story now.`;
}

/**
 * Build the user-facing prompt for the editor pass.
 */
export function buildGrammarPrompt(storyText, dialect) {
  const langInstruction = getLanguagePreservationInstruction(dialect);

  if (isEnglishLanguageCode(dialect)) {
    return `Review and polish this bedtime story for publication. Ensure it reads beautifully aloud and feels like a professionally published children's book.

Use ${langInstruction} consistently. Fix any mixed spelling or phrasing.

You must also verify that setting, timeline, and character behaviour are fully consistent. Fix any issues you find.

STORY:
${storyText}`;
  }

  const code = resolveLanguageCode(dialect);
  const langName = LANGUAGE_NAMES[code] || code;
  return `Review and polish this ${langName} bedtime story for publication. Ensure it reads beautifully aloud in ${langName} and feels like a professionally published children's book.

Maintain ${langInstruction}. Fix any grammar, flow, or phrasing that sounds unnatural in ${langName} for a children's bedtime story. Do NOT translate to English.

You must also verify that setting, timeline, and character behaviour are fully consistent. Fix any issues you find.

STORY:
${storyText}`;
}

/**
 * Build the user-facing prompt for the final validation pass.
 * Includes mode and context so the validator can perform mode-specific checks.
 *
 * @param {string} storyText - The story to validate
 * @param {Object} context
 * @param {string} context.mode - "random" or "hero"
 * @param {string} [context.dialect] - "en-GB"/"en-US" or legacy "british"/"american" spelling and phrasing preference.
 * @param {string} [context.interests] - Child's interests (for random mode check)
 * @param {string} [context.customIdea] - The exact story idea (for hero mode integrity check)
 * @param {string} [context.childWish] - The exact quick-story wish to preserve in random mode.
 * @param {string} [context.seriesContext] - Prior series continuity guidance for Hero mode.
 */
export function buildValidationPrompt(storyText, { mode, dialect, interests, customIdea, childWish, seriesContext, dayBeats } = {}) {
  let modeContext = "";

  if (mode === "today" && dayBeats) {
    modeContext = `\nSTORY MODE: today
REAL-LIFE DAY MOMENTS the parent shared: "${dayBeats}"

Perform the DAY-BEAT FIDELITY CHECK: verify each shared moment appears as a warm, softened echo. No invented frightening events, illness, conflict, or unshared details. Hard moments must be reframed with warmth, not dwelt on. If fidelity is broken — rewrite surgically.`;
  } else if (mode === "hero" && customIdea) {
    modeContext = `\nSTORY MODE: hero
CUSTOM IDEA (the story MUST centre around this): "${customIdea}"
CHILD'S INTERESTS: ${interests || "not specified"}
${seriesContext ? `SERIES CONTINUITY TO PRESERVE WHEN RELEVANT: "${seriesContext}"\n
Perform the CONTINUITY CHECK: keep recurring world logic, companion identity, and emotional thread aligned with the prior series context unless the new custom idea clearly changes part of that path.\n
` : ""}Perform the IDEA INTEGRITY CHECK: verify the custom idea is central, present, and actively used throughout the story. If the idea is missing, diluted, or replaced — rewrite to align with it.`;
  } else if (mode === "random" && interests) {
    modeContext = `\nSTORY MODE: random
CHILD'S INTERESTS: ${interests}

${childWish ? `TONIGHT'S WISH: "${childWish}"\n` : ""}

Perform the INTEREST UTILISATION CHECK: verify at least one interest plays a meaningful role in the story — not just a brief mention. If interests are ignored, weave them in.
${childWish ? `Perform the WISH FIDELITY CHECK: verify tonight's wish remains central and recognisable in the story. If the wish is a simple action or image such as "flying" or "swimming", that action/image must clearly happen on-page rather than being replaced by a nearby generic theme. If the wish combines multiple major parts, preserve all of them together so the story does not drop the creature, place, or action that made the wish specific. If the wish has drifted into something generic or unrelated — rewrite surgically to restore it.` : ""}`;
  }

  const languageCheckLine = isEnglishLanguageCode(dialect)
    ? `Use ${getLanguagePreservationInstruction(dialect)} consistently throughout. If any spelling or phrasing mixes dialects, correct it.`
    : (() => {
        const code = resolveLanguageCode(dialect);
        const name = LANGUAGE_NAMES[code] || code;
        return `The story must be written entirely in ${name}. Do not translate or introduce English words. Correct any language-mixing issues.`;
      })();

  return `Perform a strict final validation on this bedtime story. Check setting consistency, timeline logic, character consistency, grammar, child safety, and language consistency.
${languageCheckLine}
${modeContext}
If perfect, return it exactly as-is. If any issue exists, fix it silently.

STORY:
${storyText}`;
}

/**
 * Build a prompt to generate a short, magical story title.
 */
export function buildTitlePrompt(storyText, childName, dialect) {
  const langLine = isEnglishLanguageCode(dialect)
    ? `Use ${getLanguagePreservationInstruction(dialect)} if spelling choices matter.`
    : (() => {
        const code = resolveLanguageCode(dialect);
        const name = LANGUAGE_NAMES[code] || code;
        return `Write the title in ${name}.`;
      })();

  return `Generate a short, enchanting title (3–6 words) for this children's bedtime story. The main character is called ${childName}.
${langLine}

Return ONLY the title — no quotes, no punctuation, no explanation.

STORY (excerpt):
${storyText.substring(0, 600)}`;
}

/**
 * Build a prompt for the final delivery-quality cleanup pass.
 */
export function buildDeliveryQaPrompt(storyText, { issues = [], dialect } = {}) {
  const issueBlock = issues.length
    ? issues.map((issue) => `- ${issue}`).join("\n")
    : "- General final quality cleanup only.";

  const langLine = isEnglishLanguageCode(dialect)
    ? `Use ${getLanguagePreservationInstruction(dialect)} consistently.`
    : (() => {
        const code = resolveLanguageCode(dialect);
        const name = LANGUAGE_NAMES[code] || code;
        return `Maintain the story in ${name} throughout — do not translate or introduce English.`;
      })();

  return `Perform a final delivery-quality cleanup on this bedtime story.
${langLine}

Focus on these issues:
${issueBlock}

Make the smallest possible corrections, then return ONLY the final story text.

STORY:
${storyText}`;
}

// =============================================================================
// Helpers — Language, Setting, and Theme inference
// =============================================================================

function getWordRange(length) {
  switch (length) {
    case "short": return "350-500 words — a single gem of a scene, complete and satisfying";
    case "long": return "1800-2400 words, paced like an unhurried premium 10-12 minute bedtime read-aloud with a full emotional arc";
    default: return "900-1200 words — a full story with clear beats and emotional depth";
  }
}

function selectStoryPersonality({ name, age, interests, mode, customIdea, dayMood }) {
  if (mode === "today") {
    if (dayMood === "brave" || dayMood === "nervous") return STORY_PERSONALITIES[1];
    if (dayMood === "joyful" || dayMood === "exciting") return STORY_PERSONALITIES[3];
    if (dayMood === "mixed" || dayMood === "quiet" || dayMood === "tired") return STORY_PERSONALITIES[2];
  }

  const source = `${name || ""} ${interests || ""} ${customIdea || ""}`.toLowerCase();
  const score = Array.from(source).reduce((total, char) => total + char.charCodeAt(0), age || 0);
  return STORY_PERSONALITIES[score % STORY_PERSONALITIES.length];
}

// Maps language codes to full Claude-readable language names.
const LANGUAGE_NAMES = {
  "en-GB": "British English",
  "en-US": "American English",
  "es":    "Spanish",
  "fr":    "French",
  "pt":    "Portuguese",
  "de":    "German",
  "it":    "Italian",
  "ja":    "Japanese",
  "zh-CN": "Simplified Chinese (Mandarin)",
  "ar":    "Modern Standard Arabic",
  "hi":    "Hindi",
  "ur":    "Urdu",
};

// Legacy dialect aliases → language code
const DIALECT_TO_LANGUAGE = {
  "british":  "en-GB",
  "american": "en-US",
  "en-gb":    "en-GB",
  "en-us":    "en-US",
};

export function resolveLanguageCode(language) {
  if (!language) return "en-GB";
  const key = String(language).trim().toLowerCase();
  return DIALECT_TO_LANGUAGE[key] || language;
}

// Full story-generation language directive (used in buildStoryPrompt LANGUAGE STYLE field).
function getLanguageInstruction(language) {
  const code = resolveLanguageCode(language);
  const name = LANGUAGE_NAMES[code];

  if (!name) {
    return "British English (en-GB) spelling and phrasing";
  }
  if (code === "en-GB") {
    return "British English (en-GB) spelling and phrasing (for example: colour, favourite, cosy, mum, travelling, prioritise)";
  }
  if (code === "en-US") {
    return "American English (en-US) spelling and phrasing (for example: color, favorite, cozy, mom, traveling, prioritize)";
  }
  // Non-English: directive to write the whole story in that language
  return `${name}. Write the ENTIRE story in ${name}. Do not use any English words or phrases. Use vocabulary and expressions natural for a children's bedtime story in ${name}.`;
}

// Short phrase used inside sentences like "Use [X] consistently."
// Produces grammatically correct output for both English dialects and non-English.
function getLanguagePreservationInstruction(language) {
  const code = resolveLanguageCode(language);
  if (code === "en-GB") {
    return "British English (en-GB) spelling and phrasing (e.g. colour, favourite, cosy, mum, travelling)";
  }
  if (code === "en-US") {
    return "American English (en-US) spelling and phrasing (e.g. color, favorite, cozy, mom, traveling)";
  }
  const name = LANGUAGE_NAMES[code];
  if (!name) return "British English (en-GB) spelling and phrasing";
  return `${name} throughout — preserve the original ${name}, do not translate or introduce English`;
}

function isEnglishLanguageCode(language) {
  const code = resolveLanguageCode(language || "");
  return code === "en-GB" || code === "en-US";
}

// Keep as a named export so server.js and other callers can still use it
export function getDialectInstruction(dialect) {
  return getLanguagePreservationInstruction(dialect);
}

/**
 * Returns language guidance calibrated to the child's age.
 */
function getLanguageLevel(age) {
  if (age <= 3) {
    return "Very simple words, very short sentences (5–8 words). Gentle repetition is encouraged. Board book level.";
  }
  if (age <= 5) {
    return "Simple vocabulary, short sentences (8–12 words). Gentle repetition and rhythm. Picture book level.";
  }
  if (age <= 7) {
    return "Clear vocabulary with some descriptive words. Sentences of 10–15 words. Light dialogue is fine.";
  }
  if (age <= 9) {
    return "Rich but accessible vocabulary. Varied sentence lengths. Dialogue and description balanced. Early reader level.";
  }
  return "Confident vocabulary with vivid descriptions. Complex sentences allowed. Engaging narrative voice. Middle-grade level.";
}

/**
 * Infer a setting from the child's interests.
 * Falls back to a gentle, universal setting.
 */
function inferSetting(interests) {
  const lower = (interests || "").toLowerCase();
  const map = [
    [/dinosaur|dino|t[\s-]?rex/, "a gentle prehistoric valley with warm ferns and a glowing amber sky"],
    [/princess|castle|queen|king|prince/, "a peaceful moonlit castle with enchanted gardens"],
    [/ocean|sea|fish|mermaid|whale|dolphin|swim|swimming|underwater/, "a tranquil ocean cove glowing with soft light"],
    [/egypt|egyptian|pyramid|pyramids|pharaoh|nile|desert/, "a calm golden desert where moonlit pyramids and the quiet Nile shimmer softly"],
    [/fly|flying|glide|gliding|soar|soaring/, "a peaceful evening sky above a beautiful landscape, where gentle wonders drift below"],
    [/space|rocket|planet|star|astronaut|moon/, "a calm, twinkling corner of the galaxy"],
    [/dragon/, "a cosy mountain hollow where friendly dragons nest"],
    [/robot|machine|android/, "a gentle workshop town where kind robots live"],
    [/farm|horse|cow|pig|chicken|sheep/, "a peaceful countryside farm bathed in golden light"],
    [/jungle|monkey|tiger|lion|elephant/, "a warm jungle clearing dappled with moonlight"],
    [/pirate|ship|treasure|sail/, "a calm tropical island under a blanket of stars"],
    [/car|truck|train|vehicle/, "a sleepy little town with winding roads under the stars"],
    [/fairy|magic|wizard|witch|spell/, "an enchanted forest glade sparkling with gentle magic"],
    [/superhero|hero|power|cape/, "a quiet neighbourhood bathed in warm evening light"],
    [/bear|bunny|rabbit|fox|deer|owl/, "a peaceful woodland at twilight, softly lit by fireflies"],
    [/unicorn|rainbow|pony/, "a meadow of soft colours beneath a shimmering rainbow"],
    [/football|soccer|sport|basketball/, "a friendly village with a moonlit playing field nearby"],
  ];

  for (const [pattern, setting] of map) {
    if (pattern.test(lower)) return setting;
  }

  return "a calm, enchanted place where gentle adventures begin";
}

/**
 * Infer a theme from the child's interests.
 * Falls back to a universal bedtime-friendly theme.
 */
function inferTheme(interests) {
  const lower = (interests || "").toLowerCase();
  const map = [
    [/friend/, "the warmth of friendship and being there for each other"],
    [/brave|hero|superhero|courage/, "quiet courage and believing in yourself"],
    [/animal|pet|bear|bunny|fox/, "kindness to all creatures and the bonds between friends"],
    [/magic|fairy|wizard|spell/, "wonder, discovery, and the magic in everyday moments"],
    [/egypt|egyptian|pyramid|pyramids|pharaoh|nile|desert|explore|adventure|discover|quest|fly|flying|swim|swimming|glide|gliding/, "curiosity, discovery, and the joy of exploring"],
    [/help|kind|care|share/, "the gentle power of kindness and helping others"],
    [/family|home|mum|dad|sister|brother/, "the comfort of family and the warmth of home"],
  ];

  for (const [pattern, theme] of map) {
    if (pattern.test(lower)) return theme;
  }

  return "kindness, courage, and the comfort of home";
}
