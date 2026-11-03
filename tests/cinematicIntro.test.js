import test from "node:test";
import assert from "node:assert/strict";
import {
  introCopy,
  INTRO_SEEN_KEY,
} from "../public/intro-copy.js";
test("single-screen welcome is button controlled, bilingual and retains the existing first-visit preference", () => {
  assert.equal(INTRO_SEEN_KEY, "warshatak-cinematic-v1");
  for (const language of ["ar", "en"]) {
    const copy = introCopy[language];
    assert.ok(copy.name && copy.tagline && copy.skip && copy.replay);
  }
});
