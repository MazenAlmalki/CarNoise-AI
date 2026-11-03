import { introCopy } from "./intro-copy.js";
// One silent welcome screen, dismissed only by an explicit action.
export function createCinematicIntro({
  getLanguage,
  onLanguage,
  beforeOpen = () => true,
}) {
  const dialog = document.getElementById("cinematicIntro"),
    app = document.querySelector(".app");
  const find = (name) => dialog.querySelector('[data-intro="' + name + '"]');
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let fadeTimer = null;
  function clear() {
    clearTimeout(fadeTimer);
  }
  function render() {
    const language = getLanguage(),
      copy = introCopy[language];
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
    find("tagline").textContent = copy.tagline;
    find("skip").textContent = copy.skip;
    find("language").textContent = language === "ar" ? "EN" : "عربي";
    find("language").setAttribute("aria-label", copy.language);
    document.getElementById("replayIntro").textContent = copy.replay;
    document.getElementById("experienceTitle").textContent = copy.settings;
    document.getElementById("settingsLanguage").textContent =
      language === "ar" ? "English" : "العربية";
  }
  function close() {
    clear();
    dialog.close();
    delete document.body.dataset.introActive;
    app.inert = false;
    document.getElementById("description").focus({ preventScroll: true });
  }
  function finish(immediate = false) {
    if (!dialog.open) return;
    clear();
    if (immediate) {
      close();
      return;
    }
    dialog.dataset.phase = "dissolve";
    fadeTimer = setTimeout(close, reduced.matches ? 150 : 550);
  }
  function open() {
    if (!beforeOpen()) return;
    clear();
    render();
    dialog.dataset.phase = "playing";
    document.body.dataset.introActive = "true";
    app.inert = true;
    dialog.showModal();
    find("skip").focus();
  }
  find("skip").onclick = () => finish();
  find("language").onclick = () =>
    onLanguage(getLanguage() === "ar" ? "en" : "ar");
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
  addEventListener("pagehide", () => {
    if (dialog.open) close();
  });
  render();
  // Show on every page load, including returning visitors with the old flag.
  open();
  return { open, setLanguage: render };
}
