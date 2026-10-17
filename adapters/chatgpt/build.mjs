import {preferenceText, loadPolicy} from '../codex/compose.mjs';

export async function render({root, texts}) {
  const policy = await loadPolicy(root);
  const body = preferenceText(texts.main, policy.patches.main, 'main');
  const scope = 'Use the tools, skills, resource access, role boundaries and permissions actually supplied by ChatGPT. This skill adds work and expression preferences only. It does not install local hooks, replace ChatGPT base instructions, grant delegation or background execution, or introduce Codex tool names. Perform only work supported and authorized in this session. Preserve native required updates, citations and artifact links.\n';
  const skill = '---\nname: taste\ndescription: Use GPT with Taste preferences for purposeful, evidence-based writing, research, design and authorized implementation. Preserve the current ChatGPT tools, permissions and task scope.\n---\n\n' + scope + '\n' + body + '\n';
  const manifest = {name: 'gpt-with-taste-chatgpt', version: '0.1.0-rc.1',
    description: 'Taste preferences using the native ChatGPT runtime.', license: 'MIT', skills: './skills/'};
  return new Map([
    ['.codex-plugin/plugin.json', JSON.stringify(manifest, null, 2) + '\n'],
    ['skills/taste/SKILL.md', skill],
    ['PROVENANCE.md', '# ChatGPT preference projection\n\nGenerated from the Taste Main author source after reviewed removal of duplicated mechanism paragraphs. No official Codex mechanism blocks, tool aliases, local hook commands or additional permissions are loaded. Register through a supported ChatGPT plugin flow, not the Codex installer. This is not an export of ChatGPT private system instructions.\n'],
  ]);
}
