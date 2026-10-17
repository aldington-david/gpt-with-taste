export function section(source, heading) {
  const lines = source.replaceAll('\r\n', '\n').split('\n');
  const start = lines.indexOf(heading);
  if (start < 0 || lines.indexOf(heading, start + 1) >= 0)
    throw new Error(`Expected one official section: ${heading}`);
  const level = heading.indexOf(' ');
  let end = start + 1;
  while (end < lines.length) {
    const next = /^(#+) /.exec(lines[end]);
    if (next && next[1].length <= level) break;
    end++;
  }
  return lines.slice(start, end).join('\n').trimEnd();
}

export function compose(text, key, {official, binding, replacements, spec}) {
  const headings = spec.sections[key];
  if (!headings) return text;
  for (const {before, after} of replacements[key]) {
    const first = text.indexOf(before);
    if (first < 0 || text.indexOf(before, first + before.length) >= 0)
      throw new Error(`Review the changed Taste ${key} passage: ${before.slice(0, 80)}`);
    const spacing = after ? '' : (text.slice(first + before.length).match(/^\r?\n\r?\n/)?.[0] ?? '');
    text = text.replace(before + spacing, after);
  }
  const mechanisms = headings.map(heading => {
    let body = section(official, heading);
    // Only tool and shell rules were selected; Taste's verification policy stays intact.
    if (heading === '# Rules for getting work done') {
      const end = body.indexOf('\n- Do not introduce unsolicited warnings,');
      if (end < 0) throw new Error('Review the official tool-rule selection');
      body = body.slice(0, end).trimEnd();
    }
    return body;
  }).join('\n\n');
  const prefix = `${binding.trimEnd()}\n\n${mechanisms}\n\n`.replaceAll('\r\n', '\n');
  const newline = text.includes('\r\n') ? '\r\n' : '\n';
  return prefix.replaceAll('\n', newline) + text;
}
