// Silent intro copy/timing. No music, narration or audio initialization.
export const INTRO_DURATION = 10800;
export const INTRO_SEEN_KEY = "warshatak-cinematic-v1";
export const introCopy = {
  ar: {
    name: "ورشتك",
    tagline: "معك، في كل مشوار.",
    lines: [
      "ورشتك.",
      "لكل صوت حكاية.",
      "نفهم الإشارات، ونوضح لك الخطوة الجاية.",
    ],
    begin: "اضغط وابدأ الرحلة",
    hint: "مقدمة قصيرة · بدون صوت",
    skip: "تخطي المقدمة",
    replay: "إعادة المقدمة",
    settings: "تجربتك",
    language: "اللغة",
    dialog: "مقدمة ورشتك",
  },
  en: {
    name: "Warshatak",
    tagline: "With you. Every mile.",
    lines: [
      "Warshatak.",
      "Every sound tells a story.",
      "Understand the signs, and find your next step.",
    ],
    begin: "Tap to begin the journey",
    hint: "A short introduction · no sound",
    skip: "Skip intro",
    replay: "Replay intro",
    settings: "Your experience",
    language: "Language",
    dialog: "Warshatak introduction",
  },
};
export function introCueAt(milliseconds) {
  return milliseconds < 2600 ? 0 : milliseconds < 6000 ? 1 : 2;
}
