import os
from PIL import Image, ImageDraw, ImageFilter

BASE_DIR = r"d:\sherif\PROJECT\amn cash"
IMG2_PATH = r"C:\Users\amnba\.gemini\antigravity\brain\5d0cfd50-bdcb-4880-a7f1-f3525a4a03c7\.user_uploaded\media_1793098178462_dacfa0cb.jpg"

print("Loading reference icon image...")
img2 = Image.open(IMG2_PATH).convert("RGBA")

# 1. Desktop Icon Extraction & Clean Masking
# Coordinates from detection: x: 41 to 507, y: 211 to 677
desktop_raw = img2.crop((41, 211, 507, 677))
dw, dh = desktop_raw.size

# High-quality anti-aliased rounded rectangle mask (using 4x supersampling)
scale = 4
super_w, super_h = dw * scale, dh * scale
super_mask = Image.new("L", (super_w, super_h), 0)
draw_sm = ImageDraw.Draw(super_mask)
radius = int(super_w * 0.22)
draw_sm.rounded_rectangle([(0, 0), (super_w, super_h)], radius=radius, fill=255)
smooth_mask = super_mask.resize((dw, dh), Image.Resampling.LANCZOS)

desktop_icon = desktop_raw.copy()
desktop_icon.putalpha(smooth_mask)
desktop_512 = desktop_icon.resize((512, 512), Image.Resampling.LANCZOS)

# 2. Android Circular Icon Extraction & Clean Masking
# Center at (777, 455), radius ~ 215
cx, cy = 777, 455
r = 215
android_raw = img2.crop((cx - r, cy - r, cx + r, cy + r))
aw, ah = android_raw.size

super_aw, super_ah = aw * scale, ah * scale
super_mask_a = Image.new("L", (super_aw, super_ah), 0)
draw_sma = ImageDraw.Draw(super_mask_a)
draw_sma.ellipse([(0, 0), (super_aw, super_ah)], fill=255)
smooth_mask_a = super_mask_a.resize((aw, ah), Image.Resampling.LANCZOS)

android_icon = android_raw.copy()
android_icon.putalpha(smooth_mask_a)
android_512 = android_icon.resize((512, 512), Image.Resampling.LANCZOS)

# 3. Create Directories
os.makedirs(os.path.join(BASE_DIR, "build"), exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, "public"), exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, "src", "assets"), exist_ok=True)

# 4. Save Windows .ico and build files
ico_path = os.path.join(BASE_DIR, "build", "icon.ico")
desktop_512.save(ico_path, format="ICO", sizes=[
    (16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)
])
desktop_512.save(os.path.join(BASE_DIR, "build", "icon.png"), "PNG")

# 5. Save Web Favicon and Web App Icons
favicon_ico = os.path.join(BASE_DIR, "public", "favicon.ico")
desktop_512.save(favicon_ico, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
desktop_512.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(BASE_DIR, "public", "favicon.png"), "PNG")
desktop_512.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(BASE_DIR, "public", "icon-192.png"), "PNG")
desktop_512.save(os.path.join(BASE_DIR, "public", "icon.png"), "PNG")

# Save asset for React In-App UI
desktop_512.save(os.path.join(BASE_DIR, "src", "assets", "app-logo.png"), "PNG")
android_512.save(os.path.join(BASE_DIR, "src", "assets", "app-logo-round.png"), "PNG")

# 6. Generate Android Mipmap Icons
android_res_dir = os.path.join(BASE_DIR, "android", "app", "src", "main", "res")
densities = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192
}

for folder, size in densities.items():
    target_dir = os.path.join(android_res_dir, folder)
    os.makedirs(target_dir, exist_ok=True)
    
    # Square/Squircle standard icon
    sq_icon = desktop_512.resize((size, size), Image.Resampling.LANCZOS)
    sq_icon.save(os.path.join(target_dir, "ic_launcher.png"), "PNG")
    
    # Circular round icon
    rd_icon = android_512.resize((size, size), Image.Resampling.LANCZOS)
    rd_icon.save(os.path.join(target_dir, "ic_launcher_round.png"), "PNG")

print("All icons successfully generated across Windows, Web, React, and Android!")
