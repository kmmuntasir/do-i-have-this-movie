import { fuzzyMatch } from './fuzzy-search.js';

/**
 * File name matching utilities for local file system sources
 */

/**
 * Common movie file patterns
 */
const MOVIE_PATTERNS = [
  // Standard: Movie Name (Year).ext
  /^(.+?)\s*\((\d{4})\)/,
  // Alternative: Movie.Name.Year.ext
  /^(.+?)\.(\d{4})\./,
  // Alternative: Movie Name Year.ext
  /^(.+?)\s+(\d{4})\s*(?:\.\w+)?$/,
  // Simple: Movie Name.ext (year must be found elsewhere)
  /^(.+?)(?:\.\w+)?$/
];

/**
 * Extract title and year from a file name
 * @param {string} fileName - The file name (without path)
 * @returns {{title: string, year: number|null}} Extracted title and year
 */
export function extractMovieInfo(fileName) {
  const baseName = fileName.replace(/\.[^.]+$/, ''); // Remove extension
  
  for (const pattern of MOVIE_PATTERNS) {
    const match = baseName.match(pattern);
    if (match) {
      const title = match[1]
        .replace(/[._]/g, ' ')  // Replace dots and underscores with spaces
        .replace(/\s+/g, ' ')    // Collapse multiple spaces
        .trim();
      const year = match[2] ? parseInt(match[2]) : null;
      return { title, year };
    }
  }
  
  // Fallback: just return the cleaned title
  return {
    title: baseName.replace(/[._]/g, ' ').replace(/\s+/g, ' ').trim(),
    year: null
  };
}

/**
 * Check if a file is likely a movie file
 * @param {string} fileName - The file name
 * @returns {boolean} True if the file appears to be a movie
 */
export function isMovieFile(fileName) {
  const movieExtensions = [
    '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv',
    '.webm', '.m4v', '.mpg', '.mpeg', '.3gp', '.ts',
    '.m2ts', '.divx', '.xvid'
  ];
  
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return movieExtensions.includes(ext);
}

/**
 * Match a movie query against a file name
 * @param {string} queryTitle - The movie title to search for
 * @param {number} queryYear - The movie year to search for
 * @param {string} fileName - The file name to match against
 * @returns {boolean} True if the file matches the query
 */
export function matchMovieFile(queryTitle, queryYear, fileName) {
  if (!isMovieFile(fileName)) {
    return false;
  }
  
  const { title, year } = extractMovieInfo(fileName);
  
  return fuzzyMatch(queryTitle, title, queryYear, year);
}

/**
 * Search through a list of file names for a matching movie
 * @param {string} queryTitle - The movie title to search for
 * @param {number} queryYear - The movie year to search for
 * @param {string[]} fileNames - Array of file names to search
 * @returns {{found: boolean, fileName?: string, title?: string, year?: number|null}} Match result
 */
export function searchMovieFiles(queryTitle, queryYear, fileNames) {
  const searchTerm = queryTitle.toLowerCase().trim();
  
  for (const fileName of fileNames) {
    if (matchMovieFile(searchTerm, queryYear, fileName)) {
      const { title, year } = extractMovieInfo(fileName);
      return {
        found: true,
        fileName,
        title,
        year
      };
    }
  }
  
  return { found: false };
}

/**
 * Normalize a file name for comparison
 * @param {string} fileName - The file name to normalize
 * @returns {string} Normalized file name
 */
export function normalizeFileName(fileName) {
  return fileName
    .toLowerCase()
    .replace(/[._\-\[\]\(\)]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
