param()

\Stop = 'Stop'
Write-Host '== ETHINX MARKETING VERIFY =='

if (-not (Test-Path package.json)) { throw 'package.json not found (run from repo root)' }

Write-Host 'Node:'; node -v
Write-Host 'NPM:'; npm -v

Write-Host 'Install (npm ci)...'
npm ci

Write-Host 'Audit (high+)...'
npm audit --audit-level=high

Write-Host 'Build...'
npm run build

Write-Host 'OK'
