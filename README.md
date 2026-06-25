# Standalone E-Learning-Frontend (reines HTML/CSS/JS)

Ein generisches, **JSON-gesteuertes** E-Learning-Frontend ohne Framework und
ohne Build-Tools. Es rendert sich vollständig aus `content/sample-content.json`,
validiert gegen `content/schema.json` und läuft direkt im Browser.

> Hinweis: Dieser Ordner ist bewusst getrennt von der bestehenden
> Vite/React-Variante im Projekt-Root. Beide existieren unabhängig nebeneinander.

## Kernprinzip: Anzahl kommt immer aus den Daten

Keine Komponente nimmt eine feste Anzahl an. Accordion-Panels, Quiz-Fragen,
Flipcards, Drag-&-Drop-Items, Slider-Skalen und Galeriebilder werden
ausschließlich über die jeweilige Array-Länge gerendert
(`panels.forEach`, `questions.length`, `cards.forEach` …). Die mitgelieferte
`sample-content.json` enthält bewusst unterschiedliche Mengen (z. B. 2 vs. 5
Accordion-Panels, 2 vs. 4 Quiz-Fragen), um das zu testen.

## Projektstruktur

```text
standalone/
  index.html                  Einstiegspunkt, lädt JSON per fetch()
  content/
    sample-content.json       Inhalt (später austauschbar)
    schema.json               zur Validierung
  src/
    render.js                 Haupt-Renderer (Kurskopf, Modulübersicht, Routing)
    registry.js               type -> Komponente
    validate.js               schlanke Schema-Validierung (liest schema.json)
    markdown.js               sicherer Mini-Markdown-Renderer
    dom.js                    kleine DOM-Hilfsfunktionen
    userState.js              offene Erweiterungsstelle für Nutzerdaten (leer)
    components/               ein Modul pro Elementtyp (isoliert)
      text.js  accordion.js  quiz.js  media.js
      image.js dragdrop.js   slider.js flipcards.js
    styles/
      tokens.css              Design-Tokens (Farben, Spacing, Typo) – nur hier ändern
      base.css                Grundlayout
      components.css          Stile je Elementtyp
```

## Unterstützte Elementtypen

`text`, `accordion`, `quiz`, `media` (video/audio), `image` (Galerie),
`dragdrop`, `slider`, `flipcards`.

Jeder Typ hat eine eigene, isolierte Render-Funktion in `src/components/`, die
nur ihre eigene JSON-Struktur kennt. Einen neuen Typ ergänzt man, indem man
eine Komponente schreibt und sie in `src/registry.js` einträgt – bestehende
Komponenten bleiben unberührt.

## Starten (lokaler Server nötig wegen `fetch`)

```bash
cd standalone
python3 -m http.server 8000
# Browser: http://localhost:8000/
```

Direktes Öffnen der Datei (`file://`) funktioniert nicht, weil `fetch()` lokale
Dateien blockiert. Jeder einfache statische Server genügt.

## Design ändern

Alle visuellen Werte stehen als CSS-Variablen in `src/styles/tokens.css`
(`--color-primary`, `--spacing-*`, `--font-*`, `--radius-*` …). Zum Umgestalten
nur diese Variablen anpassen – die Komponenten-Logik bleibt unangetastet.

## Inhalt austauschen

`content/sample-content.json` durch eigene, schema-konforme Inhalte ersetzen
(oder die URL in `src/render.js`, Konstante `CONTENT_URL`, ändern). Fehlt ein
Pflichtfeld oder ist ein `type` unbekannt, zeigt die Seite eine verständliche
Fehlermeldung statt leer zu bleiben.

## Barrierefreiheit

- Semantisches HTML (`details/summary`, `fieldset/legend`, `button`, `label`).
- Sichtbare Fokuszustände, Skip-Link, Fokus-Management beim Seitenwechsel.
- Ergebnisse werden nicht nur über Farbe vermittelt (zusätzlich Symbol/Text).
- `aria-live`-Rückmeldungen bei Quiz und Drag & Drop.
- Drag & Drop ist auch per Tastatur/Klick bedienbar (aufnehmen → Zone wählen).
- `prefers-reduced-motion` wird berücksichtigt (z. B. Flipcards ohne 3D-Drehung).

## Nutzerdaten (bewusst noch nicht umgesetzt)

Personenbezogene Daten (Fortschritt, Quiz-Ergebnisse, Zertifikatsname) gehören
**nicht** in die Content-JSON. `src/userState.js` ist die vorbereitete, aktuell
leere Erweiterungsstelle: ein In-Memory-Store mit stabilen Methoden, in den die
Komponenten optional schreiben. Persistenz (LocalStorage, Backend, SCORM-API)
lässt sich allein dort ergänzen, ohne `content.json` oder die Komponenten
anzufassen.
