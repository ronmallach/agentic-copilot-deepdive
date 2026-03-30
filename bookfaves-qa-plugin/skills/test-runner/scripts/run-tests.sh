#!/bin/bash
# generated-by-copilot: run all test suites sequentially
set -e

echo "=== Running Backend Tests ==="
cd copilot-agent-and-mcp
npm run test:backend

echo ""
echo "=== Running Frontend E2E Tests ==="
npm run build:frontend && npm run test:frontend

echo ""
echo "=== All Tests Complete ==="