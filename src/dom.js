// dom.js
// Kleine Hilfsfunktionen zum Erzeugen von DOM-Knoten.
// Bewusst minimal gehalten - kein Framework, keine Build-Tools.

/**
 * Erzeugt ein HTML-Element.
 * @param {string} tag - z.B. "div", "button"
 * @param {object} attrs - Attribute. Sonderfälle:
 *   - class:      CSS-Klassen (String)
 *   - text:       textContent (sicher, kein HTML)
 *   - html:       innerHTML (NUR für bereits bereinigtes Markup verwenden)
 *   - dataset:    { key: value } -> data-key
 *   - on:         { eventName: handler }
 *   - sonst:      direkt als Attribut gesetzt (z.B. aria-*, role, type ...)
 * @param {Array<Node|string>} children - Kindknoten oder Text
 * @returns {HTMLElement}
 */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;

    if (key === 'class') {
      node.className = value;
    } else if (key === 'text') {
      node.textContent = value;
    } else if (key === 'html') {
      node.innerHTML = value;
    } else if (key === 'dataset') {
      for (const [dk, dv] of Object.entries(value)) node.dataset[dk] = dv;
    } else if (key === 'on') {
      for (const [evt, handler] of Object.entries(value)) {
        node.addEventListener(evt, handler);
      }
    } else if (value === true) {
      node.setAttribute(key, '');
    } else {
      node.setAttribute(key, value);
    }
  }

  const kids = Array.isArray(children) ? children : [children];
  for (const child of kids) {
    if (child === undefined || child === null || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }

  return node;
}

/** Entfernt alle Kindknoten eines Elements. */
export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

/** Maskiert HTML-Sonderzeichen, damit Inhalt nie als Markup interpretiert wird. */
export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
