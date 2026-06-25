// markdown.js
// Sehr kleiner, sicherer Markdown-Renderer für die Fließtexte aus der JSON.
// Unterstützt nur eine bewusst begrenzte Teilmenge (Absätze, Listen,
// **fett**, *kursiv*, `Code`, [Links](…)). Inhalt wird ZUERST maskiert,
// danach werden nur die erlaubten Muster wieder als Markup zugelassen.
// So kann aus den Inhaltsdaten kein beliebiges HTML/JS eingeschleust werden.

import { escapeHtml } from './dom.js';

function inline(text) {
  let s = escapeHtml(text);
  // Code-Spans zuerst, damit darin keine weiteren Ersetzungen passieren.
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // Links: [Text](https://… oder /pfad). Nur http(s) und relative Pfade.
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g,
    '<a href="$2" rel="noopener noreferrer">$1</a>');
  return s;
}

/**
 * Wandelt Markdown-Text in sicheres HTML um.
 * @param {string} md
 * @returns {string} HTML-String (bereits maskiert/begrenzt)
 */
export function renderMarkdown(md) {
  if (!md) return '';
  const blocks = String(md).split(/\n{2,}/);
  const out = [];

  for (const raw of blocks) {
    const block = raw.trim();
    if (!block) continue;

    const lines = block.split('\n');
    const isUl = lines.every((l) => /^[-*]\s+/.test(l.trim()));
    const isOl = lines.every((l) => /^\d+\.\s+/.test(l.trim()));

    if (isUl) {
      const items = lines.map((l) => `<li>${inline(l.trim().replace(/^[-*]\s+/, ''))}</li>`);
      out.push(`<ul>${items.join('')}</ul>`);
    } else if (isOl) {
      const items = lines.map((l) => `<li>${inline(l.trim().replace(/^\d+\.\s+/, ''))}</li>`);
      out.push(`<ol>${items.join('')}</ol>`);
    } else {
      // Einzelne Zeilenumbrüche innerhalb eines Absatzes -> <br>
      out.push(`<p>${lines.map((l) => inline(l.trim())).join('<br>')}</p>`);
    }
  }

  return out.join('\n');
}
