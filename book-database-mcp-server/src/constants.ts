export const CHARACTER_LIMIT = 25000;

// generated-by-copilot: Resolve data files relative to this compiled file.
// dist/constants.js -> ../src/data/ reaches the source data directory.
export const BOOKS_FILE = new URL('../src/data/books.json', import.meta.url);
export const BOOKS_DETAILS_FILE = new URL(
  '../src/data/books-details.json',
  import.meta.url
);
