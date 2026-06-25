// validate.js
// Kleiner Validator, der die Inhalts-JSON gegen schema.json prüft.
// Es ist KEIN vollständiger JSON-Schema-Validator, sondern deckt genau die
// Konstrukte ab, die in schema.json vorkommen: $ref, allOf, oneOf, type,
// required, properties, items, const, enum.
//
// Wichtig: Die Pflichtfelder werden NICHT im Code hartkodiert, sondern aus
// schema.json gelesen. Wer das Schema ändert, ändert damit auch die Prüfung.

/** Löst eine lokale Referenz wie "#/definitions/module" im Root-Schema auf. */
function resolveRef(root, ref) {
  const path = ref.replace(/^#\//, '').split('/');
  return path.reduce((obj, key) => (obj ? obj[key] : undefined), root);
}

/**
 * Versucht, den festen "type"-Wert (const) eines Element-Schemas zu finden.
 * Dadurch kann bei oneOf die passende Variante anhand instance.type gewählt
 * und eine verständliche Fehlermeldung erzeugt werden.
 */
function constTypeOf(root, node) {
  if (!node) return undefined;
  if (node.$ref) return constTypeOf(root, resolveRef(root, node.$ref));
  if (node.allOf) {
    for (const sub of node.allOf) {
      const t = constTypeOf(root, sub);
      if (t) return t;
    }
  }
  if (node.properties && node.properties.type && 'const' in node.properties.type) {
    return node.properties.type.const;
  }
  return undefined;
}

function typeMatches(schemaType, value) {
  switch (schemaType) {
    case 'object': return value !== null && typeof value === 'object' && !Array.isArray(value);
    case 'array': return Array.isArray(value);
    case 'string': return typeof value === 'string';
    case 'boolean': return typeof value === 'boolean';
    case 'number': return typeof value === 'number';
    case 'integer': return typeof value === 'number' && Number.isInteger(value);
    default: return true;
  }
}

/**
 * Validiert einen Wert gegen einen (Teil-)Schemaknoten und sammelt Fehler.
 * @param {object} root - vollständiges Schema (für $ref-Auflösung)
 * @param {object} node - aktueller Schemaknoten
 * @param {*} value - zu prüfender Wert
 * @param {string} path - Pfad für die Fehlermeldung (z.B. modules[0].elements[2])
 * @param {string[]} errors - Sammelliste
 */
function validateNode(root, node, value, path, errors) {
  if (!node) return;

  if (node.$ref) {
    validateNode(root, resolveRef(root, node.$ref), value, path, errors);
    return;
  }

  // allOf: alle Teilschemata müssen erfüllt sein (z.B. elementBase + Spezifik).
  if (node.allOf) {
    for (const sub of node.allOf) validateNode(root, sub, value, path, errors);
  }

  // oneOf: bei Elementen anhand "type" die passende Variante wählen.
  if (node.oneOf) {
    if (value && typeof value === 'object' && 'type' in value) {
      const branch = node.oneOf.find((sub) => constTypeOf(root, sub) === value.type);
      if (!branch) {
        const known = node.oneOf.map((s) => constTypeOf(root, s)).filter(Boolean);
        errors.push(`${path}: unbekannter type "${value.type}". Erlaubt: ${known.join(', ')}.`);
      } else {
        validateNode(root, branch, value, path, errors);
      }
    } else {
      errors.push(`${path}: Objekt mit Feld "type" erwartet.`);
    }
    return;
  }

  if (node.const !== undefined && value !== node.const) {
    errors.push(`${path}: erwartet "${node.const}", gefunden "${value}".`);
  }

  if (node.enum && !node.enum.includes(value)) {
    errors.push(`${path}: Wert "${value}" nicht erlaubt (erlaubt: ${node.enum.join(', ')}).`);
  }

  if (node.type && !typeMatches(node.type, value)) {
    errors.push(`${path}: erwartet Typ ${node.type}.`);
    return; // Bei falschem Grundtyp lohnt keine Tiefenprüfung.
  }

  // Pflichtfelder eines Objekts.
  if (node.required && value && typeof value === 'object' && !Array.isArray(value)) {
    for (const field of node.required) {
      if (!(field in value)) errors.push(`${path}: Pflichtfeld "${field}" fehlt.`);
    }
  }

  // Eigenschaften (nur die, die im Wert vorhanden sind).
  if (node.properties && value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, sub] of Object.entries(node.properties)) {
      if (key in value) validateNode(root, sub, value[key], `${path}.${key}`, errors);
    }
  }

  // Array-Einträge.
  if (node.items && Array.isArray(value)) {
    value.forEach((item, i) => validateNode(root, node.items, item, `${path}[${i}]`, errors));
  }
}

/**
 * Prüft die geladenen Inhalte gegen das Schema.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateContent(schema, content) {
  const errors = [];
  try {
    validateNode(schema, schema, content, 'content', errors);
  } catch (err) {
    errors.push(`Validierung abgebrochen: ${err.message}`);
  }
  return { valid: errors.length === 0, errors };
}
