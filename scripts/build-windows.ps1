# Build Command Center for Windows 10/11 x64.
# Canonical binary path with .github/workflows/windows-build.yml — see README.
# Run from the repo root in PowerShell on a Windows machine (or CI).
# Produces NSIS installer + MSI under src-tauri\target\release\bundle\

$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js 20+ is required."
}
if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
  throw "Rust (rustup) is required. Install from https://rustup.rs"
}

Write-Host "Installing npm dependencies..."
npm ci
if ($LASTEXITCODE -ne 0) { npm install }

Write-Host "Running unit tests..."
npm test

Write-Host "Building Tauri Windows bundles (NSIS + MSI)..."
npm run tauri:build

Write-Host ""
Write-Host "Artifacts:"
Get-ChildItem -Recurse -Path "src-tauri\target\release\bundle" -Include *.exe,*.msi | ForEach-Object {
  Write-Host ("  " + $_.FullName)
}
Write-Host "Portable exe:"
if (Test-Path "src-tauri\target\release\command-center.exe") {
  Write-Host "  src-tauri\target\release\command-center.exe"
}
