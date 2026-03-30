#!/usr/bin/env node
/**
 * generated-by-copilot: MCP server for local book catalog data.
 *
 * Exposes tools to list, search, and retrieve books from two local JSON files:
 * - src/data/books.json      (ISBN, title, author)
 * - src/data/books-details.json (ISBN, summary, date, author)
 *
 * Transport: stdio
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerBookTools } from './tools/bookTools.js';
const server = new McpServer({
    name: 'book-database-mcp-server',
    version: '1.0.0',
});
registerBookTools(server);
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('book-database-mcp-server running via stdio');
}
main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map