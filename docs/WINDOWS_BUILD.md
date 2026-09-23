# Windows build notes

Command Center ships as a **Tauri 2** Windows app wrapping a Vite + React SPA. The supported desktop product is **Windows 10/11 x64**. The web app also runs in any modern browser (`npm run dev` / `npm run preview`).

## What the bundler produces

`src-tauri/tauri.conf.json` sets:

```json
"bundle": {
  "targets": ["nsis", "msi"],
  "windows": {
    "nsis": { "installMode": "currentUser" },
    "wix": { "language": "en-US" }
  }
}
```

| File | Who it is for |
| --- | --- |
| NSIS `*-setup.exe` | Most people. Next / Next / Finish. |
| MSI `.msi` | IT / workplace installers |
| `command-center.exe` | Portable — copy to a USB stick, no install |
| `Command-Center-0.2.0-portable-win64.zip` | Portable **web** preview (`START.bat`) |

WebView2 is already on current Windows 11. On older Windows 10 the installer can download Microsoft’s bootstrapper (`webviewInstallMode: downloadBootstrapper`).

## Local build (Windows 10/11 x64)

1. Install [Node.js 20+](https://nodejs.org/) and [Rust](https://rustup.rs).
2. Open PowerShell in this repo.
3. Run:

```powershell
.\scripts\build-windows.ps1
```

That runs `npm ci`, `npm test`, then `npm run tauri:build`.

MSI builds need the **Windows VBScript** optional feature (on by default on most PCs). If `light.exe` fails, enable it under **Settings → Apps → Optional features**.

## GitHub Actions / v0.2.0 release

[`.github/workflows/windows-build.yml`](../.github/workflows/windows-build.yml) runs on `windows-latest` when you:

- click **Run workflow**, or
- push a tag like `v0.2.0`

It uploads the NSIS, MSI, portable exe zip, and portable web zip, and **publishes** a GitHub Release on a `v*` tag (`releaseDraft: false`) so [Releases / latest](https://github.com/Sofa-Loaf/command-center/releases/latest) is a public download.

To cut **v0.2.0** after this lands on `main`:

```bash
git checkout main
git pull
git tag v0.2.0
git push origin v0.2.0
```

CI on every PR ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) checks tests, typecheck, and the web bundle. It does **not** build the Windows installer (that job needs a Windows runner).

## Not supported

- Building a Windows installer from Linux/macOS for customers
- Code signing in this MVP (SmartScreen may warn until you add a certificate)
