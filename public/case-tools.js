// Additive display helpers: never migrate IDs, descriptions, messages or media.
const generic =
  /^(?:hi|hello|hey|thanks|thank you|هلا|هلا والله|مرحبا|مرحباً|السلام عليكم|وعليكم السلام|شكرا|شكرًا|تمام|اوكي|حلل (?:المرفق|المقطع|الصوت|التسجيل).*$|analy[sz]e (?:the )?(?:attachment|clip|audio|recording).*$)[\s.!،]*$/iu;
const clean = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();
const control =
  /^(?:تخط[ّ\s]|skip this question|ساعدني أوصف صوت السيارة|help me describe the car sound)/iu;
export function caseTitle(entry, language = "ar") {
  if (clean(entry.title)) return clean(entry.title).slice(0, 90);
  const user = (entry.messages || [])
    .filter((m) => m.role === "user")
    .map((m) => clean(m.content))
    .filter((s) => !control.test(s));
  const transcript = entry.mediaAnalysis?.transcription?.hasRecognizedSpeech
    ? clean(entry.mediaAnalysis.transcription.text)
    : "";
  const candidates = [...user, transcript, clean(entry.description)].filter(
    (t) => t && !generic.test(t),
  );
  const title = candidates[0]?.replace(
    /^(?:السلام عليكم|مرحبا|هلا والله|هلا|hello|hi|hey)[\s،,.!]+/iu,
    "",
  );
  return (
    title?.slice(0, 65) ||
    (entry.mediaId
      ? language === "ar"
        ? "مراجعة مقطع السيارة"
        : "Vehicle recording review"
      : language === "ar"
        ? "محادثة جديدة"
        : "New conversation")
  );
}
export function filterCases(cases, carId, query = "", language = "ar") {
  const normalized = clean(query).toLocaleLowerCase().normalize("NFKC");
  return cases
    .filter((c) => c.carId === carId)
    .filter(
      (c) =>
        !normalized ||
        [
          caseTitle(c, language),
          c.description,
          ...(c.messages || []).map((m) => m.content),
        ].some((s) =>
          clean(s).toLocaleLowerCase().normalize("NFKC").includes(normalized),
        ),
    )
    .slice()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}
export function buildProblemSummary(entry, language = "ar") {
  if (Object.hasOwn(entry, "problemSummary") && entry.problemSummary === null)
    return null;
  const ar = language === "ar",
    analysis = entry.mediaAnalysis,
    observation =
      analysis?.audioEventAnalysis?.succeeded === true
        ? analysis.audioObservation
        : null;
  const user = (entry.messages || [])
    .filter((m) => m.role === "user")
    .map((m) => clean(m.content))
    .filter((s) => s && !generic.test(s) && !control.test(s));
  if (
    analysis?.transcription?.hasRecognizedSpeech &&
    clean(analysis.transcription.text)
  )
    user.push(
      (ar
        ? "تفريغ تلقائي قابل للتصحيح: "
        : "Automatic transcript, may need correction: ") +
        clean(analysis.transcription.text),
    );
  const assessment =
    entry.problemSummary?.assessment ||
    (entry.messages || []).findLast((m) => m.role === "assistant")?.content ||
    entry.result?.summary;
  if (!assessment) return null;
  if (!user.length && !entry.mediaId && !entry.result) return null;
  const evidence = observation
    ? [
        clean(observation.description),
        ...(observation.sounds || []).map(clean),
      ].filter(Boolean)
    : [];
  const uncertainty = [
    ar
      ? "الاحتمالات لم يؤكدها فحص ميكانيكي."
      : "Possibilities have not been confirmed by a mechanic.",
  ];
  if (observation?.uncertainty)
    uncertainty.push(clean(observation.uncertainty));
  if (!evidence.length)
    uncertainty.push(
      ar
        ? "لا تتوفر ملاحظات صوتية ناجحة؛ قياسات الموجة وحدها لا تحدد الصوت."
        : "No successful sound observations are available; waveform measurements alone do not identify a sound.",
    );
  if (
    entry.mediaAnalysisError ||
    (analysis?.audioEventAnalysis?.attempted &&
      !analysis.audioEventAnalysis.succeeded)
  )
    uncertainty.push(
      ar
        ? "حدث تعذر تقني في التحليل؛ هذا لا يعني أن الصوت غير معروف."
        : "Analysis had a technical failure; that does not mean the sound is unfamiliar.",
    );
  const comparison = observation?.referenceComparison;
  const references = (comparison?.matches || []).map(
    (r) => (ar ? r.label_ar : r.label_en) || r.id,
  );
  if (references.length)
    uncertainty.push(
      (ar ? "تسميات صاحب المقطع غير مؤكدة: " : "Unverified uploader labels: ") +
        references.join(ar ? "، " : ", "),
    );
  return {
    vehicle: "",
    symptoms: [...new Set(user)].slice(-8),
    assessment: clean(assessment),
    evidence: [...new Set(evidence)].slice(0, 6),
    uncertainty,
    confirmedFindings: [],
    nextStep:
      entry.problemSummary?.nextStep ||
      (ar
        ? "احتفظ بالمقطع والوصف واطلب فحصًا مناسبًا قبل تغيير أي قطعة."
        : "Keep the recording and symptom notes; arrange an appropriate inspection before replacing parts."),
    urgent: entry.problemSummary?.urgent === true,
  };
}
export function summaryText(summary, language = "ar") {
  const ar = language === "ar";
  return [
    ar ? "ورشتك — ملخص مشكلة السيارة" : "Warshatak — Car problem summary",
    summary.vehicle,
    (ar ? "ما ذكره المستخدم: " : "User-reported symptoms: ") +
      (summary.symptoms.join(" / ") ||
        (ar ? "لم يُذكر وصف محدد." : "No specific description supplied.")),
    (ar
      ? "تقييم المساعد — احتمالات: "
      : "Assistant assessment — possibilities: ") + summary.assessment,
    (ar
      ? "ملاحظات صوتية من النموذج — قد تخطئ: "
      : "Model sound observations — may be wrong: ") +
      (summary.evidence.join(" / ") || (ar ? "لا تتوفر." : "Unavailable.")),
    (ar ? "ما لم يتأكد: " : "Uncertainties: ") +
      summary.uncertainty.join(" / "),
    ar
      ? "نتائج ميكانيكية مؤكدة: لا يوجد فحص موثق."
      : "Confirmed mechanical findings: No documented inspection.",
    (ar ? "الخطوة الآمنة: " : "Safe next step: ") + summary.nextStep,
    summary.urgent
      ? ar
        ? "أولوية سلامة: ظهرت أعراض خطر في الوصف؛ توقف بأمان واطلب المساعدة."
        : "Safety priority: danger signs were reported; stop safely and get assistance."
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}
