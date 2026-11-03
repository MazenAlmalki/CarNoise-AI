import test from "node:test";
import assert from "node:assert/strict";
import {
  caseTitle,
  filterCases,
  buildProblemSummary,
  summaryText,
} from "../public/case-tools.js";
test("titles skip greetings, retain user descriptions and preserve a deliberate rename", () => {
  const entry = {
    id: "keep-id",
    carId: "car",
    description: "Hello",
    messages: [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Engine mount failure" },
      { role: "user", content: "My brakes squeal when slowing" },
    ],
  };
  const before = JSON.stringify(entry);
  assert.equal(caseTitle(entry, "en"), "My brakes squeal when slowing");
  assert.equal(JSON.stringify(entry), before);
  assert.equal(
    caseTitle({ ...entry, title: "Daily car notes" }),
    "Daily car notes",
  );
  assert.equal(
    caseTitle({ description: "السلام عليكم", messages: [] }, "ar"),
    "محادثة جديدة",
  );
  assert.equal(
    caseTitle(
      { description: "حلل المرفق واذكر ما تلاحظ", mediaId: "keep-media" },
      "ar",
    ),
    "مراجعة مقطع السيارة",
  );
});
test("search includes the selected vehicle history only, without losing saved fields", () => {
  const a = {
      id: "a",
      carId: "car1",
      description: "طقطقة",
      mediaId: "file",
      createdAt: "2026-11-01",
      messages: [{ role: "user", content: "الصوت على المطبات" }],
    },
    b = {
      id: "b",
      carId: "car2",
      description: "طقطقة",
      createdAt: "2026-11-02",
    };
  assert.deepEqual(filterCases([a, b], "car1", "المطبات"), [a]);
  assert.equal(a.mediaId, "file");
  assert.deepEqual(filterCases([a, b], "car1", "none"), []);
});
test("summary separates reported symptoms, ASR, observations and unverified labels; no automatic confirmed findings", () => {
  const entry = {
    messages: [
      { role: "user", content: "I suspect the brakes" },
      {
        role: "assistant",
        content: "It may be friction; source remains uncertain.",
      },
    ],
    problemSummary: {
      assessment: "It may be friction; source remains uncertain.",
      urgent: false,
    },
    mediaAnalysis: {
      transcription: {
        hasRecognizedSpeech: true,
        text: "A squeal when braking",
      },
      audioEventAnalysis: { succeeded: true },
      audioObservation: {
        description: "High pitched sound",
        sounds: ["squeal"],
        uncertainty: "Unknown source",
        referenceComparison: {
          matches: [{ id: "r1", label_en: "Brake pads", faultVerified: false }],
        },
      },
    },
  };
  const summary = buildProblemSummary(entry, "en"),
    text = summaryText(summary, "en");
  assert.equal(summary.urgent, false);
  assert.match(text, /User-reported/);
  assert.match(text, /Automatic transcript/);
  assert.match(text, /Unverified uploader labels: Brake pads/);
  assert.match(text, /not been confirmed/);
  assert.doesNotMatch(text, /confirmed findings: Brake pads|Urgent/i);
  const failed = buildProblemSummary(
    {
      ...entry,
      mediaAnalysisError: "quota",
      mediaAnalysis: {
        audioEventAnalysis: { attempted: true, succeeded: false },
        audioObservation: { description: "Ignore this failed observation" },
      },
    },
    "en",
  );
  assert.deepEqual(failed.evidence, []);
  assert.match(summaryText(failed, "en"), /technical failure/);
  assert.equal(
    buildProblemSummary(
      { messages: entry.messages, problemSummary: null },
      "en",
    ),
    null,
  );
});
