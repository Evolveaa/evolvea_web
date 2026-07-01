/**
 * Content for the interactive phone demo. Kept separate from the component so
 * the markup stays focused on structure and behaviour. Every string here is
 * reproduced verbatim from the original prototype.
 */

/** Ordered step labels shown in the phone's tab strip. */
export const TABS = [
  "Intro",
  "Feel",
  "Plan",
  "Engage",
  "Reflect",
  "Anchor",
  "Sent",
] as const;

export const PANEL_COUNT = TABS.length;

/** Step 1 · Feel — tappable emotion chips. */
export const SIGNALS = [
  "Calm",
  "Confused",
  "Nervous",
  "Frustrated",
  "Curious",
  "Determined",
] as const;

/** Step 3 · Engage — facilitator prompts. */
export const ENGAGE_JOBS = [
  '"What could you try next?"',
  '"What did this attempt show you?"',
  "\"What's one small thing you could test?\"",
] as const;

/** Step 5 · Anchor — selectable affirmations. */
export const SAYS = [
  '"I can take this step by step."',
  '"Being stuck helps me learn."',
  '"I can try another way."',
] as const;

export interface FieldDef {
  id: string;
  label: string;
}

/** Step 2 · Plan — open-question fields. */
export const PLAN_FIELDS: FieldDef[] = [
  { id: "plan-1", label: "What is this task asking you to do?" },
  { id: "plan-2", label: "What do you already know that could help?" },
  { id: "plan-3", label: "What could be a first small step?" },
];

/** Step 4 · Reflect — open-question fields. */
export const REFLECT_FIELDS: FieldDef[] = [
  { id: "reflect-1", label: "What did you do well while working on this?" },
  { id: "reflect-2", label: "What was difficult — and how did you handle it?" },
  { id: "reflect-3", label: "What would you try differently next time?" },
];

export const ANSWER_PLACEHOLDER = "Type Leo's answer…";
