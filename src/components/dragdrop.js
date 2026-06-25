// components/dragdrop.js
// Element type: "dragdrop" — Items den richtigen Zielzonen zuordnen.
// Anzahl Items/Zonen kommt aus items.length / targetZones.length.
//
// Zwei gleichwertige Bedienwege:
//  1) Maus/Touch: natives HTML5 Drag & Drop.
//  2) Tastatur/Klick: Item per Klick/Enter "aufnehmen" (aria-pressed),
//     dann Zielzone (Button) per Klick/Enter wählen -> Item wandert dorthin.
// Korrekt ist ein Item, wenn seine Zone == item.targetZoneId.
import { el } from '../dom.js';

export function render(element, ctx) {
  const block = el('section', { class: 'block block--dragdrop' });
  if (element.heading) {
    block.append(el('h3', { class: 'block__heading', text: element.heading }));
  }
  if (element.instructions) {
    block.append(el('p', { class: 'block__instructions', text: element.instructions }));
  }

  const items = Array.isArray(element.items) ? element.items : [];
  const zones = Array.isArray(element.targetZones) ? element.targetZones : [];

  let pickedId = null; // aktuell "aufgenommenes" Item (Tastatur-/Klickweg)
  const feedback = el('p', { class: 'dragdrop__feedback', role: 'status', 'aria-live': 'polite' });

  function setPicked(id) {
    pickedId = id;
    block.querySelectorAll('.dragdrop__item').forEach((b) => {
      const active = b.dataset.itemId === id;
      b.classList.toggle('is-picked', active);
      b.setAttribute('aria-pressed', String(active));
    });
    block.querySelectorAll('.dragdrop__dropzone, .dragdrop__pool').forEach((z) => {
      z.classList.toggle('is-target', !!id);
    });
  }

  function makeItemButton(item) {
    const btn = el('button', {
      type: 'button', class: 'dragdrop__item', draggable: 'true',
      'aria-pressed': 'false', dataset: { itemId: item.id },
      on: {
        click: () => setPicked(pickedId === item.id ? null : item.id),
        dragstart: (e) => { e.dataTransfer.setData('text/plain', item.id); e.dataTransfer.effectAllowed = 'move'; },
      },
    }, [item.label]);
    return btn;
  }

  function moveItemTo(itemId, containerListEl) {
    const btn = block.querySelector(`.dragdrop__item[data-item-id="${itemId}"]`);
    if (btn) containerListEl.append(btn);
    setPicked(null);
    feedback.textContent = '';
    feedback.className = 'dragdrop__feedback';
  }

  function makeDropList(extraClass, onActivateLabel) {
    const list = el('div', { class: `dragdrop__list ${extraClass}` , role: 'list' });
    list.addEventListener('dragover', (e) => { e.preventDefault(); list.classList.add('is-over'); });
    list.addEventListener('dragleave', () => list.classList.remove('is-over'));
    list.addEventListener('drop', (e) => {
      e.preventDefault();
      list.classList.remove('is-over');
      const id = e.dataTransfer.getData('text/plain');
      if (id) moveItemTo(id, list);
    });
    return list;
  }

  // Ablage (Pool) mit allen Items zu Beginn.
  const poolList = makeDropList('dragdrop__poollist');
  items.forEach((item) => poolList.append(makeItemButton(item)));
  const pool = el('div', { class: 'dragdrop__pool' }, [
    el('button', {
      type: 'button', class: 'dragdrop__zonebtn',
      on: { click: () => { if (pickedId) moveItemTo(pickedId, poolList); } },
    }, ['Ablage (zurücklegen)']),
    poolList,
  ]);

  // Zielzonen.
  const zonesWrap = el('div', { class: 'dragdrop__zones' });
  zones.forEach((zone) => {
    const list = makeDropList('dragdrop__zonelist');
    const dropBtn = el('button', {
      type: 'button', class: 'dragdrop__zonebtn',
      on: { click: () => { if (pickedId) moveItemTo(pickedId, list); } },
    }, [zone.label]);
    const box = el('div', { class: 'dragdrop__dropzone', dataset: { zoneId: zone.id } }, [dropBtn, list]);
    zonesWrap.append(box);
  });

  // Prüfen / Zurücksetzen.
  const checkBtn = el('button', {
    type: 'button', class: 'btn btn--primary',
    on: { click: () => check() },
  }, ['Zuordnung prüfen']);
  const resetBtn = el('button', {
    type: 'button', class: 'btn btn--ghost',
    on: { click: () => { items.forEach((it) => moveItemTo(it.id, poolList)); } },
  }, ['Zurücksetzen']);

  function check() {
    let correct = 0;
    let placed = 0;
    items.forEach((item) => {
      const btn = block.querySelector(`.dragdrop__item[data-item-id="${item.id}"]`);
      const zoneBox = btn.closest('.dragdrop__dropzone');
      btn.classList.remove('is-correct', 'is-wrong');
      if (!zoneBox) return; // noch in der Ablage
      placed += 1;
      const ok = zoneBox.dataset.zoneId === item.targetZoneId;
      btn.classList.add(ok ? 'is-correct' : 'is-wrong');
      if (ok) correct += 1;
    });

    if (placed < items.length) {
      feedback.className = 'dragdrop__feedback is-neutral';
      feedback.textContent = `Bitte alle Begriffe zuordnen (${placed} von ${items.length}).`;
    } else if (correct === items.length) {
      feedback.className = 'dragdrop__feedback is-correct';
      feedback.textContent = 'Alles richtig zugeordnet.';
    } else {
      feedback.className = 'dragdrop__feedback is-wrong';
      feedback.textContent = `${correct} von ${items.length} richtig zugeordnet.`;
    }
    ctx?.userState?.recordDragDrop(element.id, { correct, total: items.length });
  }

  block.append(
    pool,
    zonesWrap,
    el('div', { class: 'dragdrop__actions' }, [checkBtn, resetBtn]),
    feedback,
  );
  return block;
}
