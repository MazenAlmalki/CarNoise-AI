import test from 'node:test';import assert from 'node:assert/strict';
import {introCopy,INTRO_DURATION,introCueAt} from '../public/intro-copy.js';
test('bilingual film has a bounded duration and complete concise narrative/caption beats',()=>{assert.ok(INTRO_DURATION>=8000&&INTRO_DURATION<=12000);for(const language of ['ar','en']){const copy=introCopy[language];assert.equal(copy.lines.length,3);assert.ok(copy.lines.every(x=>x.trim()));assert.ok(copy.tagline.split(' ').length>=3);assert.ok(copy.lines.join(' ').length<150);}assert.deepEqual([0,2700,6500].map(introCueAt),[0,1,2]);});
