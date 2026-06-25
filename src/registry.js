// registry.js
// Bildet jeden Element-"type" auf seine zuständige Render-Funktion ab.
// Neue Elementtypen ergänzt man hier mit einer Zeile - der Renderer selbst
// muss dafür nicht angefasst werden.
import { render as text } from './components/text.js';
import { render as accordion } from './components/accordion.js';
import { render as quiz } from './components/quiz.js';
import { render as media } from './components/media.js';
import { render as image } from './components/image.js';
import { render as dragdrop } from './components/dragdrop.js';
import { render as slider } from './components/slider.js';
import { render as flipcards } from './components/flipcards.js';

export const registry = {
  text, accordion, quiz, media, image, dragdrop, slider, flipcards,
};
