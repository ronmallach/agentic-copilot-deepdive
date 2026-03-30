import { PaginationSchema, SearchBooksSchema, GetBookByIsbnSchema, GetBookByTitleSchema, GetBooksByTitleSchema, GetBooksByIsbnListSchema, GetBooksByAuthorSchema, } from '../schemas/bookSchemas.js';
import { listBooks, searchBooks, getBookByIsbn, getBookByTitle, getBooksByTitle, getBooksByIsbnList, getBooksByAuthor, } from '../services/bookService.js';
// generated-by-copilot: Register all book catalog tools on the MCP server
export function registerBookTools(server) {
    server.registerTool('book_database_list_books', {
        title: 'List Books',
        description: `List all books in the local catalog with pagination.

Returns a paginated list of books. Each entry includes ISBN, title, and author.

Args:
  - limit (number): Maximum results to return, 1-100 (default: 20)
  - offset (number): Results to skip for pagination (default: 0)

Returns:
  JSON object with schema:
  {
    "total": number,       // Total books in catalog
    "count": number,       // Books in this page
    "offset": number,      // Current offset
    "items": [
      { "ISBN": string, "title": string, "author": string }
    ],
    "has_more": boolean,
    "next_offset": number  // Present when has_more is true
  }

Examples:
  - Use when: "Show me all books" -> default params
  - Use when: "List the next page" -> params with offset=20`,
        inputSchema: PaginationSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    }, async ({ limit, offset }) => {
        const text = listBooks(offset, limit);
        return { content: [{ type: 'text', text }] };
    });
    server.registerTool('book_database_search_books', {
        title: 'Search Books',
        description: `Search the book catalog by title, author, or ISBN.

Performs a case-insensitive substring search. Does NOT create or modify books.

Args:
  - query (string): Search string (1-200 chars)
  - field ('title' | 'author' | 'any'): Field to search (default: 'any')
  - limit (number): Maximum results to return, 1-100 (default: 20)
  - offset (number): Results to skip for pagination (default: 0)

Returns:
  Same paginated JSON structure as book_database_list_books.

Examples:
  - Use when: "Find books by Tolstoy" -> params with query="Tolstoy", field="author"
  - Use when: "Search for war books" -> params with query="war", field="any"
  - Don't use when: You have an exact ISBN (use book_database_get_book_by_isbn instead)

Error Handling:
  - Returns empty items array with total=0 if no matches found`,
        inputSchema: SearchBooksSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    }, async ({ query, field, limit, offset }) => {
        const text = searchBooks(query, field, offset, limit);
        return { content: [{ type: 'text', text }] };
    });
    server.registerTool('book_database_get_book_by_title', {
        title: 'Get Book by Title',
        description: `Retrieve full details for a single book by its exact title (case-insensitive).

Returns the book's ISBN, author, publication date, and summary when available.
Use this when you know the exact title. For partial matches, use book_database_search_books.

Args:
  - title (string): Exact book title (e.g., "1984", "Dracula")

Returns:
  JSON object:
  {
    "ISBN": string,
    "title": string,
    "author": string,
    "summary": string,   // Present when details are available
    "date": string       // Publication date (YYYY-MM-DD), when available
  }

Examples:
  - Use when: "Get details for Dracula" -> params with title="Dracula"
  - Don't use when: You only have a partial title (use book_database_search_books)
  - Don't use when: You have multiple titles (use book_database_get_books_by_titles)

Error Handling:
  - Returns an error string if no book matches the exact title`,
        inputSchema: GetBookByTitleSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    }, async ({ title }) => {
        const text = getBookByTitle(title);
        return { content: [{ type: 'text', text }] };
    });
    server.registerTool('book_database_get_book_by_isbn', {
        title: 'Get Book by ISBN',
        description: `Retrieve full details for a single book by its ISBN.

Returns the book's title, author, ISBN, publication date, and summary when available.

Args:
  - isbn (string): ISBN-10 or ISBN-13 (e.g., "0446310789")

Returns:
  JSON object:
  {
    "ISBN": string,
    "title": string,
    "author": string,
    "summary": string,   // Present when details are available
    "date": string       // Publication date (YYYY-MM-DD), when available
  }

Examples:
  - Use when: "Tell me about ISBN 0446310789" -> params with isbn="0446310789"
  - Don't use when: You only know the title (use book_database_search_books first)

Error Handling:
  - Returns "Error: No book found with ISBN ..." if ISBN is not in catalog`,
        inputSchema: GetBookByIsbnSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    }, async ({ isbn }) => {
        const text = getBookByIsbn(isbn);
        return { content: [{ type: 'text', text }] };
    });
    server.registerTool('book_database_get_books_by_titles', {
        title: 'Get Books by Titles',
        description: `Look up multiple books by their exact titles (case-insensitive).

Useful for batch lookups when you already know the exact titles.

Args:
  - titles (string[]): Up to 20 exact book titles

Returns:
  JSON array. Each entry is either a full book object (with summary and date if available)
  or an error object: { "title": string, "error": string }

Examples:
  - Use when: "Get details for 1984 and Dracula" -> params with titles=["1984", "Dracula"]
  - Don't use when: You're not sure of the exact title (use book_database_search_books)`,
        inputSchema: GetBooksByTitleSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    }, async ({ titles }) => {
        const text = getBooksByTitle(titles);
        return { content: [{ type: 'text', text }] };
    });
    server.registerTool('book_database_get_books_by_isbn_list', {
        title: 'Get Books by ISBN List',
        description: `Look up multiple books by a list of ISBNs in a single call.

Useful for batch detail retrieval when you already have a set of ISBNs.

Args:
  - isbns (string[]): Up to 20 ISBN-10 or ISBN-13 values

Returns:
  JSON array. Each entry is either a full book object or an error object:
  { "ISBN": string, "error": string }

Examples:
  - Use when: "Get details for these ISBNs: 0446310789, 0451524935"
  - Don't use when: You only have titles (use book_database_get_books_by_titles)`,
        inputSchema: GetBooksByIsbnListSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    }, async ({ isbns }) => {
        const text = getBooksByIsbnList(isbns);
        return { content: [{ type: 'text', text }] };
    });
    server.registerTool('book_database_get_books_by_author', {
        title: 'Get Books by Author',
        description: `Return all books whose author field contains the given string (case-insensitive partial match).

Useful for finding all works by a specific author when you know their name or part of it.

Args:
  - author (string): Author name or partial name to search for (1-200 chars)
  - limit (number): Maximum results to return, 1-100 (default: 20)
  - offset (number): Results to skip for pagination (default: 0)

Returns:
  JSON object with schema:
  {
    "total": number,       // Total matching books
    "count": number,       // Books in this page
    "offset": number,      // Current offset
    "items": [
      { "ISBN": string, "title": string, "author": string }
    ],
    "has_more": boolean,
    "next_offset": number  // Present when has_more is true
  }

Examples:
  - Use when: "Show me all books by Tolkien" -> params with author="Tolkien"
  - Use when: "Find books by J.R.R." -> params with author="J.R.R."
  - Don't use when: You need to search by title or ISBN (use book_database_search_books)

Error Handling:
  - Returns empty items array with total=0 if no author matches found`,
        inputSchema: GetBooksByAuthorSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    }, async ({ author, limit, offset }) => {
        const text = getBooksByAuthor(author, offset, limit);
        return { content: [{ type: 'text', text }] };
    });
}
//# sourceMappingURL=bookTools.js.map