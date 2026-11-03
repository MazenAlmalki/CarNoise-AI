import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { SOUND_CATEGORIES } from "../server/acousticCategories.js";

// Evaluate acoustic categories only. This never trains a model, calls a provider
// or treats a component title as truth. Predictions are captured separately.
export function evaluateAudio({
  groundTruthType,
  references = [],
  testCases = [],
  predictions = [],
}) {
  const blocked = [];
  if (groundTruthType !== "acoustic_category")
    blocked.push(
      "Only independently reviewed acoustic-category ground truth is allowed.",
    );
  if (!references.length) blocked.push("No reference set.");
  if (
    references.some(
      (r) =>
        !SOUND_CATEGORIES.includes(r.acoustics?.reviewed_category) ||
        r.acoustics?.review_status !== "independently_reviewed",
    )
  )
    blocked.push(
      "Reference acoustic categories still need independent review; suspected component labels cannot substitute.",
    );
  if (
    references.some(
      (r) =>
        !/^[a-f0-9]{64}$/.test(r.sha256 || "") ||
        !/^[a-f0-9]{64}$/.test(r.source_group_sha256 || r.source_sha256 || ""),
    )
  )
    blocked.push("Reference audio/source hashes are missing or invalid.");
  if (!testCases.length) blocked.push("No independent held-out recordings.");
  const referenceHashes = new Set(references.map((r) => r.sha256)),
    groups = new Set(
      references.map((r) => r.source_group_sha256 || r.source_sha256),
    );
  const seenIds = new Set(),
    seenHashes = new Set(),
    predicted = new Map();
  for (const p of predictions) {
    if (!p?.id || predicted.has(p.id))
      blocked.push("Duplicate or missing prediction ID.");
    predicted.set(p.id, p);
  }
  for (const sample of testCases) {
    if (!sample.id || seenIds.has(sample.id))
      blocked.push("Duplicate or missing test ID.");
    seenIds.add(sample.id);
    if (
      !/^[a-f0-9]{64}$/.test(sample.audioSha256 || "") ||
      !/^[a-f0-9]{64}$/.test(sample.sourceGroup || "")
    )
      blocked.push(`${sample.id}: missing audio/source hashes.`);
    if (
      referenceHashes.has(sample.audioSha256) ||
      groups.has(sample.sourceGroup) ||
      seenHashes.has(sample.audioSha256)
    )
      blocked.push(
        `${sample.id}: reference/source leakage or duplicate recording.`,
      );
    seenHashes.add(sample.audioSha256);
    if (
      sample.reviewStatus !== "independently_reviewed" ||
      !SOUND_CATEGORIES.includes(sample.category) ||
      !["mechanical", "speech", "music", "silence", "other"].includes(
        sample.contentType,
      ) ||
      typeof sample.expectedUnknown !== "boolean"
    )
      blocked.push(
        `${sample.id}: unreviewed acoustic category/content type or unknown status.`,
      );
    const p = predicted.get(sample.id);
    if (
      !p ||
      !Array.isArray(p.rankedCategories) ||
      p.rankedCategories.some((c) => !SOUND_CATEGORIES.includes(c)) ||
      new Set(p.rankedCategories).size !== p.rankedCategories.length ||
      typeof p.rejected !== "boolean" ||
      typeof p.confident !== "boolean" ||
      !Number.isFinite(p.processingMs) ||
      p.processingMs < 0 ||
      !["mechanical", "speech", "music", "silence", "other"].includes(
        p.contentType,
      )
    )
      blocked.push(`${sample.id}: missing or malformed prediction/timing.`);
  }
  if (blocked.length)
    return {
      status: "blocked",
      reasons: [...new Set(blocked)],
      referenceCount: references.length,
      testCount: testCases.length,
      metrics: null,
    };
  let top1 = 0,
    top3 = 0,
    known = 0,
    unknown = 0,
    rejected = 0,
    confidentErrors = 0,
    contentCorrect = 0,
    elapsed = 0,
    speechCarCount = 0,
    speechCarCorrect = 0;
  const matrix = {};
  for (const sample of testCases) {
    const p = predicted.get(sample.id),
      first = p.rejected ? "rejected" : p.rankedCategories[0] || "unclassified";
    elapsed += p.processingMs;
    contentCorrect += Number(p.contentType === sample.contentType);
    if (["speech", "mechanical"].includes(sample.contentType)) {
      speechCarCount++;
      speechCarCorrect += Number(p.contentType === sample.contentType);
    }
    if (sample.expectedUnknown) {
      unknown++;
      rejected += Number(p.rejected);
      if (p.confident && !p.rejected) confidentErrors++;
    } else {
      known++;
      top1 += Number(first === sample.category);
      top3 += Number(
        !p.rejected && p.rankedCategories.slice(0, 3).includes(sample.category),
      );
      if (p.confident && first !== sample.category) confidentErrors++;
    }
    matrix[sample.category] ||= {};
    matrix[sample.category][first] = (matrix[sample.category][first] || 0) + 1;
  }
  return {
    status: "evaluated",
    scope: "Acoustic-category evaluation, never component-fault accuracy",
    referenceCount: references.length,
    testCount: testCases.length,
    metrics: {
      top1: known ? top1 / known : null,
      top3: known ? top3 / known : null,
      knownCount: known,
      incorrectConfidentPredictions: confidentErrors,
      unknownRejection: unknown ? rejected / unknown : null,
      unknownCount: unknown,
      contentTypeAccuracy: contentCorrect / testCases.length,
      speechVersusCarAccuracy: speechCarCount
        ? speechCarCorrect / speechCarCount
        : null,
      speechCarCount,
      meanProcessingMs: elapsed / testCases.length,
    },
    confusionMatrix:
      testCases.length >= 10 && Object.keys(matrix).length >= 2 ? matrix : null,
  };
}
export async function verifyEvaluationFiles(testCases, basePath) {
  const errors = [];
  for (const sample of testCases) {
    for (const [field, hashField] of [
      ["file", "audioSha256"],
      ["sourceFile", "sourceGroup"],
    ]) {
      if (typeof sample[field] !== "string" || !sample[field].trim()) {
        errors.push(
          `${sample.id}: missing ${field} path for file verification.`,
        );
        continue;
      }
      try {
        const bytes = await readFile(path.resolve(basePath, sample[field]));
        if (
          createHash("sha256").update(bytes).digest("hex") !== sample[hashField]
        )
          errors.push(
            `${sample.id}: ${field} does not match its declared hash.`,
          );
      } catch {
        errors.push(`${sample.id}: ${field} could not be read.`);
      }
    }
  }
  return errors;
}
async function main() {
  const configPath = path.resolve(
      process.argv[2] || "data/car-audio/evaluation.json",
    ),
    config = JSON.parse(await readFile(configPath, "utf8"));
  const manifest = JSON.parse(
    await readFile(
      path.resolve(path.dirname(configPath), config.referenceManifest),
      "utf8",
    ),
  );
  const predictions = process.argv[3]
    ? JSON.parse(await readFile(process.argv[3], "utf8"))
    : [];
  const result = evaluateAudio({
    ...config,
    references: manifest.records,
    predictions,
  });
  const fileErrors = await verifyEvaluationFiles(
    config.testCases || [],
    path.dirname(configPath),
  );
  if (fileErrors.length) {
    result.status = "blocked";
    result.reasons = [...(result.reasons || []), ...fileErrors];
    result.metrics = null;
    delete result.confusionMatrix;
  }
  console.log(JSON.stringify(result, null, 2));
  if (result.status === "blocked") process.exitCode = 2;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
)
  await main();
