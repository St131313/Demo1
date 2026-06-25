// render.js
// Haupt-Renderer des E-Learnings (reines HTML/CSS/JS, kein Framework).
//
// Ablauf:
//  1. schema.json + content JSON parallel laden.
//  2. Inhalte gegen das Schema validieren -> bei Fehlern verständliche
//     Meldung im UI (Seite bleibt NIE leer, Konsole crasht nicht unbemerkt).
//  3. Kurskopf + Modulübersicht (Kacheln aus modules.length) rendern.
//  4. Bei Auswahl eines Moduls dessen elements[] der Reihe nach über die
//     passende Komponente aus der Registry rendern.
//
// Navigation über den URL-Hash (#/modul/<id>), damit Zurück-Button und
// Neuladen funktionieren.

import { el, clear } from './dom.js';
import { validateContent } from './validate.js';
import { registry } from './registry.js';
import { createUserState } from './userState.js';

const CONTENT_URL = './content/sample-content.json';
const SCHEMA_URL = './content/schema.json';

// Erweiterungsstelle für spätere personenbezogene Daten (siehe userState.js).
const userState = createUserState();
const ctx = { userState };

let app;       // Wurzel-Container
let course;    // geladener, validierter Kursinhalt

/** Sichtbare Fehlermeldung statt leerer Seite / stiller Konsolen-Fehler. */
function showError(title, details = []) {
  if (!app) app = document.getElementById('app');
  clear(app);
  const list = el('ul', { class: 'errorbox__list' });
  details.slice(0, 50).forEach((d) => list.append(el('li', { text: d })));
  app.append(el('div', { class: 'errorbox', role: 'alert' }, [
    el('h2', { class: 'errorbox__title', text: title }),
    details.length ? el('p', { text: 'Bitte Inhalt prüfen:' }) : null,
    details.length ? list : null,
  ]));
}

async function loadJson(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${url} konnte nicht geladen werden (HTTP ${res.status}).`);
  return res.json();
}

/** Kurskopf mit Titel und (optionaler) Beschreibung. */
function renderHeader() {
  const header = el('header', { class: 'course__header' }, [
    el('p', { class: 'course__eyebrow', text: 'E-Learning' }),
    el('h1', { class: 'course__title', id: 'course-title', tabindex: '-1', text: course.courseTitle }),
  ]);
  if (course.courseDescription) {
    header.append(el('p', { class: 'course__desc', text: course.courseDescription }));
  }
  return header;
}

/** Modulübersicht – Kachel-Grid, dessen Anzahl sich aus modules.length ergibt. */
function renderOverview() {
  const view = el('section', { class: 'overview', 'aria-labelledby': 'overview-title' });
  view.append(el('h2', { class: 'overview__title', id: 'overview-title', tabindex: '-1', text: 'Module' }));

  const modules = [...course.modules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const grid = el('ul', { class: 'tiles', role: 'list' });

  modules.forEach((module) => {
    const meta = el('div', { class: 'tile__meta' });
    if (typeof module.estimatedMinutes === 'number') {
      meta.append(el('span', { class: 'tile__time', text: `ca. ${module.estimatedMinutes} Min.` }));
    }
    (module.tags || []).forEach((tag) => meta.append(el('span', { class: 'tag', text: tag })));

    const link = el('a', {
      class: 'tile__link', href: `#/modul/${encodeURIComponent(module.id)}`,
    }, [el('span', { class: 'tile__title', text: module.title })]);

    const tile = el('li', { class: 'tile' }, [
      link,
      module.description ? el('p', { class: 'tile__desc', text: module.description }) : null,
      meta,
      el('span', { class: 'tile__count', text: `${module.elements.length} Inhaltsblöcke` }),
    ]);
    grid.append(tile);
  });

  view.append(grid);
  return view;
}

/** Detailansicht eines Moduls: alle Elemente der Reihe nach. */
function renderModule(module) {
  const view = el('section', { class: 'module', 'aria-labelledby': 'module-title' });

  view.append(el('nav', { class: 'module__nav', 'aria-label': 'Kursnavigation' }, [
    el('a', { class: 'backlink', href: '#/' }, ['← Zurück zur Modulübersicht']),
  ]));

  const head = el('header', { class: 'module__head' }, [
    el('h2', { class: 'module__title', id: 'module-title', tabindex: '-1', text: module.title }),
  ]);
  if (module.description) head.append(el('p', { class: 'module__desc', text: module.description }));
  view.append(head);

  const content = el('div', { class: 'module__content' });
  (module.elements || []).forEach((element) => {
    const renderFn = registry[element.type];
    if (typeof renderFn !== 'function') {
      // Unbekannter Typ -> sichtbarer Hinweis, kein stiller Absturz.
      content.append(el('div', { class: 'block block--unknown', role: 'alert' }, [
        el('p', { text: `Unbekannter Elementtyp "${element.type}" (id: ${element.id}). Es ist keine Komponente dafür registriert.` }),
      ]));
      return;
    }
    try {
      content.append(renderFn(element, ctx));
    } catch (err) {
      content.append(el('div', { class: 'block block--unknown', role: 'alert' }, [
        el('p', { text: `Fehler beim Anzeigen von "${element.id}" (${element.type}): ${err.message}` }),
      ]));
    }
  });
  view.append(content);
  return view;
}

/** Router: liest den Hash und zeigt Übersicht oder ein Modul. */
function route() {
  if (!course) return;
  const hash = location.hash.replace(/^#/, '');
  const match = hash.match(/^\/modul\/(.+)$/);

  clear(app);
  app.append(renderHeader());

  if (match) {
    const id = decodeURIComponent(match[1]);
    const module = course.modules.find((m) => m.id === id);
    if (!module) {
      app.append(el('div', { class: 'errorbox', role: 'alert' }, [
        el('h2', { class: 'errorbox__title', text: 'Modul nicht gefunden' }),
        el('p', { text: `Es gibt kein Modul mit der ID "${id}".` }),
        el('a', { class: 'backlink', href: '#/' }, ['← Zurück zur Übersicht']),
      ]));
      return;
    }
    userState.markVisited(module.id);
    app.append(renderModule(module));
    focusHeading('module-title');
  } else {
    app.append(renderOverview());
    focusHeading('overview-title');
  }
}

/** Fokus für Screenreader/Tastatur nach Seitenwechsel auf die Überschrift legen. */
function focusHeading(id) {
  requestAnimationFrame(() => {
    const h = document.getElementById(id);
    if (h) h.focus();
  });
}

async function init() {
  app = document.getElementById('app');
  try {
    const [schema, content] = await Promise.all([loadJson(SCHEMA_URL), loadJson(CONTENT_URL)]);

    const { valid, errors } = validateContent(schema, content);
    if (!valid) {
      showError('Die Inhalte entsprechen nicht dem Schema.', errors);
      return;
    }

    course = content;
    window.addEventListener('hashchange', route);
    route();
  } catch (err) {
    showError('Das E-Learning konnte nicht geladen werden.', [err.message]);
  }
}

// Globale Sicherheitsnetze: nichts soll unbemerkt in der Konsole verschwinden.
window.addEventListener('error', (e) => showError('Unerwarteter Fehler.', [e.message]));
window.addEventListener('unhandledrejection', (e) =>
  showError('Unerwarteter Fehler.', [String(e.reason?.message || e.reason)]));

init();
