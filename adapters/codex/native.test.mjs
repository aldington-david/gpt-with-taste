import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {loadRecipe, compile, TEXT_KEYS} from '../../src/build.mjs';
import {loadPolicy, compose, section, preferenceText} from './compose.mjs';
import {run} from '../../scripts/build.mjs';
import {pluginBundle, MARKET_ROOT} from '../../src/codex-plugin.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const policy = await loadPolicy(root);
const {texts} = await loadRecipe(root);
const generated = compose(texts, policy);
const legacy = JSON.parse(await fs.readFile(path.join(root, 'docs/fork/history/f2dd633-patches.json'), 'utf8'));

async function scratch(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'taste-preservation-'));
  t.after(() => fs.rm(directory, {recursive: true, force: true}));
  return directory;
}

test('all three standing Taste sources survive as complete, byte-identical bodies', () => {
  for (const key of ['main', 'sub', 'independent']) {
    assert.ok(generated[key].endsWith(texts[key]), key);
    assert.equal(generated[key].split(texts[key]).length - 1, 1, key);
    assert.deepEqual(policy.patches[key], []);
  }
});

test('every previously deleted or shortened paragraph is restored at its original position', () => {
  let count = 0;
  for (const key of ['main', 'sub', 'independent']) {
    const body = generated[key].slice(-texts[key].length);
    for (const {before} of legacy[key]) {
      assert.equal(body.indexOf(before), texts[key].indexOf(before));
      assert.ok(body.includes(before));
      count++;
    }
  }
  assert.equal(count, 12);
});

test('all original reminders survive verbatim, including paragraph boundaries and final newline', () => {
  for (const key of ['userSteer', 'subSteer', 'agentSteer']) assert.equal(generated[key], texts[key]);
  assert.equal(generated.userSteer.trim().split(/\n\n/).length, 5);
  assert.equal(generated.subSteer.trim().split(/\n\n/).length, 3);
  assert.equal(generated.agentSteer.trim().split(/\n\n/).length, 3);
});

test('no hidden deletion, normalization, or replacement can pass through preferenceText', () => {
  const literal = ' \t\r\n# Literal source\r\n\r\nKeep <!-- a comment -->.\r\n  tail\t \r\n\r\n';
  assert.equal(preferenceText(literal, [], 'main'), literal);
  assert.throws(() => preferenceText(literal, [{before: 'Keep', after: ''}], 'main'), /preserved verbatim/);
  const varied = Object.fromEntries(TEXT_KEYS.map(key => [key, literal + key + '\r\n']));
  const result = compose(varied, policy);
  for (const key of ['main', 'sub', 'independent']) assert.ok(result[key].endsWith(varied[key]));
  for (const key of ['userSteer', 'subSteer', 'agentSteer']) assert.equal(result[key], varied[key]);
});

