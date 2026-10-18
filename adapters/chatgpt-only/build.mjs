import fs from 'node:fs/promises';
import path from 'node:path';
import {render as renderChatGPT} from '../chatgpt/build.mjs';

export async function render({root, meta, texts}) {
  const original = await renderChatGPT({texts});
  const manifest = {
    $schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
    name: 'gpt-with-taste-chatgpt-only',
    version: meta.version,
    description: 'Taste preferences for ChatGPT, with Codex skill discovery excluded.',
    license: 'MIT',
  };
  return new Map([
    ['plugin.json', JSON.stringify(manifest, null, 2) + '\n'],
    ['skills/taste/SKILL.md', original.get('skills/taste/SKILL.md')],
    // shortcut: filter known products; use capability gating if the host later supports it.
    ['skills/taste/agents/openai.yaml', 'policy:\n  products: [CHATGPT]\n'],
    ['LICENSE', await fs.readFile(path.join(root, 'LICENSE'), 'utf8')],
    ['PROVENANCE.md', '# ChatGPT product-scoped plugin\n\nThe skill is byte-identical to the existing ChatGPT projection, including the complete Taste Main source. Product metadata excludes Codex skill discovery so its model_instructions_file entry remains separate. This is product filtering, not detection of model_instructions_file support or cloud-only execution. CHATGPT was verified through an isolated plugin installation with Codex 0.163.0-alpha.10.2; cloud ingestion and model behavior remain unverified.\n'],
  ]);
}
