import {TEXT_KEYS} from '../../src/build.mjs';
import {compose, loadPolicy} from './compose.mjs';

export async function render({root, meta, texts}) {
  const policy = await loadPolicy(root);
  const composed = compose(texts, policy);
  return new Map([
    ...TEXT_KEYS.map(key => [meta.texts[key], composed[key]]),
    ['UPSTREAMS.json', policy.provenance],
    ['LICENSE-OpenAI.txt', policy.license],
    ['NOTICE-OpenAI.txt', policy.notice],
  ]);
}
