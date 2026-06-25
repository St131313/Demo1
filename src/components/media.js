// components/media.js
// Element type: "media" — Video oder Audio (mediaType bestimmt das Element).
// Optional: Untertitel-Spur (captionTrack) und Transkript.
import { el } from '../dom.js';

export function render(element) {
  const block = el('section', { class: 'block block--media' });
  if (element.heading) {
    block.append(el('h3', { class: 'block__heading', text: element.heading }));
  }

  let player;
  if (element.mediaType === 'audio') {
    player = el('audio', { class: 'media__player', controls: true, preload: 'metadata', src: element.src });
  } else {
    // Standard: Video. <track> nur, wenn eine Untertitel-Spur vorhanden ist.
    player = el('video', {
      class: 'media__player', controls: true, preload: 'metadata',
      playsinline: '', src: element.src,
    });
    if (element.captionTrack) {
      player.append(el('track', {
        kind: 'captions', src: element.captionTrack,
        srclang: 'de', label: 'Deutsch', default: true,
      }));
    }
  }

  // Falls die (Platzhalter-)Quelle nicht lädt, sichtbaren Hinweis zeigen –
  // niemals stilles Scheitern.
  player.addEventListener('error', () => {
    if (player.dataset.errShown) return;
    player.dataset.errShown = '1';
    player.replaceWith(el('p', {
      class: 'media__fallback', role: 'status',
      text: `Medien konnten nicht geladen werden: ${element.src}`,
    }));
  });

  const figure = el('figure', { class: 'media__frame' }, [player]);
  block.append(figure);

  if (element.transcript) {
    block.append(el('details', { class: 'media__transcript' }, [
      el('summary', { text: 'Transkript anzeigen' }),
      el('div', { class: 'prose', text: element.transcript }),
    ]));
  }

  return block;
}
