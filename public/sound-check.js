import { createVoice } from "./voice.js";
const $ = (id) => document.getElementById(id);
const copy = {
  ar: {
    back: "الرجوع لورشتك",
    title: "خلّنا نحدد وين ينقطع الصوت",
    intro:
      "هذه الاختبارات لا تحتاج مفتاح API، ولا ترفع تسجيلك. يبدأ الصوت فقط عند الضغط على تشغيل.",
    toneTitle: "١. نغمة معروفة",
    toneHint:
      "اضغط تشغيل. النغمة مدتها ثانية واحدة. إذا تحرك الوقت بدون صوت، راجع كتم موقع localhost ومخرج الصوت لهذا التبويب.",
    heard: "سمعت النغمة",
    silent: "ما سمعتها",
    speechTitle: "٢. صوت الميكانيكي",
    speechHint:
      "إذا سمعت النغمة ولم تسمع الكلام، افتح الخيارات أدناه ثم «تجربة الصوت». إلغاء الكتم واختيار صوت هنا يطبّق على ورشتك أيضًا.",
    micTitle: "٣. الميكروفون والتسجيل",
    micHint:
      "ابدأ وتكلم لعشر ثوانٍ كحد أقصى. إذا بقي المؤشر صفرًا أثناء الكلام، جرّب ميكروفونًا آخر. بعد الإيقاف شغّل التسجيل أو نزّله.",
    input: "الميكروفون",
    default: "الافتراضي",
    record: "ابدأ التسجيل",
    stop: "إيقاف التسجيل",
    level: "مستوى الإشارة",
    download: "تنزيل التسجيل لفحصه خارج المتصفح",
    outputTitle: "مخرج تشغيل النغمة والتسجيل",
    output: "السماعة",
    outputHint:
      "تظهر الأجهزة المتاحة بعد السماح بالميكروفون. تغيير المخرج هنا يخص الاختبار؛ صوت الميكانيكي يستخدم مخرج الكلام في النظام.",
    report: "جهز نتيجة الاختبار للمشاركة",
    result: "انسخ النتيجة وأرسلها في المحادثة",
  },
  en: {
    back: "Back to Warshatak",
    title: "Find where the sound stops",
    intro:
      "These checks need no API key and never upload your recording. Audio starts only when you press Play.",
    toneTitle: "1. Known test tone",
    toneHint:
      "Play the one-second tone. If time moves without audible sound, check localhost site mute and this tab’s audio output.",
    heard: "I heard the tone",
    silent: "I could not hear it",
    speechTitle: "2. Mechanic voice",
    speechHint:
      "If the tone works but speech does not, use Test voice below. Mute and voice changes also apply to Warshatak.",
    micTitle: "3. Microphone and recording",
    micHint:
      "Start and speak for up to ten seconds. If the meter stays at zero while speaking, try another microphone. Then play or download the recording.",
    input: "Microphone",
    default: "Default",
    record: "Start recording",
    stop: "Stop recording",
    level: "Signal level",
    download: "Download recording to test outside the browser",
    outputTitle: "Test tone and recording output",
    output: "Speaker",
    outputHint:
      "Available devices appear after microphone permission. Output changes apply to this test; speech uses the system speech output.",
    report: "Prepare test report",
    result: "Copy this result into the chat",
  },
};
let lang =
    new URLSearchParams(location.search).get("lang") === "en" ? "en" : "ar",
  stream = null,
  recorder = null,
  context = null,
  frame = null,
  stopTimer = null,
  url = null,
  requestId = 0;
const report = {
  toneHeard: "not_answered",
  toneState: "not_played",
  speechState: "not_started",
  micState: "not_started",
};
const say = (ar, en) => (lang === "ar" ? ar : en);
const voice = createVoice({
  container: $("voice"),
  getLanguage: () => lang,
  canSpeak: () => !stream,
  onState: (state) => {
    report.speechState = state;
  },
  onNotice: (message) => {
    $("speechStatus").textContent = message;
    report.speechNotice = message;
  },
});
function render() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document
    .querySelectorAll("[data-copy]")
    .forEach((n) => (n.textContent = copy[lang][n.dataset.copy]));
  $("language").textContent = lang === "ar" ? "English" : "العربية";
  voice.stop();
  voice.render();
  if (recorder?.state === "recording")
    $("record").textContent = copy[lang].stop;
}
$("language").onclick = () => {
  lang = lang === "ar" ? "en" : "ar";
  render();
};
render();
for (const event of ["playing", "pause", "ended", "error"])
  $("tone").addEventListener(event, () => {
    report.toneState = event;
    report.toneError = $("tone").error?.code || null;
    $("toneStatus").textContent =
      event === "error"
        ? say("فشل فك أو تشغيل الملف.", "The file failed to decode/play.")
        : say("حالة المشغّل: ", "Player state: ") + event;
  });
