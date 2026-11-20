"""
Reusable Kid-Friendly UI Components, Styles, and Canvas Visual Effects.
Includes:
- Color palette constants
- Floating animated balloons
- Confetti & star celebration burst engine
- Kid-styled buttons and cards
"""

import tkinter as tk
import random
import math
from sound_manager import sound

# -------------------------------------------------------------
# PALETTE & FONTS
# -------------------------------------------------------------
COLORS = {
    "bg_main": "#f0fdf4",          # Light mint cream
    "bg_card": "#ffffff",          # Pure white
    "bg_header": "#3b82f6",        # Friendly bright blue
    "text_dark": "#1e293b",        # Slate dark
    "text_light": "#ffffff",       # White
    "accent_yellow": "#facc15",    # Sunny yellow
    "accent_coral": "#f87171",     # Soft coral red
    "accent_green": "#4ade80",     # Cheerful green
    "accent_sky": "#38bdf8",       # Sky blue
    "accent_purple": "#c084fc",    # Fun lavender purple
    "accent_orange": "#fb923c",    # Bright orange
    "balloon_colors": [
        "#f87171", "#fb923c", "#facc15", "#4ade80",
        "#2dd4bf", "#38bdf8", "#818cf8", "#c084fc", "#f472b6"
    ]
}

FONTS = {
    "kid_title": ("Arial Rounded MT Bold", 26, "bold"),
    "kid_heading": ("Arial Rounded MT Bold", 20, "bold"),
    "kid_sub": ("Arial Rounded MT Bold", 15, "bold"),
    "kid_body": ("Comic Sans MS", 13, "bold"),
    "kid_big": ("Arial Rounded MT Bold", 36, "bold"),
    "kid_giant": ("Arial Rounded MT Bold", 58, "bold"),
    "hindi_giant": ("Nirmala UI", 58, "bold"),
    "hindi_title": ("Nirmala UI", 24, "bold"),
    "hindi_body": ("Nirmala UI", 16, "bold"),
}


# -------------------------------------------------------------
# CONFETTI & CELEBRATION PARTICLE SYSTEM
# -------------------------------------------------------------
class ConfettiEngine:
    """Spawns and animates colorful confetti particles on a Tkinter Canvas."""
    def __init__(self, canvas):
        self.canvas = canvas
        self.particles = []
        self.running = False

    def burst(self, x=None, y=None, count=45):
        """Trigger an explosion of confetti and stars."""
        width = self.canvas.winfo_width() or 800
        height = self.canvas.winfo_height() or 600

        center_x = x if x is not None else width // 2
        center_y = y if y is not None else height // 3

        shapes = ["circle", "rect", "star"]
        colors = COLORS["balloon_colors"]

        for _ in range(count):
            angle = random.uniform(0, 2 * math.pi)
            speed = random.uniform(4, 13)
            p = {
                "x": center_x,
                "y": center_y,
                "vx": math.cos(angle) * speed,
                "vy": math.sin(angle) * speed - 5,  # Upward burst
                "size": random.randint(6, 14),
                "color": random.choice(colors),
                "shape": random.choice(shapes),
                "gravity": 0.35,
                "life": random.randint(35, 60),
                "item_id": None
            }
            self.particles.append(p)

        if not self.running:
            self.running = True
            self._animate()

    def _animate(self):
        alive_particles = []
        for p in self.particles:
            if p["item_id"]:
                self.canvas.delete(p["item_id"])

            p["x"] += p["vx"]
            p["y"] += p["vy"]
            p["vy"] += p["gravity"]
            p["life"] -= 1

            if p["life"] > 0 and p["y"] < (self.canvas.winfo_height() or 800) + 20:
                alive_particles.append(p)
                s = p["size"]
                if p["shape"] == "circle":
                    p["item_id"] = self.canvas.create_oval(
                        p["x"] - s, p["y"] - s, p["x"] + s, p["y"] + s,
                        fill=p["color"], outline=""
                    )
                elif p["shape"] == "rect":
                    p["item_id"] = self.canvas.create_rectangle(
                        p["x"] - s, p["y"] - s / 2, p["x"] + s, p["y"] + s / 2,
                        fill=p["color"], outline=""
                    )
                else:
                    # Star emoji text
                    p["item_id"] = self.canvas.create_text(
                        p["x"], p["y"], text="⭐",
                        font=("Segoe UI Emoji", int(s * 1.5))
                    )

        self.particles = alive_particles
        if self.particles:
            self.canvas.after(25, self._animate)
        else:
            self.running = False


