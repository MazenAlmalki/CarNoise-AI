// Browser-only, opt-in speech. Preference storage is independent of garage data.
export function createVoice({
  container,
  getLanguage,
  onState,
  canSpeak = () => true,
  onMouth = () => {},
  onNotice = () => {},
}) {
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
  let status = "idle",
    startTimer = null,
    mouthTimer = null;
  const segments = (text) =>
    String(text)
      .replace(/[*#`]/g, "")
      .match(/[^.!؟?\n]{1,200}(?:[.!؟?\n]+|$)|[^.!؟?\n]{1,200}/gu) || [];
  function closeMouth() {
    clearTimeout(mouthTimer);
    onMouth(0.12);
  }
  function pulseMouth(length = 4) {
    if (globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      closeMouth();
      return;
    }
    clearTimeout(mouthTimer);
    onMouth(1.4);
    mouthTimer = setTimeout(
      () => onMouth(0.12),
      Math.min(240, 80 + length * 12),
    );
  }
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
      test: "تجربة الصوت",
      default: "صوت الجهاز",
      unsupported: "القراءة الصوتية غير متاحة في هذا المتصفح.",
      missing: "صوت عربي غير ظاهر؛ سنحاول صوت الجهاز باللغة العربية.",
      loading: "جاري تشغيل صوت الجهاز…",
      unavailable:
        "تعذّر تشغيل العربية. أضف صوتًا عربيًا من إعدادات الكلام في الجهاز، ثم أعد فتح المتصفح.",
      blocked: "المتصفح منع الصوت. اضغط «اقرأ الرد» للسماح بالتشغيل.",
      timeout:
        "محرك الصوت لم يستجب. جرّب صوتًا آخر من القائمة أو أعد فتح المتصفح.",
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
      test: "Test voice",
      default: "Device voice",
      unsupported: "Read-aloud is unavailable in this browser.",
      missing:
        "No English voice is listed; trying the device voice in English.",
      loading: "Starting device speech…",
      unavailable:
        "The requested language is unavailable. Install a matching speech voice in your device settings, then reopen the browser.",
      blocked:
        "Your browser blocked speech. Click Read reply to start playback.",
      timeout:
        "The speech engine did not respond. Try another voice or reopen the browser.",
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
              : next === "loading"
                ? "loading"
                : "ready"
        ];
  }
  function stop() {
    generation++;
    clearTimeout(startTimer);
    closeMouth();
    synth?.cancel();
    utterance = null;
    setStatus("idle");
  }
  function fail(key) {
    generation++;
    synth?.cancel();
    onNotice(w()[key] || w().failed);
    clearTimeout(startTimer);
    closeMouth();
    utterance = null;
    setStatus("idle");
    const note = container.querySelector("[role=status]");
    if (note) note.textContent = w()[key] || w().failed;
    container.open = true;
  }
  function speak(text) {
    stop();
    onNotice("");
    if (!supported) {
      onNotice(w().unsupported);
      return;
    }
    if (prefs.muted) {
      container.open = true;
      const message =
        getLanguage() === "ar"
          ? "الصوت مكتوم. أزل خيار كتم الصوت من قائمة صوت الميكانيكي أولًا."
          : "Voice is muted. Uncheck Mute voice in Mechanic voice first.";
      container.querySelector("[role=status]").textContent = message;
      onNotice(message);
      return;
    }
    if (!canSpeak()) {
      container.querySelector("[role=status]").textContent = w().recording;
      onNotice(w().recording);
      return;
    }
    const language = getLanguage() === "ar" ? "ar" : "en",
      voices = synth
        .getVoices()
        .filter((v) => v.lang.toLowerCase().startsWith(language));
    const chosen = voices.find((v) => v.voiceURI === prefs.voice) || voices[0];
    const chunks = segments(String(text).slice(0, 4000)),
      id = generation;
    if (!chunks.length) return;
    function next(index) {
      if (id !== generation) return;
      if (index >= chunks.length) {
        utterance = null;
        closeMouth();
        setStatus("idle");
        return;
      }
      const current = new SpeechSynthesisUtterance(chunks[index]);
      utterance = current;
      current.lang = language === "ar" ? "ar-SA" : "en-US";
      // An empty getVoices() list can be transient; leave voice unset so the
      // engine can resolve its default using the requested language.
      if (chosen) current.voice = chosen;
      current.onstart = () => {
        if (id === generation) {
          clearTimeout(startTimer);
          setStatus("speaking");
          pulseMouth();
        }
      };
      current.onboundary = (event) => {
        if (
          id === generation &&
          status === "speaking" &&
          event.name !== "sentence"
        )
          pulseMouth(event.charLength || 4);
      };
      current.onpause = () => {
        if (id === generation) {
          closeMouth();
          setStatus("paused");
        }
      };
      current.onresume = () => {
        if (id === generation) {
          setStatus("speaking");
          pulseMouth();
        }
      };
      current.onend = () => {
        if (id === generation) {
          clearTimeout(startTimer);
          closeMouth();
          next(index + 1);
        }
      };
      current.onerror = (event) => {
        if (id === generation)
          fail(
            ["language-unavailable", "voice-unavailable"].includes(event?.error)
              ? "unavailable"
              : event?.error === "not-allowed"
                ? "blocked"
                : "failed",
          );
      };
      setStatus("loading");
      startTimer = setTimeout(() => {
        if (id === generation) {
          generation++;
          synth.cancel();
          fail("timeout");
        }
      }, 8000);
      try {
        if (synth.paused) synth.resume();
        synth.speak(current);
      } catch {
        fail("failed");
      }
    }
    next(0);
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
      button(w().test, () =>
        speak(
          getLanguage() === "ar"
            ? "هلا، أنا مساعدك في ورشتك. خلنا نفهم صوت سيارتك سوا."
            : "Hello, I am your Warshatak assistant. Let us understand your car together.",
        ),
      ),
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
    note.textContent =
      status === "speaking"
        ? w().speaking
        : status === "paused"
          ? w().paused
          : voices.length
            ? w().ready
            : w().missing;
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
    togglePause() {
      if (status === "paused") synth?.resume();
      else if (status === "speaking") synth?.pause();
    },
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
