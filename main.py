"""
Little Champions: Kids Fun Learn & Play Game (छोटे उस्ताद)
Main Application Entry Point.
Dual Age Modes & Math Masters:
- Ages 3 to 4: English Alphabet, Hindi Varnamala, Maths Counting
- Ages 7 to 10: Tables 1-20, Division, Multiplication, LCM, HCF, Balloon Pop, Speed Sprint
"""

import tkinter as tk
from tkinter import ttk
import json
import os
import sys
import socket
import threading
import subprocess
from pathlib import Path

from sound_manager import sound
from ui_components import (
    COLORS, FONTS, create_kid_button,
    CelebrationDialog, shake_widget_red
)
from toddler_games import ToddlerHub
from tables_game import TablesHub

PROFILE_FILE = Path(__file__).resolve().parent / "kid_profile.json"


def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        try:
            ip = socket.gethostbyname(socket.gethostname())
        except Exception:
            ip = "127.0.0.1"
    finally:
        s.close()
    return ip


class ProfileDialog(tk.Toplevel):
    """Startup dialog asking for child's name, class, and avatar."""
    def __init__(self, parent, current_profile, on_save):
        super().__init__(parent)
        self.title("🌟 Welcome Little Champion! 🌟")
        self.geometry("450x420")
        self.resizable(False, False)
        self.configure(bg="#ffffff")
        self.transient(parent)
        self.grab_set()

        self.on_save = on_save
        self.selected_avatar = tk.StringVar(value=current_profile.get("avatar", "🦁"))

        # Center on screen
        self.update_idletasks()
        try:
            px = parent.winfo_rootx() + (parent.winfo_width() // 2) - 225
            py = parent.winfo_rooty() + (parent.winfo_height() // 2) - 210
            self.geometry(f"+{max(0, px)}+{max(0, py)}")
        except Exception:
            pass

        tk.Label(self, text="🌟", font=("Segoe UI Emoji", 36), bg="#ffffff").pack(pady=(12, 0))
        tk.Label(self, text="Welcome Little Champion!", font=("Arial Rounded MT Bold", 18, "bold"),
                 fg="#0f172a", bg="#ffffff").pack()
        tk.Label(self, text="Tell us your name & class so we can cheer for you!",
                 font=("Comic Sans MS", 11), fg="#64748b", bg="#ffffff").pack(pady=(0, 10))

        # Avatar picker
        tk.Label(self, text="Choose Your Mascot:", font=("Arial Rounded MT Bold", 11, "bold"),
                 fg="#334155", bg="#ffffff").pack()

        avatar_frame = tk.Frame(self, bg="#ffffff")
        avatar_frame.pack(pady=6)

        avatars = ["🦁", "🚀", "🐱", "🦄", "🐼", "👑"]
        self.avatar_btns = {}
        for a in avatars:
            b = tk.Button(
                avatar_frame, text=a, font=("Segoe UI Emoji", 20),
                bd=2, relief="solid", cursor="hand2", width=2, height=1,
                command=lambda val=a: self._select_avatar(val)
            )
            b.pack(side="left", padx=4)
            self.avatar_btns[a] = b
        self._highlight_selected_avatar()

        # Name Input
        form = tk.Frame(self, bg="#ffffff", padx=20)
        form.pack(fill="x", pady=8)

        tk.Label(form, text="Child's Name:", font=("Arial Rounded MT Bold", 11, "bold"),
                 fg="#334155", bg="#ffffff").pack(anchor="w")
        self.name_entry = tk.Entry(form, font=("Arial Rounded MT Bold", 14), bg="#f8fafc", bd=2, relief="solid")
        self.name_entry.pack(fill="x", pady=(2, 10))
        self.name_entry.insert(0, current_profile.get("name", ""))
        self.name_entry.focus_set()

        # Class Selector
        tk.Label(form, text="Class / Grade:", font=("Arial Rounded MT Bold", 11, "bold"),
                 fg="#334155", bg="#ffffff").pack(anchor="w")

        self.class_cb = ttk.Combobox(
            form, font=("Arial Rounded MT Bold", 12), state="readonly",
            values=[
                "Nursery / Preschool",
                "LKG / Junior KG",
                "UKG / Senior KG",
                "Class 1",
                "Class 2",
                "Class 3",
                "Class 4",
                "Class 5"
            ]
        )
        self.class_cb.pack(fill="x", pady=(2, 12))
        current_cls = current_profile.get("class", "Class 2")
        self.class_cb.set(current_cls if current_cls else "Class 2")

        # Submit button
        submit_btn = tk.Button(
            self, text="Let's Play & Learn! 🚀", font=("Arial Rounded MT Bold", 14, "bold"),
            bg="#2563eb", fg="#ffffff", activebackground="#1d4ed8", activeforeground="#ffffff",
            bd=0, padx=20, pady=10, cursor="hand2", command=self._submit
        )
        submit_btn.pack(fill="x", padx=40, pady=6)

        sound.speak("What is your name, Little Champion?")

    def _select_avatar(self, val):
        sound.play_click()
        self.selected_avatar.set(val)
        self._highlight_selected_avatar()

    def _highlight_selected_avatar(self):
        cur = self.selected_avatar.get()
        for a, b in self.avatar_btns.items():
            if a == cur:
                b.config(bg="#eff6ff", highlightcolor="#2563eb")
            else:
                b.config(bg="#ffffff")

    def _submit(self):
        name = self.name_entry.get().strip() or "Champion"
        grade = self.class_cb.get() or "Class 2"
        avatar = self.selected_avatar.get() or "🦁"

        self.on_save(name, grade, avatar)
        self.destroy()


class PhoneConnectDialog(tk.Toplevel):
    """Shows the local phone connection URL and QR code."""
    def __init__(self, parent):
        super().__init__(parent)
        self.title("📱 Play on Your Phone!")
        self.geometry("440x480")
        self.resizable(False, False)
        self.configure(bg="#ffffff")
        self.transient(parent)

        # Center on screen
        self.update_idletasks()
        try:
            px = parent.winfo_rootx() + (parent.winfo_width() // 2) - 220
            py = parent.winfo_rooty() + (parent.winfo_height() // 2) - 240
            self.geometry(f"+{max(0, px)}+{max(0, py)}")
        except Exception:
            pass

        ip = get_local_ip()
        phone_url = f"http://{ip}:8000"

        tk.Label(self, text="📱", font=("Segoe UI Emoji", 36), bg="#ffffff").pack(pady=(10, 0))
        tk.Label(self, text="Play on Your Mobile Phone!", font=("Arial Rounded MT Bold", 16, "bold"),
                 fg="#0f172a", bg="#ffffff").pack()
        tk.Label(self, text="Scan this QR code with your phone camera:", font=("Comic Sans MS", 10),
                 fg="#64748b", bg="#ffffff").pack(pady=(2, 6))

        # QR Image
        qr_path = Path(__file__).resolve().parent / "web" / "phone_qr.png"
        self.qr_img = None
        if qr_path.exists():
            try:
                self.qr_img = tk.PhotoImage(file=str(qr_path)).subsample(2, 2)
                qr_lbl = tk.Label(self, image=self.qr_img, bg="#ffffff", bd=2, relief="solid")
                qr_lbl.pack(pady=4)
            except Exception as e:
                print("QR display note:", e)

        tk.Label(self, text="Or open this link in your phone's browser:", font=("Arial Rounded MT Bold", 10),
                 fg="#475569", bg="#ffffff").pack(pady=(6, 2))

        url_lbl = tk.Label(self, text=phone_url, font=("Arial Rounded MT Bold", 13, "bold"),
                           fg="#2563eb", bg="#eff6ff", padx=10, pady=4, relief="solid", bd=1)
        url_lbl.pack(pady=2)

        tk.Label(self, text="(Make sure your phone is connected to the same Wi-Fi!)",
                 font=("Comic Sans MS", 9), fg="#94a3b8", bg="#ffffff").pack(pady=4)

        close_btn = tk.Button(self, text="Got It! 👍", font=("Arial Rounded MT Bold", 12, "bold"),
                              bg="#3b82f6", fg="#ffffff", bd=0, padx=20, pady=6, cursor="hand2",
                              command=self.destroy)
        close_btn.pack(pady=8)


class KidsLearningApp:
    def __init__(self, root):
        self.root = root
        self.root.title("🌟 Little Champions: Play & Learn (छोटे उस्ताद)")
        self.root.geometry("1080x760")
        self.root.minsize(980, 680)
        self.root.configure(bg=COLORS["bg_main"])

        # Player Profile & Progress
        self.kid_name = "Champion"
        self.kid_class = "Class 2"
        self.kid_avatar = "🦁"
        self.total_stars = 0

        self.load_profile()

        # Build Global Persistent Header
        self._build_header()

        # Dynamic Content Container Frame
        self.container = tk.Frame(self.root, bg=COLORS["bg_main"])
        self.container.pack(expand=True, fill="both")

        # Active module handler
        self.current_hub = None

        # Start on Main Home Screen
        self.show_home_screen()

        # Ask child profile on startup if first time or default
        if self.kid_name == "Champion":
            self.root.after(300, self.open_profile_dialog)
        else:
            self.root.after(500, lambda: sound.speak(f"Welcome back, {self.kid_name}! Let's play and learn!"))

        # Start background server for phone access
        self.start_phone_server_thread()

    def load_profile(self):
        if PROFILE_FILE.exists():
            try:
                with open(PROFILE_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.kid_name = data.get("name", "Champion")
                    self.kid_class = data.get("class", "Class 2")
                    self.kid_avatar = data.get("avatar", "🦁")
                    self.total_stars = data.get("stars", 0)
            except Exception:
                pass

    def save_profile(self):
        try:
            with open(PROFILE_FILE, "w", encoding="utf-8") as f:
                json.dump({
                    "name": self.kid_name,
                    "class": self.kid_class,
                    "avatar": self.kid_avatar,
                    "stars": self.total_stars
                }, f, indent=2)
        except Exception:
            pass

    def open_profile_dialog(self):
        ProfileDialog(
            parent=self.root,
            current_profile={"name": self.kid_name, "class": self.kid_class, "avatar": self.kid_avatar},
            on_save=self.update_profile
        )

    def update_profile(self, name, grade, avatar):
        self.kid_name = name
        self.kid_class = grade
        self.kid_avatar = avatar
        self.save_profile()
        self.profile_btn.config(text=f"{self.kid_avatar} {self.kid_name} ({self.kid_class})")
        sound.speak(f"Welcome {self.kid_name} from {self.kid_class}! Let's learn and play together!")

    def start_phone_server_thread(self):
        def _run():
            try:
                server_script = Path(__file__).resolve().parent / "server.py"
                if server_script.exists():
                    subprocess.Popen(
                        [sys.executable, str(server_script)],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                        creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
                    )
            except Exception as e:
                print("Server start note:", e)

        t = threading.Thread(target=_run, daemon=True)
        t.start()

    def show_phone_dialog(self):
        sound.play_click()
        PhoneConnectDialog(self.root)

    def _build_header(self):
        self.header_frame = tk.Frame(self.root, bg=COLORS["bg_header"], height=70, padx=16, pady=8)
        self.header_frame.pack(fill="x", side="top")

        # App Logo & Title
        title_box = tk.Frame(self.header_frame, bg=COLORS["bg_header"])
        title_box.pack(side="left")

        logo_lbl = tk.Label(title_box, text="🌟", font=("Segoe UI Emoji", 26), bg=COLORS["bg_header"])
        logo_lbl.pack(side="left", padx=(0, 6))

        app_title = tk.Label(
            title_box, text="Little Champions • छोटे उस्ताद",
            font=FONTS["kid_heading"], bg=COLORS["bg_header"], fg="#ffffff"
        )
        app_title.pack(side="left")

        # Right Controls: Kid Profile, Stars, Phone, Sound, Home
        ctrls_box = tk.Frame(self.header_frame, bg=COLORS["bg_header"])
        ctrls_box.pack(side="right")

        # Kid Profile Button (Click to change name/class)
        self.profile_btn = tk.Button(
            ctrls_box, text=f"{self.kid_avatar} {self.kid_name} ({self.kid_class})",
            font=("Arial Rounded MT Bold", 11, "bold"),
            bg="#f1f5f9", fg="#1e293b", activebackground="#e2e8f0", activeforeground="#0f172a",
            bd=0, padx=10, pady=5, cursor="hand2", command=self.open_profile_dialog
        )
        self.profile_btn.pack(side="left", padx=6)

        # Star Counter Badge
        self.star_badge = tk.Frame(ctrls_box, bg="#facc15", bd=0, padx=10, pady=4)
        self.star_badge.pack(side="left", padx=6)

        self.star_lbl = tk.Label(
            self.star_badge, text=f"⭐ {self.total_stars}",
            font=FONTS["kid_sub"], bg="#facc15", fg="#1e293b"
        )
        self.star_lbl.pack()

        # Phone Connect Button
        phone_btn = tk.Button(
            ctrls_box, text="📱 Phone", font=FONTS["kid_body"],
            bg="#0284c7", fg="#ffffff", activebackground="#0369a1", activeforeground="#ffffff",
            bd=0, padx=10, pady=5, cursor="hand2", command=self.show_phone_dialog
        )
        phone_btn.pack(side="left", padx=6)

        # Sound Toggle Button
        self.sound_btn = tk.Button(
            ctrls_box, text="🔊 Sound", font=FONTS["kid_body"],
            bg="#2563eb", fg="#ffffff", activebackground="#1d4ed8", activeforeground="#ffffff",
            bd=0, padx=10, pady=5, cursor="hand2", command=self.toggle_sound
        )
        self.sound_btn.pack(side="left", padx=6)

        # Home Button
        home_btn = tk.Button(
            ctrls_box, text="🏠 Home", font=FONTS["kid_body"],
            bg="#059669", fg="#ffffff", activebackground="#047857", activeforeground="#ffffff",
            bd=0, padx=12, pady=5, cursor="hand2", command=self.show_home_screen
        )
        home_btn.pack(side="left", padx=6)

    def toggle_sound(self):
        is_muted = sound.toggle_mute()
        if is_muted:
            self.sound_btn.config(text="🔇 Muted", bg="#64748b")
        else:
            self.sound_btn.config(text="🔊 Sound", bg="#2563eb")
            sound.play_click()

    def add_star(self, count=1):
        self.total_stars += count
        self.star_lbl.config(text=f"⭐ {self.total_stars}")
        self.save_profile()
        sound.play_star()

        def pulse(step):
            if step == 0:
                self.star_badge.config(bg="#fef08a")
                self.root.after(100, lambda: pulse(1))
            else:
                self.star_badge.config(bg="#facc15")

        pulse(0)

    def celebrate_success(self, puzzle_name, msg="Super Duper! You got it right!", on_next=None):
        self.add_star(10)
        CelebrationDialog(
            parent=self.root,
            kid_name=self.kid_name,
            kid_class=self.kid_class,
            stars_count=self.total_stars,
            msg=msg,
            on_next=on_next
        )

    def trigger_sad_effect(self, widget, msg="Oops! Let's try again! ❤️"):
        shake_widget_red(widget, self.root)
        sound.speak(f"Oops {self.kid_name}! Don't worry, try once more!")

    def clear_container(self):
        for widget in self.container.winfo_children():
            widget.destroy()

    # =========================================================
    # WELCOME / HOME SCREEN
    # =========================================================
    def show_home_screen(self):
        self.clear_container()

        hero = tk.Frame(self.container, bg=COLORS["bg_main"])
        hero.pack(pady=(20, 10))

        welcome_lbl = tk.Label(
            hero, text=f"🎉 Welcome, {self.kid_name}! 🎉",
            font=FONTS["kid_giant"], bg=COLORS["bg_main"], fg="#0369a1"
        )
        welcome_lbl.pack()

        hindi_greet = tk.Label(
            hero, text=f"{self.kid_avatar} Class {self.kid_class} Superstar • खेल-खेल में सीखें!",
            font=FONTS["hindi_title"], bg=COLORS["bg_main"], fg="#ea580c"
        )
        hindi_greet.pack(pady=4)

        choose_lbl = tk.Label(
            hero, text="Choose your adventure below or play on your mobile phone! 👇",
            font=FONTS["kid_sub"], bg=COLORS["bg_main"], fg="#475569"
        )
        choose_lbl.pack(pady=4)

        # Dual Age Portals
        portals_frame = tk.Frame(self.container, bg=COLORS["bg_main"])
        portals_frame.pack(expand=True, fill="both", padx=30, pady=(8, 16))

        # Portal 1: Ages 3 to 4
        portal_34 = tk.Frame(portals_frame, bg="#ffffff", bd=0, highlightbackground="#38bdf8", highlightthickness=4, padx=20, pady=20)
        portal_34.pack(side="left", expand=True, fill="both", padx=12, pady=8)

        tk.Label(portal_34, text="🎈 🐣 🎨", font=("Segoe UI Emoji", 38), bg="#ffffff").pack()
        tk.Label(portal_34, text="Ages 3 to 4 Years", font=FONTS["kid_title"], bg="#ffffff", fg="#0284c7").pack(pady=2)
        tk.Label(portal_34, text="Junior Explorers • नन्हे उस्ताद", font=FONTS["hindi_body"], bg="#ffffff", fg="#64748b").pack()

        bullet_frame1 = tk.Frame(portal_34, bg="#ffffff")
        bullet_frame1.pack(expand=True, pady=10)

        bullets_1 = [
            "🔤 English Alphabet A-Z (Phonics & Flashcards)",
            "🇮🇳 हिन्दी वर्णमाला (स्वर अ से अः व व्यंजन क से ज्ञ)",
            "🔢 1-2-3 Counting Safari (Tap & Count Objects)",
            "🎈 Pop the Letter & Number Balloon Games"
        ]
        for b in bullets_1:
            tk.Label(bullet_frame1, text=b, font=FONTS["kid_body"], bg="#ffffff", fg="#334155", anchor="w").pack(fill="x", pady=3)

        btn_toddler = create_kid_button(
            portal_34, text="Enter Junior Land (3-4 Yrs) 🚀",
            command=self.open_toddler_hub, bg_color="#0284c7", fg_color="#ffffff",
            font=FONTS["kid_heading"], pady=10
        )
        btn_toddler.pack(side="bottom", fill="x", pady=(8, 0))

        # Portal 2: Ages 7 to 10
        portal_78 = tk.Frame(portals_frame, bg="#ffffff", bd=0, highlightbackground="#7c3aed", highlightthickness=4, padx=20, pady=20)
        portal_78.pack(side="right", expand=True, fill="both", padx=12, pady=8)

        tk.Label(portal_78, text="🚀 ➗ 🏆", font=("Segoe UI Emoji", 38), bg="#ffffff").pack()
        tk.Label(portal_78, text="Ages 7 to 10+ Years", font=FONTS["kid_title"], bg="#ffffff", fg="#6b21a8").pack(pady=2)
        tk.Label(portal_78, text="Math Masters • पहाड़े व गणित चैम्पियन", font=FONTS["hindi_body"], bg="#ffffff", fg="#64748b").pack()

        bullet_frame2 = tk.Frame(portal_78, bg="#ffffff")
        bullet_frame2.pack(expand=True, pady=10)

        bullets_2 = [
            "✖️ Tables Explorer 1-20 (Voice & Mental Math Tricks)",
            "➗ Division Safari Puzzles (Sharing & Equations)",
            "🔢 LCM (Least Common Multiple) Detective",
            "🧩 HCF (Highest Common Factor) Detective",
            "🎈 Balloon Pop Arcade & 60-Sec Speed Sprint!"
        ]
        for b in bullets_2:
            tk.Label(bullet_frame2, text=b, font=FONTS["kid_body"], bg="#ffffff", fg="#334155", anchor="w").pack(fill="x", pady=3)

        btn_tables = create_kid_button(
            portal_78, text="Enter Math Arena (7-10 Yrs) 🏆",
            command=self.open_tables_hub, bg_color="#7c3aed", fg_color="#ffffff",
            font=FONTS["kid_heading"], pady=10
        )
        btn_tables.pack(side="bottom", fill="x", pady=(8, 0))

    def open_toddler_hub(self):
        self.clear_container()
        self.current_hub = ToddlerHub(
            parent_frame=self.container,
            on_star_earned=self.add_star,
            go_home_callback=self.show_home_screen,
            app_ref=self
        )

    def open_tables_hub(self):
        self.clear_container()
        self.current_hub = TablesHub(
            parent_frame=self.container,
            on_star_earned=self.add_star,
            go_home_callback=self.show_home_screen,
            app_ref=self
        )


def main():
    root = tk.Tk()
    app = KidsLearningApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
