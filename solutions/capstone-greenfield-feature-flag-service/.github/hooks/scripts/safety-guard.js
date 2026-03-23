// generated-by-copilot: PreToolUse hook to block destructive terminal commands
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

    const terminalTools = ['run_in_terminal', 'terminal', 'bash', 'shell'];
    if (!terminalTools.some((t) => toolName.toLowerCase().includes(t))) {
      process.stdout.write(JSON.stringify({ continue: true }));
      process.exit(0);
    }

    const command = toolInput.command || toolInput.cmd || toolInput.input || '';
    const blockedPatterns = [
      /rm\s+-rf\s+\//i,
      /rm\s+-rf\s+\*/i,
      /DROP\s+(TABLE|DATABASE)/i,
      /npm\s+publish/i,
      /git\s+push\s+.*--force/i,
      /curl\s+.*\|\s*(bash|sh)/i,
      /format\s+[a-z]:/i,
    ];

    for (const pattern of blockedPatterns) {
      if (pattern.test(command)) {
        process.stdout.write(
          JSON.stringify({
            hookSpecificOutput: {
              hookEventName: 'PreToolUse',
              permissionDecision: 'deny',
              permissionDecisionReason: `BLOCKED: "${command}" matches dangerous pattern "${pattern.source}".`,
            },
          })
        );
        process.exit(0);
      }
    }

    process.stdout.write(JSON.stringify({ continue: true }));
    process.exit(0);
  } catch (err) {
    process.stderr.write(`Safety guard error: ${err.message}\n`);
    process.exit(1);
  }
});
