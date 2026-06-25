// components/slider.js
// Element type: "slider" — beliebig viele Selbsteinschätzungs-Skalen.
// Pro Eintrag in scales[] ein <input type="range"> mit Beschriftung und
// Live-Anzeige des Werts. Keine richtige/falsche Antwort (Selbsteinschätzung).
import { el } from '../dom.js';

export function render(element, ctx) {
  const block = el('section', { class: 'block block--slider' });
  if (element.heading) {
    block.append(el('h3', { class: 'block__heading', text: element.heading }));
  }
  if (element.instructions) {
    block.append(el('p', { class: 'block__instructions', text: element.instructions }));
  }

  const scales = Array.isArray(element.scales) ? element.scales : [];

  scales.forEach((scale) => {
    const inputId = `slider-${scale.id}`;
    const step = scale.step ?? 1;
    const initial = scale.defaultValue ?? scale.min;

    const output = el('output', { class: 'slider__value', for: inputId, text: String(initial) });

    const input = el('input', {
      type: 'range', id: inputId, class: 'slider__input',
      min: scale.min, max: scale.max, step,
      value: initial,
      'aria-describedby': `${inputId}-min ${inputId}-max`,
      on: {
        input: (e) => {
          output.textContent = e.target.value;
          ctx?.userState?.recordSlider(scale.id, Number(e.target.value));
        },
      },
    });

    const row = el('div', { class: 'slider' }, [
      el('div', { class: 'slider__head' }, [
        el('label', { class: 'slider__label', for: inputId, text: scale.label }),
        output,
      ]),
      el('div', { class: 'slider__track' }, [
        el('span', { id: `${inputId}-min`, class: 'slider__end', text: scale.minLabel || String(scale.min) }),
        input,
        el('span', { id: `${inputId}-max`, class: 'slider__end', text: scale.maxLabel || String(scale.max) }),
      ]),
    ]);

    block.append(row);
  });

  return block;
}
