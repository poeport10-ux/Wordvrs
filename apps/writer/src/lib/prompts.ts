// A curated prompt library to kickstart a writing session when stuck.
// Deliberately simple and static rather than a model call — see README for the
// planned AI writing assistant integration.

export const WRITING_PROMPTS = [
  "Describe a world where humans can communicate with animals.",
  "Write the moment your protagonist realizes they've been lied to their whole life.",
  "A stranger hands your character a key that opens something impossible.",
  "Two rivals are forced to share the last safe room in a collapsing building.",
  "Write a scene set entirely in a single elevator ride.",
  "Your character finds a letter addressed to them, written by their future self.",
  "Describe a city that only exists at night.",
  "A character discovers their reflection is a few seconds out of sync.",
  "Write the last entry in someone's journal before everything changes.",
  "Two characters argue about something small that's really about something else.",
  "Your protagonist has to choose between two people they love.",
  "Describe the first meal after a long war ends.",
  "A child asks an impossible question and gets an honest answer.",
  "Write a eulogy delivered by someone who secretly hated the deceased.",
  "Your character wakes up with a skill they didn't have yesterday.",
] as const;

export function randomPrompt(exclude?: string): string {
  const pool = exclude ? WRITING_PROMPTS.filter((p) => p !== exclude) : WRITING_PROMPTS;
  return pool[Math.floor(Math.random() * pool.length)];
}
