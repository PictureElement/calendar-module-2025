import sanitizeHtml from 'sanitize-html';

const BASE_LEVEL = 3;

// Find minimum heading level present (1, 2, ..., 6)
function getMinHeadingLevel(html) {
  const levels = [];
  html.replace(/<h([1-6])\b/gi, (_, d) => {
    levels.push(Number(d));
    return _;
  });
  if (levels.length === 0) return null;
  return Math.min(...levels);
}

// Clamp between BASE_LEVEL and 6
function clampLevel(level) {
  return Math.max(BASE_LEVEL, Math.min(6, level));
}

export function normalizeHeadingsAndSanitize(dirtyHtml) {
  const minLevel = getMinHeadingLevel(dirtyHtml);
  const shift = (minLevel == null) ? 0 : BASE_LEVEL - minLevel; // if no headings, keep as is

  const headingTransforms = {};

  // Build transformTags functions for h1, h2, ..., h6
  for (let L = 1; L <= 6; L++) {
    const tag = `h${L}`;
    headingTransforms[tag] = function (tagName, attribs) {
      const newLevel = clampLevel(L + shift);
      return { tagName: `h${newLevel}`, attribs };
    };
  }

  // Sanitize with transforms
  return sanitizeHtml(dirtyHtml, {
    transformTags: headingTransforms
  });
}
