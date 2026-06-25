// components/flipcards.js
// Element type: "flipcards" — beliebig viele Karteikarten.
// Jede Karte ist ein <button> (tastaturbedienbar). Klick/Enter dreht die Karte
// von front auf back. Das Grid passt sich über CSS automatisch an cards.length an.
// Die 3D-Drehung wird bei prefers-reduced-motion per CSS ausgeschaltet.
import { el } from '../dom.js';

export function render(element) {
  const block = el('section', { class: 'block block--flipcards' });
  if (element.heading) {
    block.append(el('h3', { class: 'block__heading', text: element.heading }));
  }

  const cards = Array.isArray(element.cards) ? element.cards : [];
  const grid = el('ul', { class: 'flipcards', role: 'list' });

  cards.forEach((card) => {
    const front = el('div', { class: 'flipcard__face flipcard__face--front' }, [
      card.image ? el('img', { class: 'flipcard__img', src: card.image, alt: '', loading: 'lazy' }) : null,
      el('span', { class: 'flipcard__text', text: card.front }),
      el('span', { class: 'flipcard__hint', text: 'Zum Umdrehen aktivieren' }),
    ]);
    const back = el('div', { class: 'flipcard__face flipcard__face--back' }, [
      el('span', { class: 'flipcard__text', text: card.back }),
    ]);

    const button = el('button', {
      type: 'button', class: 'flipcard', 'aria-pressed': 'false',
      on: {
        click: (e) => {
          const btn = e.currentTarget;
          const flipped = btn.classList.toggle('is-flipped');
          btn.setAttribute('aria-pressed', String(flipped));
        },
      },
    }, [el('span', { class: 'flipcard__inner' }, [front, back])]);

    grid.append(el('li', { class: 'flipcards__item' }, [button]));
  });

  block.append(grid);
  return block;
}
