#!/usr/bin/env python3
"""Generate Command Center app icons (PNG + ICO + SVG favicon)."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
TAURI_ICONS = ROOT / "src-tauri" / "icons"
PUBLIC = ROOT / "public"
DOCS = ROOT / "docs"


def lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def draw_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pad = max(1, size // 32)
    radius = size * 0.22
    for y in range(size):
        t = y / max(1, size - 1)
        color = (lerp(12, 8, t), lerp(28, 18, t), lerp(38, 24, t), 255)
        d.line([(pad, y), (size - pad - 1, y)], fill=color)
    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([pad, pad, size - pad - 1, size - pad - 1], radius=radius, fill=255)
    bg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bg.paste(img, (0, 0), mask)
    img = bg
    d = ImageDraw.Draw(img)

    # Terminal body
    tx, ty = int(size * 0.16), int(size * 0.20)
    tw, th = int(size * 0.68), int(size * 0.58)
    d.rounded_rectangle([tx, ty, tx + tw, ty + th], radius=size * 0.08, fill=(20, 32, 44, 255))
    d.rounded_rectangle(
        [tx, ty, tx + tw, ty + int(size * 0.12)],
        radius=size * 0.06,
        fill=(28, 44, 58, 255),
    )
    # Prompt chevron
    cx = tx + int(size * 0.10)
    cy = ty + int(size * 0.28)
    chev = int(size * 0.10)
    accent = (46, 230, 197, 255)
    d.polygon(
        [(cx, cy), (cx + chev, cy + chev // 2), (cx, cy + chev)],
        fill=accent,
    )
    # Cursor bar
    d.rectangle(
        [cx + chev + int(size * 0.04), cy + int(size * 0.02), cx + chev + int(size * 0.18), cy + chev - int(size * 0.02)],
        fill=accent,
    )
    # Clipboard corner
    bx, by = int(size * 0.58), int(size * 0.48)
    bw, bh = int(size * 0.26), int(size * 0.32)
    d.rounded_rectangle([bx, by, bx + bw, by + bh], radius=size * 0.04, fill=(232, 240, 247, 255))
    clip_w = int(size * 0.12)
    d.rounded_rectangle(
        [bx + (bw - clip_w) // 2, by - int(size * 0.04), bx + (bw + clip_w) // 2, by + int(size * 0.04)],
        radius=size * 0.02,
        fill=accent,
    )
    return img


def write_svg(path: Path) -> None:
    path.write_text(
        """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0c1c26"/>
      <stop offset="1" stop-color="#081218"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#g)"/>
  <rect x="10" y="13" width="44" height="37" rx="6" fill="#14202c"/>
  <rect x="10" y="13" width="44" height="8" rx="4" fill="#1c2c3a"/>
  <path d="M16 28 l7 5 -7 5" fill="none" stroke="#2ee6c5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="26" y="31" width="10" height="4" rx="1" fill="#2ee6c5"/>
  <rect x="36" y="32" width="16" height="20" rx="3" fill="#e8f0f7"/>
  <rect x="40" y="29" width="8" height="6" rx="2" fill="#2ee6c5"/>
</svg>
""",
        encoding="utf-8",
    )


def write_download_svg(path: Path) -> None:
    path.write_text(
        """<svg xmlns="http://www.w3.org/2000/svg" width="420" height="64" viewBox="0 0 420 64">
  <rect width="420" height="64" rx="10" fill="#0f8f84"/>
  <text x="210" y="28" text-anchor="middle" font-family="Segoe UI, system-ui, sans-serif" font-size="16" font-weight="700" fill="#f3fffd">Download for Windows</text>
  <text x="210" y="48" text-anchor="middle" font-family="Segoe UI, system-ui, sans-serif" font-size="12" fill="#d5fff6">Free forever · NSIS installer + portable zip</text>
</svg>
""",
        encoding="utf-8",
    )


def main() -> None:
    TAURI_ICONS.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    DOCS.mkdir(parents=True, exist_ok=True)
    master = draw_icon(1024)
    master.save(TAURI_ICONS / "icon.png")
    draw_icon(32).save(TAURI_ICONS / "32x32.png")
    draw_icon(128).save(TAURI_ICONS / "128x128.png")
    draw_icon(256).save(TAURI_ICONS / "128x128@2x.png")
    ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    draw_icon(256).save(TAURI_ICONS / "icon.ico", format="ICO", sizes=ico_sizes)
    write_svg(PUBLIC / "favicon.svg")
    write_svg(TAURI_ICONS / "icon.svg")
    write_download_svg(DOCS / "download-windows.svg")
    print(f"Wrote icons to {TAURI_ICONS}")


if __name__ == "__main__":
    main()
