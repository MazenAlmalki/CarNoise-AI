// MOCK provider latency/audio; real browser playback events coordinate text.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright"),
  fs = require("node:fs"),
  assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const c = await b.newContext({ viewport: { width: 390, height: 844 } });
    await c.addInitScript(
      () =>
        !localStorage.getItem("warshatak-voice") &&
        localStorage.setItem(
          "warshatak-voice",
          JSON.stringify({ auto: true, engine: "gemini" }),
        ),
    );
    const p = await c.newPage(),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.route("**/api/speech/status", (r) =>
      r.fulfill({
        json: { configured: true, provider: "gemini", voice: "Charon" },
      }),
    );
    let counter = 0,
      mode = "success",
      urgent = false,
      speechRequests = 0;
    await p.route("**/api/chat", (r) =>
      r.fulfill({
        json: {
          reply: `This is synchronized reply number ${++counter}.`,
          responseLanguage: "en",
          problemSummary: urgent
            ? {
                urgent: true,
                assessment: "Safety warning",
                nextStep: "Stop safely",
              }
            : null,
        },
      }),
    );
    await p.route("**/api/speech", async (r) => {
      speechRequests++;
      if (mode === "quota") {
        await r.fulfill({ status: 502, json: { code: "SPEECH_QUOTA" } });
        return;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, mode === "slow" ? 18000 : 800),
      );
      try {
        await r.fulfill({
          contentType: "audio/wav",
          body: fs.readFileSync(
            require("node:path").join(
              __dirname,
              "../public/assets/sound-check.wav",
            ),
          ),
        });
      } catch {}
    });
    await p.goto(process.env.SMOKE_URL || "http://127.0.0.1:3007");
    await p.locator("[data-intro=skip]").click();
    await p.locator("#cinematicIntro").waitFor({ state: "hidden" });
    async function send() {
      await p.locator("#description").fill("The car has an unusual noise");
      await p.locator("#sendButton").click();
    }
    await send();
    await p.locator(".speech-pending").waitFor();
    assert.doesNotMatch(
      await p.locator(".message.assistant").last().textContent(),
      /synchronized reply/,
    );
    await p.waitForFunction(
      () => document.body.dataset.speechState === "speaking",
    );
    assert.match(
      await p.locator(".message.assistant").last().textContent(),
      /synchronized reply number 1/,
    );
    assert.equal(speechRequests, 1);
    await p.locator("#stopSpeech").click();
    mode = "quota";
    await send();
    await p.waitForFunction(
      () =>
        document.querySelectorAll(".message.assistant").length === 2 &&
        !document.querySelector(".speech-pending"),
    );
    assert.match(
      await p.locator(".message.assistant").last().textContent(),
      /number 2/,
    );
    await p.locator("#speechNotice:not(.hidden)").waitFor();
    mode = "slow";
    await send();
    await p.locator(".speech-pending").waitFor();
    await p.locator(".show-reply-now").click();
    assert.match(
      await p.locator(".message.assistant").last().textContent(),
      /number 3/,
    );
    assert.equal(
      await p.evaluate(() => document.body.dataset.speechState),
      "idle",
    );
    await send();
    await p.locator(".speech-pending").waitFor();
    await p.waitForFunction(
      () => !document.querySelector(".speech-pending"),
      {},
      { timeout: 17000 },
    );
    assert.match(
      await p.locator(".message.assistant").last().textContent(),
      /number 4/,
    );
    assert.equal(
      await p.evaluate(() => document.body.dataset.speechState),
      "idle",
    );
    assert.match(
      await p.locator("#speechNotice").textContent(),
      /too long|تأخر/,
    );
    const saved = await p.evaluate(() =>
      JSON.parse(localStorage.getItem("carnoise-garage-v2")),
    );
    assert.ok(
      saved.cases.some((c) =>
        c.messages.some((m) =>
          m.content.includes("synchronized reply number 4"),
        ),
      ),
    );
    await p.reload();
    await p.locator("[data-intro=skip]").click();
    await p.locator("#cinematicIntro").waitFor({ state: "hidden" });
    await p.locator("#menuButton").click();
    await p.locator(".history-row").first().click();
    assert.equal(await p.locator(".speech-pending").count(), 0);
    await p.evaluate(() => {
      const prefs = JSON.parse(localStorage.getItem("warshatak-voice"));
      prefs.auto = false;
      localStorage.setItem("warshatak-voice", JSON.stringify(prefs));
    });
    await p.reload();
    await p.locator("[data-intro=skip]").click();
    await p.locator("#cinematicIntro").waitFor({ state: "hidden" });
    const previous = speechRequests;
    await send();
    await p.waitForFunction(() => document.querySelector(".message.assistant"));
    assert.match(
      await p.locator(".message.assistant").last().textContent(),
      /number 5/,
    );
    assert.equal(speechRequests, previous);
    assert.equal(await p.locator(".speech-pending").count(), 0);
    await p.evaluate(() => {
      const prefs = JSON.parse(localStorage.getItem("warshatak-voice"));
      prefs.auto = true;
      localStorage.setItem("warshatak-voice", JSON.stringify(prefs));
    });
    await p.reload();
    await p.locator("[data-intro=skip]").click();
    await p.locator("#cinematicIntro").waitFor({ state: "hidden" });
    urgent = true;
    mode = "success";
    await send();
    await p.waitForFunction(() => document.querySelector(".message.assistant"));
    assert.match(
      await p.locator(".message.assistant").last().textContent(),
      /number 6/,
    );
    assert.equal(
      await p.locator(".speech-pending").count(),
      0,
      "urgent warnings must be immediate",
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS real playback reveals text at speech start; one TTS call; quota releases text; Show text now cancels; 15-second fallback; saved history visible; automatic speech off stays immediate. Provider mocked.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