$("heard").onclick = () => {
  report.toneHeard = true;
  $("guidance").textContent = say(
    "مخرج النغمة مسموع حسب تأكيدك. جرّب الكلام والتسجيل كل واحد لحاله.",
    "You confirmed the tone is audible. Test speech and recording separately.",
  );
};
$("silent").onclick = () => {
  report.toneHeard = false;
  $("guidance").textContent = say(
    "راجع كتم تبويب localhost وإذن الصوت ومخرج التشغيل أدناه. تشغيل المؤشر وحده لا يثبت خروج صوت مسموع.",
    "Check localhost tab mute, site sound permission and the output below. A moving playback timer does not prove audible output.",
  );
};
async function devices() {
  const list = await navigator.mediaDevices.enumerateDevices();
  for (const [id, kind] of [
    ["input", "audioinput"],
    ["output", "audiooutput"],
  ]) {
    const node = $(id),
      selected = node.value;
    node.replaceChildren();
    const defaultOption = new Option(copy[lang].default, "");
    node.add(defaultOption);
    list
      .filter((d) => d.kind === kind && d.deviceId && d.deviceId !== "default")
      .forEach((d, i) =>
        node.add(new Option(d.label || kind + " " + (i + 1), d.deviceId)),
      );
    node.value = selected;
  }
  if (!("setSinkId" in $("tone"))) {
    $("output").disabled = true;
    $("outputStatus").textContent = say(
      "اختيار المخرج غير مدعوم هنا؛ استخدم إعدادات الصوت في النظام.",
      "Output selection is unsupported here; use system audio settings.",
    );
  }
}
$("output").onchange = async () => {
  try {
    if (!("setSinkId" in $("tone"))) throw Error("unsupported");
    await $("tone").setSinkId($("output").value);
    await $("recorded").setSinkId($("output").value);
    $("outputStatus").textContent = say(
      "تم اختيار المخرج للاختبار.",
      "Test output selected.",
    );
  } catch (error) {
    $("outputStatus").textContent =
      say("تعذّر اختيار المخرج: ", "Cannot select output: ") + error.name;
  }
};
function stopTracks() {
  cancelAnimationFrame(frame);
  clearTimeout(stopTimer);
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  context?.close().catch(() => {});
  context = null;
  $("level").value = 0;
}
$("record").onclick = async () => {
  if (recorder?.state === "recording") {
    recorder.stop();
    return;
  }
  const id = ++requestId;
  voice.stop();
  $("tone").pause();
  $("recorded").pause();
  $("record").disabled = true;
  try {
    if (!navigator.mediaDevices?.getUserMedia || !globalThis.MediaRecorder)
      throw new Error("Microphone recording is unavailable in this browser.");
    const captured = await navigator.mediaDevices.getUserMedia({
      audio: $("input").value
        ? { deviceId: { exact: $("input").value } }
        : true,
    });
    if (id !== requestId) {
      captured.getTracks().forEach((t) => t.stop());
      return;
    }
    stream = captured;
    await devices().catch(() => {});
    const active = new MediaRecorder(captured),
      chunks = [];
    recorder = active;
    let peak = 0;
    const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (Context) {
      try {
        context = new Context();
        await context.resume();
        const analyser = context.createAnalyser();
        analyser.fftSize = 1024;
        context.createMediaStreamSource(captured).connect(analyser);
        const data = new Float32Array(analyser.fftSize);
        const update = () => {
          if (!stream) return;
          analyser.getFloatTimeDomainData(data);
          const rms = Math.sqrt(
            data.reduce((sum, x) => sum + x * x, 0) / data.length,
          );
          peak = Math.max(peak, rms);
          $("level").value = Math.min(100, rms * 400);
          report.micPeakRms = Number(peak.toFixed(6));
          frame = requestAnimationFrame(update);
        };
        update();
      } catch {
        report.meterUnavailable = true;
      }
    }
    active.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    active.onstop = () => {
      stopTracks();
      if (id !== requestId) return;
      const blob = new Blob(chunks, { type: active.mimeType });
      if (url) URL.revokeObjectURL(url);
      url = URL.createObjectURL(blob);
      $("recorded").src = url;
      $("recorded").hidden = false;
      $("download").href = url;
      $("download").download = blob.type.includes("mp4")
        ? "microphone-test.m4a"
        : "microphone-test.webm";
      $("download").hidden = false;
      report.micState = "recorded";
      report.recordingBytes = blob.size;
      report.recordingType = blob.type;
      $("micStatus").textContent = say(
        "تم حفظ التسجيل محليًا. شغّله وقارنه بالنغمة.",
        "Recording saved locally. Play it and compare with the tone.",
      );
      $("record").textContent = copy[lang].record;
      recorder = null;
    };
    active.onerror = () => {
      requestId++;
      stopTracks();
      recorder = null;
      report.micState = "failed";
      report.micError = "encoding_failed";
      $("record").textContent = copy[lang].record;
      $("micStatus").textContent = say(
        "فشل ترميز التسجيل. جرّب متصفحًا آخر.",
        "Recording encoding failed. Try another browser.",
      );
    };
    active.start();
    report.micState = "recording";
    $("record").textContent = copy[lang].stop;
    $("micStatus").textContent = say(
      "التسجيل شغال، تكلم الآن.",
      "Recording; speak now.",
    );
    stopTimer = setTimeout(() => {
      if (active.state === "recording") active.stop();
    }, 10000);
  } catch (error) {
    stopTracks();
    report.micState = "failed";
    report.micError = error.name;
    $("micStatus").textContent =
      say("تعذّر التسجيل: ", "Recording failed: ") + error.name;
  } finally {
    $("record").disabled = false;
  }
};
$("report").onclick = () => {
  $("result").value = JSON.stringify(
    {
      ...report,
      tone: {
        muted: $("tone").muted,
        volume: $("tone").volume,
        readyState: $("tone").readyState,
      },
      recording: { muted: $("recorded").muted, volume: $("recorded").volume },
      speechSupported: !!globalThis.speechSynthesis,
      voiceLanguages:
        globalThis.speechSynthesis?.getVoices().map((v) => v.lang) || [],
      secureContext: isSecureContext,
    },
    null,
    2,
  );
  $("result").focus();
  $("result").select();
};
addEventListener("pagehide", () => {
  requestId++;
  if (recorder?.state === "recording") recorder.stop();
  stopTracks();
  voice.stop();
  if (url) URL.revokeObjectURL(url);
});
devices().catch(() => {});
