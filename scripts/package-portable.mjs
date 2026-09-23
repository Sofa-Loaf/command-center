#!/usr/bin/env node
/**
 * Package a portable Windows zip of the runnable web app.
 * Used as a public download when a Tauri installer is not available,
 * and as an extra artifact beside the installer.
 */
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const version = typeof pkg.version === "string" ? pkg.version : "0.0.0";
const zipName = `Command-Center-${version}-portable-win64.zip`;
const outDir = join(root, "dist-portable", "Command-Center-portable");
const zipPath = join(root, "dist-portable", zipName);
const dist = join(root, "dist");

function run(cmd, args) {
  const command = process.platform === "win32" && cmd === "npm" ? "npm.cmd" : cmd;
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed`);
  }
}

if (!existsSync(join(root, "node_modules"))) {
  run("npm", ["ci"]);
}

run("npm", ["run", "build"]);

rmSync(join(root, "dist-portable"), { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
cpSync(dist, join(outDir, "web"), { recursive: true });

writeFileSync(
  join(outDir, "START.bat"),
  `@echo off
setlocal
cd /d "%~dp0"
echo Starting Command Center (portable web app)...
echo Clipboard only. Never executes remotely. Close this window to stop the server.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0START.ps1"
`,
  "utf8",
);

writeFileSync(
  join(outDir, "START.ps1"),
  `$ErrorActionPreference = "Stop"
$root = Join-Path $PSScriptRoot "web"
if (-not (Test-Path $root)) { throw "Missing web folder. Unzip the whole archive." }
$listener = New-Object System.Net.HttpListener
$port = 1420
$prefix = "http://127.0.0.1:$port/"
try {
  $listener.Prefixes.Add($prefix)
  $listener.Start()
} catch {
  $port = 14200
  $prefix = "http://127.0.0.1:$port/"
  $listener = New-Object System.Net.HttpListener
  $listener.Prefixes.Add($prefix)
  $listener.Start()
}
Start-Process $prefix
Write-Host "Command Center is open at $prefix"
Write-Host "Copy commands, paste into SSH/RDP/iLO. Close this window to stop."
$mime = @{
  ".html"="text/html; charset=utf-8"; ".js"="text/javascript"; ".css"="text/css"
  ".svg"="image/svg+xml"; ".png"="image/png"; ".woff"="font/woff"; ".woff2"="font/woff2"
  ".json"="application/json"; ".map"="application/json"; ".ico"="image/x-icon"
}
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart("/"))
  if ([string]::IsNullOrWhiteSpace($path)) { $path = "index.html" }
  $full = Join-Path $root ($path -replace "/", [IO.Path]::DirectorySeparatorChar)
  $full = [IO.Path]::GetFullPath($full)
  if (-not $full.StartsWith([IO.Path]::GetFullPath($root))) {
    $ctx.Response.StatusCode = 403
    $ctx.Response.Close()
    continue
  }
  if (-not (Test-Path $full -PathType Leaf)) {
    $full = Join-Path $root "index.html"
  }
  $bytes = [IO.File]::ReadAllBytes($full)
  $ext = [IO.Path]::GetExtension($full).ToLowerInvariant()
  $ctx.Response.ContentType = $(if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" })
  $ctx.Response.ContentLength64 = $bytes.Length
  $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $ctx.Response.Close()
}
`,
  "utf8",
);

writeFileSync(
  join(outDir, "README.txt"),
  `Command Center — portable web app (Windows)
==========================================

This zip is a free, runnable clipboard command palette. Double-click START.bat.

What you get
- The same UI: tabs, command cards, placeholders, search, dark/light mode
- Lists scroll inside the window. Display sets smooth or instant jumps and compact density
- Library stored in the browser as localStorage key command-center:document
- Works offline after the page loads

The full Windows app (Start-menu installer, portable .exe) is on the GitHub
Release when the Tauri build is attached:

https://github.com/Sofa-Loaf/command-center/releases/latest

Clipboard only. Never executes remotely. Free forever. No account.

If Windows blocks START.bat: right-click → Run anyway / More info.
`,
  "utf8",
);

rmSync(zipPath, { force: true });
const zipResult = spawnSync("zip", ["-r", "-9", zipPath, "Command-Center-portable"], {
  cwd: join(root, "dist-portable"),
  stdio: "inherit",
});
if (zipResult.status !== 0) {
  const pyArgs = [
    "-c",
    `import shutil; shutil.make_archive(${JSON.stringify(zipName.replace(/\.zip$/, ""))}, 'zip', '.', 'Command-Center-portable')`,
  ];
  let packed = false;
  for (const bin of ["python3", "python"]) {
    const python = spawnSync(bin, pyArgs, { cwd: join(root, "dist-portable"), stdio: "inherit" });
    if (python.status === 0) {
      packed = true;
      break;
    }
  }
  if (!packed) {
    const ps = spawnSync(
      "powershell",
      [
        "-NoProfile",
        "-Command",
        `Compress-Archive -Path Command-Center-portable -DestinationPath ${zipName} -Force`,
      ],
      { cwd: join(root, "dist-portable"), stdio: "inherit" },
    );
    if (ps.status !== 0) throw new Error("Could not create zip");
  }
}

console.log(`Wrote ${zipPath}`);
