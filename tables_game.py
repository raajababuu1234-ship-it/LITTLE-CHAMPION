"""
Math Tables Master Games (Ages 7 to 10):
1. Interactive Tables Explorer (Tables 1 to 20 with voice sing-along & tricks)
2. Table Balloon Pop Challenge (Floating answer balloons)
3. Missing Factor Detective (Fill in the blank puzzle)
4. 60-Second Speed Table Sprint (Timer arcade challenge with medals)
5. Division Safari Puzzles (Sharing treats & equation detective)
6. LCM Detective (Least Common Multiple with visual multiples)
7. HCF Detective (Highest Common Factor with factor clouds)
8. Multiplication Detective (Speed multiplication & factors)
"""

import tkinter as tk
import random
import time
from sound_manager import sound
from data_content import (
    get_table_data, TABLE_TIPS,
    DIVISION_PUZZLES, LCM_PUZZLES, HCF_PUZZLES, MULTIPLICATION_PUZZLES
)
from ui_components import (
    COLORS, FONTS, ConfettiEngine, FloatingBalloon,
    create_kid_button, shake_widget_red, CelebrationDialog
)


class TablesHub:
    """Manages math learning and games for children aged 7 to 10."""
    def __init__(self, parent_frame, on_star_earned, go_home_callback, app_ref=None):
        self.parent = parent_frame
        self.on_star_earned = on_star_earned
        self.go_home_callback = go_home_callback
        self.app_ref = app_ref

        self.current_table_num = 2
        self.table_range_mode = "2-10"

        # Animation & Game State
        self.animating = False
        self.balloons = []
        self.step_counter = 0
        self.confetti = None

        # Speed sprint state
        self.sprint_active = False
        self.sprint_time_left = 60
        self.sprint_score = 0
        self.sprint_streak = 0

        # Puzzle indexes
        self.div_idx = 0
        self.lcm_idx = 0
        self.hcf_idx = 0
        self.mult_idx = 0

        self._render_sub_menu()

    @property
    def kid_name(self):
        if self.app_ref and hasattr(self.app_ref, "kid_name") and self.app_ref.kid_name:
            return self.app_ref.kid_name
        return "Little Champion"

    @property
    def kid_class(self):
        if self.app_ref and hasattr(self.app_ref, "kid_class") and self.app_ref.kid_class:
            return self.app_ref.kid_class
        return "Class 2"

    def celebrate(self, puzzle_name, msg="Super job! You solved it correctly!", on_next=None):
        """Celebrate success with kid's name and victory sounds."""
        self.on_star_earned(10)
        stars_now = self.app_ref.total_stars if self.app_ref else 10
        CelebrationDialog(
            parent=self.parent.winfo_toplevel(),
            kid_name=self.kid_name,
            kid_class=self.kid_class,
            stars_count=stars_now,
            msg=msg,
            on_next=on_next
        )

    def trigger_sad(self, widget, msg="Oops! Let's try again! ❤️"):
        """Red sad effect when solution is incorrect."""
        shake_widget_red(widget, self.parent.winfo_toplevel())
        sound.speak(f"Oops {self.kid_name}! Try once more!")

    def clear_view(self):
        self.animating = False
        self.balloons = []
        self.sprint_active = False
        for widget in self.parent.winfo_children():
            widget.destroy()

    # =========================================================
    # TABLES SUB-MENU (ALL 7 MATH MODES)
    # =========================================================
    def _render_sub_menu(self):
        self.clear_view()

        # Banner Title
        title_frame = tk.Frame(self.parent, bg=COLORS["bg_main"])
        title_frame.pack(pady=(12, 10))

        lbl = tk.Label(
            title_frame, text="🚀 Math Masters Arena (पहाड़े व गणित) 🚀",
            font=FONTS["kid_title"], bg=COLORS["bg_main"], fg="#4338ca"
        )
        lbl.pack()

        sub = tk.Label(
            title_frame,
            text=f"Welcome, {self.kid_name}! Master Tables, Division, LCM, HCF & Multiplication!",
            font=FONTS["kid_sub"], bg=COLORS["bg_main"], fg="#475569"
        )
        sub.pack(pady=2)

        # Scrollable / 2-Row Grid Container
        main_cards = tk.Frame(self.parent, bg=COLORS["bg_main"])
        main_cards.pack(expand=True, fill="both", padx=20, pady=5)

        row1 = tk.Frame(main_cards, bg=COLORS["bg_main"])
        row1.pack(fill="x", pady=5)

        row2 = tk.Frame(main_cards, bg=COLORS["bg_main"])
        row2.pack(fill="x", pady=5)

        # Row 1: Tables, Division, Multiplication
        self._build_card(
            row1,
            title="📖 Tables (1-20)",
            subtitle="Audio sing-along & tricks",
            icon="✖️ 🎧",
            bg_color="#3b82f6",
            btn_text="Open Tables",
            command=self.show_table_explorer
        )

        self._build_card(
            row1,
            title="➗ Division Safari",
            subtitle="Share treats & solve equations",
            icon="➗ 🧁",
            bg_color="#0284c7",
            btn_text="Play Division",
            command=self.start_division_game
        )

        self._build_card(
            row1,
            title="✖️ Mult Detective",
            subtitle="Find the missing factor",
            icon="🔍 🧠",
            bg_color="#10b981",
            btn_text="Solve Puzzles",
            command=self.start_multiplication_puzzles
        )

        # Row 2: LCM, HCF, Balloon Pop, Speed Sprint
        self._build_card(
            row2,
            title="🔢 LCM Detective",
            subtitle="Smallest common multiple",
            icon="🔢 🌟",
            bg_color="#8b5cf6",
            btn_text="Find LCM",
            command=self.start_lcm_game
        )

        self._build_card(
            row2,
            title="🧩 HCF Detective",
            subtitle="Highest common factor",
            icon="🧩 🏆",
            bg_color="#ea580c",
            btn_text="Find HCF",
            command=self.start_hcf_game
        )

        self._build_card(
            row2,
            title="🎈 Table Balloon Pop",
            subtitle="Float & pop correct balloon",
            icon="🎯 🎈",
            bg_color="#f43f5e",
            btn_text="Pop Balloons",
            command=self.start_table_balloon_game
        )

        self._build_card(
            row2,
            title="⚡ Speed Sprint",
            subtitle="60-sec arcade challenge",
            icon="⏱️ 🏆",
            bg_color="#f59e0b",
            btn_text="Start Sprint",
            command=self.start_speed_sprint
        )

        sound.speak(f"Welcome to Math Masters, {self.kid_name}! Choose a puzzle below!")

    def _build_card(self, parent, title, subtitle, icon, bg_color, btn_text, command):
        card = tk.Frame(parent, bg="#ffffff", bd=0, highlightbackground=bg_color, highlightthickness=3, padx=10, pady=10)
        card.pack(side="left", expand=True, fill="both", padx=6, pady=4)

        tk.Label(card, text=icon, font=("Segoe UI Emoji", 28), bg="#ffffff").pack(pady=2)
        tk.Label(card, text=title, font=("Arial Rounded MT Bold", 13, "bold"), bg="#ffffff", fg="#0f172a").pack(pady=1)
        tk.Label(card, text=subtitle, font=("Comic Sans MS", 10), bg="#ffffff", fg="#64748b", wraplength=130).pack(pady=2)

        btn = create_kid_button(
            card, text=btn_text, command=command,
            bg_color=bg_color, fg_color="#ffffff", font=("Arial Rounded MT Bold", 11, "bold"), pady=4
        )
        btn.pack(side="bottom", fill="x", pady=(6, 0))

    # =========================================================
    # 1. TABLES EXPLORER & AUDIO RECITER
    # =========================================================
    def show_table_explorer(self):
        self.clear_view()

        nav_bar = tk.Frame(self.parent, bg=COLORS["bg_main"])
        nav_bar.pack(fill="x", padx=20, pady=8)

        create_kid_button(nav_bar, "⬅️ Back to Menu", self._render_sub_menu, bg_color="#64748b").pack(side="left")

        tk.Label(
            nav_bar, text="📖 Interactive Multiplication Tables (1 to 20)",
            font=FONTS["kid_title"], bg=COLORS["bg_main"], fg="#1d4ed8"
        ).pack(side="left", padx=15)

        selector_frame = tk.Frame(self.parent, bg=COLORS["bg_main"])
        selector_frame.pack(fill="x", padx=20, pady=4)

        self.table_buttons = []
        for i in range(1, 21):
            btn = tk.Button(
                selector_frame, text=str(i),
                font=("Arial Rounded MT Bold", 11, "bold"),
                width=3, height=1, bd=0, cursor="hand2",
                command=lambda n=i: self._load_table(n)
            )
            btn.pack(side="left", padx=2, pady=2)
            self.table_buttons.append(btn)

        self.table_display_frame = tk.Frame(self.parent, bg=COLORS["bg_main"])
        self.table_display_frame.pack(expand=True, fill="both", padx=20, pady=5)

        self._load_table(self.current_table_num)

    def _load_table(self, num):
        self.current_table_num = num
        for i, btn in enumerate(self.table_buttons, start=1):
            if i == num:
                btn.config(bg="#2563eb", fg="#ffffff")
            else:
                btn.config(bg="#e2e8f0", fg="#334155")

        for w in self.table_display_frame.winfo_children():
            w.destroy()

        t_data = get_table_data(num)
        trick = TABLE_TIPS.get(num, "")

        split_container = tk.Frame(self.table_display_frame, bg=COLORS["bg_main"])
        split_container.pack(expand=True, fill="both", pady=4)

        rows_box = tk.Frame(split_container, bg="#ffffff", bd=0, highlightbackground="#3b82f6", highlightthickness=2, padx=20, pady=10)
        rows_box.pack(side="left", expand=True, fill="both", padx=(0, 10))

        tk.Label(
            rows_box, text=f"✖️ Table of {num} (पहाड़ा {num} का)",
            font=FONTS["kid_heading"], bg="#ffffff", fg="#1d4ed8"
        ).pack(pady=(0, 6))

        self.row_widgets = []
        for row in t_data:
            rf = tk.Frame(rows_box, bg="#f8fafc", padx=10, pady=3, cursor="hand2")
            rf.pack(fill="x", pady=2)

            lbl = tk.Label(
                rf, text=row["display"], font=("Arial Rounded MT Bold", 14, "bold"),
                bg="#f8fafc", fg="#1e293b"
            )
            lbl.pack(side="left", padx=8)

            spk_btn = tk.Label(rf, text="🔊", font=("Segoe UI Emoji", 12), bg="#f8fafc", fg="#2563eb")
            spk_btn.pack(side="right", padx=6)

            def make_speak(s=row["spoken"], w=rf):
                return lambda e: self._speak_single_row(s, w)

            rf.bind("<Button-1>", make_speak())
            lbl.bind("<Button-1>", make_speak())
            spk_btn.bind("<Button-1>", make_speak())
            self.row_widgets.append(rf)

        # Right Drawer: Recite & Memory Trick
        right_box = tk.Frame(split_container, bg=COLORS["bg_main"], width=280)
        right_box.pack(side="right", fill="y", padx=(10, 0))

        create_kid_button(
            right_box, text="🔊 Recite Whole Table",
            command=lambda: self._recite_table(num, t_data),
            bg_color="#22c55e", font=FONTS["kid_sub"], pady=8
        ).pack(fill="x", pady=(0, 10))

        trick_card = tk.Frame(right_box, bg="#fef08a", bd=0, padx=12, pady=10)
        trick_card.pack(fill="both", expand=True)

        tk.Label(trick_card, text="💡 Magic Memory Trick", font=FONTS["kid_sub"], bg="#fef08a", fg="#854d0e").pack(anchor="w")
        tk.Label(trick_card, text=trick, font=FONTS["kid_body"], bg="#fef08a", fg="#713f12", wraplength=220, justify="left").pack(anchor="w", pady=4)

        sound.speak(f"Table of {num}")

    def _speak_single_row(self, spoken_text, widget):
        for w in self.row_widgets:
            w.config(bg="#f8fafc")
        widget.config(bg="#fde047")
        sound.speak(spoken_text)

    def _recite_table(self, num, t_data):
        def highlight_step(idx):
            if idx < len(self.row_widgets):
                for w in self.row_widgets:
                    w.config(bg="#f8fafc")
                self.row_widgets[idx].config(bg="#fde047")
                sound.speak(t_data[idx]["spoken"])
                self.parent.after(1600, lambda: highlight_step(idx + 1))
            else:
                for w in self.row_widgets:
                    w.config(bg="#f8fafc")
                sound.speak(f"Awesome recitation of table of {num}, {self.kid_name}!")

        highlight_step(0)

    # =========================================================
    # 2. DIVISION SAFARI PUZZLES
    # =========================================================
    def start_division_game(self):
        self.clear_view()

        nav_bar = tk.Frame(self.parent, bg=COLORS["bg_main"])
        nav_bar.pack(fill="x", padx=20, pady=8)

        create_kid_button(nav_bar, "⬅️ Back to Menu", self._render_sub_menu, bg_color="#64748b").pack(side="left")

        tk.Label(
            nav_bar, text="➗ Division Safari Puzzles",
            font=FONTS["kid_title"], bg=COLORS["bg_main"], fg="#0284c7"
        ).pack(side="left", padx=15)

        self._spawn_division_question()

    def _spawn_division_question(self):
        for w in self.parent.winfo_children()[1:]:
            w.destroy()

        puzzle = DIVISION_PUZZLES[self.div_idx]

        content = tk.Frame(self.parent, bg=COLORS["bg_main"])
        content.pack(expand=True, fill="both", padx=20, pady=15)

        card = tk.Frame(content, bg="#ffffff", highlightbackground="#0284c7", highlightthickness=3, padx=25, pady=20)
        card.pack(pady=10)

        tk.Label(card, text=puzzle["question"], font=FONTS["kid_giant"], bg="#ffffff", fg="#0284c7").pack()
        tk.Label(card, text=puzzle["story"], font=FONTS["kid_sub"], bg="#ffffff", fg="#475569", wraplength=480).pack(pady=8)

        # Visual items
        items_frame = tk.Frame(card, bg="#f8fafc", padx=10, pady=6)
        items_frame.pack(pady=6)
        items_str = (puzzle["item"] + " ") * puzzle["dividend"]
        tk.Label(items_frame, text=items_str, font=("Segoe UI Emoji", 20), bg="#f8fafc", wraplength=450).pack()

        sound.speak(f"{puzzle['question']}. {puzzle['story']}")

        opts_frame = tk.Frame(content, bg=COLORS["bg_main"])
        opts_frame.pack(pady=15)

        for opt in puzzle["options"]:
            self._make_choice_btn(opts_frame, opt, puzzle["quotient"], self._check_division, "#0284c7")

    def _make_choice_btn(self, parent, opt, correct_val, check_func, bg_color):
        btn = create_kid_button(
            parent, text=f"  {opt}  ",
            command=None,
            bg_color=bg_color, font=FONTS["kid_giant"], width=4
        )
        btn.config(command=lambda o=opt, b=btn: check_func(o, correct_val, b))
        btn.pack(side="left", padx=15)
        return btn

    def _check_division(self, chosen, correct, btn):
        if chosen == correct:
            self.div_idx = (self.div_idx + 1) % len(DIVISION_PUZZLES)
            self.celebrate(
                "Division Safari",
                f"Superb! Each friend gets {correct}! Brilliant math, {self.kid_name}! 🌟",
                on_next=self._spawn_division_question
            )
        else:
            self.trigger_sad(btn)

    # =========================================================
    # 3. LCM (LEAST COMMON MULTIPLE) DETECTIVE
    # =========================================================
    def start_lcm_game(self):
        self.clear_view()

        nav_bar = tk.Frame(self.parent, bg=COLORS["bg_main"])
        nav_bar.pack(fill="x", padx=20, pady=8)

        create_kid_button(nav_bar, "⬅️ Back to Menu", self._render_sub_menu, bg_color="#64748b").pack(side="left")

        tk.Label(
            nav_bar, text="🔢 LCM Detective (लघुत्तम समापवर्त्य)",
            font=FONTS["kid_title"], bg=COLORS["bg_main"], fg="#7c3aed"
        ).pack(side="left", padx=15)

        self._spawn_lcm_question()

    def _spawn_lcm_question(self):
        for w in self.parent.winfo_children()[1:]:
            w.destroy()

        puzzle = LCM_PUZZLES[self.lcm_idx]

        content = tk.Frame(self.parent, bg=COLORS["bg_main"])
        content.pack(expand=True, fill="both", padx=20, pady=10)

        card = tk.Frame(content, bg="#ffffff", highlightbackground="#8b5cf6", highlightthickness=3, padx=25, pady=15)
        card.pack(pady=10)

        tk.Label(card, text=f"Find the LCM of {puzzle['num1']} and {puzzle['num2']}",
                 font=FONTS["kid_heading"], bg="#ffffff", fg="#7c3aed").pack(pady=4)

        m1_str = ", ".join(str(x) for x in puzzle["multiples1"])
        m2_str = ", ".join(str(x) for x in puzzle["multiples2"])

        tk.Label(card, text=f"Multiples of {puzzle['num1']}:  {m1_str}",
                 font=FONTS["kid_body"], bg="#ffffff", fg="#334155").pack(anchor="w", pady=2)
        tk.Label(card, text=f"Multiples of {puzzle['num2']}:  {m2_str}",
                 font=FONTS["kid_body"], bg="#ffffff", fg="#334155").pack(anchor="w", pady=2)

        tip_lbl = tk.Label(card, text=f"💡 {puzzle['explanation']}",
                           font=("Comic Sans MS", 11, "italic"), bg="#f3e8ff", fg="#6b21a8",
                           padx=10, pady=6, wraplength=500)
        tip_lbl.pack(pady=8)

        sound.speak(f"Find the LCM of {puzzle['num1']} and {puzzle['num2']}!")

        opts_frame = tk.Frame(content, bg=COLORS["bg_main"])
        opts_frame.pack(pady=12)

        for opt in puzzle["options"]:
            self._make_choice_btn(opts_frame, opt, puzzle["answer"], self._check_lcm, "#8b5cf6")

    def _check_lcm(self, chosen, correct, btn):
        if chosen == correct:
            self.lcm_idx = (self.lcm_idx + 1) % len(LCM_PUZZLES)
            self.celebrate(
                "LCM Detective",
                f"Outstanding! LCM is {correct}! Smallest common multiple! 🌟",
                on_next=self._spawn_lcm_question
            )
        else:
            self.trigger_sad(btn)

    # =========================================================
    # 4. HCF (HIGHEST COMMON FACTOR) DETECTIVE
    # =========================================================
    def start_hcf_game(self):
        self.clear_view()

        nav_bar = tk.Frame(self.parent, bg=COLORS["bg_main"])
        nav_bar.pack(fill="x", padx=20, pady=8)

        create_kid_button(nav_bar, "⬅️ Back to Menu", self._render_sub_menu, bg_color="#64748b").pack(side="left")

        tk.Label(
            nav_bar, text="🧩 HCF Detective (महत्तम समापवर्तक)",
            font=FONTS["kid_title"], bg=COLORS["bg_main"], fg="#ea580c"
        ).pack(side="left", padx=15)

        self._spawn_hcf_question()

    def _spawn_hcf_question(self):
        for w in self.parent.winfo_children()[1:]:
            w.destroy()

        puzzle = HCF_PUZZLES[self.hcf_idx]

        content = tk.Frame(self.parent, bg=COLORS["bg_main"])
        content.pack(expand=True, fill="both", padx=20, pady=10)

        card = tk.Frame(content, bg="#ffffff", highlightbackground="#ea580c", highlightthickness=3, padx=25, pady=15)
        card.pack(pady=10)

        tk.Label(card, text=f"Find the HCF of {puzzle['num1']} and {puzzle['num2']}",
                 font=FONTS["kid_heading"], bg="#ffffff", fg="#ea580c").pack(pady=4)

        f1_str = ", ".join(str(x) for x in puzzle["factors1"])
        f2_str = ", ".join(str(x) for x in puzzle["factors2"])

        tk.Label(card, text=f"Factors of {puzzle['num1']}:  {{{f1_str}}}",
                 font=FONTS["kid_body"], bg="#ffffff", fg="#334155").pack(anchor="w", pady=2)
        tk.Label(card, text=f"Factors of {puzzle['num2']}:  {{{f2_str}}}",
                 font=FONTS["kid_body"], bg="#ffffff", fg="#334155").pack(anchor="w", pady=2)

        tip_lbl = tk.Label(card, text=f"💡 {puzzle['explanation']}",
                           font=("Comic Sans MS", 11, "italic"), bg="#ffedd5", fg="#9a3412",
                           padx=10, pady=6, wraplength=500)
        tip_lbl.pack(pady=8)

        sound.speak(f"Find the HCF of {puzzle['num1']} and {puzzle['num2']}!")

        opts_frame = tk.Frame(content, bg=COLORS["bg_main"])
        opts_frame.pack(pady=12)

        for opt in puzzle["options"]:
            self._make_choice_btn(opts_frame, opt, puzzle["answer"], self._check_hcf, "#ea580c")

    def _check_hcf(self, chosen, correct, btn):
        if chosen == correct:
            self.hcf_idx = (self.hcf_idx + 1) % len(HCF_PUZZLES)
            self.celebrate(
                "HCF Detective",
                f"Genius! HCF is {correct}! The highest common factor! 🏆",
                on_next=self._spawn_hcf_question
            )
        else:
            self.trigger_sad(btn)

    # =========================================================
    # 5. MULTIPLICATION PUZZLES & MISSING FACTORS
    # =========================================================
    def start_multiplication_puzzles(self):
        self.clear_view()

        nav_bar = tk.Frame(self.parent, bg=COLORS["bg_main"])
        nav_bar.pack(fill="x", padx=20, pady=8)

        create_kid_button(nav_bar, "⬅️ Back to Menu", self._render_sub_menu, bg_color="#64748b").pack(side="left")

        tk.Label(
            nav_bar, text="✖️ Multiplication Detective",
            font=FONTS["kid_title"], bg=COLORS["bg_main"], fg="#059669"
        ).pack(side="left", padx=15)

        self._spawn_mult_question()

    def _spawn_mult_question(self):
        for w in self.parent.winfo_children()[1:]:
            w.destroy()

        puzzle = MULTIPLICATION_PUZZLES[self.mult_idx]

        content = tk.Frame(self.parent, bg=COLORS["bg_main"])
        content.pack(expand=True, fill="both", padx=20, pady=15)

        card = tk.Frame(content, bg="#ffffff", highlightbackground="#10b981", highlightthickness=3, padx=25, pady=20)
        card.pack(pady=10)

        tk.Label(card, text=puzzle["q"], font=FONTS["kid_giant"], bg="#ffffff", fg="#059669").pack()
        tk.Label(card, text=f"💡 {puzzle['hint']}", font=FONTS["kid_sub"], bg="#ecfdf5", fg="#047857",
                 padx=12, pady=6, wraplength=480).pack(pady=10)

        sound.speak(f"{puzzle['q']}")

        opts_frame = tk.Frame(content, bg=COLORS["bg_main"])
        opts_frame.pack(pady=15)

        for opt in puzzle["options"]:
            self._make_choice_btn(opts_frame, opt, puzzle["ans"], self._check_mult, "#10b981")

    def _check_mult(self, chosen, correct, btn):
        if chosen == correct:
            self.mult_idx = (self.mult_idx + 1) % len(MULTIPLICATION_PUZZLES)
            self.celebrate(
                "Multiplication Detective",
                f"Brilliant! {correct} is correct! Math Superstar, {self.kid_name}! 🌟",
                on_next=self._spawn_mult_question
            )
        else:
            self.trigger_sad(btn)

    # =========================================================
    # 6. TABLE BALLOON POP CHALLENGE
    # =========================================================
    def start_table_balloon_game(self):
        self.clear_view()

        nav_bar = tk.Frame(self.parent, bg=COLORS["bg_main"])
        nav_bar.pack(fill="x", padx=20, pady=8)

        create_kid_button(nav_bar, "⬅️ Back to Menu", self._render_sub_menu, bg_color="#64748b").pack(side="left")

        tk.Label(
            nav_bar, text="🎈 Table Balloon Pop Challenge",
            font=FONTS["kid_title"], bg=COLORS["bg_main"], fg="#e11d48"
        ).pack(side="left", padx=15)

        range_frame = tk.Frame(nav_bar, bg=COLORS["bg_main"])
        range_frame.pack(side="right")
        tk.Label(range_frame, text="Range:", font=FONTS["kid_body"], bg=COLORS["bg_main"], fg="#475569").pack(side="left", padx=4)

        for r_name, r_code in [("2-5", "2-5"), ("6-10", "6-10"), ("11-15", "11-15"), ("All 2-20", "2-20")]:
            is_sel = (self.table_range_mode == r_code)
            btn = tk.Button(
                range_frame, text=r_name,
                font=("Arial Rounded MT Bold", 10),
                bg="#e11d48" if is_sel else "#ffffff",
                fg="#ffffff" if is_sel else "#334155",
                bd=0, padx=6, cursor="hand2",
                command=lambda c=r_code: self._set_range_and_restart(c)
            )
            btn.pack(side="left", padx=2)

        self._spawn_balloon_question()

    def _set_range_and_restart(self, r_code):
        self.table_range_mode = r_code
        self.start_table_balloon_game()

    def _spawn_balloon_question(self):
        for w in self.parent.winfo_children()[1:]:
            w.destroy()

        self.animating = False
        self.balloons = []

        if self.table_range_mode == "2-5":
            t_num = random.randint(2, 5)
        elif self.table_range_mode == "6-10":
            t_num = random.randint(6, 10)
        elif self.table_range_mode == "11-15":
            t_num = random.randint(11, 15)
        else:
            t_num = random.randint(2, 20)

        mult = random.randint(1, 10)
        correct_answer = t_num * mult

        top_info = tk.Frame(self.parent, bg=COLORS["bg_main"])
        top_info.pack(fill="x", padx=20, pady=5)

        q_banner = tk.Frame(top_info, bg="#ffffff", highlightbackground="#e11d48", highlightthickness=3, padx=20, pady=8)
        q_banner.pack(side="left")

        q_text = f"Solve:  {t_num}  ×  {mult}  =  ?"
        tk.Label(q_banner, text=q_text, font=FONTS["kid_giant"], bg="#ffffff", fg="#e11d48").pack()

        def prompt_audio():
            sound.speak(f"What is {t_num} times {mult}?")

        create_kid_button(top_info, "🔊 Repeat", prompt_audio, bg_color="#f59e0b", padx=10, pady=4).pack(side="right")

        canvas = tk.Canvas(self.parent, bg="#fff1f2", highlightthickness=0)
        canvas.pack(expand=True, fill="both", padx=20, pady=(5, 15))
        self.confetti = ConfettiEngine(canvas)

        distractors = set()
        while len(distractors) < 3:
            offset = random.choice([-t_num, t_num, -1, 1, 2, -2])
            fake = correct_answer + offset
            if fake > 0 and fake != correct_answer:
                distractors.add(fake)

        all_answers = list(distractors) + [correct_answer]
        random.shuffle(all_answers)

        positions_x = [150, 320, 490, 660]
        for i, ans in enumerate(all_answers):
            b = FloatingBalloon(
                canvas=canvas,
                text=str(ans),
                subtext="",
                value=ans,
                x=positions_x[i],
                y=380 + random.randint(0, 50),
                speed=random.uniform(1.2, 1.9)
            )
            self.balloons.append(b)

        prompt_audio()

        def on_canvas_click(event):
            for b in self.balloons:
                if b.contains(event.x, event.y):
                    sound.play_pop()
                    b.pop()
                    if b.value == correct_answer:
                        self.animating = False
                        self.celebrate(
                            "Balloon Pop",
                            f"Pop! {t_num} × {mult} = {correct_answer}! Great job, {self.kid_name}! 🎈",
                            on_next=self._spawn_balloon_question
                        )
                    else:
                        self.trigger_sad(canvas)
                    break

        canvas.bind("<Button-1>", on_canvas_click)

        self.animating = True
        self.step_counter = 0

        def balloon_loop():
            if not self.animating or not canvas.winfo_exists():
                return
            self.step_counter += 1
            for b in self.balloons:
                b.update_position(self.step_counter)
                if b.y < -60 and not b.popped:
                    b.y = (canvas.winfo_height() or 400) + 60
                    b.base_x = random.randint(120, (canvas.winfo_width() or 700) - 120)

            canvas.after(35, balloon_loop)

        balloon_loop()

    # =========================================================
    # 7. 60-SECOND SPEED SPRINT
    # =========================================================
    def start_speed_sprint(self):
        self.clear_view()

        nav_bar = tk.Frame(self.parent, bg=COLORS["bg_main"])
        nav_bar.pack(fill="x", padx=20, pady=8)

        create_kid_button(nav_bar, "⬅️ Back to Menu", self._render_sub_menu, bg_color="#64748b").pack(side="left")

        tk.Label(
            nav_bar, text="⚡ 60-Second Speed Table Sprint",
            font=FONTS["kid_title"], bg=COLORS["bg_main"], fg="#d97706"
        ).pack(side="left", padx=15)

        self.sprint_active = True
        self.sprint_time_left = 60
        self.sprint_score = 0
        self.sprint_streak = 0

        # Stats bar
        stats_frame = tk.Frame(self.parent, bg=COLORS["bg_main"])
        stats_frame.pack(fill="x", padx=20, pady=6)

        self.time_lbl = tk.Label(stats_frame, text=f"⏱️ Time: {self.sprint_time_left}s", font=FONTS["kid_heading"], bg="#fee2e2", fg="#dc2626", padx=12, pady=4)
        self.time_lbl.pack(side="left", padx=10)

        self.score_lbl = tk.Label(stats_frame, text=f"🏆 Score: {self.sprint_score}", font=FONTS["kid_heading"], bg="#fef08a", fg="#854d0e", padx=12, pady=4)
        self.score_lbl.pack(side="left", padx=10)

        self.streak_lbl = tk.Label(stats_frame, text="🔥 Streak: 0", font=FONTS["kid_heading"], bg="#e0e7ff", fg="#4338ca", padx=12, pady=4)
        self.streak_lbl.pack(side="left", padx=10)

        self.sprint_content = tk.Frame(self.parent, bg=COLORS["bg_main"])
        self.sprint_content.pack(expand=True, fill="both", padx=20, pady=10)

        self._tick_timer()
        self._spawn_sprint_problem()
        sound.speak("Ready, set, go! Beat the clock!")

    def _tick_timer(self):
        if not self.sprint_active:
            return
        self.sprint_time_left -= 1
        self.time_lbl.config(text=f"⏱️ Time: {self.sprint_time_left}s")
        if self.sprint_time_left <= 0:
            self._end_sprint()
        else:
            self.parent.after(1000, self._tick_timer)

    def _spawn_sprint_problem(self):
        if not self.sprint_active:
            return
        for w in self.sprint_content.winfo_children():
            w.destroy()

        t_num = random.randint(2, 10)
        mult = random.randint(1, 10)
        prod = t_num * mult

        card = tk.Frame(self.sprint_content, bg="#ffffff", highlightbackground="#f59e0b", highlightthickness=3, padx=30, pady=20)
        card.pack(pady=15)

        tk.Label(card, text=f"{t_num}  ×  {mult}  =  ?", font=FONTS["kid_giant"], bg="#ffffff", fg="#b45309").pack()

        distractors = set()
        while len(distractors) < 3:
            offset = random.choice([-t_num, t_num, -1, 1, 2, -2])
            fake = prod + offset
            if fake > 0 and fake != prod:
                distractors.add(fake)

        options = list(distractors) + [prod]
        random.shuffle(options)

        opts_frame = tk.Frame(self.sprint_content, bg=COLORS["bg_main"])
        opts_frame.pack(pady=10)

        for opt in options:
            btn = create_kid_button(
                opts_frame, text=f"  {opt}  ",
                command=lambda o=opt: self._check_sprint_ans(o, prod),
                bg_color="#f59e0b", font=FONTS["kid_giant"], width=4
            )
            btn.pack(side="left", padx=15)

    def _check_sprint_ans(self, chosen, correct):
        if not self.sprint_active:
            return
        if chosen == correct:
            sound.play_correct()
            self.sprint_score += 10
            self.sprint_streak += 1
            self.on_star_earned(1)
            self.score_lbl.config(text=f"🏆 Score: {self.sprint_score}")
            self.streak_lbl.config(text=f"🔥 Streak: {self.sprint_streak}")
            self._spawn_sprint_problem()
        else:
            sound.play_wrong()
            self.sprint_streak = 0
            self.streak_lbl.config(text="🔥 Streak: 0")

    def _end_sprint(self):
        self.sprint_active = False
        for w in self.sprint_content.winfo_children():
            w.destroy()

        sound.play_fanfare()

        end_card = tk.Frame(self.sprint_content, bg="#ffffff", highlightbackground="#f59e0b", highlightthickness=4, padx=30, pady=25)
        end_card.pack(pady=20)

        tk.Label(end_card, text="🏆 SPRINT FINISHED! 🏆", font=FONTS["kid_title"], bg="#ffffff", fg="#b45309").pack(pady=4)
        tk.Label(end_card, text=f"Amazing Job, {self.kid_name}!", font=FONTS["kid_heading"], bg="#ffffff", fg="#2563eb").pack(pady=2)
        tk.Label(end_card, text=f"Final Score: {self.sprint_score} Points ⭐", font=FONTS["kid_sub"], bg="#ffffff", fg="#15803d").pack(pady=6)

        create_kid_button(
            end_card, text="Play Again ⚡", command=self.start_speed_sprint,
            bg_color="#f59e0b", font=FONTS["kid_heading"], pady=8
        ).pack(fill="x", pady=(10, 4))
        create_kid_button(
            end_card, text="Back to Menu 🏠", command=self._render_sub_menu,
            bg_color="#64748b", font=FONTS["kid_sub"], pady=6
        ).pack(fill="x")

        sound.speak(f"Sprint finished! Amazing job {self.kid_name}! Final score {self.sprint_score} points!")
