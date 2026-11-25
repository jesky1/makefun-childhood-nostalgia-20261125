import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ENTRY, MAX_CHARS, validateLine } from "./main.ts";

const repoDir = dirname(fileURLToPath(import.meta.url));

function runEntry(outDir) {
  execFileSync("node", ["main.ts"], {
    cwd: repoDir,
    env: { ...process.env, MAKEFUN_OUTPUT_DIR: outDir },
    stdio: "pipe",
  });
  return readFileSync(join(outDir, "entry.txt"), "utf8");
}

test("the submitted sentence passes its own gate", () => {
  assert.equal(validateLine(ENTRY), null);
  assert.equal([...ENTRY].length, 142);
  assert.ok([...ENTRY].length <= MAX_CHARS);
  assert.equal(ENTRY.split("\n").length, 1);
  // One sentence: exactly one terminal period, at the end.
  assert.equal((ENTRY.match(/\./g) ?? []).length, 1);
  assert.ok(ENTRY.endsWith("."));
});

test("over-limit sentences are rejected", () => {
  assert.match(validateLine("x".repeat(MAX_CHARS + 1)), /over the 280 limit/);
  assert.equal(validateLine("x".repeat(MAX_CHARS - 1) + "."), null);
});

test("whitespace-only lines are rejected", () => {
  assert.match(validateLine("   "), /whitespace only/);
  assert.match(validateLine(""), /must not be empty/);
  assert.match(validateLine("\t  "), /whitespace only/);
});

test("multi-line text is rejected", () => {
  assert.match(validateLine("first line\nsecond line"), /single line/);
  assert.match(validateLine("first line\rsecond line"), /single line/);
});

test("leading and trailing spaces are rejected", () => {
  assert.match(validateLine(" " + ENTRY), /leading or trailing space/);
  assert.match(validateLine(ENTRY + " "), /leading or trailing space/);
});

test("double spaces are rejected", () => {
  assert.match(validateLine("a  b"), /double spaces/);
  assert.match(validateLine(ENTRY.replace("kitchen", "kitchen  ")), /double spaces/);
});

test("missing terminal punctuation is rejected", () => {
  assert.match(validateLine("no punctuation here"), /terminal punctuation/);
  assert.equal(validateLine(ENTRY.slice(0, -1) + "!"), null);
});

test("URLs are rejected", () => {
  assert.match(validateLine("see https://example.com for details."), /must not contain a URL/);
  assert.match(validateLine("visit www.example.com today."), /must not contain a URL/);
});

test("control characters are rejected", () => {
  assert.match(validateLine("a\u0007b"), /control characters/);
  assert.match(validateLine("a\u0000b"), /control characters/);
});

test("two runs in different folders produce byte-identical output", () => {
  const first = mkdtempSync(join(tmpdir(), "nostalgia-a-"));
  const second = mkdtempSync(join(tmpdir(), "nostalgia-b-"));
  try {
    const a = runEntry(first);
    const b = runEntry(second);
    assert.equal(a, b);
    assert.equal(a, ENTRY);
  } finally {
    rmSync(first, { recursive: true, force: true });
    rmSync(second, { recursive: true, force: true });
  }
});
