import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {compile, loadRecipe, TARGETS} from '../../src/build.mjs';
import {compose, section} from './compose.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = file => fs.readFile(path.join(root, 'adapters/codex', file), 'utf8');
const [official, binding, patches, upstream, recipe] = await Promise.all([
  read('official/model-instructions.md'), read('binding.md'), read('patches.json'), read('upstream.json'), loadRecipe(root),
]);
const options = {official, binding, replacements: JSON.parse(patches), spec: JSON.parse(upstream)};
const files = await compile(root, ['codex']);
const output = key => files.get(`dist/codex/${recipe.meta.texts[key]}`);

test('Codex restores official tools, skill and plugin guidance once, without importing verification policy A', () => {
  for (const key of ['main', 'sub', 'independent']) {
    const text = output(key);
    for (const heading of ['# Using skills', '# Apps (Connectors)', '# Plugins'])
      assert.equal(text.split(section(official, heading)).length, 2, `${key}: ${heading}`);
    assert.match(text, /Promise\.allSettled/);
    assert.match(text, /JSON\.stringify\(\).*not shell escaping/);
    assert.match(text, /--body-file/);
    assert.doesNotMatch(text, /Do not write tests for reversible, low-impact changes/);
    for (const {before} of options.replacements[key]) assert.ok(!text.includes(before), key);
  }
});

test('user interaction stays with Main and Independent; Sub keeps native parent reporting and artifact rules', () => {
  for (const key of ['main', 'independent']) {
    assert.ok(output(key).includes(section(official, '# When to ask the user for permission')));
    assert.ok(output(key).includes(section(official, '# Working with the user')));
    assert.match(output(key), /60 seconds/);
  }
  const sub = output('sub');
  assert.doesNotMatch(sub, /# When to ask the user for permission|# Working with the user|functions\.request_user_input_async/);
  for (const heading of ['### Formatting rules', '### Visualizations'])
    assert.ok(sub.includes(section(official, heading)));
  for (const key of ['main', 'sub', 'independent']) {
    assert.match(output(key), /Native role messages determine/);
    assert.match(output(key), /A sent message, a mailbox wake, and a completed task are different states/);
    assert.match(output(key), /native parent channel/);
    assert.doesNotMatch(output(key), /You are `\/root`|# Collaboration Mode:|sandbox_mode\s*=/);
  }
});

test('Taste verification A and judgment, collaboration, research and visual quality B/C are retained', () => {
  for (const [key, headings] of Object.entries({
    main: ['## Verify what determines acceptance', '## Make taste visible in the work', '## When the task involves research'],
    sub: ['## Verify the risks that determine delivery', '## Make a clear quality judgment', '## When the task involves research'],
    independent: ['### Software, games, and interfaces', '### Research'],
  })) {
    for (const heading of headings)
      assert.equal(section(output(key), heading), section(recipe.texts[key], heading), `${key}: ${heading}`);
    assert.match(output(key), /user's (?:latest language|chosen persona|explicit persona)/);
  }
  for (const key of ['main', 'sub']) assert.match(output(key), /Nonessential hash verification is prohibited/);
  for (const prefix of ['Choose direct work or delegation', 'Keep one active owner', 'After delegation, do non-overlapping work']) {
    const paragraph = recipe.texts.main.split(/\r?\n\r?\n/).find(text => text.startsWith(prefix));
    assert.ok(paragraph && output('main').includes(paragraph), prefix);
  }
  const persona = recipe.texts.main.split(/\r?\n\r?\n/).find(text => text.startsWith('Be lively,'));
  assert.ok(persona && output('main').includes(persona));
});

test('all Steer exports remain byte-identical and no ChatGPT target is introduced', () => {
  for (const key of ['userSteer', 'subSteer', 'agentSteer']) {
    assert.equal(output(key), recipe.texts[key]);
    assert.equal(files.get(`prompts/${recipe.meta.texts[key]}`), recipe.texts[key]);
  }
  assert.deepEqual(TARGETS, ['codex', 'kiki', 'claude', 'pi', 'omp', 'dsh']);
});

test('recipe changes outside reviewed passages survive; missing or duplicate passages stop composition', () => {
  const suffix = '\n\n\nLiteral user content stays here.\n  trailing spaces  \n';
  assert.ok(compose(recipe.texts.main + suffix, 'main', options).endsWith(suffix));
  const passage = options.replacements.main[0].before;
  assert.throws(() => compose(recipe.texts.main.replace(passage, 'REVISED'), 'main', options), /Review the changed Taste main passage/);
  assert.throws(() => compose(recipe.texts.main + passage, 'main', options), /Review the changed Taste main passage/);
});

test('composition preserves repository LF and Windows CRLF source endings', () => {
  const lf = recipe.texts.main.replaceAll('\r\n', '\n');
  const expected = compose(lf, 'main', options);
  assert.equal(compose(lf.replaceAll('\n', '\r\n'), 'main', options), expected.replaceAll('\n', '\r\n'));
});

test('official section selection is bounded and fails on missing or ambiguous sections', () => {
  assert.equal(section('# One\nA\n## Child\nB\n# Two\nC\n', '# One'), '# One\nA\n## Child\nB');
  assert.equal(section('# One\r\nA\r\n', '# One'), '# One\nA');
  assert.throws(() => section('# Two\n', '# One'), /Expected one official section/);
  assert.throws(() => section('# One\n# One\n', '# One'), /Expected one official section/);
  assert.throws(() => compose(recipe.texts.main, 'main', {...options,
    official: official.replace('- Do not introduce unsolicited warnings,', '- CHANGED,')}), /Review the official tool-rule selection/);
});

test('provenance and notices ship beside generated instructions', () => {
  assert.deepEqual(JSON.parse(files.get('dist/codex/UPSTREAM.json')), options.spec);
  assert.match(files.get('dist/codex/LICENSE-OpenAI.txt'), /Apache License/);
  assert.match(files.get('dist/codex/NOTICE-OpenAI.txt'), /Copyright 2025 OpenAI/);
  for (const key of ['main', 'sub', 'independent'])
    assert.doesNotMatch(output(key), /ce0323f2|adapters\/codex\/|recipe\/manifest\.json/);
});
