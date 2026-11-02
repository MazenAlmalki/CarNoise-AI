import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSaudiDescription,assessText,groundedResponse } from '../server/saudiUnderstanding.js';

test('Saudi colloquial vibration is normalized',()=>{
 const normalized=normalizeSaudiDescription('سيارتي ترج وهي واقفة');
 assert.match(normalized,/اهتزاز/);
 assert.match(normalized,/عند الوقوف/);
});

test('clear idle vibration retrieves the right knowledge card',()=>{
 const result=assessText('سيارتي ترج وهي واقفة');
 assert.equal(result.matches[0]?.id,'T008');
 assert.equal(result.clearMatch,true);
 const reply=groundedResponse(result,'ar',[]);
 assert.ok(reply.includes('المحرك'));
 assert.ok(!reply.includes('الرياح'));
 assert.ok(reply.includes('المكيف'));
});

test('follow-up about AC remembers prior issue',()=>{
 const messages=[
  {role:'user',content:'سيارتي ترج وهي واقفة'},
  {role:'assistant',content:'هل الرجفة تزيد إذا شغّلت المكيف؟'}
 ];
 const result=assessText('ايه تزيد مع المكيف',messages);
 assert.equal(result.matches[0]?.id,'T008');
 assert.equal(result.clearMatch,true);
 const reply=groundedResponse(result,'ar',messages);
 assert.match(reply,/المكيف/);
 assert.match(reply,/لمبة المكينة/);
});

test('nonspecific text cannot create a confirmed diagnosis',()=>{
 const result=assessText('هلا كيف الحال');
 assert.equal(result.clearMatch,false);
 assert.equal(groundedResponse(result,'ar'),null);
});

test('critical brake issues trigger safety rule',()=>{
 assert.equal(assessText('الفرامل ما تمسك').isDanger,true);
});

test('English engine shaking description matches',()=>{
 const result=assessText('car shaking at idle');
 assert.equal(result.matches[0]?.id,'T008');
 assert.match(groundedResponse(result,'en'),/possibility|possible/i);
});

test('normalization avoids interpreting every single word as a diagnosed failure',()=>{
 const result=assessText('ترج');
 assert.equal(result.clearMatch,false);
});
