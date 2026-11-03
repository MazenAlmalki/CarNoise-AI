// Edit the script/tagline here. Keep narration short enough for the 10.8s film.
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
    hint: "تجربة قصيرة · صوت اختياري",
    skip: "تخطي المقدمة",
    mute: "كتم الصوت",
    unmute: "تشغيل الصوت",
    replay: "إعادة المقدمة",
    settings: "تجربتك",
    language: "اللغة",
    missing: "لا يوجد صوت عربي متاح؛ تابع مع الترجمة المكتوبة.",
    blocked: "تعذّر تشغيل الصوت؛ المقدمة مستمرة مع النص.",
    dialog: "مقدمة ورشتك",
    enter: "جاهزين للمشوار.",
    recordedError: "تعذر تشغيل التعليق المسجّل؛ تابع مع النص.",
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
    hint: "A short introduction · optional sound",
    skip: "Skip intro",
    mute: "Mute sound",
    unmute: "Unmute sound",
    replay: "Replay intro",
    settings: "Your experience",
    language: "Language",
    missing: "No English voice is available. Continue with subtitles.",
    blocked:
      "Audio could not start. The introduction continues with subtitles.",
    dialog: "Warshatak introduction",
    enter: "Ready for the road.",
    recordedError:
      "Recorded narration could not play. Continue with subtitles.",
  },
};
export function introCueAt(milliseconds) {
  return milliseconds < 2600 ? 0 : milliseconds < 6000 ? 1 : 2;
}
