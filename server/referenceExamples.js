import { hasHostedAudioEvidence } from "./geminiAudio.js";
import { loadAudioReferences } from "./audioReferences.js";
export const exampleQuestion = (language) =>
  language === "ar"
    ? "هذا مثال لصوت مشابه. هل الصوت اللي عندك قريب منه؟"
    : "Here’s a similar sound example. Does yours sound close to this?";
// Only a successful actual-audio comparison can nominate an example. Labels
// and waveform/text retrieval alone never nominate one. No fault is confirmed.
export async function selectReferenceExample({
  media,
  memory,
  plan,
  offered = [],
  skip = false,
}) {
  if (
    skip ||
    plan.urgent ||
    !plan.clarificationAllowed ||
    memory.questionsAsked >= 2 ||
    !hasHostedAudioEvidence(media) ||
    media.transcription?.hasRecognizedSpeech ||
    media.audioObservation.soundOrigin === "human_vocal_imitation"
  )
    return null;
  const comparison = media.audioObservation.referenceComparison;
  if (
    !["clear", "partial"].includes(comparison?.result) ||
    !comparison.reason?.trim()
  )
    return null;
  const seen = new Set(
    Array.isArray(offered)
      ? offered.filter((x) => typeof x === "string").slice(-100)
      : [],
  );
  const references = await loadAudioReferences();
  const candidate = comparison.matches?.find(
    (match) => !seen.has(match.id) && references.some((r) => r.id === match.id),
  );
  if (!candidate) return null;
  return {
    id: candidate.id,
    url: "/api/audio-references/" + candidate.id,
    reason: comparison.reason.slice(0, 500),
    uncertainty: media.audioObservation.uncertainty?.slice(0, 300) || "",
    diagnosisConfirmed: false,
  };
}