# -------------------------------------------------------------
# ANIMATED FLOATING BALLOON CLASS
# -------------------------------------------------------------
class FloatingBalloon:
    """Interactive floating balloon on a Canvas with bobbing and pop physics."""
    def __init__(self, canvas, text, subtext="", value=None, color=None, x=100, y=500, speed=1.5):
        self.canvas = canvas
        self.text = str(text)
        self.subtext = str(subtext)
        self.value = value if value is not None else text
        self.color = color or random.choice(COLORS["balloon_colors"])
        self.x = x
        self.y = y
        self.base_x = x
        self.speed = speed
        self.wobble_offset = random.uniform(0, 100)
        self.radius_x = 42
        self.radius_y = 50
        self.popped = False

        self.canvas_items = []
        self._draw()

    def _draw(self):
        # Draw balloon string
        str_id = self.canvas.create_line(
            self.x, self.y + self.radius_y,
            self.x - 3, self.y + self.radius_y + 35,
            width=2, fill="#94a3b8", smooth=True
        )
        self.canvas_items.append(str_id)

        # Draw balloon knot
        knot_id = self.canvas.create_polygon(
            self.x - 5, self.y + self.radius_y,
            self.x + 5, self.y + self.radius_y,
            self.x, self.y + self.radius_y + 8,
            fill=self.color, outline="#334155", width=1
        )
        self.canvas_items.append(knot_id)

        # Draw balloon body (egg oval)
        body_id = self.canvas.create_oval(
            self.x - self.radius_x, self.y - self.radius_y,
            self.x + self.radius_x, self.y + self.radius_y,
            fill=self.color, outline="#ffffff", width=2
        )
        self.canvas_items.append(body_id)

        # Draw shiny highlight reflection
        hi_id = self.canvas.create_oval(
            self.x - self.radius_x + 10, self.y - self.radius_y + 10,
            self.x - self.radius_x + 24, self.y - self.radius_y + 24,
            fill="#ffffff", outline=""
        )
        self.canvas_items.append(hi_id)

        # Draw center text
        # If text is Hindi character, choose Hindi font
        font = FONTS["kid_heading"]
        if any('\u0900' <= char <= '\u097F' for char in self.text):
            font = ("Nirmala UI", 22, "bold")

        txt_id = self.canvas.create_text(
            self.x, self.y - 4,
            text=self.text, font=font, fill="#ffffff"
        )
        self.canvas_items.append(txt_id)

        if self.subtext:
            sub_id = self.canvas.create_text(
                self.x, self.y + 18,
                text=self.subtext, font=("Comic Sans MS", 10, "bold"), fill="#ffffff"
            )
            self.canvas_items.append(sub_id)

    def update_position(self, step):
        if self.popped:
            return
        self.y -= self.speed
        # Horizontal swaying motion
        wobble = math.sin((step + self.wobble_offset) * 0.05) * 1.5
        self.x = self.base_x + wobble

        # Move all canvas parts
        if self.canvas.winfo_exists():
            for item in self.canvas_items:
                self.canvas.delete(item)
            self.canvas_items = []
            self._draw()

    def contains(self, px, py):
        """Check if click is inside the balloon oval."""
        if self.popped:
            return False
        dx = (px - self.x) / self.radius_x
        dy = (py - self.y) / self.radius_y
        return (dx * dx + dy * dy) <= 1.0

    def pop(self):
        """Pop balloon with burst effect."""
        self.popped = True
        for item in self.canvas_items:
            self.canvas.delete(item)
        self.canvas_items = []


# -------------------------------------------------------------
# HELPER: KID BUTTON
# -------------------------------------------------------------
def create_kid_button(parent, text, command, bg_color="#38bdf8", fg_color="#ffffff",
                      font=None, width=None, height=None, padx=16, pady=8):
    """Generates a soft, colorful, kid-friendly Tkinter button with hover highlight."""
    if font is None:
        font = FONTS["kid_sub"]

    btn = tk.Button(
        parent,
        text=text,
        command=lambda: (_play_click_and_call(command)),
        font=font,
        bg=bg_color,
        fg=fg_color,
        activebackground=_lighten_color(bg_color),
        activeforeground=fg_color,
        relief="flat",
        cursor="hand2",
        bd=0,
        padx=padx,
        pady=pady
    )
    if width:
        btn.config(width=width)
    if height:
        btn.config(height=height)

    # Hover animations
    def on_enter(e):
        btn.config(bg=_lighten_color(bg_color))
    def on_leave(e):
        btn.config(bg=bg_color)

    btn.bind("<Enter>", on_enter)
    btn.bind("<Leave>", on_leave)
    return btn


