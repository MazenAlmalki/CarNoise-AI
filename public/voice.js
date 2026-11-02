// Browser-only, opt-in speech. Preference storage is independent of garage data.
export function createVoice({ container, getLanguage, onState, canSpeak = () => true }) {
  const synth = globalThis.speechSynthesis,
    supported = !!synth && !!globalThis.SpeechSynthesisUtterance;
  let prefs = { auto: false, muted: false, voice: "" },
    utterance = null,
    generation = 0;
  try {
    prefs = {
      ...prefs,
      ...JSON.parse(localStorage.getItem("warshatak-voice") || "{}"),
    };
  } catch {}
  prefs.auto = prefs.auto === true;
  prefs.muted = prefs.muted === true;
  let status = "idle";
  const words = {
    ar: {
      title: "صوت الميكانيكي",
      auto: "قراءة الردود تلقائيًا",
      mute: "كتم الصوت",
      play: "اقرأ الرد",
      pause: "إيقاف مؤقت",
      resume: "متابعة",
      stop: "إيقاف",
      voice: "الصوت",
      default: "صوت الجهاز",
      unsupported: "القراءة الصوتية غير متاحة في هذا المتصفح.",
      missing: "لا يوجد صوت عربي على الجهاز. يمكنك قراءة الرد كنص.",
      ready: "جاهز للقراءة",
      recording: "أوقف التسجيل أولًا لتشغيل الصوت.",
      speaking: "يتحدث الآن",
      paused: "القراءة متوقفة مؤقتًا",
      failed: "تعذّر تشغيل الصوت. جرّب صوتًا آخر.",
    },
    en: {
      title: "Mechanic voice",
      auto: "Read new replies automatically",
      mute: "Mute voice",
      play: "Read reply",
      pause: "Pause",
      resume: "Resume",
      stop: "Stop",
      voice: "Voice",
      default: "Device voice",
      unsupported: "Read-aloud is unavailable in this browser.",
      missing: "No English voice is installed. The reply is available as text.",
      ready: "Ready to read",
      recording: "Stop recording before playing speech.",
      speaking: "Speaking",
      paused: "Speech paused",
      failed: "Could not play speech. Try another voice.",
    },
  };
  const w = () => words[getLanguage()];
  function save() {
    try {
      localStorage.setItem("warshatak-voice", JSON.stringify(prefs));
    } catch {}
  }
  function button(label, fn) {
    const n = document.createElement("button");
    n.type = "button";
    n.textContent = label;
    n.onclick = fn;
    return n;
  }
  function setStatus(next) {
    status = next;
    onState(next);
    const n = container.querySelector("[role=status]");
    if (n)
      n.textContent =
        w()[
          next === "speaking"
            ? "speaking"
            : next === "paused"
              ? "paused"
              : "ready"
        ];
  }
  function stop() {
    generation++;
    synth?.cancel();
    utterance = null;
    setStatus("idle");
  }
  function speak(text) {
    stop();
    if (!supported || prefs.muted) return;
    if (!canSpeak()) { container.querySelector("[role=status]").textContent=w().recording; return; }
    const lang = getLanguage() === "ar" ? "ar" : "en",
      voices = synth
        .getVoices()
        .filter((v) => v.lang.toLowerCase().startsWith(lang));
    if (!voices.length) {
      container.querySelector("[role=status]").textContent = w().missing;
      return;
    }
    const id = generation;
    utterance = new SpeechSynthesisUtterance(
      String(text).replace(/[*#`]/g, "").slice(0, 4000),
    );
    utterance.lang = lang === "ar" ? "ar-SA" : "en-US";
    utterance.voice =
      voices.find((v) => v.voiceURI === prefs.voice) || voices[0];
    utterance.onpause = () => {
      if (id === generation) setStatus("paused");
    };
    utterance.onresume = () => {
      if (id === generation) setStatus("speaking");
    };
    utterance.onstart = () => {
      if (id === generation) setStatus("speaking");
    };
    utterance.onend = () => {
      if (id === generation) {
        utterance = null;
        setStatus("idle");
      }
    };
    utterance.onerror = () => {
      if (id === generation) {
        utterance = null;
        setStatus("idle");
        container.querySelector("[role=status]").textContent = w().failed;
      }
    };
    try { synth.speak(utterance); }
    catch { utterance=null;setStatus('idle');container.querySelector('[role=status]').textContent=w().failed; }
  }
  function render() {
    container.replaceChildren();
    const title = document.createElement("summary");
    title.textContent = w().title;
    container.append(title);
    if (!supported) {
      const n = document.createElement("p");
      n.textContent = w().unsupported;
      container.append(n);
      return;
    }
    const body = document.createElement("div");
    body.className = "voice-settings";
    for (const [key, label] of [
      ["auto", "auto"],
      ["muted", "mute"],
    ]) {
      const l = document.createElement("label"),
        input = document.createElement("input");
      input.type = "checkbox";
      input.checked = !!prefs[key];
      input.onchange = () => {
        prefs[key] = input.checked;
        save();
        if (key === "muted" && input.checked) stop();
      };
      l.append(input, document.createTextNode(w()[label]));
      body.append(l);
    }
    const label = document.createElement("label");
    label.textContent = w().voice;
    const select = document.createElement("select");
    select.setAttribute("aria-label", w().voice);
    const voices = synth
      .getVoices()
      .filter((v) => v.lang.toLowerCase().startsWith(getLanguage()));
    const fallback = document.createElement("option");
    fallback.value = "";
    fallback.textContent = w().default;
    select.append(fallback);
    voices.forEach((v) => {
      const o = document.createElement("option");
      o.value = v.voiceURI;
      o.textContent = v.name;
      select.append(o);
    });
    select.value = prefs.voice;
    select.onchange = () => {
      prefs.voice = select.value;
      save();
      stop();
    };
    label.append(select);
    body.append(label);
    const controls = document.createElement("div");
    controls.className = "voice-controls";
    controls.append(
      button(w().pause, () => {
        if (status === "speaking") {
          synth.pause();
        }
      }),
      button(w().resume, () => {
        if (status === "paused") {
          synth.resume();
        }
      }),
      button(w().stop, stop),
    );
    body.append(controls);
    const note = document.createElement("p");
    note.setAttribute("role", "status");
    note.textContent = voices.length ? w().ready : w().missing;
    body.append(note);
    container.append(body);
  }
  render();
  synth?.addEventListener?.("voiceschanged", render);
  globalThis.addEventListener("pagehide", stop);
  return {
    stop,
    render,
    speak,
    autoSpeak(text) {
      if (prefs.auto && !prefs.muted) speak(text);
    },
    readButton(text) {
      const n = button(w().play, () => speak(text));
      n.className = "read-reply";
      n.disabled = !supported;
      return n;
    },
  };
}
