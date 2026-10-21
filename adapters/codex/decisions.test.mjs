import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadRecipe, compile} from '../../src/build.mjs';
import {compose, loadPolicy, officialSection, section, missingSkillAdjustment} from './compose.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const {texts} = await loadRecipe(root);
const policy = await loadPolicy(root);
const outputs = compose(texts, policy);
const {before, after} = missingSkillAdjustment;

test('C2 changes exactly one sentence in the official skill section for every Codex role', () => {
  const original = section(policy.official, '# Using skills');
  const adapted = officialSection(policy.official, '# Using skills');
  assert.equal(adapted, original.replace(before, after));
  assert.equal(adapted.replace(after, before), original);
  for (const key of ['main', 'sub', 'independent']) {
    assert.equal(outputs[key].split(adapted).length - 1, 1, key);
    assert.equal(outputs[key].split(after).length - 1, 1, key);
    assert.ok(!outputs[key].includes(before), key);
  }
  assert.ok(policy.official.includes(before));
  assert.ok(!policy.official.includes(after));
});

test('C2 retains skill discovery, reporting, role boundaries and a stop when no independent work remains', () => {
  const adapted = officialSection(policy.official, '# Using skills');
  assert.ok(adapted.includes('If the file is missing, search for that skill elsewhere in case the path was stale.'));
  for (const requirement of ['report the missing skill', "role's permitted communication channel",
    'pause only the work that depends on it', 'already-authorized work that is independent',
    'Do not pretend to have used the skill', 'bypass an explicit requirement to use it',
    'If no independent work remains, end the turn']) assert.ok(after.includes(requirement), requirement);
  assert.throws(() => officialSection(policy.official.replace(before, 'Changed upstream wording.'), '# Using skills'), /source drift/);
  assert.throws(() => officialSection(policy.official.replace(before, before + ' ' + before), '# Using skills'), /source drift/);
});

test('C1 retains the official feedback cadence and all Taste text without reclassifying or shortening it', () => {
  const interaction = section(policy.official, '# Working with the user');
  for (const key of ['main', 'independent']) assert.ok(outputs[key].includes(interaction));
  for (const key of ['main', 'sub', 'independent']) {
    assert.ok(outputs[key].endsWith(texts[key]));
    assert.equal(outputs[key].split(texts[key]).length - 1, 1);
  }
  for (const key of ['userSteer', 'subSteer', 'agentSteer']) assert.equal(outputs[key], texts[key]);
  assert.ok(outputs.main.includes('Do ordinary checks without narrating each tool call.'));
  assert.ok(outputs.userSteer.includes('Necessary execution updates should name an actual action, not preview the writing plan.'));
  assert.ok(outputs.independent.includes('When starting a task or changing direction, state the goal and next step in one sentence, then proceed.'));
});

test('all other official sections remain exact, with no changes to the template hierarchy', () => {
  for (const heading of ['# When to ask the user for permission', '# Working with the user',
    '# Rules for getting work done', '# Apps (Connectors)', '# Plugins', '### Formatting rules', '### Visualizations'])
    assert.equal(officialSection(policy.official, heading), section(policy.official, heading));
  assert.ok(outputs.sub.includes('# Working with the user\n\n## Final answer\n\n### Formatting rules'));
  assert.ok(!outputs.sub.includes('request_user_input_async'));
});

test('the actual compiler exports C2 to installer files, while ChatGPT and all reminder files keep their own text', async () => {
  const files = await compile(root, ['codex', 'chatgpt']);
  for (const name of ['main', 'sub']) {
    assert.equal(files.get(`prompts/${name}.md`), files.get(`dist/codex/${name}.md`));
    assert.ok(files.get(`prompts/${name}.md`).includes(after));
  }
  for (const [name, key] of [['user', 'userSteer'], ['sub', 'subSteer'], ['agent', 'agentSteer']]) {
    assert.equal(files.get(`prompts/${name}-steer.md`), texts[key]);
    assert.equal(files.get(`dist/codex/${name}-steer.md`), texts[key]);
  }
  const chatgpt = files.get('dist/chatgpt/skills/taste/SKILL.md');
  assert.ok(chatgpt.endsWith(texts.main));
  assert.ok(!chatgpt.includes(after));
});
