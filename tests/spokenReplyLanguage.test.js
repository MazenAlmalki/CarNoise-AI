import test from "node:test";
import assert from "node:assert/strict";
import {
  detectReplyLanguage,
  spokenReplyLanguage,
  replyMatchesLanguage,
} from "../server/chatLanguage.js";
test("Arabic speech overrides English UI, metadata aliases and transliterated Arabic are supported", () => {
  assert.equal(
    spokenReplyLanguage(
      {
        hasRecognizedSpeech: true,
        text: "السيارة تطقطق عند التشغيل",
        language: "unknown",
      },
      "en",
    ),
    "ar",
  );
  assert.equal(
    spokenReplyLanguage(
      { hasRecognizedSpeech: true, text: "salam alaikum", language: "Arabic" },
      "en",
    ),
    "ar",
  );
  assert.equal(
    spokenReplyLanguage(
      { hasRecognizedSpeech: true, text: "salam alaikum", language: "ar-SA" },
      "en",
    ),
    "ar",
  );
  assert.equal(
    spokenReplyLanguage(
      {
        hasRecognizedSpeech: true,
        text: "My engine is clicking",
        language: "English",
      },
      "ar",
    ),
    "en",
  );
  assert.equal(
    spokenReplyLanguage(
      { hasRecognizedSpeech: false, text: "", language: "ar" },
      "en",
    ),
    "en",
  );
});
test("reply language handles Arabic diacritics and Latin vehicle terms without token-count ties", () => {
  assert.equal(
    detectReplyLanguage("سَيَّارَتِي Toyota Camry ترجف", "ar"),
    "ar",
  );
  assert.equal(
    detectReplyLanguage("سيارتي ترجف والمكينة فيها صوت ABS CVT", "en"),
    "ar",
  );
  assert.equal(detectReplyLanguage("What does this noise mean?", "ar"), "en");
  assert.equal(
    replyMatchesLanguage("A squeal can have several causes.", "ar"),
    false,
  );
  assert.equal(
    replyMatchesLanguage("قد يكون صوت احتكاك، واسم القطعة CVT.", "ar"),
    true,
  );
  assert.equal(replyMatchesLanguage("2026-11-03", "ar"), true);
});