def _play_click_and_call(command):
    sound.play_click()
    if command:
        command()


def _lighten_color(hex_color):
    """Generates a slightly lighter tone for smooth button hover."""
    try:
        hex_color = hex_color.lstrip('#')
        r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        r = min(255, int(r + (255 - r) * 0.25))
        g = min(255, int(g + (255 - g) * 0.25))
        b = min(255, int(b + (255 - b) * 0.25))
        return f"#{r:02x}{g:02x}{b:02x}"
    except Exception:
        return hex_color


# -------------------------------------------------------------
# CELEBRATION MODAL WITH KID'S NAME & SAD RED EFFECT
# -------------------------------------------------------------
def shake_widget_red(widget, root, original_bg=None, custom_msg="Oops! Try again! ❤️"):
    """Visual red sad effect with gentle shake animation."""
    sound.play_wrong()
    if original_bg is None:
        try:
            original_bg = widget.cget("bg")
        except Exception:
            original_bg = "#ffffff"

    try:
        widget.config(bg="#fee2e2")
    except Exception:
        pass

    root.after(800, lambda: _restore_bg(widget, original_bg))


def _restore_bg(widget, bg):
    try:
        widget.config(bg=bg)
    except Exception:
        pass


class CelebrationDialog(tk.Toplevel):
    """Kid celebration modal popup with child's name, class, and fanfare."""
    def __init__(self, parent, kid_name, kid_class, stars_count, msg="Super Duper! You got it right!", on_next=None):
        super().__init__(parent)
        self.title("🎉 SUPER CHAMPION! 🎉")
        self.geometry("480x420")
        self.resizable(False, False)
        self.configure(bg="#ffffff")
        self.transient(parent)
        self.grab_set()

        self.update_idletasks()
        try:
            px = parent.winfo_rootx() + (parent.winfo_width() // 2) - 240
            py = parent.winfo_rooty() + (parent.winfo_height() // 2) - 210
            self.geometry(f"+{max(0, px)}+{max(0, py)}")
        except Exception:
            pass

        self.on_next = on_next

        sound.play_correct()
        sound.play_fanfare()
        sound.speak(f"Awesome job, {kid_name}! You are a superstar!")

        trophy_lbl = tk.Label(self, text="🏆", font=("Segoe UI Emoji", 48), bg="#ffffff")
        trophy_lbl.pack(pady=(16, 0))

        title_lbl = tk.Label(self, text="🎉 WOO-HOO! AMAZING JOB! 🎉",
                             font=("Arial Rounded MT Bold", 16, "bold"), fg="#1e293b", bg="#ffffff")
        title_lbl.pack(pady=(6, 2))

        name_lbl = tk.Label(self, text=kid_name,
                            font=("Arial Rounded MT Bold", 24, "bold"), fg="#2563eb", bg="#ffffff")
        name_lbl.pack()

        class_lbl = tk.Label(self, text=f"🌟 {kid_class} Superstar! 🌟",
                             font=("Arial Rounded MT Bold", 12, "bold"), fg="#059669", bg="#d1fae5",
                             padx=12, pady=4)
        class_lbl.pack(pady=8)

        msg_lbl = tk.Label(self, text=msg,
                           font=("Comic Sans MS", 12), fg="#475569", bg="#ffffff",
                           wraplength=420)
        msg_lbl.pack(pady=6)

        stars_lbl = tk.Label(self, text=f"⭐ +10 Stars Earned! Total: {stars_count} ⭐",
                             font=("Arial Rounded MT Bold", 13, "bold"), fg="#854d0e", bg="#fef08a",
                             padx=14, pady=6)
        stars_lbl.pack(pady=10)

        next_btn = tk.Button(self, text="Next Challenge 🚀", font=("Arial Rounded MT Bold", 14, "bold"),
                             bg="#10b981", fg="#ffffff", activebackground="#059669", activeforeground="#ffffff",
                             bd=0, padx=24, pady=10, cursor="hand2", command=self._on_close)
        next_btn.pack(pady=12)

    def _on_close(self):
        self.destroy()
        if self.on_next:
            self.on_next()
