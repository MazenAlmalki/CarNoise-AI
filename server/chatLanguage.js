// Actual message/speech language overrides the interface or an older case locale.
export function normalizedLanguage(value) {
  const text = String(value || "")
    .toLowerCase()
    .trim();
  return /^(?:ar(?:[-_].*)?|arabic|العربية)$/.test(text)
    ? "ar"
    : /^(?:en(?:[-_].*)?|english)$/.test(text)
      ? "en"
      : null;
}
export function detectReplyLanguage(message, selected = "ar") {
  const text = String(message || "");
  const arabic = (text.match(/\p{Script=Arabic}/gu) || []).length;
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  if (
    arabic >= 3 &&
    (arabic >= latin * 0.6 ||
      (normalizedLanguage(selected) === "ar" && arabic >= latin * 0.3))
  )
    return "ar";
  if (arabic > latin) return "ar";
  if (latin > arabic) return "en";
  if (arabic) return normalizedLanguage(selected) || "ar";
  return normalizedLanguage(selected) || "ar";
}
export function spokenReplyLanguage(transcription, selected = "ar") {
  if (
    transcription?.hasRecognizedSpeech !== true ||
    !String(transcription.text || "").trim()
  )
    return normalizedLanguage(selected) || "ar";
  // An Arabic script transcript is direct evidence; provider acoustic-language
  // metadata also covers Arabizi/transliterated speech without forcing translation.
  if (/\p{Script=Arabic}/u.test(transcription.text)) return "ar";
  return (
    normalizedLanguage(transcription.language) ||
    detectReplyLanguage(transcription.text, selected)
  );
}
export function replyMatchesLanguage(reply, language) {
  const text = String(reply || "");
  const arabic = (text.match(/\p{Script=Arabic}/gu) || []).length;
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  if (!arabic && !latin) return !/\p{L}/u.test(text);
  if (language === "ar") return arabic > 0 && arabic >= latin * 0.2;
  return latin > 0 && latin >= arabic;
}
