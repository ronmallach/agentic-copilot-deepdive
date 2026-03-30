# generated-by-copilot: run all test suites sequentially (Windows)
$ErrorActionPreference = "Stop"

Write-Host "=== Running Backend Tests ==="
Push-Location copilot-agent-and-mcp
npm run test:backend

Write-Host ""
Write-Host "=== Running Frontend E2E Tests ==="
npm run build:frontend; npm run test:frontend
Pop-Location

Write-Host ""
Write-Host "=== All Tests Complete ==="