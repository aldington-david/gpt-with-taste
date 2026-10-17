import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadRecipe, compile} from '../../src/build.mjs';
import {loadPolicy, compose, section} from './compose.mjs';
import {run} from '../../scripts/build.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const policy = await loadPolicy(root);
const {texts} = await loadRecipe(root);
const generated = compose(texts, policy);

test('Main keeps each selected official mechanism once and preserves Taste personality', () => {
  for (const heading of ['# When to ask the user for permission', '# Working with the user',
    '# Rules for getting work done', '# Using skills', '# Apps (Connectors)', '# Plugins'])
    assert.equal(generated.main.split(section(policy.official, heading)).length - 1, 1, heading);
  assert.doesNotMatch(generated.main, /# Personality\n|Avoid section headings/);
  assert.match(generated.main, /Be lively, perceptive, warm/);
  assert.match(generated.main, /Form a valuable, falsifiable hypothesis/);
});

test('Sub gets tool and artifact contracts without Main user-dialogue procedures', () => {
  assert.match(generated.sub, /# Using skills/);
  assert.match(generated.sub, /### Visualizations/);
  assert.doesNotMatch(generated.sub, /# Working with the user|request_user_input_async/);
  assert.match(generated.sub, /The parent owns cross-task coordination, integration, and final acceptance/);
  assert.match(generated.sub, /native parent-channel contract/);
});

test('tool discovery, scientific figures and shell quoting remain conditional on the runtime', () => {
  for (const key of ['main', 'sub', 'independent']) {
    assert.match(generated[key], /Named APIs below apply only when exposed/);
    for (const text of ['skills.list', 'main_resource', 'tool_search', 'JSON.stringify()',
      'standard plotting tools', 'Plugins are not invoked directly']) assert.ok(generated[key].includes(text));
  }
});

test('approved conflicting paragraphs are removed; meaningful facts and limits survive', () => {
  for (const key of ['main', 'sub', 'independent'])
    for (const {before, after} of policy.patches[key]) {
      assert.ok(!generated[key].includes(before));
      if (after) assert.ok(generated[key].includes(after));
    }
  assert.doesNotMatch(generated.main, /Nonessential hash verification is prohibited/);
  assert.match(generated.main, /Run tests appropriate to the change/);
  assert.match(generated.main, /integration and acceptance duties/);
});

test('upstream edits at removal anchors stop the build; unrelated additions survive', () => {
  const before = policy.patches.main[0].before;
  assert.throws(() => compose({...texts, main: texts.main.replace(before, 'Upstream changed this clause')}, policy), /Review the upstream/);
  assert.throws(() => compose({...texts, main: texts.main + '\n\n' + before}, policy), /one approved paragraph/);
  const result = compose({...texts, main: texts.main + '\nApproved extra example.\n'}, policy);
  assert.match(result.main, /Approved extra example/);
  assert.equal(result.sub, generated.sub);
});

test('missing or ambiguous official sections never silently produce a Taste-only fallback', () => {
  assert.throws(() => section('# Missing\n', '# Using skills'), /missing or ambiguous/);
  assert.throws(() => section('# Using skills\na\n# Using skills\nb', '# Using skills'), /missing or ambiguous/);
  assert.throws(() => compose(texts, {...policy, official: '# Missing\n'}), /missing or ambiguous/);
});

test('all three reminders are bounded and do not repeat the complete mechanism source', () => {
  for (const key of ['userSteer', 'subSteer', 'agentSteer']) {
    assert.ok(Buffer.byteLength(generated[key], 'utf8') < 2500);
    assert.doesNotMatch(generated[key], /skills\.list|request_user_input_async|# Using skills/);
    assert.match(generated[key], /native/);
  }
  assert.match(generated.agentSteer, /mailbox wake is not proof/);
  assert.throws(() => compose(texts, {...policy, steering: {...policy.steering, userSteer: 'x'.repeat(2501)}}), /oversized/);
});

test('existing installer prompt paths equal the generated Codex files and include license sidecars', async () => {
  const files = await compile(root, ['codex']);
  for (const name of ['main', 'sub', 'user-steer', 'sub-steer', 'agent-steer'])
    assert.equal(files.get(`prompts/${name}.md`), files.get(`dist/codex/${name}.md`));
  assert.ok(files.has('dist/codex/LICENSE-OpenAI.txt'));
  assert.ok(files.has('dist/codex/NOTICE-OpenAI.txt'));
  assert.equal(JSON.parse(files.get('dist/codex/UPSTREAMS.json')).official.model, 'gpt-6-astra');
});

test('ChatGPT gets a preference skill without Codex tool names, hooks or MCP registration', async () => {
  const files = await compile(root, ['chatgpt']);
  const skill = files.get('dist/chatgpt/skills/taste/SKILL.md');
  assert.match(skill, /name: taste/);
  assert.match(skill, /Be lively, perceptive, warm/);
  assert.doesNotMatch(skill, /skills\.list|codex_apps|functions\.exec|request_user_input_async/);
  assert.ok(![...files.keys()].some(name => /\/hooks\//.test(name)));
  const manifest = JSON.parse(files.get('dist/chatgpt/.codex-plugin/plugin.json'));
  assert.equal(manifest.skills, './skills/');
  assert.ok(!Object.hasOwn(manifest, 'hooks'));
  assert.ok(!Object.hasOwn(manifest, 'mcpServers'));
});

test('composition leaves the portable recipe object intact', () => {
  const before = structuredClone(texts);
  compose(texts, policy);
  assert.deepEqual(texts, before);
});

test('build is deterministic and check reports drift without changing the file', async t => {
  const scratch = await fs.mkdtemp(path.join(os.tmpdir(), 'taste-native-'));
  t.after(() => fs.rm(scratch, {recursive: true, force: true}));
  for (const dir of ['recipe', 'src', 'adapters'])
    await fs.cp(path.join(root, dir), path.join(scratch, dir), {recursive: true});
  assert.deepEqual(await compile(scratch, ['codex', 'chatgpt']), await compile(scratch, ['chatgpt', 'codex']));
  await run(['--target', 'codex', '--target', 'chatgpt'], scratch);
  await run(['--target', 'codex', '--target', 'chatgpt', '--check'], scratch);
  const target = path.join(scratch, 'prompts/main.md');
  await fs.appendFile(target, '\nDRIFT\n');
  await assert.rejects(run(['--target', 'codex', '--check'], scratch), /prompts\/main.md/);
  assert.match(await fs.readFile(target, 'utf8'), /DRIFT/);
});
