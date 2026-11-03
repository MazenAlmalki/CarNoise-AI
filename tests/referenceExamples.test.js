import test from "node:test";
import assert from "node:assert/strict";
import {
  selectReferenceExample,
  exampleQuestion,
} from "../server/referenceExamples.js";
const media = {
  type: "audio",
  audioEventAnalysis: { provider: "gemini", attempted: true, succeeded: true },
  audioObservation: {
    contentType: "mechanical_sound",hasMechanicalSound:true,
    provider: "gemini",
    hasClearSound: true,
    description: "Repeated high pitched bursts.",
    sounds: ["squeal"],
    uncertainty: "Source uncertain.",
    referenceComparison: {
      result: "partial",
      reason: "Similar pitch and cadence, different background.",
      matches: [{ id: "upload1-02" }],
    },
  },
};
const args = {
  media,
  memory: { questionsAsked: 0 },
  plan: { urgent: false, clarificationAllowed: true },
};
test("actual comparison selects one hash-verified recording without exposing a suspected part label", async () => {
  const result = await selectReferenceExample(args);
  assert.equal(result.id, "upload1-02");
  assert.equal(result.url, "/api/audio-references/upload1-02");
  assert.equal(result.diagnosisConfirmed, false);
  assert.equal(result.label_en, undefined);
  assert.equal((exampleQuestion("en").match(/\?/g) || []).length, 1);
});
test("speech, emergency, exhausted budget, rejected/offered examples and failures never force examples", async () => {
  for (const patch of [
    { offered: ["upload1-02"] },
    { skip: true },
    { memory: { questionsAsked: 2 } },
    { plan: { urgent: true, clarificationAllowed: true } },
    {
      media: {
        ...media,
        transcription: { hasRecognizedSpeech: true, text: "hello" },
      },
    },
    {
      media: {
        ...media,
        audioEventAnalysis: { provider: "gemini", succeeded: false },
      },
    },
    { media: { type: "audio", waveform: { ok: true } } },
    {
      media: {
        ...media,
        audioObservation: {
    contentType: "mechanical_sound",hasMechanicalSound:true,
          ...media.audioObservation,
          referenceComparison: { result: "none", matches: [] },
        },
      },
    },
    {
      media: {
        ...media,
        audioObservation: {
    contentType: "mechanical_sound",hasMechanicalSound:true,
          ...media.audioObservation,
          referenceComparison: {
            result: "clear",
            reason: "x",
            matches: [{ id: "../../secret" }],
          },
        },
      },
    },
  ])
    assert.equal(await selectReferenceExample({ ...args, ...patch }), null);
});