test('Main keeps each selected official section once and does not import official personality', () => {
  let position = -1;
  for (const heading of ['# When to ask the user for permission', '# Working with the user',
    '# Rules for getting work done', '# Using skills', '# Apps (Connectors)', '# Plugins']) {
    const excerpt = section(policy.official, heading);
    assert.equal(generated.main.split(excerpt).length - 1, 1, heading);
    const next = generated.main.indexOf(excerpt); assert.ok(next > position); position = next;
  }
  assert.doesNotMatch(generated.main, /# Personality\n|Avoid section headings/);
});

test('Sub artifact excerpts retain native parent headings and order, without root dialogue', () => {
  const sub = generated.sub;
  assert.match(sub, /# Working with the user\n\n## Final answer\n\n### Formatting rules/);
  assert.ok(sub.indexOf('### Visualizations') < sub.indexOf('# Rules for getting work done'));
  assert.doesNotMatch(sub, /request_user_input_async|## Intermediate commentary/);
  for (const heading of ['### Formatting rules', '### Visualizations', '# Using skills', '# Apps (Connectors)', '# Plugins'])
    assert.equal(sub.split(section(policy.official, heading)).length - 1, 1);
});

test('runtime applicability keeps actual tool and role boundaries without a new polling-method ban', () => {
  assert.match(policy.binding, /only when supplied by the current runtime/);
  assert.match(policy.binding, /parent communication channel/);
  assert.doesNotMatch(policy.binding, /Do not synthesize a missing event|Taste's preferences below/);
  for (const key of ['main', 'sub', 'independent'])
    for (const term of ['skills.list', 'main_resource', 'tool_search', 'JSON.stringify()', 'standard plotting tools'])
      assert.ok(generated[key].includes(term), `${key}: ${term}`);
});

test('missing or ambiguous official sources fail rather than silently dropping mechanisms', () => {
  assert.throws(() => section('# Missing\n', '# Using skills'), /missing or ambiguous/);
  assert.throws(() => section('# Using skills\na\n# Using skills\nb', '# Using skills'), /missing or ambiguous/);
  assert.throws(() => compose(texts, {...policy, official: '# Missing\n'}), /missing or ambiguous/);
});

test('ChatGPT contains complete Taste Main and does not depend on Codex policy files', async t => {
  const {render} = await import('../chatgpt/build.mjs');
  const nonexistentRoot = path.join(await scratch(t), 'no-codex-files');
  const files = await render({root: nonexistentRoot, texts});
  const skill = files.get('skills/taste/SKILL.md');
  assert.ok(skill.endsWith(texts.main));
  assert.equal(skill.split(texts.main).length - 1, 1);
  assert.doesNotMatch(skill, /skills\.list|codex_apps|functions\.exec|request_user_input_async/);
  const manifest = JSON.parse(files.get('.codex-plugin/plugin.json'));
  assert.ok(!('hooks' in manifest)); assert.ok(!('mcpServers' in manifest));
});

test('composition does not mutate the author sources', () => {
  const original = structuredClone(texts);
  compose(texts, policy);
  assert.deepEqual(texts, original);
});

test('build preserves installer paths and source bytes, and detects output drift read-only', async t => {
  const directory = await scratch(t);
  for (const name of ['recipe', 'src', 'adapters'])
    await fs.cp(path.join(root, name), path.join(directory, name), {recursive: true});
  const first = await compile(directory, ['codex', 'chatgpt']);
  assert.deepEqual(first, await compile(directory, ['chatgpt', 'codex']));
  for (const name of ['main', 'sub', 'user-steer', 'sub-steer', 'agent-steer'])
    assert.equal(first.get(`prompts/${name}.md`), first.get(`dist/codex/${name}.md`));
  await run(['--target', 'codex', '--target', 'chatgpt'], directory);
  await run(['--target', 'codex', '--target', 'chatgpt', '--check'], directory);
  const target = path.join(directory, 'prompts/main.md');
  await fs.appendFile(target, '\nDRIFT\n');
  await assert.rejects(run(['--target', 'codex', '--check'], directory), /prompts\/main.md/);
  assert.match(await fs.readFile(target, 'utf8'), /DRIFT/);
});

test('built plugin and real hook CLI deliver all original reminder text with native routing and dedup', async t => {
  const directory = await scratch(t);
  // Build in the fixture so the test never installs into a real Codex home.
  for (const name of ['recipe', 'src', 'adapters', 'hooks', 'plugin'])
    await fs.cp(path.join(root, name), path.join(directory, name), {recursive: true});
  await run(['--target', 'codex'], directory);
  const bundle = await pluginBundle(directory);
  const home = path.join(directory, 'isolated home 中文');
  for (const [relative, bytes] of bundle) {
    const target = path.join(home, relative);
    await fs.mkdir(path.dirname(target), {recursive: true}); await fs.writeFile(target, bytes);
  }
  const pluginRoot = path.join(home, MARKET_ROOT, 'plugins/gpt-with-taste');
  const definitions = JSON.parse(await fs.readFile(path.join(pluginRoot, 'hooks/hooks.json'), 'utf8'));
  assert.deepEqual(Object.keys(definitions.hooks), ['UserPromptSubmit', 'SubagentStart', 'PostToolUse']);
  const data = path.join(directory, 'plugin data');
  function invoke(event) {
    const before = JSON.stringify(event);
    const call = spawnSync(process.execPath, [path.join(pluginRoot, 'hooks/steer.mjs')], {
      input: before, encoding: 'utf8', timeout: 10000,
      env: {...process.env, PLUGIN_ROOT: pluginRoot, PLUGIN_DATA: data, GPT_WITH_TASTE_HOOK_AUDIT: ''},
    });
    assert.equal(call.status, 0, call.stderr);
    assert.equal(JSON.stringify(event), before);
    return JSON.parse(call.stdout);
  }
  function expectText(event, route, key) {
    assert.equal(invoke(event).hookSpecificOutput.additionalContext,
      `<gpt-with-taste-${route}-steer>\n${texts[key].trim()}\n</gpt-with-taste-${route}-steer>`);
  }
  expectText({hook_event_name: 'UserPromptSubmit', session_id: 'parent', turn_id: 'u1'}, 'user', 'userSteer');
  expectText({hook_event_name: 'SubagentStart', session_id: 'parent', agent_id: 'child', turn_id: 'c1'}, 'sub', 'subSteer');
  assert.equal(invoke({hook_event_name: 'UserPromptSubmit', session_id: 'child', turn_id: 'c1'}).hookSpecificOutput, undefined);
  expectText({hook_event_name: 'UserPromptSubmit', session_id: 'child', turn_id: 'c2'}, 'sub', 'subSteer');
  expectText({hook_event_name: 'PostToolUse', session_id: 'parent', tool_name: 'collaborationwait_agent',
    tool_response: {message: 'Wait completed.', timed_out: false}}, 'agent', 'agentSteer');
  for (const response of [{timed_out: true}, {timed_out: false, status: {child: {running: true}}}])
    assert.equal(invoke({hook_event_name: 'PostToolUse', session_id: 'parent', tool_name: 'wait_agent', tool_response: response}).hookSpecificOutput, undefined);
});
