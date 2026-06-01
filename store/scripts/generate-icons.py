#!/usr/bin/env python3
"""Regenerate extension/public/icons from brand/shrimp-mascot.png."""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "extension/public/brand/shrimp-mascot.png"
OUT = ROOT / "extension/public/icons"


def main() -> None:
    im = Image.open(SRC).convert("RGBA")
    w, h = im.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    im = im.crop((left, top, left + side, top + side))

    OUT.mkdir(parents=True, exist_ok=True)
    for size in (16, 32, 48, 128):
        out = im.resize((size, size), Image.Resampling.LANCZOS)
        path = OUT / f"icon{size}.png"
        out.save(path)
        print(f"Wrote {path}")


if __name__ == "__main__":
    main()
