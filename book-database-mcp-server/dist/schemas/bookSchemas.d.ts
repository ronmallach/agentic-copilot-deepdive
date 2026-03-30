import { z } from 'zod';
export declare const PaginationSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    limit: number;
    offset: number;
}, {
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export declare const SearchBooksSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
} & {
    query: z.ZodString;
    field: z.ZodDefault<z.ZodEnum<["title", "author", "any"]>>;
}, "strict", z.ZodTypeAny, {
    limit: number;
    offset: number;
    query: string;
    field: "title" | "author" | "any";
}, {
    query: string;
    limit?: number | undefined;
    offset?: number | undefined;
    field?: "title" | "author" | "any" | undefined;
}>;
export declare const GetBookByIsbnSchema: z.ZodObject<{
    isbn: z.ZodString;
}, "strict", z.ZodTypeAny, {
    isbn: string;
}, {
    isbn: string;
}>;
export declare const GetBookByTitleSchema: z.ZodObject<{
    title: z.ZodString;
}, "strict", z.ZodTypeAny, {
    title: string;
}, {
    title: string;
}>;
export declare const GetBooksByTitleSchema: z.ZodObject<{
    titles: z.ZodArray<z.ZodString, "many">;
}, "strict", z.ZodTypeAny, {
    titles: string[];
}, {
    titles: string[];
}>;
export declare const GetBooksByIsbnListSchema: z.ZodObject<{
    isbns: z.ZodArray<z.ZodString, "many">;
}, "strict", z.ZodTypeAny, {
    isbns: string[];
}, {
    isbns: string[];
}>;
export declare const GetBooksByAuthorSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
} & {
    author: z.ZodString;
}, "strict", z.ZodTypeAny, {
    limit: number;
    offset: number;
    author: string;
}, {
    author: string;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
//# sourceMappingURL=bookSchemas.d.ts.map