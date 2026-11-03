export function renderReferenceExample({
  message,
  language,
  enabled,
  onFeedback,
}) {
  const example = message.referenceExample;
  if (
    !example ||
    !/^upload[12]-\d{2}$/.test(example.id) ||
    example.url !== "/api/audio-references/" + example.id
  )
    return null;
  const ar = language === "ar",
    card = document.createElement("section");
  card.className = "reference-example";
  const title = document.createElement("h3");
  title.textContent = ar ? "مثال صوتي للمقارنة" : "Reference example";
  const reason = document.createElement("p");
  reason.textContent = example.reason;
  const uncertainty = document.createElement("p");
  uncertainty.className = "media-warning";
  uncertainty.textContent =
    (example.uncertainty || "") +
    " " +
    (ar
      ? "التشابه لا يؤكد عطلًا أو قطعة معينة."
      : "Resemblance does not confirm a fault or component.");
  const audio = document.createElement("audio");
  audio.controls = true;
  audio.preload = "none";
  audio.src = example.url;
  audio.setAttribute("aria-label", title.textContent);
  const notice = document.createElement("p");
  notice.setAttribute("role", "status");
  audio.onerror = () => {
    notice.textContent = ar
      ? "تعذر تشغيل المثال. تقدر تتخطاه وتكمل."
      : "Example playback failed. You can skip it and continue.";
  };
  const actions = document.createElement("div");
  actions.className = "reference-feedback";
  for (const [value, label, text] of [
    [
      "close",
      ar ? "قريب" : "Close",
      ar
        ? "الصوت قريب من المثال؛ هذا تأكيد للتشابه المسموع فقط، وليس تشخيصًا."
        : "My sound is close to the example; this confirms perceived resemblance only, not a diagnosis.",
    ],
    [
      "different",
      ar ? "مختلف" : "Different",
      ar ? "صوتي مختلف عن المثال." : "My sound is different from the example.",
    ],
    [
      "unsure",
      ar ? "مو متأكد" : "Not sure",
      ar
        ? "مو متأكد إن صوتي يشبه المثال."
        : "I am not sure whether my sound resembles the example.",
    ],
    [
      "skip",
      ar ? "تخطي" : "Skip",
      ar
        ? "تخطّ مقارنة المثال ولخص المتاح دون أسئلة إضافية."
        : "Skip this sound comparison and summarize without more questions.",
    ],
  ]) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.disabled = !enabled || !!message.referenceFeedback;
    button.setAttribute(
      "aria-pressed",
      String(message.referenceFeedback === value),
    );
    button.onclick = () => onFeedback(value, text);
    actions.append(button);
  }
  card.append(title, reason, audio, uncertainty, actions, notice);
  return card;
}
