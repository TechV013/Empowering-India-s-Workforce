function extractJson(text) {
  if (!text) throw new Error('Empty model response');

  let cleaned = String(text).trim();

  // Strip markdown code fences
  cleaned = cleaned.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();

  // Find the first JSON object or array
  const objectStart = cleaned.indexOf('{');
  const arrayStart = cleaned.indexOf('[');
  let start = -1;
  if (objectStart === -1 && arrayStart === -1) {
    throw new Error('Invalid JSON from model');
  }
  if (objectStart === -1) start = arrayStart;
  else if (arrayStart === -1) start = objectStart;
  else start = Math.min(objectStart, arrayStart);

  // Reject clearly invalid leading text that is not part of the JSON block
  const leading = cleaned.slice(0, start).trim();
  if (leading.length > 200) {
    throw new Error('Invalid JSON from model');
  }

  return carefulParse(cleaned, start);
}

function carefulParse(text, start) {
  try {
    return JSON.parse(text.slice(start));
  } catch (_) {
    // Swallow and fall through to bracket matching
  }

  // Bracket-match from the start to handle truncated/extra trailing text
  const openChar = text[start];
  const closeChar = openChar === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === openChar) depth++;
    else if (ch === closeChar) {
      depth--;
      if (depth === 0) {
        return JSON.parse(text.slice(start, i + 1));
      }
    }
  }

  throw new Error('Invalid JSON from model');
}

module.exports = { extractJson };