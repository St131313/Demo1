// components/image.js
// Element type: "image" — Galerie mit beliebig vielen Bildern.
// Das Grid passt sich über CSS (auto-fill) automatisch an images.length an.
import { el } from '../dom.js';

export function render(element) {
  const block = el('section', { class: 'block block--image' });
  if (element.heading) {
    block.append(el('h3', { class: 'block__heading', text: element.heading }));
  }

  const images = Array.isArray(element.images) ? element.images : [];
  const gallery = el('ul', { class: 'gallery', role: 'list' });

  images.forEach((image) => {
    const img = el('img', {
      class: 'gallery__img',
      src: image.src,
      // Leeres alt für rein dekorative Bilder; sonst der gelieferte Alt-Text.
      alt: image.alt || '',
      loading: 'lazy',
      decoding: 'async',
    });

    // Bricht eine (Platzhalter-)Quelle, zeigen wir einen sichtbaren Platzhalter
    // statt eines kaputten Bild-Icons.
    img.addEventListener('error', () => {
      const ph = el('div', { class: 'gallery__placeholder', role: 'img', 'aria-label': image.alt || image.caption || 'Bild' }, [
        el('span', { text: 'Bild nicht verfügbar' }),
      ]);
      img.replaceWith(ph);
    });

    const figure = el('figure', { class: 'gallery__figure' }, [
      img,
      el('figcaption', { class: 'gallery__caption', text: image.caption }),
    ]);
    gallery.append(el('li', { class: 'gallery__item' }, [figure]));
  });

  block.append(gallery);
  return block;
}
