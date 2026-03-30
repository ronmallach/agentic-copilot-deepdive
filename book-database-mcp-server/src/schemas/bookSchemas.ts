import { z } from 'zod';

export const PaginationSchema = z
  .object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .describe('Maximum number of results to return (1-100, default 20)'),
    offset: z
      .number()
      .int()
      .min(0)
      .default(0)
      .describe('Number of results to skip for pagination (default 0)'),
  })
  .strict();

export const SearchBooksSchema = PaginationSchema.extend({
  query: z
    .string()
    .min(1)
    .max(200)
    .describe('Search string to match against book titles, authors, or ISBNs'),
  field: z
    .enum(['title', 'author', 'any'])
    .default('any')
    .describe(
      "Which field to search: 'title', 'author', or 'any' (default 'any')"
    ),
}).strict();

export const GetBookByIsbnSchema = z
  .object({
    isbn: z
      .string()
      .min(10)
      .max(13)
      .describe('ISBN-10 or ISBN-13 of the book to retrieve (e.g., "0446310789")'),
  })
  .strict();

export const GetBookByTitleSchema = z
  .object({
    title: z
      .string()
      .min(1)
      .max(300)
      .describe('Exact book title to look up (case-insensitive, e.g., "1984")'),
  })
  .strict();

export const GetBooksByTitleSchema = z
  .object({
    titles: z
      .array(z.string().min(1))
      .min(1)
      .max(20)
      .describe(
        'List of exact book titles to look up (case-insensitive, max 20)'
      ),
  })
  .strict();

export const GetBooksByIsbnListSchema = z
  .object({
    isbns: z
      .array(z.string().min(10).max(13))
      .min(1)
      .max(20)
      .describe('List of ISBN-10 or ISBN-13 values to look up (max 20)'),
  })
  .strict();
