export async function render({texts}) {
  if (typeof texts.main !== 'string' || !texts.main.trim()) throw new Error('Missing Taste Main source');
  const scope = 'Use the tools, skills, resource access, role boundaries and permissions actually supplied by ChatGPT. This skill adds work and expression preferences only. It does not install local hooks, replace ChatGPT base instructions, grant delegation or background execution, or introduce Codex tool names. Perform only work supported and authorized in this session. Preserve native required updates, citations and artifact links.\n';
  const skill = '---\nname: taste\ndescription: Use GPT with Taste preferences for purposeful, evidence-based writing, research, design and authorized implementation. Preserve the current ChatGPT tools, permissions and task scope.\n---\n\n' + scope + '\n' + texts.main;
  const manifest = {name: 'gpt-with-taste-chatgpt', version: '0.1.0-rc.2',
    description: 'Taste preferences using the native ChatGPT runtime.', license: 'MIT', skills: './skills/'};
  return new Map([
    ['.codex-plugin/plugin.json', JSON.stringify(manifest, null, 2) + '\n'],
    ['skills/taste/SKILL.md', skill],
    ['PROVENANCE.md', '# ChatGPT preference projection\n\nContains the complete Taste Main author source verbatim after a ChatGPT applicability paragraph. No Codex deletion filter or Codex mechanism excerpts are applied. This projection has no local hook or MCP registration and is not an export of ChatGPT private instructions. Registration and runtime behavior remain unverified.\n'],
  ]);
}
