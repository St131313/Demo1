// components/accordion.js
// Element type: "accordion" — beliebig viele Panels.
// Nutzt natives <details>/<summary> (tastaturbedienbar, screenreaderfreundlich).
// Die Anzahl ergibt sich ausschließlich aus panels.length.
import { el } from '../dom.js';
import { renderMarkdown } from '../markdown.js';

export function render(element) {
  const block = el('section', { class: 'block block--accordion' });
  if (element.heading) {
    block.append(el('h3', { class: 'block__heading', text: element.heading }));
  }

  const panels = Array.isArray(element.panels) ? element.panels : [];
  const list = el('div', { class: 'accordion' });

  panels.forEach((panel) => {
    const summary = el('summary', { class: 'accordion__summary' }, [
      el('span', { class: 'accordion__title', text: panel.title }),
      el('span', { class: 'accordion__icon', 'aria-hidden': 'true' }),
    ]);
    const details = el('details', { class: 'accordion__item', open: !!panel.defaultOpen }, [
      summary,
      el('div', { class: 'accordion__content prose', html: renderMarkdown(panel.content) }),
    ]);
    list.append(details);
  });

  block.append(list);
  return block;
}
