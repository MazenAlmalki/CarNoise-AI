import {
  introCopy,
  INTRO_DURATION,
  INTRO_SEEN_KEY,
  introCueAt,
} from "./intro-copy.js";
import { playIntroAudio } from "./intro-audio.js";
// Replace null with local narration URLs (e.g. /assets/intro-ar.wav). Aim for
// 9–10 seconds. The same subtitles/timeline remain available without audio.
export const recordedSources = { ar: null, en: null };
export function createCinematicIntro({
  getLanguage,
  onLanguage,
  beforeOpen = () => true,
}) {
  const dialog = document.getElementById("cinematicIntro"),
    app = document.querySelector(".app");
  const find = (name) => dialog.querySelector('[data-intro="' + name + '"]');
  let language = getLanguage(),
    playing = false,
    muted = false,
    audio = null,
    frame = null,
    endTimer = null,
    dissolveTimer = null,
    started = 0,
    voiceStarted = 0,
    actualCue = -1,
    restoreFocus = null,
    lastSubtitle = -1,
    lastTimingAt = 0;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  function markSeen() {
    try {
      localStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {}
  }
  function clearPlayback() {
    audio?.stop();
    audio = null;
    cancelAnimationFrame(frame);
    clearTimeout(endTimer);
    clearTimeout(dissolveTimer);
    playing = false;
  }
  function subtitle(index) {
    index = Math.max(lastSubtitle, index);
    if (index === lastSubtitle) return;
    lastSubtitle = index;
    find("subtitles").textContent = introCopy[language].lines[index];
  }
  function render() {
    const copy = introCopy[language];
    dialog.lang = language;
    dialog.dir = language === "ar" ? "rtl" : "ltr";
    dialog.setAttribute("aria-label", copy.dialog);
    dialog
      .querySelector(".intro-toolbar")
      .setAttribute(
        "aria-label",
        language === "ar" ? "أزرار المقدمة" : "Introduction controls",
      );
    find("name").textContent = copy.name;
    find("tagline").replaceChildren(
      ...copy.tagline.split(" ").map((word, i) => {
        const span = document.createElement("span");
        span.textContent = word;
        span.style.setProperty("--word", i);
        return span;
      }),
    );
    for (const key of ["begin", "skip", "hint"])
      find(key).textContent = copy[key];
    find("language").textContent = language === "ar" ? "EN" : "عربي";
    find("language").setAttribute("aria-label", copy.language);
    find("mute").textContent = muted ? copy.unmute : copy.mute;
    find("mute").setAttribute("aria-pressed", String(muted));
    lastSubtitle = -1;
    subtitle(0);
    document.getElementById("replayIntro").textContent = copy.replay;
    document.getElementById("experienceTitle").textContent = copy.settings;
    document.getElementById("settingsLanguage").textContent =
      language === "ar" ? "English" : "العربية";
  }
  function finish(immediate = false) {
    if (!dialog.open) return;
    markSeen();
    clearPlayback();
    if (immediate) {
      close();
      return;
    }
    dialog.dataset.phase = "dissolve";
    dissolveTimer = setTimeout(close, reduced.matches ? 300 : 550);
  }
  function close() {
    clearPlayback();
    dialog.close();
    delete document.body.dataset.introActive;
    app.inert = false;
    dialog.dataset.phase = "ready";
    if (
      restoreFocus?.isConnected &&
      restoreFocus !== document.body &&
      !restoreFocus.closest("[inert]")
    )
      restoreFocus.focus({ preventScroll: true });
    else document.getElementById("description").focus({ preventScroll: true });
  }
  function begin() {
    if (playing) return;
    markSeen();
    playing = true;
    started = performance.now();
    voiceStarted = 0;
    actualCue = -1;
    lastSubtitle = -1;
    find("notice").textContent = "";
    dialog.dataset.phase = "playing";
    dialog.dataset.scene = "logo";
    audio = playIntroAudio({
      language,
      lines: introCopy[language].lines,
      muted,
      recordedSource: recordedSources[language],
      onStart: () => {
        voiceStarted = performance.now();
      },
      onCue: (index) => {
        actualCue = index;
        lastTimingAt = performance.now();
        subtitle(index);
      },
      onNotice: (key) => {
        find("notice").textContent = key
          ? introCopy[language][key] || introCopy[language].blocked
          : "";
      },
    });
    function tick(now) {
      if (!playing) return;
      const elapsed = now - started,
        narrationElapsed = now - (voiceStarted || started);
      const cue =
        actualCue >= 0 && now - lastTimingAt < 1200
          ? actualCue
          : introCueAt(narrationElapsed);
      subtitle(cue);
      const nextScene =
        elapsed > 8300 ? "resolve" : lastSubtitle >= 1 ? "tagline" : "logo";
      if (dialog.dataset.scene !== nextScene) dialog.dataset.scene = nextScene;
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    endTimer = setTimeout(() => finish(), INTRO_DURATION - 550);
  }
  function open() {
    if (!beforeOpen()) return;
    clearPlayback();
    restoreFocus = document.activeElement;
    language = getLanguage();
    render();
    find("notice").textContent = "";
    dialog.dataset.phase = "ready";
    dialog.dataset.scene = "logo";
    dialog.dataset.reduced = String(reduced.matches);
    document.body.dataset.introActive = "true";
    app.inert = true;
    dialog.showModal();
    find("begin").focus();
  }
  function setLanguage(value) {
    language = value === "en" ? "en" : "ar";
    if (dialog.open && playing) {
      clearPlayback();
      dialog.dataset.phase = "ready";
      dialog.dataset.scene = "logo";
    }
    render();
  }
  find("begin").onclick = begin;
  find("skip").onclick = () => finish(true);
  find("mute").onclick = () => {
    muted = !muted;
    audio?.setMuted(muted);
    find("mute").textContent = muted
      ? introCopy[language].unmute
      : introCopy[language].mute;
    find("mute").setAttribute("aria-pressed", String(muted));
  };
  find("language").onclick = () => {
    onLanguage(language === "ar" ? "en" : "ar");
  };
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    finish(true);
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.code === "Space" || event.key === "Escape") {
      event.preventDefault();
      finish(true);
    }
  });
  document.getElementById("replayIntro").onclick = open;
  document.getElementById("settingsLanguage").onclick = () =>
    onLanguage(getLanguage() === "ar" ? "en" : "ar");
  reduced.addEventListener("change", () => {
    dialog.dataset.reduced = String(reduced.matches);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && dialog.open && playing) finish(true);
  });
  addEventListener("pagehide", () => clearPlayback());
  render();
  let seen = false;
  try {
    seen = localStorage.getItem(INTRO_SEEN_KEY) === "1";
  } catch {}
  if (!seen) open();
  return { open, setLanguage };
}
