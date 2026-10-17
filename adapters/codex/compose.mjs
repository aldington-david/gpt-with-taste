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
  if (typeof source !== 'string' || !source.trim())
    throw new Error(`Missing Taste source: ${key}`);
  // A future sentence-level replacement needs explicit review, not a silent deletion.
  if (!Array.isArray(edits) || edits.length)
    throw new Error(`Taste ${key} must be preserved verbatim; review any proposed replacement first`);
  return source;
}

export async function loadPolicy(root) {
  const directory = path.join(root, 'adapters/codex');
  const read = name => fs.readFile(path.join(directory, name), 'utf8');
  const [official, binding, patches, provenance, license, notice] = await Promise.all([
    read('official/astra-base.md'), read('binding.md'), read('patches.json'),
    read('upstreams.json'), read('official/LICENSE'), read('official/NOTICE'),
  ]);
  return {official, binding, patches: JSON.parse(patches), provenance, license, notice};
}

export function compose(texts, policy) {
  const common = ['# Rules for getting work done', '# Using skills', '# Apps (Connectors)', '# Plugins']
    .map(heading => section(policy.official, heading));
  const delivery = ['### Formatting rules', '### Visualizations']
    .map(heading => section(policy.official, heading));
  const interaction = [section(policy.official, '# When to ask the user for permission'),
    section(policy.official, '# Working with the user')];
  const result = {};
  for (const key of ['main', 'sub', 'independent']) {
    // Keep the original parent headings for Sub's artifact excerpts, without
    // importing the root agent's user-dialogue procedures into that role.
    const native = key === 'sub'
      ? ['# Working with the user\n\n## Final answer\n\n' + delivery.join('\n\n'), ...common]
      : [...interaction, ...common];
    const taste = preferenceText(texts[key], policy.patches[key], key);
    result[key] = [policy.binding.trim(), ...native].join('\n\n') + '\n\n' + taste;
  }
  for (const key of ['userSteer', 'subSteer', 'agentSteer']) {
    if (typeof texts[key] !== 'string' || !texts[key].trim())
      throw new Error(`Missing original Taste reminder: ${key}`);
    result[key] = texts[key];
  }
  return result;
}
