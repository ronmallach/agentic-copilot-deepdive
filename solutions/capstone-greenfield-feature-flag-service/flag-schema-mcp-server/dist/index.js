// generated-by-copilot: MCP server providing canonical feature flag schemas, audit log schema, and sample flags
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
// generated-by-copilot: resolve path to flag-schemas.json relative to this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataPath = join(__dirname, 'data', 'flag-schemas.json');
// generated-by-copilot: load schema data once at startup
const schemaData = JSON.parse(readFileSync(dataPath, 'utf-8'));
const server = new McpServer({
    name: 'flag-schema-mcp-server',
    version: '1.0.0',
});
// generated-by-copilot: tool 1 - returns the flag field definitions
server.registerTool('get_flag_schema', {
    title: 'Get Flag Schema',
    description: `Returns the canonical feature flag field definitions from flag-schemas.json.

Provides the exact field names, types, formats, validation rules, and constraints
that any agent needs to generate flag-related code (routes, models, tests, seed data).

Args: None

Returns:
  Markdown-formatted table of flag fields with type, format, and description.`,
    inputSchema: z.object({}).strict(),
    annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
}, async () => {
    const flagSchema = schemaData.flagSchema;
    const lines = [
        '# Feature Flag Schema',
        '',
        'Canonical field definitions for feature flags.',
        '',
        '| Field | Type | Format/Constraint | Description |',
        '|-------|------|-------------------|-------------|',
    ];
    for (const [field, def] of Object.entries(flagSchema)) {
        const d = def;
        const constraints = [];
        if (d.format)
            constraints.push(`format: ${d.format}`);
        if (d.pattern)
            constraints.push(`pattern: ${d.pattern}`);
        if (d.maxLength)
            constraints.push(`maxLength: ${d.maxLength}`);
        if (d.default !== undefined)
            constraints.push(`default: ${d.default}`);
        if (d.enum)
            constraints.push(`enum: ${d.enum.join(', ')}`);
        lines.push(`| ${field} | ${d.type} | ${constraints.join('; ') || '—'} | ${d.description} |`);
    }
    return {
        content: [{ type: 'text', text: lines.join('\n') }],
    };
});
// generated-by-copilot: tool 2 - returns the audit log schema
server.registerTool('get_audit_log_schema', {
    title: 'Get Audit Log Schema',
    description: `Returns the audit log field definitions from flag-schemas.json.

Provides the exact field names, types, and constraints for audit log entries
so agents can generate consistent audit logging code.

Args: None

Returns:
  Markdown-formatted table of audit log fields with type, format, and description.`,
    inputSchema: z.object({}).strict(),
    annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
}, async () => {
    const auditSchema = schemaData.auditLogSchema;
    const lines = [
        '# Audit Log Schema',
        '',
        'Field definitions for feature flag audit log entries.',
        '',
        '| Field | Type | Format/Constraint | Description |',
        '|-------|------|-------------------|-------------|',
    ];
    for (const [field, def] of Object.entries(auditSchema)) {
        const d = def;
        const constraints = [];
        if (d.format)
            constraints.push(`format: ${d.format}`);
        if (d.enum)
            constraints.push(`enum: ${d.enum.join(', ')}`);
        lines.push(`| ${field} | ${d.type} | ${constraints.join('; ') || '—'} | ${d.description || '—'} |`);
    }
    return {
        content: [{ type: 'text', text: lines.join('\n') }],
    };
});
// generated-by-copilot: tool 3 - returns the sample flag configurations
server.registerTool('get_sample_flags', {
    title: 'Get Sample Flags',
    description: `Returns sample feature flag configurations from flag-schemas.json.

Provides ready-to-use sample flags for seeding data files, writing test fixtures,
and validating flag-related code. Each sample includes name, description,
environment, and enabled status.

Args: None

Returns:
  Markdown-formatted list of sample flags with their configurations.`,
    inputSchema: z.object({}).strict(),
    annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
}, async () => {
    const samples = schemaData.sampleFlags;
    const lines = [
        '# Sample Feature Flags',
        '',
        `${samples.length} sample flags for seed data and test fixtures.`,
        '',
        '| Name | Description | Environment | Enabled |',
        '|------|-------------|-------------|---------|',
    ];
    for (const flag of samples) {
        lines.push(`| ${flag.name} | ${flag.description} | ${flag.environment} | ${flag.enabled} |`);
    }
    lines.push('');
    lines.push('## JSON');
    lines.push('');
    lines.push('```json');
    lines.push(JSON.stringify(samples, null, 2));
    lines.push('```');
    return {
        content: [{ type: 'text', text: lines.join('\n') }],
    };
});
// generated-by-copilot: start the server with stdio transport
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((error) => {
    process.stderr.write(`Server error: ${error}\n`);
    process.exit(1);
});
//# sourceMappingURL=index.js.map