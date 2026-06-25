// components/quiz.js
// Element type: "quiz" — beliebig viele Fragen, jede mit beliebig vielen Optionen.
// allowMultiple bestimmt Checkbox (Mehrfachauswahl) vs. Radio (Einfachauswahl).
// Anzahl Fragen/Optionen kommt ausschließlich aus questions.length / options.length.
import { el } from '../dom.js';

export function render(element, ctx) {
  const block = el('section', { class: 'block block--quiz' });
  if (element.heading) {
    block.append(el('h3', { class: 'block__heading', text: element.heading }));
  }

  const questions = Array.isArray(element.questions) ? element.questions : [];

  questions.forEach((question, qIndex) => {
    const multiple = !!question.allowMultiple;
    const options = Array.isArray(question.options) ? question.options : [];
    const groupName = `q-${element.id}-${question.id}`;

    const optionList = el('div', { class: 'quiz__options', role: 'group' });
    options.forEach((option) => {
      const inputId = `${groupName}-${option.id}`;
      const input = el('input', {
        type: multiple ? 'checkbox' : 'radio',
        name: groupName, id: inputId, value: option.id, class: 'quiz__input',
      });
      const row = el('label', { class: 'quiz__option', for: inputId }, [
        input,
        el('span', { class: 'quiz__option-label', text: option.label }),
        el('span', { class: 'quiz__mark', 'aria-hidden': 'true' }),
      ]);
      optionList.append(row);
    });

    // Rückmeldebereich: aria-live, damit Screenreader das Ergebnis vorlesen.
    const feedback = el('p', { class: 'quiz__feedback', role: 'status', 'aria-live': 'polite' });

    const checkBtn = el('button', {
      type: 'button', class: 'btn btn--primary quiz__check',
      on: { click: () => evaluate() },
    }, ['Antwort prüfen']);

    function evaluate() {
      const chosen = new Set(
        Array.from(optionList.querySelectorAll('input')).filter((i) => i.checked).map((i) => i.value),
      );
      if (chosen.size === 0) {
        feedback.className = 'quiz__feedback is-neutral';
        feedback.textContent = 'Bitte zuerst eine Antwort auswählen.';
        return;
      }

      const correctIds = new Set(options.filter((o) => o.isCorrect).map((o) => o.id));
      const isCorrect = chosen.size === correctIds.size && [...chosen].every((id) => correctIds.has(id));

      // Optionen visuell markieren – nicht nur über Farbe, sondern via Klassen,
      // die im CSS zusätzlich ein Symbol/Text einblenden.
      optionList.querySelectorAll('.quiz__option').forEach((row) => {
        const input = row.querySelector('input');
        row.classList.remove('is-correct', 'is-wrong', 'is-missed');
        if (correctIds.has(input.value)) {
          row.classList.add(input.checked ? 'is-correct' : 'is-missed');
        } else if (input.checked) {
          row.classList.add('is-wrong');
        }
      });

      feedback.className = `quiz__feedback ${isCorrect ? 'is-correct' : 'is-wrong'}`;
      let msg = isCorrect ? 'Richtig.' : 'Noch nicht richtig.';
      if (question.explanation) msg += ` ${question.explanation}`;
      feedback.textContent = msg;

      // Optionaler Hook in den (noch leeren) userState – ohne Persistenz.
      ctx?.userState?.recordQuiz(`${element.id}:${question.id}`, { correct: isCorrect });
    }

    const legend = el('legend', { class: 'quiz__question' }, [
      el('span', { class: 'quiz__counter', text: `Frage ${qIndex + 1} von ${questions.length}` }),
      el('span', { class: 'quiz__question-text', text: question.question }),
      multiple ? el('span', { class: 'quiz__hint', text: 'Mehrfachauswahl möglich' }) : null,
    ]);

    const fieldset = el('fieldset', { class: 'quiz__item' }, [
      legend, optionList, el('div', { class: 'quiz__actions' }, [checkBtn]), feedback,
    ]);
    block.append(fieldset);
  });

  return block;
}
