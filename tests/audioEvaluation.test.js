import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  evaluateAudio,
  verifyEvaluationFiles,
} from "../scripts/evaluate_audio.js";
const references = [
  {
    sha256: "1".repeat(64),
    source_sha256: "2".repeat(64),
    acoustics: {
      reviewed_category: "squeal",
      review_status: "independently_reviewed",
    },
  },
];
const sample = {
  id: "held-out",
  audioSha256: "3".repeat(64),
  sourceGroup: "4".repeat(64),
  reviewStatus: "independently_reviewed",
  category: "squeal",
  contentType: "mechanical",
  expectedUnknown: false,
};
const prediction = {
  id: "held-out",
  rankedCategories: ["rattle", "squeal"],
  rejected: false,
  confident: true,
  processingMs: 150,
  contentType: "mechanical",
};
test("CLI input verification checks actual recording/source files, not just declared metadata", async () => {
  const folder = await mkdtemp(path.join(tmpdir(), "warshatak-eval-"));
  try {
    const bytes = await readFile(
      new URL(
        "../data/uploaded_audio_references/upload1-01.wav",
        import.meta.url,
      ),
    );
    await writeFile(path.join(folder, "sample.wav"), bytes);
    const hash = createHash("sha256").update(bytes).digest("hex"),
      record = {
        id: "file-integrity-fixture",
        file: "sample.wav",
        sourceFile: "sample.wav",
        audioSha256: hash,
        sourceGroup: hash,
      };
    assert.deepEqual(await verifyEvaluationFiles([record], folder), []);
    assert.match(
      (
        await verifyEvaluationFiles(
          [{ ...record, audioSha256: "0".repeat(64) }],
          folder,
        )
      ).join(" "),
      /does not match/,
    );
    assert.match(
      (
        await verifyEvaluationFiles(
          [{ ...record, sourceFile: "missing.wav" }],
          folder,
        )
      ).join(" "),
      /could not be read/,
    );
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});
// Synthetic metadata fixtures test the evaluator, NOT recognition performance.
test("uploaded suspected component labels cannot produce an accuracy report", async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL(
        "../data/uploaded_audio_references/manifest.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  assert.equal(manifest.records.length, 15);
  assert.ok(
    manifest.records.every(
      (r) =>
        r.fault_verified === false &&
        r.reported_problem.verification_status ===
          "unverified_suspected_fault" &&
        r.acoustics.reviewed_category === null,
    ),
  );
  const result = evaluateAudio({
    groundTruthType: "acoustic_category",
    references: manifest.records,
    testCases: [],
  });
  assert.equal(result.status, "blocked");
  assert.equal(result.metrics, null);
});
test("evaluation rejects source leakage, self matches, missing predictions and fault ground truth", () => {
  for (const change of [
    { groundTruthType: "fault" },
    { testCases: [{ ...sample, sourceGroup: references[0].source_sha256 }] },
    { testCases: [{ ...sample, audioSha256: references[0].sha256 }] },
    { testCases: [{ ...sample, reviewStatus: "uploader_claim" }] },
    { predictions: [] },
  ]) {
    assert.equal(
      evaluateAudio({
        groundTruthType: "acoustic_category",
        references,
        testCases: [sample],
        predictions: [prediction],
        ...change,
      }).status,
      "blocked",
    );
  }
});
test("top ranks, incorrect confident results, unknown rejection, speech and timings use real denominators", () => {
  const unknown = {
    ...sample,
    id: "speech",
    audioSha256: "5".repeat(64),
    sourceGroup: "6".repeat(64),
    category: "speech",
    contentType: "speech",
    expectedUnknown: true,
  };
  const p = {
    ...prediction,
    id: "speech",
    rankedCategories: [],
    rejected: true,
    confident: false,
    processingMs: 50,
    contentType: "speech",
  };
  const result = evaluateAudio({
    groundTruthType: "acoustic_category",
    references,
    testCases: [sample, unknown],
    predictions: [prediction, p],
  });
  assert.equal(result.status, "evaluated");
  assert.deepEqual(result.metrics, {
    top1: 0,
    top3: 1,
    knownCount: 1,
    incorrectConfidentPredictions: 1,
    unknownRejection: 1,
    unknownCount: 1,
    contentTypeAccuracy: 1,
    speechVersusCarAccuracy: 1,
    speechCarCount: 2,
    meanProcessingMs: 100,
  });
  assert.equal(result.confusionMatrix, null);
});
