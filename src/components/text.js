// components/text.js
// Element type: "text" — Überschrift (optional) + Markdown-Fließtext.
import { el } from '../dom.js';
import { renderMarkdown } from '../markdown.js';

export function render(element) {
  const block = el('section', { class: 'block block--text' });
  if (element.heading) {
    block.append(el('h3', { class: 'block__heading', text: element.heading }));
  }
  block.append(el('div', { class: 'prose', html: renderMarkdown(element.body) }));
  return block;
}
