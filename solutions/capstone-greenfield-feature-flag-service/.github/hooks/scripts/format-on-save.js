// generated-by-copilot: PostToolUse hook to auto-format files with Prettier
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
    if (!filePath) process.exit(0);

    const formattable = /\.(js|ts|jsx|tsx|json|css|html|md|yaml|yml)$/i;
    if (!formattable.test(filePath)) process.exit(0);

    execSync(`npx prettier --write "${filePath}"`, { stdio: 'inherit' });
  } catch (err) {
    process.stderr.write(`Format hook error: ${err.message}\n`);
    process.exit(0);
  }
});
