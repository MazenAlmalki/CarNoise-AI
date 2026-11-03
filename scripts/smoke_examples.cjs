// Provider responses are mocks; reference WAV playback and storage use the real browser/server.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright"),
  assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
  });
  try {
    const c = await b.newContext({
        viewport: { width: 390, height: 844 },
        permissions: ["microphone"],
      }),
      p = await c.newPage(),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.route("**/api/speech/status", (r) =>
      r.fulfill({ json: { configured: false } }),
    );
    let requests = [];
    await p.route("**/api/chat", (r) => {
      const body = r.request().postDataJSON();
      requests.push(body);
      return r.fulfill({
        json: body.offeredReferenceIds.length
          ? {
              reply: "Resemblance alone does not confirm a fault.",
              responseLanguage: "en",
            }
          : {
              reply:
                "The pitch resembles an example; its source remains uncertain. Does yours sound close to this?",
              responseLanguage: "en",
              referenceExample: {
                id: "upload1-02",
                url: "/api/audio-references/upload1-02",
                reason: "Similar pitch, with different background.",
                uncertainty: "Source unknown.",
                diagnosisConfirmed: false,
              },
            },
      });
    });
    await p.goto(process.env.SMOKE_URL || "http://127.0.0.1:3007");
    await p.locator("#cinematicIntro[open]").waitFor();
    await p.waitForTimeout(2800);
    assert.equal(
      await p.locator("#cinematicIntro[open]").count(),
      1,
      "must wait for a button",
    );
    await p.locator("[data-intro=language]").click();
    await p.locator("[data-intro=skip]").click();
    await p.locator("#cinematicIntro").waitFor({ state: "hidden" });
    assert.equal(
      await p.evaluate(() => document.activeElement.id),
      "description",
    );
    await p.locator("#description").fill("There is a squealing noise");
    await p.locator("#sendButton").click();
    await p.locator(".reference-feedback button:enabled").first().waitFor();
    const player = p.locator(".reference-example audio");
    assert.equal(await player.getAttribute("preload"), "none");
    assert.equal(await player.evaluate((a) => a.paused), true);
    await player.evaluate((a) => a.play());
    await p.waitForFunction(
      () =>
        document.querySelector(".reference-example audio").currentTime > 0.05,
    );
    await p.locator("#recordButton").click();
    await p.waitForFunction(
      () => document.body.dataset.assistantState === "recording",
    );
    assert.equal(await player.evaluate((a) => a.paused), true);
    await p.locator("#cancelDictation").click();
    await p
      .locator(".reference-feedback button")
      .filter({ hasText: "Different" })
      .click();
    await p.waitForFunction(
      () => document.querySelectorAll(".message.assistant").length === 2,
    );
    assert.deepEqual(requests.at(-1).offeredReferenceIds, ["upload1-02"]);
    assert.match(requests.at(-1).message, /different/);
    assert.equal(
      await p.locator(".reference-feedback button:enabled").count(),
      0,
    );
    await p.evaluate(()=>localStorage.setItem("warshatak-cinematic-v1","1"));
    await p.reload();
    await p.locator("#cinematicIntro[open]").waitFor();
    await p.locator("[data-intro=skip]").click();
    await p.locator("#cinematicIntro").waitFor({state:"hidden"});
    await p.locator("#menuButton").click();
    await p.locator(".history-row").first().click();
    assert.equal(
      await p.locator(".reference-feedback [aria-pressed=true]").textContent(),
      "Different",
    );
    await p.locator("#menuButton").click();
    await p.locator("#garageSettings > summary").click();
    await p.locator("#experienceSettings > summary").click();
    await p.locator("#replayIntro").click();
    await p.keyboard.press("Escape");
    assert.equal(await p.locator("#cinematicIntro[open]").count(), 0);
    await p.emulateMedia({ reducedMotion: "reduce" });
    await p.locator("#menuButton").click();
    await p.locator("#replayIntro").click();
    await p.locator("[data-intro=skip]").click();
    await p.locator("#cinematicIntro").waitFor({ state: "hidden" });
    await p.screenshot({
      path: process.env.SMOKE_SCREENSHOT || "/tmp/warshatak-examples.png",
      fullPage: true,
    });
    if (process.env.AXE_MODULE) {
      const Axe = require(process.env.AXE_MODULE).default;
      const result = await new Axe({ page: p })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      assert.deepEqual(
        result.violations.map((v) => v.id),
        [],
      );
    }
    const reference = await p.request.get(
      new URL("/api/audio-references/upload1-02", p.url()).href,
    );
    assert.equal(reference.status(), 200);
    assert.equal((await reference.body()).toString("ascii", 0, 4), "RIFF");
    assert.equal(
      (
        await p.request.get(
          new URL("/api/audio-references/invented", p.url()).href,
        )
      ).status(),
      404,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS button intro holds, fades and focuses chat; real WAV playback; recording cancels reference; feedback persists and excludes offered ID; replay, reduced motion, mobile and optional axe. Provider responses mocked.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
