import fs from 'node:fs/promises';
import path from 'node:path';

export function section(source, heading) {
  const headings = [...source.matchAll(/^#{1,6} .+$/gm)];
  const matches = headings.filter(item => item[0] === heading);
  if (matches.length !== 1) throw new Error(`Official section missing or ambiguous: ${heading}`);
  const start = headings.indexOf(matches[0]);
  const depth = heading.indexOf(' ');
  const next = headings.slice(start + 1).find(item => item[0].indexOf(' ') <= depth);
  return source.slice(headings[start].index, next?.index ?? source.length).trim();
}

export function preferenceText(source, edits, key) {
  let result = source;
  for (const {before, after} of edits) {
    if (typeof before !== 'string' || !before || typeof after !== 'string' || result.split(before).length !== 2)
      throw new Error(`Review the upstream ${key} change: expected one approved paragraph (${String(before).slice(0, 64)})`);
    result = result.replace(before, after);
  }
  return result.replace(/\n{3,}/g, '\n\n').trim();
}

export async function loadPolicy(root) {
  const directory = path.join(root, 'adapters/codex');
  const read = name => fs.readFile(path.join(directory, name), 'utf8');
  const [official, binding, patches, steering, provenance, license, notice] = await Promise.all([
    read('official/astra-base.md'), read('binding.md'), read('patches.json'),
    read('steering.json'), read('upstreams.json'), read('official/LICENSE'), read('official/NOTICE'),
  ]);
  return {official, binding, patches: JSON.parse(patches), steering: JSON.parse(steering),
    provenance, license, notice};
}

export function compose(texts, policy) {
  const common = ['# Rules for getting work done', '# Using skills', '# Apps (Connectors)', '# Plugins']
    .map(heading => section(policy.official, heading));
  const delivery = ['### Formatting rules', '### Visualizations']
    .map(heading => section(policy.official, heading));
  const interaction = [section(policy.official, '# When to ask the user for permission'),
    section(policy.official, '# Working with the user')];
  // Working-with-user already includes the formatting and visualization sections.
  const result = {};
  for (const key of ['main', 'sub', 'independent']) {
    const native = key === 'sub' ? [...common, ...delivery] : [...interaction, ...common];
    const taste = preferenceText(texts[key], policy.patches[key], key);
    result[key] = [policy.binding.trim(), ...native, taste].join('\n\n') + '\n';
  }
  for (const key of ['userSteer', 'subSteer', 'agentSteer']) {
    const text = policy.steering[key];
    if (typeof text !== 'string' || !text.trim() || Buffer.byteLength(text, 'utf8') > 2500)
      throw new Error(`Missing or oversized compact reminder: ${key}`);
    result[key] = text.trim() + '\n';
  }
  return result;
}
