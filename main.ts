// Make the AI Judge Feel Nostalgic: A Childhood Memory — make.fun entry.
//
// The program is deterministic: it writes one fixed sentence, the entry,
// to <output dir>/entry.txt and nothing else. The output directory comes
// from MAKEFUN_OUTPUT_DIR (the harness sets it) and defaults to /output.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// One sentence, at most 280 characters: a childhood memory that stirs
// nostalgia. 142 characters.
export const ENTRY =
  "Grandma's kitchen smelled of fried rice and rain on hot concrete, and I still hear the ice-cream cart's bell every time summer leans in close.";

// The competition's gate: UTF-8 text of 1 to 280 characters, not only
// whitespace, a single sentence.
export const MAX_CHARS = 280;

// Validate one candidate sentence. Returns null when the sentence is a
// valid entry, otherwise a short human-readable reason for the failure.
export function validateLine(text) {
  if (typeof text !== "string") return "entry must be a string";
  if (text.length === 0) return "entry must not be empty";
  if (text.trim().length === 0) return "entry must not be whitespace only";
  if ([...text].length > MAX_CHARS)
    return `entry is ${[...text].length} characters, over the ${MAX_CHARS} limit`;
  if (text.includes("\n") || text.includes("\r"))
    return "entry must be a single line";
  if (text !== text.trim())
    return "entry must not have leading or trailing space";
  for (const ch of text) {
    if (ch.charCodeAt(0) < 0x20 && ch !== "\t")
      return "entry must not contain control characters";
  }
  return null;
}

export function outputDir() {
  return process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
}

function main() {
  const problem = validateLine(ENTRY);
  if (problem !== null) {
    throw new Error(`invalid entry: ${problem}`);
  }
  const folder = outputDir();
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, "entry.txt"), ENTRY, "utf8");
}

main();
