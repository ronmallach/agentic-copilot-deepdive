// generated-by-copilot: PostToolUse hook script to auto-format files with Prettier
// Reads the tool input from stdin (JSON) and runs Prettier on the edited file.
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin });
let inputData = '';

rl.on('line', (line) => {
  inputData += line;
});

rl.on('close', () => {
  try {
    const input = JSON.parse(inputData);
    const toolInput =
      typeof input.tool_input === 'string'
        ? JSON.parse(input.tool_input)
        : input.tool_input || {};

    const filePath = toolInput.filePath;
    if (!filePath) {
      // generated-by-copilot: no file path in tool input, skip formatting
      process.exit(0);
    }

    // generated-by-copilot: only format known file types
    const formattable = /\.(js|ts|jsx|tsx|json|css|html|md|yaml|yml)$/i;
    if (!formattable.test(filePath)) {
      process.exit(0);
    }

    execSync(`npx prettier --write "${filePath}"`, { stdio: 'inherit' });
  } catch (err) {
    // generated-by-copilot: non-blocking - log but don't fail the agent
    process.stderr.write(`Format hook error: ${err.message}\n`);
    process.exit(0);
  }
});