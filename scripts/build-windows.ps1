# Build the NeoFile Windows installer on a Windows machine.
# Requires: Node 22, Rust stable, the Visual Studio C++ build tools, and WebView2.
# This Linux environment cannot cross-compile that installer. GitHub Actions can:
# see .github/workflows/desktop.yml

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

npm ci
npm run build --workspace @neofile/web
Push-Location apps/desktop
npx tauri build --bundles nsis
Pop-Location

$bundle = "apps/desktop/src-tauri/target/release/bundle"
Write-Host "Windows bundles are under $bundle"
Get-ChildItem -Recurse $bundle -Include *.exe, *.msi | Select-Object -ExpandProperty FullName
