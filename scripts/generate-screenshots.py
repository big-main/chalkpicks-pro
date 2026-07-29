#!/usr/bin/env python3
"""
ChalkPicks Pro — App Store Screenshot Generator
================================================
Frames raw browser screenshots inside device mockups (iPhone 15 Pro and Pixel 8)
and adds caption overlays for Play Store and App Store submission.

Usage:
    python3 scripts/generate-screenshots.py

Input:  screenshots/*.png  (raw browser screenshots, any resolution)
Output: screenshots/framed/  (framed screenshots at store-required resolutions)

Requirements:
    pip install Pillow

Store dimensions:
    Google Play Store  : 1080 × 1920 px  (portrait)
    Apple App Store    : 1290 × 2796 px  (iPhone 15 Pro Max, portrait)
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import sys
import os

# ─── Configuration ────────────────────────────────────────────────────────────

SCREENSHOTS_DIR = Path(__file__).parent.parent / "screenshots"
OUTPUT_DIR = SCREENSHOTS_DIR / "framed"

# Brand colors
BG_COLOR = (8, 8, 20)           # #080814 — deep navy
ACCENT = (57, 255, 20)          # #39FF14 — neon lime
TEXT_COLOR = (220, 220, 240)    # off-white
CAPTION_BG = (12, 12, 28, 230)  # semi-transparent dark

# Store output sizes
PLAY_STORE_SIZE = (1080, 1920)   # Google Play portrait
APP_STORE_SIZE  = (1290, 2796)   # iPhone 15 Pro Max portrait

# Caption text per screenshot (filename → caption)
CAPTIONS = {
    "home":         "AI-Powered Sports Picks",
    "picks":        "Daily Expert Picks",
    "ev-finder":    "+EV Finder — Beat the Books",
    "dashboard":    "Advanced Analytics Dashboard",
    "odds":         "Live Odds Comparison",
    "performance":  "Proven Track Record",
    "pricing":      "Flexible Subscription Plans",
    "methodology":  "Institutional-Grade Models",
}

DEFAULT_CAPTION = "ChalkPicks Pro"

# ─── Device frame specs ───────────────────────────────────────────────────────

DEVICES = {
    "pixel8": {
        "store": "play",
        "output_size": PLAY_STORE_SIZE,
        "frame_color": (30, 30, 40),
        "corner_radius": 60,
        "screen_inset": (40, 100, 40, 100),  # left, top, right, bottom
        "status_bar_height": 80,
        "home_indicator_height": 40,
        "label": "Google Pixel 8",
    },
    "iphone15pro": {
        "store": "appstore",
        "output_size": APP_STORE_SIZE,
        "frame_color": (28, 28, 30),
        "corner_radius": 80,
        "screen_inset": (50, 120, 50, 120),
        "status_bar_height": 100,
        "home_indicator_height": 50,
        "label": "iPhone 15 Pro",
    },
}

# ─── Helpers ──────────────────────────────────────────────────────────────────

def rounded_rectangle(draw: ImageDraw.ImageDraw, xy, radius: int, fill, outline=None, width=1):
    """Draw a rounded rectangle."""
    x0, y0, x1, y1 = xy
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill, outline=outline, width=width)


def load_font(size: int, bold: bool = False):
    """Try to load a system font, fall back to default."""
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for path in font_paths:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def frame_screenshot(screenshot_path: Path, device_key: str) -> Image.Image:
    """Frame a screenshot inside a device mockup with caption overlay."""
    device = DEVICES[device_key]
    out_w, out_h = device["output_size"]
    inset_l, inset_t, inset_r, inset_b = device["screen_inset"]
    corner_r = device["corner_radius"]

    # Create canvas
    canvas = Image.new("RGBA", (out_w, out_h), BG_COLOR + (255,))
    draw = ImageDraw.Draw(canvas)

    # Draw device body
    body_margin = 20
    rounded_rectangle(
        draw,
        (body_margin, body_margin, out_w - body_margin, out_h - body_margin),
        radius=corner_r,
        fill=device["frame_color"],
        outline=(60, 60, 80),
        width=3,
    )

    # Screen area
    screen_x0 = inset_l
    screen_y0 = inset_t
    screen_x1 = out_w - inset_r
    screen_y1 = out_h - inset_b
    screen_w = screen_x1 - screen_x0
    screen_h = screen_y1 - screen_y0

    # Load and resize screenshot
    try:
        shot = Image.open(screenshot_path).convert("RGBA")
    except Exception as e:
        print(f"  ⚠ Could not open {screenshot_path}: {e}")
        # Create placeholder
        shot = Image.new("RGBA", (screen_w, screen_h), (20, 20, 40, 255))
        pd = ImageDraw.Draw(shot)
        pd.text((screen_w // 2, screen_h // 2), "Screenshot\nPlaceholder", fill=TEXT_COLOR, anchor="mm")

    shot = shot.resize((screen_w, screen_h), Image.LANCZOS)

    # Paste screenshot into screen area
    canvas.paste(shot, (screen_x0, screen_y0))

    # Status bar overlay (top)
    status_overlay = Image.new("RGBA", (screen_w, device["status_bar_height"]), (0, 0, 0, 180))
    canvas.alpha_composite(status_overlay, (screen_x0, screen_y0))

    # Home indicator (bottom)
    ind_h = device["home_indicator_height"]
    ind_overlay = Image.new("RGBA", (screen_w, ind_h), (0, 0, 0, 160))
    canvas.alpha_composite(ind_overlay, (screen_x0, screen_y1 - ind_h))

    # Draw home indicator pill
    pill_w, pill_h = 120, 6
    pill_x = screen_x0 + (screen_w - pill_w) // 2
    pill_y = screen_y1 - ind_h // 2 - pill_h // 2
    draw2 = ImageDraw.Draw(canvas)
    draw2.rounded_rectangle([pill_x, pill_y, pill_x + pill_w, pill_y + pill_h], radius=3, fill=(180, 180, 200, 200))

    # Caption bar at bottom of canvas (below device)
    caption_area_h = 160
    caption_y = out_h - body_margin - caption_area_h - 20

    # Determine caption
    stem = screenshot_path.stem.lower()
    caption = next((v for k, v in CAPTIONS.items() if k in stem), DEFAULT_CAPTION)

    # Draw accent line
    draw2.rectangle([out_w // 2 - 80, caption_y, out_w // 2 + 80, caption_y + 4], fill=ACCENT)

    # Draw caption text
    font_title = load_font(52, bold=True)
    font_sub = load_font(34)

    draw2.text((out_w // 2, caption_y + 30), caption, font=font_title, fill=TEXT_COLOR, anchor="mt")
    draw2.text((out_w // 2, caption_y + 100), "chalkpicks.live", font=font_sub, fill=ACCENT + (200,), anchor="mt")

    return canvas.convert("RGB")


def generate_placeholder_screenshots():
    """Generate placeholder screenshots if none exist."""
    SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    pages = ["home", "picks", "ev-finder", "dashboard", "odds", "performance"]
    for page in pages:
        p = SCREENSHOTS_DIR / f"{page}.png"
        if not p.exists():
            img = Image.new("RGB", (390, 844), BG_COLOR)
            d = ImageDraw.Draw(img)
            font = load_font(28, bold=True)
            d.text((195, 422), f"/{page}", font=font, fill=ACCENT, anchor="mm")
            img.save(p)
            print(f"  Created placeholder: {p.name}")


def main():
    print("ChalkPicks Pro — Screenshot Generator")
    print("=" * 45)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)

    # Check for input screenshots
    shots = sorted(SCREENSHOTS_DIR.glob("*.png"))
    shots = [s for s in shots if s.parent == SCREENSHOTS_DIR]  # exclude subdirs

    if not shots:
        print("No screenshots found. Generating placeholders…")
        generate_placeholder_screenshots()
        shots = sorted(SCREENSHOTS_DIR.glob("*.png"))
        shots = [s for s in shots if s.parent == SCREENSHOTS_DIR]

    print(f"Found {len(shots)} screenshot(s): {[s.name for s in shots]}\n")

    total = 0
    for shot in shots:
        for device_key, device in DEVICES.items():
            store = device["store"]
            out_name = f"{shot.stem}_{device_key}.png"
            out_path = OUTPUT_DIR / store / out_name
            out_path.parent.mkdir(parents=True, exist_ok=True)

            print(f"  Framing {shot.name} → {store}/{out_name} ({device['label']})…")
            try:
                framed = frame_screenshot(shot, device_key)
                framed.save(out_path, "PNG", optimize=True)
                size_kb = out_path.stat().st_size // 1024
                print(f"    ✓ Saved {out_path.relative_to(Path.cwd())} ({size_kb} KB)")
                total += 1
            except Exception as e:
                print(f"    ✗ Error: {e}")

    print(f"\n✅ Generated {total} framed screenshot(s) in {OUTPUT_DIR}/")
    print("\nStore submission directories:")
    print(f"  Play Store  : {OUTPUT_DIR}/play/")
    print(f"  App Store   : {OUTPUT_DIR}/appstore/")
    print("\nNext steps:")
    print("  1. Take real screenshots from Chrome DevTools (390×844 for mobile)")
    print("  2. Save them to screenshots/ with descriptive names (e.g., picks.png)")
    print("  3. Re-run this script to regenerate framed versions")
    print("  4. Upload to Google Play Console / App Store Connect")


if __name__ == "__main__":
    main()
