export declare function listBooks(offset: number, limit: number): string;
export declare function searchBooks(query: string, field: 'title' | 'author' | 'any', offset: number, limit: number): string;
export declare function getBookByTitle(title: string): string;
export declare function getBookByIsbn(isbn: string): string;
export declare function getBooksByTitle(titles: string[]): string;
export declare function getBooksByIsbnList(isbns: string[]): string;
export declare function getBooksByAuthor(author: string, offset: number, limit: number): string;
//# sourceMappingURL=bookService.d.ts.map