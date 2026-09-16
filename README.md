# Command Center

Clipboard command palette for MSP / field techs. Organize CLI commands in tabs. Click → copy → paste into SSH, RDP, or iLO.

**Never executes remotely.** No backend. No accounts. Offline OK. **Free forever.**

<p align="center">
  <a href="https://github.com/Sofa-Loaf/command-center/releases/latest">
    <img src="docs/download-windows.svg" alt="Download for Windows — Free forever" width="420" height="64">
  </a>
</p>

<p align="center">
  <strong><a href="https://github.com/Sofa-Loaf/command-center/releases/latest">Download the latest Windows release</a></strong>
  · Free forever · No account · Clipboard only
</p>

## Install on Windows

You do **not** need to build anything.

1. Click **[Download for Windows](https://github.com/Sofa-Loaf/command-center/releases/latest)**.
2. On the release page, pick one:
   - **`Command Center_..._x64-setup.exe`** — installer (Start-menu shortcut). Prefer this when it is listed.
   - **`Command-Center-portable-win64.zip`** — unzip and double-click **`command-center.exe`**.
   - **`Command-Center-0.1.0-portable-win64.zip`** — unzip and double-click **`START.bat`** (portable web app).
   - An **`.msi`** is also there if your workplace prefers that.
3. If Windows says **“Windows protected your PC”**, click **More info**, then **Run anyway**. This app is new and may not be signed yet.

### First use

1. Pick a tab (Diagnostics, Networking, Troubleshooting, …).
2. Fill the placeholder bar (`host`, `ip`, `user`, `port`, …). Last-used values stick.
3. Click a command card (or **Copy filled**). Paste into the remote session.
4. Press **`/`** or **Ctrl+K** to search. **Enter** copies the selected command. **Esc** closes.

The library lives in this browser/app only, under localStorage key **`command-center:document`**.

## What it does (and does not)

Does:

- Tabs with CRUD + drag reorder
- Command cards: title, notes, tags, OS badge (`linux` / `windows` / `macos` / `generic`), multi-line body, favorites
- Copy **filled** and copy **raw**
- Placeholders `{{host}}` `{{ip}}` `{{user}}` `{{port}}` `{{path}}` `{{service}}` `{{pid}}` `{{interface}}` `{{days}}` and `${VAR}`, plus defaults like `{{port:22}}`
- Live preview; warn on empty placeholders but still copy
- Favorites Quick area
- Duplicate / edit / delete with undo toast
- Import JSON, text, Markdown, or YAML
- Export the whole library or the current tab as JSON
- Dark and light mode (toggle, persisted, respects `prefers-color-scheme` until you pick)

Does not (on purpose):

- SSH / WinRM / iLO execution
- Cloud sync, accounts, or telemetry
- A backend of any kind

## Run from source (developers)

```bash
npm install
npm test
npm run dev          # http://127.0.0.1:1420
npm run build
npm run package:portable   # zip a Windows-runnable web preview
```

Desktop window (needs Tauri system libraries on your OS):

```bash
npm run tauri:dev
```

## Windows packages (builders)

Produce the installer **only** on Windows 10/11 x64, or with the GitHub Actions Windows workflow. Cross-compiling a signed Windows installer from Linux is not supported.

| Path | What you get |
| --- | --- |
| [`scripts/build-windows.ps1`](scripts/build-windows.ps1) | Local NSIS + MSI + portable exe |
| [`scripts/package-portable.mjs`](scripts/package-portable.mjs) | Portable zip of the web app (`START.bat`) |
| [`.github/workflows/windows-build.yml`](.github/workflows/windows-build.yml) | Installer + portable zip on `windows-latest` (`workflow_dispatch` or a `v*` tag) |
| [`src-tauri/tauri.conf.json`](src-tauri/tauri.conf.json) | Tauri 2 bundler: `targets: ["nsis", "msi"]`, current-user NSIS |

On a Windows machine (PowerShell):

```powershell
# Need Node.js 20+ and Rust: https://rustup.rs
.\scripts\build-windows.ps1
```

Cut a GitHub Release (after merge to `main`):

```bash
git tag v0.1.0
git push origin v0.1.0
```

More notes: [`docs/WINDOWS_BUILD.md`](docs/WINDOWS_BUILD.md).

## Starter library

Default tabs: **Diagnostics**, **Networking**, **Troubleshooting**, **System Info**, **Disk/Storage**, **Users/Auth**, **Services**, **Logs**.

Canonical example file: [`examples/commands.json`](examples/commands.json). Reset from **Library → Reset to starter pack** (undoable).

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Desktop shell | **Tauri 2** (Rust) | Small Windows `.exe` / NSIS / MSI |
| UI | React + Vite + TypeScript | Dense MSP/NOC tool UI |
| Persistence | `localStorage` key `command-center:document` | Offline, no backend |

## Project layout

```
src/                 React UI
src/lib/             Placeholders, import/export, library, search
src-tauri/           Tauri 2 Rust shell and Windows bundle config
scripts/             icons, Windows build, portable zip
examples/            starter commands.json
docs/                Windows build notes
.github/workflows/   CI + Windows installer / Release
```

## License

[MIT](LICENSE). Tauri is MIT.
