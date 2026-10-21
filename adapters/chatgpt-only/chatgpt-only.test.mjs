import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {compile, loadRecipe} from '../../src/build.mjs';
import {render} from './build.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('the additional plugin preserves the original skill and scopes discovery outside Codex', async () => {
  const files = await compile(root, ['chatgpt', 'chatgpt-only']);
  const prefix = 'dist/chatgpt-only/';
  assert.equal(files.get(prefix + 'skills/taste/SKILL.md'), files.get('dist/chatgpt/skills/taste/SKILL.md'));
  assert.equal(files.get(prefix + 'skills/taste/agents/openai.yaml'), 'policy:\n  products: [CHATGPT]\n');
  const manifest = JSON.parse(files.get(prefix + 'plugin.json'));
  assert.deepEqual(manifest, {
    $schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
    name: 'gpt-with-taste-chatgpt-only',
    version: (await loadRecipe(root)).meta.version,
    description: 'Taste preferences for ChatGPT, with Codex skill discovery excluded.',
    license: 'MIT',
  });
  assert.notEqual(manifest.name, JSON.parse(files.get('dist/chatgpt/.codex-plugin/plugin.json')).name);
  assert.equal(files.get(prefix + 'LICENSE'), await fs.readFile(path.join(root, 'LICENSE'), 'utf8'));
  assert.ok(![...files.keys()].some(file => file.startsWith(prefix) && /(?:hooks|mcp|\.app\.json)/.test(file)));
});

test('the additional projection keeps literal source text and the original missing-source error', async () => {
  const {meta, texts} = await loadRecipe(root);
  const literal = ' \t\r\n# Literal source\r\n\r\nKeep this paragraph and its conjunctions.\r\n  tail\t \r\n';
  const files = await render({root, meta, texts: {...texts, main: literal}});
  assert.ok(files.get('skills/taste/SKILL.md').endsWith(literal));
  await assert.rejects(render({root, meta, texts: {...texts, main: ''}}), /Missing Taste Main source/);
});
