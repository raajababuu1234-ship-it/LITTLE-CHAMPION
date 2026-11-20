# 📱 Little Champions: Play & Learn - Android App & APK Guide

This folder contains the complete native Android Studio project and tools to run the game as an installed app on any Android mobile phone.

---

## ⚡ Option 1: 5-Second Instant App Install (PWA / WebAPK - Recommended)
You **do not need** to install heavy developer tools or enable "Unknown Sources" on your phone to play this game as an app!

1. On your PC, double-click **`run_game.bat`** (or run `python server.py`).
2. Make sure your phone is connected to the same Wi-Fi network as your PC.
3. Open your Android phone's browser (Chrome or Edge) and scan the QR code or visit the address shown on screen (e.g. `http://192.168.1.92:8000`).
4. Tap the **3 dots menu** in the top-right corner of Chrome on your phone.
5. Tap **"Install App"** (or **"Add to Home screen"**).
6. Android will automatically package and install a real native **WebAPK** onto your phone's Home Screen and App Drawer!
7. It runs in full-screen standalone mode with no browser URL bar and works **100% offline**!

---

## 🛠️ Option 2: Build a Standalone `.apk` file using Android Studio
If you want an actual `.apk` file to share via WhatsApp, Bluetooth, or Google Drive:

1. Download & Install [Android Studio](https://developer.android.com/studio) (if not already installed).
2. Open Android Studio and select **"Open"**.
3. Choose the folder:  
   `C:\Users\Dell\OneDrive\Desktop\New folder\kids_learning_gameupdated\kids_learning_game\android_app`
4. Wait for Gradle sync to complete (it will automatically download the lightweight SDK components).
5. In the top menu, click **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
6. Once built, Android Studio will display a pop-up saying **"APK(s) generated successfully"** with a **"locate"** link.
7. Click **"locate"** to find your `app-debug.apk`. Transfer this file to your Android phone and tap to install!

---

## 🌐 Option 3: Free Instant Online APK Builder (No Android Studio Needed)
If you don't have Android Studio installed on your computer:

1. Compress the `web/` folder into a ZIP file named `kids_game.zip`.
2. Go to a trusted free Web-to-APK builder:
   - [PWABuilder by Microsoft](https://www.pwabuilder.com/) (Enter your local URL or upload manifest)
   - [WebIntoApp](https://www.webintoapp.com/) (Upload your `web/` zip file, choose app name "Little Champions", and click "Make APK")
3. Download the generated `.apk` file directly onto your phone and install!
