// userState.js
// BEWUSST LEERE/OFFENE Erweiterungsstelle für personenbezogene Daten.
//
// Gemäß README.md und schema.json gehören Nutzerdaten (Fortschritt,
// Quiz-Ergebnisse, Zertifikatsname …) NICHT in die Content-JSON, sondern in
// ein separates userState-Objekt, das zur Laufzeit dazugeladen wird.
//
// Hier ist absichtlich noch KEINE echte Speicher-/Sende-Logik umgesetzt.
// Es gibt nur einen In-Memory-Store mit stabilen Methoden. Komponenten rufen
// diese optional auf (z.B. quiz.recordResult). Sobald klar ist, ob/wie
// Nutzerdaten persistiert werden (LocalStorage, Backend, SCORM-API …), kann
// das allein in dieser Datei ergänzt werden - ohne content.json oder die
// bestehenden Komponenten anzufassen.

export function createUserState() {
  const store = {
    quiz: {},     // quizId -> Ergebnisobjekt
    slider: {},   // scaleId -> Wert
    dragdrop: {}, // übungId -> Ergebnisobjekt
    visited: {},  // moduleId -> true
  };

  return {
    // --- Schreibzugriffe (aktuell nur In-Memory, kein Persistieren) ---
    recordQuiz(quizId, result) { store.quiz[quizId] = result; },
    recordSlider(scaleId, value) { store.slider[scaleId] = value; },
    recordDragDrop(exerciseId, result) { store.dragdrop[exerciseId] = result; },
    markVisited(moduleId) { store.visited[moduleId] = true; },

    // --- Lesezugriffe ---
    get(key) { return store[key]; },
    snapshot() { return structuredClone(store); },

    // Platzhalter: später hier z.B. await fetch('/api/userstate') o.Ä.
    async load() { /* absichtlich leer - geschützte Quelle kommt später */ },
    async save() { /* absichtlich leer - Persistenz kommt später */ },
  };
}
