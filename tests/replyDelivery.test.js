import test from "node:test";
import assert from "node:assert/strict";
import { createReplyDelivery, waitForReplyPreparation } from "../public/reply-delivery.js";
test("reply stays pending until actual playback callback releases it; history text is never modified", () => {
  const released = [],
    message = { content: "Complete reply" },
    before = JSON.stringify(message),
    gate = createReplyDelivery({ onRelease: (x) => released.push(x) });
  gate.prepare(message, "car-case");
  assert.equal(gate.isPending(message), true);
  assert.equal(released.length, 0);
  gate.release(message);
  assert.equal(gate.isPending(message), false);
  assert.equal(released[0].caseId, "car-case");
  assert.equal(JSON.stringify(message), before);
});
test("a stale playback callback cannot reveal or cancel the next reply", () => {
  const gate = createReplyDelivery(),
    old = {},
    next = {};
  gate.prepare(old, "old");
  gate.prepare(next, "next");
  gate.release(old);
  assert.equal(gate.isPending(next), true);
  gate.release(next);
});
test("slow speech releases text once and cancels the delayed voice through fallback", async () => {
  let releases = 0,
    slow = 0;
  const message = {},
    gate = createReplyDelivery({
      waitMs: 10,
      onRelease: () => releases++,
      onSlow: () => slow++,
    });
  gate.prepare(message, "case");
  await new Promise((r) => setTimeout(r, 25));
  assert.equal(gate.isPending(message), false);
  assert.equal(releases, 1);
  assert.equal(slow, 1);
  gate.release(message);
  assert.equal(releases, 1);
});

test('cancelling preparation rejects immediately instead of releasing a stale reply',async()=>{
 const controller=new AbortController();let displayed=false;
 const pending=waitForReplyPreparation({startedAt:performance.now(),signal:controller.signal,onWait:()=>displayed=true});
 assert.equal(displayed,true);controller.abort();await assert.rejects(pending,{name:'AbortError'});
});
test('safety replies and already-slow responses receive no extra presentation pause',async()=>{
 for(const args of [{startedAt:performance.now(),urgent:true},{startedAt:performance.now()-5000}]){
  let displayed=false;await waitForReplyPreparation({...args,onWait:()=>displayed=true});assert.equal(displayed,false);
 }
});
