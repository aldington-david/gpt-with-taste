import fs from 'node:fs/promises';
import path from 'node:path';
import {TEXT_KEYS} from '../../src/build.mjs';
import {compose} from './compose.mjs';

export async function render({root, meta, texts}) {
  const directory = path.join(root, 'adapters/codex');
  const read = file => fs.readFile(path.join(directory, file), 'utf8');
  const [official, binding, patches, upstream] = await Promise.all([
    read('official/model-instructions.md'), read('binding.md'), read('patches.json'), read('upstream.json'),
  ]);
  const spec = JSON.parse(upstream), replacements = JSON.parse(patches);
  const files = new Map(TEXT_KEYS.map(key => [meta.texts[key],
    compose(texts[key], key, {official, binding, replacements, spec})]));
  files.set('UPSTREAM.json', upstream);
  files.set('LICENSE-OpenAI.txt', await read('official/LICENSE'));
  files.set('NOTICE-OpenAI.txt', await read('official/NOTICE'));
  return files;
}
