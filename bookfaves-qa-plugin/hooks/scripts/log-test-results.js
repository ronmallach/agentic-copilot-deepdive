// generated-by-copilot: PostToolUse hook to log test execution results
// Only fires for terminal tool calls that contain test commands.
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
    const toolInput =
      typeof input.tool_input === 'string'
        ? JSON.parse(input.tool_input)
        : input.tool_input || {};

    // generated-by-copilot: only log for terminal commands that look like test runs
    const terminalTools = ['run_in_terminal', 'terminal', 'bash', 'shell'];
    if (!terminalTools.some((t) => toolName.toLowerCase().includes(t))) {
      process.exit(0);
    }

    const command = toolInput.command || toolInput.cmd || toolInput.input || '';
    const testPatterns = [/npm\s+run\s+test/i, /jest/i, /cypress/i, /vitest/i];

    if (!testPatterns.some((p) => p.test(command))) {
      process.exit(0);
    }

    // generated-by-copilot: log test execution with timestamp
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] Test executed: ${command}\n`;
    process.stderr.write(logEntry);
  } catch (err) {
    // generated-by-copilot: non-blocking - log but don't fail the agent
    process.stderr.write(`Test log hook error: ${err.message}\n`);
    process.exit(0);
  }
});