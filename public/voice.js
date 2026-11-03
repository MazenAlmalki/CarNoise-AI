import { createAudioSpeaker } from "./audio-speaker.js";
// Infer the spoken language from the reply, independently of the UI language.
export function speechLanguage(text, preferred = "ar") {
  const ar = String(text).match(/\p{Script=Arabic}/gu)?.length || 0;
  const en = String(text).match(/[A-Za-z]/g)?.length || 0;
  if (ar >= 3 && ar >= en * 0.6) return "ar";
  return ar > en ? "ar" : en > ar ? "en" : preferred === "en" ? "en" : "ar";
}
// Opt-in natural Gemini speech with an explicit device-voice alternative. Preference storage is independent of garage data.
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
  let prefs = {
      auto: false,
      muted: false,
      voice: "",
      pace: "calm",
      engine: "auto",
      naturalVoice: "",
    },
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
  let speechStarted = 0,
    activeTurnStarted = null,
    lastTimings = {};
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
      missing:
        "ما ظهر صوت عربي مناسب في المتصفح. القراءة تنتظر صوتًا مطابقًا للغة النص.",
      loading: "جاري تشغيل صوت الجهاز…",
      unavailable:
        "ما فيه صوت متاح يطابق لغة الرد. حدّث أصوات الجهاز أو جرّب خيار صوت آخر مطابق للغة.",
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
        "No matching English voice is listed. Playback requires a voice matching the reply language.",
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
  Object.assign(words.ar, {
    engine: "مصدر الصوت",
    automatic: "تلقائي",
    natural: "صوت طبيعي — Gemini",
    device: "أصوات الجهاز",
    characterVoice: "صوت الشخصية",
    disclosure:
      "صوت Gemini يرسل نص الرد فقط إلى Google، ويستهلك من حصة API. لا يحتاج صوتًا عربيًا في Windows.",
    keyMissing: "لتشغيل صوت Gemini، أضف GEMINI_API_KEY في السيرفر وأعد تشغيله.",
    quota: "وصل صوت Gemini إلى حد الحصة أو الطلبات. حاول لاحقًا.",
    access: "مفتاح Gemini أو صلاحية نموذج الصوت مرفوضة.",
    model: "نموذج الصوت غير متاح لحسابك. تحقق من GEMINI_TTS_MODEL.",
    network: "تعذّر الاتصال بخدمة توليد الصوت.",
    syncUnavailable:
      "الصوت يعمل، لكن هذا المتصفح لم يسمح بتحليل الصوت لمزامنة الفم.",
    loading: "جاري تجهيز صوت الشخصية…",
  });
  Object.assign(words.en, {
    engine: "Voice source",
    automatic: "Automatic",
    natural: "Natural voice — Gemini",
    device: "Device voices",
    characterVoice: "Character voice",
    disclosure:
      "Gemini speech sends only reply text to Google and uses API quota. It needs no installed Arabic device voice.",
    keyMissing:
      "Set GEMINI_API_KEY on the server and restart it to enable Gemini speech.",
    quota: "Gemini speech quota or request limit reached. Try later.",
    access: "Gemini key or speech-model access was denied.",
    model:
      "Speech model unavailable. Check GEMINI_TTS_MODEL and account access.",
    network: "Cannot reach speech generation.",
    syncUnavailable:
      "Audio is playing, but this browser did not allow audio analysis for mouth synchronization.",
    loading: "Preparing character speech…",
  });
  const w = () => words[getLanguage()];
  let hosted = null,
    configPromise = null,
    request = null,
    cached = null,
    activeText = "";
  const speaker = createAudioSpeaker({
    onState: setStatus,
    onMouth,
    onError: fail,
    onSyncUnavailable: () => onNotice(w().syncUnavailable),
  });
  async function configuration() {
    if (!configPromise)
      configPromise = fetch("/api/speech/status", {
        signal: AbortSignal.timeout(3000),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((value) => {
          hosted = value;
          render();
          return value;
        })
        .catch(() => {
          configPromise = null;
          return null;
        });
    return configPromise;
  }

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
  let deliveryCallbacks = null;
  function finishDelivery() {
    const callbacks = deliveryCallbacks;
    deliveryCallbacks = null;
    callbacks?.onStop?.();
  }
  function setStatus(next) {
    if (next === "speaking" && deliveryCallbacks) {
      const callback = deliveryCallbacks.onStart;
      deliveryCallbacks.onStart = null;
      callback?.();
    }
    if (next === "idle") finishDelivery();
    if (
      next === "speaking" &&
      speechStarted &&
      lastTimings.firstPlaybackMs == null
    ) {
      lastTimings.firstPlaybackMs = Math.round(
        performance.now() - speechStarted,
      );
      if (
        performance.getEntriesByName("warshatak:speech-first-playback").length >
        30
      )
        performance.clearMeasures("warshatak:speech-first-playback");
      performance.measure("warshatak:speech-first-playback", {
        start: speechStarted,
        end: performance.now(),
      });
      if (Number.isFinite(activeTurnStarted)) {
        lastTimings.turnToFirstPlaybackMs = Math.round(
          performance.now() - activeTurnStarted,
        );
        if (
          performance.getEntriesByName("warshatak:turn-to-first-playback")
            .length > 30
        )
          performance.clearMeasures("warshatak:turn-to-first-playback");
        performance.measure("warshatak:turn-to-first-playback", {
          start: activeTurnStarted,
          end: performance.now(),
        });
      }
    }
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
    request?.abort();
    request = null;
    speaker.stop();
    activeText = "";
    utterance = null;
    setStatus("idle");
  }
  function fail(key) {
    stop();
    const message = w()[key] || w().failed;
    onNotice(message);
    const note = container.querySelector("[role=status]");
    if (note) note.textContent = message;
    container.open = true;
  }
  async function naturalSpeech(text, language, id) {
    const voice = prefs.naturalVoice || hosted.voice || "Charon",
      key = language + "|" + voice + "|" + text;
    setStatus("loading");
    try {
      if (cached?.key === key) {
        lastTimings.cacheHit = true;
        await speaker.play(cached.blob);
        return;
      }
      request = new AbortController();
      const requestStarted = performance.now();
      const signal = AbortSignal.any([
        request.signal,
        AbortSignal.timeout(65000),
      ]);
      const response = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language, voice }),
        signal,
      });
      if (id !== generation) return;
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const errors = {
          SPEECH_KEY_MISSING: "keyMissing",
          SPEECH_QUOTA: "quota",
          SPEECH_ACCESS_DENIED: "access",
          SPEECH_MODEL_UNAVAILABLE: "model",
        };
        fail(
          errors[body.code] || (response.status === 429 ? "quota" : "failed"),
        );
        return;
      }
      const blob = await response.blob();
      if (id !== generation) return;
      lastTimings.generationAndDownloadMs = Math.round(
        performance.now() - requestStarted,
      );
      if (
        !blob.type.startsWith("audio/") ||
        !blob.size ||
        blob.size > 8 * 1024 * 1024 + 44
      ) {
        fail("failed");
        return;
      }
      cached = { key, blob };
      await speaker.play(blob);
    } catch (error) {
      if (id === generation)
        fail(
          ["TimeoutError", "AbortError"].includes(error?.name)
            ? "timeout"
            : "network",
        );
    }
  }
  async function speak(
    text,
    { turnStarted = null, onStart = () => {}, onStop = () => {} } = {},
  ) {
    text = String(text || "")
      .replace(/[*#`]/g, "")
      .slice(0, 1900);
    if (status === "loading" && activeText === text) return;
    stop();
    deliveryCallbacks = { onStart, onStop };
    speechStarted = performance.now();
    activeTurnStarted = turnStarted;
    lastTimings = { cacheHit: false };
    activeText = text;
    onNotice("");
    if (prefs.muted) {
      container.open = true;
      const message =
        getLanguage() === "ar"
          ? "الصوت مكتوم. أزل خيار كتم الصوت من قائمة صوت الميكانيكي أولًا."
          : "Voice is muted. Uncheck Mute voice in Mechanic voice first.";
      container.querySelector("[role=status]").textContent = message;
      onNotice(message);
      finishDelivery();
      return;
    }
    if (!canSpeak()) {
      container.querySelector("[role=status]").textContent = w().recording;
      onNotice(w().recording);
      finishDelivery();
      return;
    }
    const idForConfig = generation;
    if (prefs.engine !== "browser") speaker.prepare();
    const config = await configuration();
    if (idForConfig !== generation) return;
    const useNatural =
      prefs.engine === "gemini" ||
      (prefs.engine !== "browser" && config?.configured === true);
    if (useNatural) {
      if (!config?.configured) {
        fail("keyMissing");
        return;
      }
      await naturalSpeech(
        text,
        speechLanguage(text, getLanguage()),
        idForConfig,
      );
      return;
    }
    speaker.stop();
    if (!supported) {
      fail(prefs.engine === "browser" ? "unsupported" : "keyMissing");
      return;
    }
    const language = speechLanguage(text, getLanguage()),
      voices = synth
        .getVoices()
        .filter((v) => v.lang.toLowerCase().startsWith(language));
    if (!voices.length) {
      fail(prefs.engine === "browser" ? "unavailable" : "keyMissing");
      return;
    }
    voices.sort(
      (a, b) =>
        Number(
          b.lang.toLowerCase() === (language === "ar" ? "ar-sa" : "en-us"),
        ) -
        Number(
          a.lang.toLowerCase() === (language === "ar" ? "ar-sa" : "en-us"),
        ),
    );
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
      current.lang = chosen.lang;
      current.rate = prefs.pace === "normal" ? 1 : 0.94;
      current.pitch = 0.98;
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
    const diagnosis = document.createElement("a");
    diagnosis.href = "/sound-check.html?lang=" + getLanguage();
    diagnosis.textContent =
      getLanguage() === "ar"
        ? "فحص الصوت والميكروفون"
        : "Check sound and microphone";
    diagnosis.style.display = "block";
    diagnosis.style.marginBlock = "10px";
    container.append(diagnosis);
    if (!supported && hosted?.configured !== true) {
      const n = document.createElement("p");
      n.textContent = w().unsupported;
      container.append(n);
      return;
    }
    const body = document.createElement("div");
    body.className = "voice-settings";
    const engineLabel = document.createElement("label");
    engineLabel.textContent = w().engine;
    const engine = document.createElement("select");
    engine.setAttribute("aria-label", w().engine);
    for (const [value, text] of [
      ["auto", w().automatic],
      ["gemini", w().natural],
      ["browser", w().device],
    ])
      engine.add(new Option(text, value));
    engine.value = ["auto", "gemini", "browser"].includes(prefs.engine)
      ? prefs.engine
      : "auto";
    engine.onchange = () => {
      prefs.engine = engine.value;
      save();
      stop();
      render();
      container.querySelector("[data-engine]").focus();
    };
    engine.dataset.engine = "true";
    engineLabel.append(engine);
    body.append(engineLabel);
    const disclosure = document.createElement("p");
    disclosure.className = "voice-disclosure";
    disclosure.textContent = w().disclosure;
    body.append(disclosure);
    const usesNatural =
      prefs.engine === "gemini" ||
      (prefs.engine !== "browser" && hosted?.configured === true);
    if (usesNatural) {
      const label = document.createElement("label");
      label.textContent = w().characterVoice;
      const select = document.createElement("select");
      select.setAttribute("aria-label", w().characterVoice);
      for (const name of hosted?.voices || ["Charon"])
        select.add(new Option(name, name));
      select.value = prefs.naturalVoice || hosted?.voice || "Charon";
      select.onchange = () => {
        prefs.naturalVoice = select.value;
        save();
        stop();
      };
      label.append(select);
      body.append(label);
    }

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
    const voices = (synth?.getVoices() || []).filter((v) =>
      v.lang.toLowerCase().startsWith(getLanguage()),
    );
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
    label.hidden = usesNatural;
    label.append(select);
    body.append(label);
    const paceLabel = document.createElement("label");
    paceLabel.textContent =
      getLanguage() === "ar" ? "أسلوب القراءة" : "Reading pace";
    const pace = document.createElement("select");
    pace.add(
      new Option(getLanguage() === "ar" ? "هادئ وطبيعي" : "Calm", "calm"),
    );
    pace.add(new Option(getLanguage() === "ar" ? "عادي" : "Normal", "normal"));
    pace.value = prefs.pace === "normal" ? "normal" : "calm";
    pace.onchange = () => {
      prefs.pace = pace.value;
      save();
      stop();
    };
    paceLabel.hidden = usesNatural;
    paceLabel.append(pace);
    body.append(paceLabel);
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
          if (speaker.active()) speaker.pause();
          else synth?.pause();
        }
      }),
      button(w().resume, () => {
        if (status === "paused") {
          if (speaker.active()) speaker.resume();
          else synth?.resume();
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
          : status === "loading"
            ? w().loading
            : (usesNatural && hosted?.configured) || voices.length
              ? w().ready
              : w().missing;
    body.append(note);
    container.append(body);
  }
  render();
  void configuration();
  synth?.addEventListener?.("voiceschanged", render);
  globalThis.addEventListener("pagehide", stop);
  return {
    stop,
    render,
    speak,
    togglePause() {
      if (status === "paused") {
        if (speaker.active()) speaker.resume();
        else synth?.resume();
      } else if (status === "speaking") {
        if (speaker.active()) speaker.pause();
        else synth?.pause();
      }
    },
    isAutoEnabled: () => prefs.auto && !prefs.muted,
    autoSpeak(text, options) {
      if (prefs.auto && !prefs.muted) speak(text, options);
    },
    getSourceInfo() {
      const natural =
        prefs.engine === "gemini" ||
        (prefs.engine !== "browser" && hosted?.configured === true);
      return {
        timings: { ...lastTimings },
        provider: natural ? "gemini" : "browser",
        configured: natural ? hosted?.configured === true : supported,
        voice: natural
          ? prefs.naturalVoice || hosted?.voice || "Charon"
          : prefs.voice || null,
      };
    },
    readButton(text) {
      const n = button(w().play, () => speak(text));
      n.className = "read-reply";
      n.disabled = false;
      return n;
    },
  };
}
