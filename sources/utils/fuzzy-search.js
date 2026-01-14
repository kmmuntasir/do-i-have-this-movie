/**
 * Fuzzy search utilities for movie matching
 */

/**
 * Perform fuzzy title matching
 * @param {string} searchTerm - The search term
 * @param {string} itemTitle - The title to match against
 * @returns {boolean} True if titles match fuzzily
 */
export function fuzzyMatchTitle(searchTerm, itemTitle) {
  const s1 = searchTerm.toLowerCase().trim();
  const s2 = itemTitle.toLowerCase().trim();
  return s1 === s2 || s1.includes(s2) || s2.includes(s1);
}

/**
 * Perform fuzzy year matching
 * @param {number} year1 - First year
 * @param {number} year2 - Second year
 * @returns {boolean} True if years match within tolerance
 */
export function fuzzyMatchYear(year1, year2) {
  if (!year1 || !year2) return true;
  return Math.abs(year1 - year2) <= 1;
}

/**
 * Perform combined fuzzy matching
 * @param {string} searchTerm - The search term
 * @param {string} itemTitle - The title to match against
 * @param {number} searchYear - The search year
 * @param {number} itemYear - The item year
 * @returns {boolean} True if both title and year match
 */
export function fuzzyMatch(searchTerm, itemTitle, searchYear, itemYear) {
  return fuzzyMatchTitle(searchTerm, itemTitle) && 
         fuzzyMatchYear(searchYear, itemYear);
}
