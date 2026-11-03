// Browser integration checks. All provider responses are MOCKS; PCM playback,
// MediaRecorder, IndexedDB, keyboard navigation and DOM rendering are real.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  http = require("node:http");
const base = process.env.SMOKE_URL || "http://127.0.0.1:3006";
const artifacts = process.env.SMOKE_ARTIFACTS || "/tmp/warshatak-smoke";
fs.mkdirSync(artifacts, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
  });
  const mediaStub = http.createServer(async (req, res) => {
    for await (const _chunk of req) {
    }
    setTimeout(() => {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.end(
        JSON.stringify({
          analysis: {
            type: "audio",
            audioEventAnalysis: {
              provider: "gemini",
              attempted: true,
              succeeded: false,
            },
            waveform: { kind: "waveform_features_only" },
            warnings: ["Gemini fixture: quota unavailable"],
            transcription: { hasRecognizedSpeech: false, text: "" },
          },
        }),
      );
    }, 350);
  });
  await new Promise((resolve) => mediaStub.listen(0, "127.0.0.1", resolve));
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      permissions: ["microphone", "clipboard-read", "clipboard-write"],
    });
    await context.addInitScript(() => {
      if (!localStorage.getItem("v2-smoke-seeded")) {
        const cars = Array.from({ length: 25 }, (_, i) => ({
          id: "car" + i,
          name:
            i === 0
              ? "كامري الرحلات العائلية ذات الاسم الطويل جدًا"
              : "Vehicle " + i,
          year: 2020 + (i % 5),
        }));
        const cases = [
          {
            id: "old-a",
            carId: "car0",
            description: "السلام عليكم",
            createdAt: "2026-11-01T12:00:00Z",
            messages: [
              { role: "user", content: "السلام عليكم" },
              { role: "assistant", content: "وعليكم السلام" },
              { role: "user", content: "الفرامل تصفّر عند التهدئة" },
              { role: "assistant", content: "قد يكون احتكاكًا؛ يلزم التحقق." },
            ],
          },
          {
            id: "old-b",
            carId: "car1",
            description: "My car shakes at idle",
            createdAt: "2026-11-02T12:00:00Z",
            messages: [],
          },
        ];
        localStorage.setItem(
          "carnoise-garage-v2",
          JSON.stringify({
            cars,
            cases,
            carId: "car0",
            lang: "ar",
            theme: "dark",
          }),
        );
        localStorage.setItem("warshatak-cinematic-v1", "1");
        localStorage.setItem("v2-smoke-seeded", "1");
      }
      window.__micTracks = [];
      const original = navigator.mediaDevices.getUserMedia.bind(
        navigator.mediaDevices,
      );
      navigator.mediaDevices.getUserMedia = async (constraints) => {
        const stream = await original(constraints);
        window.__micTracks.push(...stream.getTracks());
        return stream;
      };
      window.__loadingLabels = [];
      addEventListener("DOMContentLoaded", () =>
        new MutationObserver((records) =>
          records.forEach((record) =>
            window.__loadingLabels.push(
              ...[...record.addedNodes].map((n) => n.textContent),
            ),
          ),
        ).observe(document.querySelector("#typingLabel"), {
          childList: true,
          subtree: true,
          characterData: true,
        }),
      );
    });
    const page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    async function audit(label) {
      if (!process.env.AXE_MODULE) return;
      const AxeBuilder = require(process.env.AXE_MODULE).default;
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      assert.deepEqual(
        result.violations.map((v) => ({
          id: v.id,
          targets: v.nodes.map((n) => n.target),
        })),
        [],
        label,
      );
    }
    await page.route("**/api/speech/status", (r) =>
      r.fulfill({ json: { configured: false, provider: "gemini" } }),
    );
    let requests = [],
      fail = false;
    await page.route("**/api/chat", async (route) => {
      const body = route.request().postDataJSON();
      requests.push(body);
      await new Promise((r) => setTimeout(r, 180));
      if (fail) {
        await route.fulfill({
          status: 503,
          json: { error: "Fixture provider unavailable" },
        });
        return;
      }
      const ar = body.language === "ar",
        reply = body.skipClarification
          ? ar
            ? "المعلومات ما تكفي لتحديد قطعة. احتفظ بالمقطع للفحص."
            : "There is not enough evidence to identify a component. Keep the recording for inspection."
          : ar
            ? "قد يكون احتكاكًا أو جزءًا مرتخيًا. المصدر غير مؤكد. من أي جهة تسمعه؟"
            : "Friction or a loose part may fit, but the source is uncertain. Where do you hear it?";
      await route.fulfill({
        json: {
          reply,
          responseLanguage: ar ? "ar" : "en",
          canSkipQuestion: !body.skipClarification,
          problemSummary: {
            assessment: reply,
            urgent: false,
            nextStep: ar
              ? "لا تغيّر قطعة بناءً على الصوت وحده."
              : "Do not replace a part based only on sound.",
          },
        },
      });
    });
    await page.route("**/api/media/analyze", (route) =>
      route.continue({
        url: `http://127.0.0.1:${mediaStub.address().port}/api/media/analyze`,
      }),
    );
    await page.goto(base);
    await page.locator("[data-intro=skip]").click();
    await page.locator("#cinematicIntro").waitFor({state:"hidden"});
    assert.equal(await page.locator("#vehicleSelect option").count(), 25);
    assert.equal(await page.locator(".car-row").count(), 0);
    assert.equal(await page.locator("#historyList .history-row").count(), 1);
    assert.match(await page.locator(".history-name").textContent(), /الفرامل/);
    await page.locator("#historySearch").fill("التهدئة");
    assert.equal(await page.locator(".history-row").count(), 1);
    await page.locator("#historySearch").fill("My car");
    assert.equal(await page.locator(".history-row").count(), 0);
    await page.locator("#historySearch").fill("");
    await page.locator(".history-row").click();
    await page.locator(".thread-menu summary").click();
    await page.locator(".thread-actions button").first().click();
    await page.locator("#carName").fill("متابعة الفرامل");
    await page.locator("#carForm button[type=submit]").click();
    await page.locator("#carDialog").waitFor({ state: "hidden" });
    let garage = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("carnoise-garage-v2")),
    );
    assert.equal(garage.cases[0].id, "old-a");
    assert.equal(garage.cases[0].description, "السلام عليكم");
    assert.equal(garage.cases[0].title, "متابعة الفرامل");
    await page.locator(".thread-menu summary").click();
    await page.locator(".thread-actions button").last().click();
    await page.locator("#confirmDialog [value=cancel]").click();
    await page.locator("#confirmDialog").waitFor({ state: "hidden" });
    assert.equal(await page.locator(".history-row").count(), 1);
    await page.locator("#addCar").click();
    await page.locator("#carName").fill("سيارة الاختبار المؤقتة");
    await page.locator("#carForm button[type=submit]").click();
    await page.locator("#carDialog").waitFor({ state: "hidden" });
    assert.equal(await page.locator("#vehicleSelect option").count(), 26);
    await page.locator(".vehicle-menu summary").click();
    await page.locator(".vehicle-actions button").last().click();
    await page.locator("#confirmDialog [value=delete]").click();
    await page.locator("#confirmDialog").waitFor({ state: "hidden" });
    assert.equal(await page.locator("#vehicleSelect option").count(), 25);
    await page.locator("#vehicleSelect").selectOption("car0");
    await page.locator("#vehicleSelect").selectOption("car1");
    assert.equal(await page.locator(".history-row").count(), 1);
    assert.match(await page.locator(".history-name").textContent(), /shakes/);
    await page.locator("#vehicleSelect").selectOption("car0");
    await page.locator("#description").fill("عندي صوت غير معتاد في السيارة");
    await page.locator("#sendButton").click();
    await page.locator("#busy:not(.hidden)").waitFor();
    await page.locator(".skip-question:enabled").waitFor();
    await page.locator(".skip-question").click();
    await page.waitForFunction(
      () => document.querySelectorAll(".message.assistant").length === 2,
    );
    assert.equal(requests.at(-1).skipClarification, true);
    await page.locator("#busy").waitFor({ state: "hidden" });
    assert.equal(await page.locator(".skip-question").count(), 0);
    await page.locator(".problem-summary > summary").click();
    await page.locator(".summary-copy").click();
    assert.match(
      await page.evaluate(() => navigator.clipboard.readText()),
      /المعلومات ما تكفي/,
    );
    assert.match(
      await page.locator(".problem-summary").textContent(),
      /لم يؤكدها فحص/,
    );
    await page.screenshot({
      path: artifacts + "/v2-desktop-ar.png",
      fullPage: true,
    });
    await audit("Arabic desktop summary");
    await page.locator("#themeSwitch").click();
    await audit("Light theme desktop");
    await page.locator("#themeSwitch").click();
    await page.locator("#recordButton").click();
    await page.waitForFunction(
      () => document.body.dataset.assistantState === "recording",
    );
    await page.waitForFunction(
      () =>
        Number(
          document
            .querySelector("#recordingStatus")
            .style.getPropertyValue("--recording-level"),
        ) > 0.01,
    );
    await page.waitForTimeout(250);
    await page.locator("#recordButton").click();
    await page.locator("#mediaPreview audio").waitFor();
    assert.equal(
      await page.evaluate(() =>
        window.__micTracks.every((t) => t.readyState === "ended"),
      ),
      true,
    );
    await page.locator("#description").fill("حلل المرفق");
    await page.locator("#sendButton").click();
    await page.waitForFunction(
      () => document.querySelectorAll(".message.assistant").length === 3,
    );
    await page.locator("#busy").waitFor({ state: "hidden" });
    assert.equal(await page.locator("#recordButton").isEnabled(), true);
    const labels = await page.evaluate(() => window.__loadingLabels);
    assert.ok(labels.some((t) => /جاري رفع/.test(t)));
    assert.ok(labels.some((t) => /وصل المرفق/.test(t)));
    garage = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("carnoise-garage-v2")),
    );
    const saved = garage.cases.find((c) => c.mediaId);
    assert.ok(saved?.mediaId);
    await page.locator("#vehicleSelect").selectOption("car1");
    await page.locator("#vehicleSelect").selectOption("car0");
    await page.locator(".history-row").filter({ hasText: "عندي صوت" }).click();
    await page.locator("[data-saved-media-preview] audio").waitFor();
    assert.match(
      await page.locator(".problem-summary").textContent(),
      /تعذر تقني/,
    );
    await page.locator("#newCaseSide").click();
    fail = true;
    await page.locator("#description").fill("عندي طقطقة جديدة");
    await page.locator("#sendButton").click();
    await page.locator(".retry-button").waitFor();
    assert.equal(
      await page.locator("#description").inputValue(),
      "عندي طقطقة جديدة",
    );
    fail = false;
    await page.locator(".retry-button").click();
    await page.locator(".message.assistant").waitFor();
    await page.locator("#busy").waitFor({ state: "hidden" });
    await page.locator("#newCaseSide").click();
    await page.locator("#recordButton").click();
    await page.waitForFunction(
      () => document.body.dataset.assistantState === "recording",
    );
    await page.locator("#vehicleSelect").selectOption("car1");
    assert.equal(
      await page.evaluate(() =>
        window.__micTracks.every((t) => t.readyState === "ended"),
      ),
      true,
    );
    assert.equal(await page.locator("#recordingStatus").isVisible(), false);
    await page.locator("#languageSwitch").click();
    assert.equal(await page.locator("html").getAttribute("dir"), "ltr");
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        "overflow " + width,
      );
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("#menuButton").click();
    await page.locator("#vehicleSelect").selectOption("car0");
    assert.equal(
      await page.locator("#menuButton").getAttribute("aria-expanded"),
      "false",
    );
    await page.locator("#menuButton").click();
    await page.locator(".history-row").first().click();
    await page.screenshot({
      path: artifacts + "/v2-mobile-en.png",
      fullPage: true,
    });
    await audit("English mobile");
    await page.locator("#menuButton").click();
    await page.locator("#historySearch").focus();
    await page.keyboard.press("Escape");
    assert.equal(
      await page.locator("#menuButton").getAttribute("aria-expanded"),
      "false",
    );
    assert.equal(
      await page
        .locator("#menuButton")
        .evaluate((n) => n === document.activeElement),
      true,
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator("#languageSwitch").click();
    await page.locator("#menuButton").click();
    await page.screenshot({
      path: artifacts + "/v2-mobile-ar-drawer.png",
      fullPage: true,
    });
    if (process.env.AXE_MODULE) {
      const AxeBuilder = require(process.env.AXE_MODULE).default;
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      assert.deepEqual(
        result.violations.map((v) => ({
          id: v.id,
          targets: v.nodes.map((n) => n.target),
        })),
        [],
      );
    }
    await page.reload();
    await page.locator("[data-intro=skip]").click();
    await page.locator("#cinematicIntro").waitFor({state:"hidden"});
    await page.setViewportSize({ width: 1440, height: 1000 });
    garage = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("carnoise-garage-v2")),
    );
    assert.equal(garage.cars.length, 25);
    assert.equal(
      garage.cases.find((c) => c.id === "old-a").title,
      "متابعة الفرامل",
    );
    assert.ok(garage.cases.some((c) => c.mediaId === saved.mediaId));
    assert.deepEqual(errors, []);
    console.log(
      "PASS V2 browser integration: MOCK provider; real browser storage, synthetic microphone, upload phases, summary copy, vehicle/history search and rename, delete cancellation, retry, recording cancellation, RTL/LTR, 320–1440px, reduced motion and optional axe.",
    );
  } finally {
    await browser.close();
    await new Promise((resolve) => mediaStub.close(resolve));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
