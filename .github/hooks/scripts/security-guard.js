// generated-by-copilot: security guard hook script
// This PreToolUse hook intercepts terminal commands before they execute.
// It checks the command against dangerous patterns and blocks matches.
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin });
let inputData = '';

rl.on('line', (line) => {
  inputData += line;
});

rl.on('close', () => {
  try {
    const input = JSON.parse(inputData);
    const toolName = input.tool_name || '';
    const toolInput = input.tool_input || {};

    // generated-by-copilot: only check terminal/command execution tools
    const terminalTools = ['run_in_terminal', 'terminal', 'bash', 'shell'];
    if (!terminalTools.some((t) => toolName.toLowerCase().includes(t))) {
      process.stdout.write(JSON.stringify({ continue: true }));
      process.exit(0);
    }

    const command = toolInput.command || toolInput.cmd || toolInput.input || '';

    // generated-by-copilot: define blocked patterns
    const blockedPatterns = [
      /rm\s+-rf\s+\//i,
      /rm\s+-rf\s+\*/i,
      /DROP\s+TABLE/i,
      /DROP\s+DATABASE/i,
      /format\s+[a-z]:/i,
      /npm\s+publish/i,
      /git\s+push\s+.*--force/i,
      /curl\s+.*\|\s*(bash|sh)/i,
    ];

    for (const pattern of blockedPatterns) {
      if (pattern.test(command)) {
        process.stdout.write(
          JSON.stringify({
            hookSpecificOutput: {
              hookEventName: 'PreToolUse',
              permissionDecision: 'deny',
              permissionDecisionReason: `BLOCKED: Command matches dangerous pattern "${pattern.source}". Command: "${command}"`,
            },
          })
        );
        process.exit(0);
      }
    }

    // generated-by-copilot: command is safe
    process.stdout.write(JSON.stringify({ continue: true }));
    process.exit(0);
  } catch (err) {
    process.stderr.write(`Security guard error: ${err.message}\n`);
    process.exit(1);
  }
});
