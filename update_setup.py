import qrcode
import shutil
from pathlib import Path

# Paths
base_dir = Path(r"C:\Users\Dell\OneDrive\Desktop\New folder\kids_learning_gameupdated\kids_learning_game")
web_dir = base_dir / "web"
desktop_dir = Path(r"C:\Users\Dell\OneDrive\Desktop")

phone_url = "http://192.168.1.110:8000"

# 1. Generate QR Code
qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_M,
    box_size=10,
    border=2,
)
qr.add_data(phone_url)
qr.make(fit=True)
img = qr.make_image(fill_color="#1e293b", back_color="#ffffff")

qr_dest1 = web_dir / "phone_qr.png"
img.save(str(qr_dest1))
print("Saved QR to:", qr_dest1)

qr_dest2 = base_dir / "android_app" / "app" / "src" / "main" / "assets" / "phone_qr.png"
if qr_dest2.parent.exists():
    shutil.copyfile(str(qr_dest1), str(qr_dest2))
    print("Copied QR to android_app")

# 2. Update index.html
index_file = web_dir / "index.html"
content = index_file.read_text(encoding="utf-8")
content = content.replace("http://192.168.1.92:8000", phone_url)
index_file.write_text(content, encoding="utf-8")
print("Updated web/index.html with", phone_url)

# Also update android_app index.html if exists
android_index = base_dir / "android_app" / "app" / "src" / "main" / "assets" / "index.html"
if android_index.exists():
    c = android_index.read_text(encoding="utf-8")
    c = c.replace("http://192.168.1.92:8000", phone_url)
    android_index.write_text(c, encoding="utf-8")
    print("Updated android_app index.html")

# 3. Update mobileconfig
for mc_path in [desktop_dir / "LittleChampions_iOS_Installer.mobileconfig", base_dir / "LittleChampions_iOS_Installer.mobileconfig"]:
    if mc_path.exists():
        mc_text = mc_path.read_text(encoding="utf-8")
        mc_text = mc_text.replace("http://192.168.1.92:8000", phone_url)
        mc_path.write_text(mc_text, encoding="utf-8")
        print("Updated mobileconfig:", mc_path)

# 4. Create Desktop 1-Click Launcher Batch File
bat_content = f"""@echo off
title Little Champions: Play & Learn
cls
echo ============================================================
echo            LITTLE CHAMPIONS: PLAY AND LEARN
echo ============================================================
echo.
echo Starting local game server...
echo.
start /B python "{base_dir / 'server.py'}"
timeout /t 2 >nul
echo Opening Little Champions in your browser...
start http://localhost:8000
echo.
echo App is running at: {phone_url}
echo Connect your phone or iPhone to the same Wi-Fi and open:
echo      {phone_url}
echo ============================================================
pause
"""
launcher_path = desktop_dir / "Play_Little_Champions.bat"
launcher_path.write_text(bat_content, encoding="utf-8")
print("Created launcher:", launcher_path)
