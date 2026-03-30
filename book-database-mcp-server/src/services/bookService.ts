import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import type {
  Book,
  BookDetails,
  BookWithDetails,
  PaginatedResult,
} from '../types.js';
import {
  BOOKS_FILE,
  BOOKS_DETAILS_FILE,
  CHARACTER_LIMIT,
} from '../constants.js';

// generated-by-copilot: Load and cache catalog data at startup
let booksCache: Book[] | null = null;
let detailsCache: Map<string, BookDetails> | null = null;

function loadBooks(): Book[] {
  if (booksCache) return booksCache;
  const raw = readFileSync(fileURLToPath(BOOKS_FILE), 'utf-8');
  booksCache = JSON.parse(raw) as Book[];
  return booksCache;
}

function loadDetailsMap(): Map<string, BookDetails> {
  if (detailsCache) return detailsCache;
  const raw = readFileSync(fileURLToPath(BOOKS_DETAILS_FILE), 'utf-8');
  const parsed = JSON.parse(raw) as { books: BookDetails[] };
  detailsCache = new Map(parsed.books.map((b) => [b.ISBN, b]));
  return detailsCache;
}

function buildPaginatedResult<T>(
  items: T[],
  offset: number,
  limit: number
): PaginatedResult<T> {
  const page = items.slice(offset, offset + limit);
  const hasMore = items.length > offset + page.length;
  return {
    total: items.length,
    count: page.length,
    offset,
    items: page,
    has_more: hasMore,
    ...(hasMore ? { next_offset: offset + page.length } : {}),
  };
}

function truncateIfNeeded(text: string): string {
  if (text.length <= CHARACTER_LIMIT) return text;
  return (
    text.slice(0, CHARACTER_LIMIT) +
    '\n...[truncated — use offset/limit parameters to paginate]'
  );
}

export function listBooks(offset: number, limit: number): string {
  const books = loadBooks();
  const result = buildPaginatedResult(books, offset, limit);
  return truncateIfNeeded(JSON.stringify(result, null, 2));
}

export function searchBooks(
  query: string,
  field: 'title' | 'author' | 'any',
  offset: number,
  limit: number
): string {
  const books = loadBooks();
  const q = query.toLowerCase();
  const matched = books.filter((b) => {
    if (field === 'title') return b.title.toLowerCase().includes(q);
    if (field === 'author') return b.author.toLowerCase().includes(q);
    return (
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.ISBN.includes(q)
    );
  });
  const result = buildPaginatedResult(matched, offset, limit);
  return truncateIfNeeded(JSON.stringify(result, null, 2));
}

export function getBookByTitle(title: string): string {
  const books = loadBooks();
  const detailsMap = loadDetailsMap();
  const book = books.find((b) => b.title.toLowerCase() === title.toLowerCase());
  if (!book)
    return `Error: No book found with title "${title}". Try book_database_search_books to find partial matches.`;
  const details = detailsMap.get(book.ISBN);
  const combined: BookWithDetails = {
    ...book,
    ...(details ? { summary: details.summary, date: details.date } : {}),
  };
  return JSON.stringify(combined, null, 2);
}

export function getBookByIsbn(isbn: string): string {
  const books = loadBooks();
  const detailsMap = loadDetailsMap();
  const book = books.find((b) => b.ISBN === isbn);
  if (!book) return `Error: No book found with ISBN "${isbn}".`;
  const details = detailsMap.get(isbn);
  const combined: BookWithDetails = {
    ...book,
    ...(details ? { summary: details.summary, date: details.date } : {}),
  };
  return JSON.stringify(combined, null, 2);
}

export function getBooksByTitle(titles: string[]): string {
  const books = loadBooks();
  const detailsMap = loadDetailsMap();
  const results = titles.map((title) => {
    const book = books.find(
      (b) => b.title.toLowerCase() === title.toLowerCase()
    );
    if (!book) return { title, error: `No book found with title "${title}".` };
    const details = detailsMap.get(book.ISBN);
    return {
      ...book,
      ...(details ? { summary: details.summary, date: details.date } : {}),
    };
  });
  return truncateIfNeeded(JSON.stringify(results, null, 2));
}

export function getBooksByIsbnList(isbns: string[]): string {
  const books = loadBooks();
  const detailsMap = loadDetailsMap();
  const results = isbns.map((isbn) => {
    const book = books.find((b) => b.ISBN === isbn);
    if (!book)
      return { ISBN: isbn, error: `No book found with ISBN "${isbn}".` };
    const details = detailsMap.get(isbn);
    return {
      ...book,
      ...(details ? { summary: details.summary, date: details.date } : {}),
    };
  });
  return truncateIfNeeded(JSON.stringify(results, null, 2));
}

// generated-by-copilot: Return all books whose author field contains the given string (case-insensitive partial match)
export function getBooksByAuthor(
  author: string,
  offset: number,
  limit: number
): string {
  const books = loadBooks();
  const q = author.toLowerCase();
  const matched = books.filter((b) => b.author.toLowerCase().includes(q));
  const result = buildPaginatedResult(matched, offset, limit);
  return truncateIfNeeded(JSON.stringify(result, null, 2));
}
