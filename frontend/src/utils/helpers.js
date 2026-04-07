/**
 * Formats a duration in seconds to a human-readable string (e.g. "1h 23m").
 * @param {number} seconds
 * @returns {string}
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

/**
 * Returns a difficulty label in Spanish.
 * @param {'beginner'|'intermediate'|'advanced'} level
 * @returns {string}
 */
export const difficultyLabel = (level) => {
  const map = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' };
  return map[level] || level;
};

/**
 * Truncates a string to a given max length, appending ellipsis if needed.
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
export const truncate = (str, maxLength = 120) => {
  if (!str) return '';
  return str.length > maxLength ? `${str.slice(0, maxLength)}…` : str;
};
