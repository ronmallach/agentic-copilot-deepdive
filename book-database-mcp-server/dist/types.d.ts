export interface Book {
    ISBN: string;
    title: string;
    author: string;
}
export interface BookDetails {
    ISBN: string;
    summary: string;
    date: string;
    author: string;
}
export interface BookWithDetails extends Book {
    summary?: string;
    date?: string;
}
export interface PaginatedResult<T> {
    total: number;
    count: number;
    offset: number;
    items: T[];
    has_more: boolean;
    next_offset?: number;
}
//# sourceMappingURL=types.d.ts.map