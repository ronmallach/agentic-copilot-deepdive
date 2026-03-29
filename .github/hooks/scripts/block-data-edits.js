#!/usr/bin/env node

// generated-by-copilot: Hook script to block file edits in backend/data/ directory

process.stdin.setEncoding('utf8');

let inputData = '';

process.stdin.on('readable', () => {
  let chunk;
  while (null !== (chunk = process.stdin.read())) {
    inputData += chunk;
  }
});

process.stdin.on('end', () => {
  try {
    const input = JSON.parse(inputData);
    const toolName = input.tool || '';
    let toolInput = input.tool_input || {};

    // Check if this is a file edit tool
    const fileEditTools = [
      'edit/editFiles',
      'edit/createFile',
      'replace_string_in_file',
      'create_file',
      'multi_replace_string_in_file',
    ];

    if (fileEditTools.includes(toolName)) {
      // Check if tool_input is a JSON string and parse if needed
      if (typeof toolInput === 'string') {
        toolInput = JSON.parse(toolInput);
      }

      let filePaths = [];

      // Handle different tool input formats
      if (toolName === 'multi_replace_string_in_file') {
        // Extract from replacements array
        if (toolInput.replacements && Array.isArray(toolInput.replacements)) {
          filePaths = toolInput.replacements
            .map((r) => r.filePath)
            .filter((path) => path && typeof path === 'string');
        }
      } else {
        // Handle single file tools
        const filePath =
          toolInput.filePath || toolInput.file_path || toolInput.path;
        if (filePath && typeof filePath === 'string') {
          filePaths = [filePath];
        }
      }

      // Check each file path
      for (const path of filePaths) {
        // Normalize Windows backslashes to forward slashes
        const normalizedPath = path.replace(/\\/g, '/');

        // Check if path contains backend/data/
        if (normalizedPath.includes('backend/data/')) {
          // Block the operation
          const response = {
            hookSpecificOutput: {
              hookEventName: 'PreToolUse',
              permissionDecision: 'deny',
              permissionDecisionReason:
                'File edits to backend/data/ directory are not allowed. Use the Database Migrator agent instead for schema changes.',
            },
          };
          console.log(JSON.stringify(response));
          process.exit(0);
        }
      }
    }

    // Allow all other operations
    const allowResponse = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
      },
    };
    console.log(JSON.stringify(allowResponse));
    process.exit(0);
  } catch (error) {
    // On parse error, allow the operation but log the error
    console.error('Hook script error:', error.message);
    const allowResponse = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
      },
    };
    console.log(JSON.stringify(allowResponse));
    process.exit(0);
  }
});
