import {introCueAt} from './intro-copy.js';
// Pluggable audio layer. Set recordedSources in cinematic-intro.js to use owned
// narration files instead of browser speech. No hosted speech endpoint is used.
export function playIntroAudio({
  language,
  lines,
  muted = false,
  recordedSource = null,
  onCue = () => {},
  onWord = () => {},
  onNotice = () => {},
  onStart = () => {},
}) {
  const synth = globalThis.speechSynthesis,
    Context = globalThis.AudioContext || globalThis.webkitAudioContext;
  let context = null,
    bed = null,
    media = null,
    speech = null,
    stopped = false,
    speaking = false,
    isMuted = muted,
    voiceListener = null,
    voiceTimer = null;
  const oscillators = [];
  let currentCue = 0,
    narrationDone = false,
    speechGeneration = 0;
  const audioStarted = performance.now();
  function duck() {
    if (context && bed)
      bed.gain.setTargetAtTime(
        isMuted ? 0 : speaking ? 0.005 : 0.018,
        context.currentTime,
        0.15,
      );
  }
  function setMuted(value) {
    isMuted = value;
    duck();
    if (media) media.muted = value;
    if (speech) speech.volume = value ? 0 : 0.95;
    // SpeechSynthesisUtterance.volume changes are not reliable mid-utterance.
    // Cancel on mute rather than letting narration continue audibly.
    if (value && speech) {
      speechGeneration++;
      speech.onend = null;
      speech.onerror = null;
      synth?.cancel();
      speech = null;
      speaking = false;
      duck();
    }
    if (!value && !recordedSource && !speech && !narrationDone && !stopped) {
      currentCue = Math.max(
        currentCue,
        performance.now() - audioStarted < 2600
          ? 0
          : performance.now() - audioStarted < 6000
            ? 1
            : 2,
      );
      narrate();
    }
  }
  // A locally synthesized, quiet ambient chord; no music files or network calls.
  try {
    if (Context) {
      context = new Context();
      void context.resume().catch(() => {});
      bed = context.createGain();
      bed.gain.value = isMuted ? 0 : 0.018;
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 450;
      bed.connect(filter);
      filter.connect(context.destination);
      [130.81, 196, 261.63].forEach((frequency, index) => {
        const oscillator = context.createOscillator(),
          gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.value = index === 0 ? 0.6 : 0.3;
        oscillator.connect(gain);
        gain.connect(bed);
        oscillator.start();
        oscillators.push(oscillator);
      });
    }
  } catch {
    onNotice("blocked");
  }
  function stop() {
    if (stopped) return;
    stopped = true;
    clearTimeout(voiceTimer);
    if (voiceListener)
      synth?.removeEventListener?.("voiceschanged", voiceListener);
    if (speech) {
      speechGeneration++;
      speech.onend = null;
      speech.onerror = null;
      synth?.cancel();
      speech = null;
    }
    if (media) {
      media.pause();
      media.removeAttribute("src");
      media.load();
    }
    for (const oscillator of oscillators) {
      try {
        oscillator.stop();
      } catch {}
    }
    if (context) void context.close().catch(() => {});
  }
  function narrate() {
    if (stopped || isMuted || speaking) return;
    currentCue=Math.max(currentCue,introCueAt(performance.now()-audioStarted));
    const voices = synth?.getVoices?.() || [],
      matching = voices.filter((v) =>
        v.lang.toLowerCase().startsWith(language),
      );
    if (!matching.length) {
      onNotice("missing");
      return;
    }
    matching.sort(
      (a, b) =>
        Number(
          b.lang.toLowerCase() === (language === "ar" ? "ar-sa" : "en-us"),
        ) -
        Number(
          a.lang.toLowerCase() === (language === "ar" ? "ar-sa" : "en-us"),
        ),
    );
    let chosen = matching[0];
    try {
      const saved = JSON.parse(localStorage.getItem("warshatak-voice") || "{}");
      chosen = matching.find((v) => v.voiceURI === saved.voice) || chosen;
    } catch {}
    clearTimeout(voiceTimer);
    if (voiceListener)
      synth.removeEventListener?.("voiceschanged", voiceListener);
    const ticket = ++speechGeneration;
    const startIndex = currentCue,
      spokenLines = lines.slice(startIndex);
    speech = new SpeechSynthesisUtterance(spokenLines.join(" "));
    speech.lang = language === "ar" ? "ar-SA" : "en-US";
    speech.voice = chosen;
    speech.rate = 0.9;
    speech.pitch = 0.86;
    speech.volume = 0.95;
    const offsets = spokenLines.map(
      (_, index) =>
        spokenLines.slice(0, index).join(" ").length + (index ? 1 : 0),
    );
    speech.onstart = () => {
      if (stopped || ticket !== speechGeneration || isMuted) return;
      speaking = true;
      duck();
      onNotice(null);
      onStart();
      onCue(startIndex);
    };
    speech.onboundary = (event) => {
      if (stopped || isMuted || ticket !== speechGeneration) return;
      let cue = 0;
      for (let i = 0; i < offsets.length; i++)
        if (event.charIndex >= offsets[i]) cue = i;
      currentCue = startIndex + cue;
      onCue(currentCue);
      onWord(event.charIndex);
    };
    speech.onend = () => {
      if (stopped || ticket !== speechGeneration) return;
      speaking = false;
      narrationDone = true;
      speech = null;
      duck();
    };
    speech.onerror = () => {
      if (stopped || ticket !== speechGeneration) return;
      speaking = false;
      duck();
      onNotice("blocked");
    };
    try {
      if (synth.paused) synth.resume();
      synth.speak(speech);
    } catch {
      speaking = false;
      duck();
      onNotice("blocked");
    }
  }
  if (recordedSource) {
    media = new Audio(recordedSource);
    media.muted = isMuted;
    media.volume = 0.85;
    media.onplaying = () => {
      if (stopped) return;
      speaking = true;
      duck();
      onStart();
    };
    media.onpause = media.onended = () => {
      if (stopped) return;
      speaking = false;
      duck();
    };
    media.onerror = () => {
      if (!stopped) onNotice("recordedError");
    };
    media.ontimeupdate = () => {
      if (stopped) return;
      const seconds = media.currentTime;
      onCue(seconds < 2.6 ? 0 : seconds < 6 ? 1 : 2);
    };
    void media.play().catch(() => {
      if (!stopped) onNotice("recordedError");
    });
  } else if (synth && globalThis.SpeechSynthesisUtterance) {
    if (
      synth.getVoices().some((v) => v.lang.toLowerCase().startsWith(language))
    )
      narrate();
    else {
      voiceListener = () => {
        if (
          synth
            .getVoices()
            .some((v) => v.lang.toLowerCase().startsWith(language))
        ) {
          clearTimeout(voiceTimer);
          synth.removeEventListener("voiceschanged", voiceListener);
          narrate();
        }
      };
      synth.addEventListener?.("voiceschanged", voiceListener);
      voiceTimer = setTimeout(narrate, 700);
    }
  } else onNotice("missing");
  return { stop, setMuted };
}
