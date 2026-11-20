"""
Preschool & Toddler Games (Ages 3 to 4):
1. English Alphabet Explorer, Balloon Pop & Picture Match
2. Hindi Varnamala (स्वर & व्यंजन) Explorer & "अक्षर खोजो" Game
3. Maths 1-2-3 Counting Safari (Tap-to-Count & Count Quiz)
"""

import tkinter as tk
import random
from sound_manager import sound
from data_content import ALPHABET_DATA, HINDI_SWAR, HINDI_VYANJAN, COUNTING_DATA
from ui_components import COLORS, FONTS, ConfettiEngine, FloatingBalloon, create_kid_button


class ToddlerHub:
    """Manages all learning modes and games for children aged 3 to 4."""
    def __init__(self, parent_frame, on_star_earned, go_home_callback, app_ref=None):
        self.parent = parent_frame
        self.on_star_earned = on_star_earned
        self.go_home_callback = go_home_callback
        self.app_ref = app_ref

        # Animation loop tracking
        self.animating = False
        self.balloons = []
        self.step_counter = 0

        # State trackers
        self.current_alpha_idx = 0
        self.current_hindi_list = HINDI_SWAR
        self.current_hindi_type = "swar"
        self.current_hindi_idx = 0
        self.current_count_idx = 0
        self.tap_count_progress = 0

        self.confetti = None

        self._render_sub_menu()

    @property
    def kid_name(self):
        if self.app_ref and hasattr(self.app_ref, "kid_name") and self.app_ref.kid_name:
            return self.app_ref.kid_name
        return "Little Champion"

    def clear_view(self):
        self.animating = False
        self.balloons = []
        for widget in self.parent.winfo_children():
            widget.destroy()

    # =========================================================
    # JUNIOR SUB-MENU
    # =========================================================
    def _render_sub_menu(self):
        self.clear_view()

        # Banner Title
        title_frame = tk.Frame(self.parent, bg=COLORS["bg_main"])
        title_frame.pack(pady=(20, 15))

        lbl = tk.Label(
            title_frame, text="🎈 Junior Explorers (Ages 3 - 4) 🎈",
            font=FONTS["kid_title"], bg=COLORS["bg_main"], fg="#0284c7"
        )
        lbl.pack()

        sub = tk.Label(
            title_frame, text="Learn English ABC, हिन्दी वर्णमाला & 1-2-3 Counting with Fun Games!",
            font=FONTS["kid_sub"], bg=COLORS["bg_main"], fg="#475569"
        )
        sub.pack(pady=4)

        # 3 Main Hub Cards
        cards_container = tk.Frame(self.parent, bg=COLORS["bg_main"])
        cards_container.pack(expand=True, fill="both", padx=30, pady=10)

        # Card 1: English Alphabet
        self._build_portal_card(
            cards_container,
            title="🔤 English Alphabet",
            subtitle="A to Z Letters, Phonics & Balloon Pop",
            icon="🅰️ 🍎",
            bg_color="#38bdf8",
            btn_text="Play ABC Games 🚀",
            command=self.show_alphabet_menu
        )

        # Card 2: Hindi Varnamala
        self._build_portal_card(
            cards_container,
            title="🇮🇳 हिन्दी वर्णमाला",
            subtitle="स्वर (अ से अः) और व्यंजन (क से ज्ञ)",
            icon="🕉️ 🕊️",
            bg_color="#fb923c",
            btn_text="वर्णमाला खेलें 🌸",
            command=self.show_hindi_menu
        )

        # Card 3: Maths Counting
        self._build_portal_card(
            cards_container,
            title="🔢 1-2-3 Counting",
            subtitle="Count animals, fruits & pop bubbles!",
            icon="⭐ 🎈",
            bg_color="#4ade80",
            btn_text="Play Counting Fun 🎯",
            command=self.show_counting_menu
        )

        # Voice greeting
        sound.speak("Welcome, Junior Explorer! Choose Alphabet, Hindi Varnamala, or Counting!")

    def _build_portal_card(self, parent, title, subtitle, icon, bg_color, btn_text, command):
        card = tk.Frame(parent, bg="#ffffff", bd=0, highlightbackground=bg_color, highlightthickness=3, padx=20, pady=20)
        card.pack(side="left", expand=True, fill="both", padx=15, pady=15)

        tk.Label(card, text=icon, font=("Segoe UI Emoji", 42), bg="#ffffff").pack(pady=5)
        tk.Label(card, text=title, font=FONTS["kid_heading"], bg="#ffffff", fg="#0f172a").pack(pady=4)
        tk.Label(card, text=subtitle, font=FONTS["kid_body"], bg="#ffffff", fg="#64748b", wraplength=200).pack(pady=4)

        btn = create_kid_button(
            card, text=btn_text, command=command,
            bg_color=bg_color, fg_color="#ffffff", font=FONTS["kid_sub"], pady=10
        )
        btn.pack(side="bottom", fill="x", pady=(15, 5))

    # =========================================================
    # 1. ENGLISH ALPHABET SECTION
    # =========================================================
    def show_alphabet_menu(self):
        self.clear_view()

        nav_bar = tk.Frame(self.parent, bg=COLORS["bg_main"])
        nav_bar.pack(fill="x", padx=20, pady=10)

        create_kid_button(nav_bar, "⬅️ Back to Junior Menu", self._render_sub_menu, bg_color="#64748b").pack(side="left")

        tk.Label(nav_bar, text="🔤 Alphabet Adventure", font=FONTS["kid_title"], bg=COLORS["bg_main"], fg="#0284c7").pack(side="left", padx=20)

        btn_bar = tk.Frame(nav_bar, bg=COLORS["bg_main"])
        btn_bar.pack(side="right")
        create_kid_button(btn_bar, "📖 Flashcards", self.show_alphabet_flashcard, bg_color="#38bdf8").pack(side="left", padx=5)
        create_kid_button(btn_bar, "🎈 Balloon Pop", self.start_alphabet_balloon_game, bg_color="#f43f5e").pack(side="left", padx=5)
        create_kid_button(btn_bar, "🖼️ Picture Quiz", self.start_alphabet_quiz_game, bg_color="#10b981").pack(side="left", padx=5)

        # Default start with flashcards
        self.show_alphabet_flashcard()

    def show_alphabet_flashcard(self):
        # Clear child content under nav_bar
        for w in self.parent.winfo_children()[1:]:
            w.destroy()

        item = ALPHABET_DATA[self.current_alpha_idx]

        content = tk.Frame(self.parent, bg=COLORS["bg_main"])
        content.pack(expand=True, fill="both", padx=20, pady=10)

        # Big Display Card
        card = tk.Frame(content, bg="#ffffff", bd=0, highlightbackground=item["color"], highlightthickness=4, padx=30, pady=20)
        card.pack(expand=True, pady=10)

        # Big Letter (A a)
        letter_lbl = tk.Label(
            card, text=f"{item['letter']} {item['small']}",
            font=FONTS["kid_giant"], bg="#ffffff", fg=item["color"]
        )
        letter_lbl.pack()

        # Big Emoji
        emoji_lbl = tk.Label(card, text=item["emoji"], font=("Segoe UI Emoji", 70), bg="#ffffff")
        emoji_lbl.pack(pady=4)

        # Word & Sentence
        word_lbl = tk.Label(card, text=item["word"], font=FONTS["kid_heading"], bg="#ffffff", fg="#0f172a")
        word_lbl.pack()

        sent_lbl = tk.Label(card, text=item["sentence"], font=FONTS["kid_body"], bg="#ffffff", fg="#475569")
        sent_lbl.pack(pady=6)

        # Speak Button
        def speak_current():
            sound.speak(f"{item['phonics']}. {item['sentence']}")

        create_kid_button(
            card, text="🔊 Tap to Listen", command=speak_current,
            bg_color=item["color"], font=FONTS["kid_sub"]
        ).pack(pady=10)

        # Navigation Controls
        ctrls = tk.Frame(content, bg=COLORS["bg_main"])
        ctrls.pack(pady=10)

        def prev_letter():
            self.current_alpha_idx = (self.current_alpha_idx - 1) % len(ALPHABET_DATA)
            self.show_alphabet_flashcard()

        def next_letter():
            self.current_alpha_idx = (self.current_alpha_idx + 1) % len(ALPHABET_DATA)
            self.show_alphabet_flashcard()

        def random_letter():
            self.current_alpha_idx = random.randint(0, len(ALPHABET_DATA) - 1)
            self.show_alphabet_flashcard()

        create_kid_button(ctrls, "⬅️ Previous", prev_letter, bg_color="#94a3b8").pack(side="left", padx=10)
        create_kid_button(ctrls, "🎲 Random Letter", random_letter, bg_color="#f59e0b").pack(side="left", padx=10)
        create_kid_button(ctrls, "Next ➡️", next_letter, bg_color="#22c55e").pack(side="left", padx=10)

        # Speak aloud when card opens
        speak_current()

    def start_alphabet_balloon_game(self):
        for w in self.parent.winfo_children()[1:]:
            w.destroy()

        self.animating = False
        self.balloons = []

        top_info = tk.Frame(self.parent, bg=COLORS["bg_main"])
        top_info.pack(fill="x", padx=20, pady=5)

        self.target_alpha = random.choice(ALPHABET_DATA)

        prompt_lbl = tk.Label(
            top_info,
            text=f"🎈 Pop the Balloon with Letter:  [ {self.target_alpha['letter']} ]  {self.target_alpha['emoji']}",
            font=FONTS["kid_heading"], bg=COLORS["bg_main"], fg="#dc2626"
        )
        prompt_lbl.pack(side="left")

        def prompt_audio():
            sound.speak(f"Pop the balloon with letter {self.target_alpha['letter']} for {self.target_alpha['word']}!")

        create_kid_button(top_info, "🔊 Repeat", prompt_audio, bg_color="#f59e0b", padx=10, pady=4).pack(side="right")

        # Game Canvas
        canvas = tk.Canvas(self.parent, bg="#e0f2fe", highlightthickness=0)
        canvas.pack(expand=True, fill="both", padx=20, pady=(5, 15))

        self.confetti = ConfettiEngine(canvas)

        # Spawn Balloons: 1 Target + 3 Distractors
        distractors = [d for d in ALPHABET_DATA if d["letter"] != self.target_alpha["letter"]]
        chosen = random.sample(distractors, 3) + [self.target_alpha]
        random.shuffle(chosen)

        positions_x = [150, 320, 490, 660]
        for i, item in enumerate(chosen):
            b = FloatingBalloon(
                canvas=canvas,
                text=item["letter"],
                subtext=item["emoji"],
                value=item["letter"],
                color=item["color"],
                x=positions_x[i],
                y=380 + random.randint(0, 50),
                speed=random.uniform(1.0, 1.8)
            )
            self.balloons.append(b)

        prompt_audio()

        # Canvas Click Handling
        def on_canvas_click(event):
            for b in self.balloons:
                if b.contains(event.x, event.y):
                    sound.play_pop()
                    b.pop()
                    if b.value == self.target_alpha["letter"]:
                        # Correct!
                        sound.play_correct()
                        self.confetti.burst(event.x, event.y, count=45)
                        self.on_star_earned()
                        sound.speak(f"Awesome {self.kid_name}! {self.target_alpha['letter']} for {self.target_alpha['word']}!")
                        # Load next balloon round after short celebration
                        self.parent.after(1400, self.start_alphabet_balloon_game)
                    else:
                        sound.play_wrong()
                        sound.speak(f"Oops {self.kid_name}, that was {b.value}! Try finding {self.target_alpha['letter']}!")
                    break

        canvas.bind("<Button-1>", on_canvas_click)

        # Animation Loop
        self.animating = True
        self.step_counter = 0

        def game_loop():
            if not self.animating or not canvas.winfo_exists():
                return
            self.step_counter += 1
            for b in self.balloons:
                b.update_position(self.step_counter)
                # Respawn at bottom if floats off top
                if b.y < -60 and not b.popped:
                    b.y = (canvas.winfo_height() or 400) + 60
                    b.base_x = random.randint(100, (canvas.winfo_width() or 700) - 100)

            canvas.after(35, game_loop)

        game_loop()

    def start_alphabet_quiz_game(self):
        for w in self.parent.winfo_children()[1:]:
            w.destroy()

        self.target_alpha = random.choice(ALPHABET_DATA)

        content = tk.Frame(self.parent, bg=COLORS["bg_main"])
        content.pack(expand=True, fill="both", padx=20, pady=20)

        # Big Question Header
        q_frame = tk.Frame(content, bg="#ffffff", bd=0, highlightbackground="#38bdf8", highlightthickness=3, padx=25, pady=15)
        q_frame.pack(pady=15)

        tk.Label(
            q_frame, text="Which letter starts with this picture?",
            font=FONTS["kid_heading"], bg="#ffffff", fg="#0369a1"
        ).pack()

        tk.Label(
            q_frame, text=f"{self.target_alpha['emoji']}  {self.target_alpha['word']}",
            font=("Segoe UI Emoji", 54), bg="#ffffff"
        ).pack(pady=6)

        sound.speak(f"Which letter starts with {self.target_alpha['word']}?")

        # 3 Option Cards
        distractors = [d for d in ALPHABET_DATA if d["letter"] != self.target_alpha["letter"]]
        options = random.sample(distractors, 2) + [self.target_alpha]
        random.shuffle(options)

        opts_frame = tk.Frame(content, bg=COLORS["bg_main"])
        opts_frame.pack(expand=True, pady=15)

        feedback_lbl = tk.Label(content, text="", font=FONTS["kid_sub"], bg=COLORS["bg_main"], fg="#15803d")
        feedback_lbl.pack(pady=5)

        def check_choice(selected_item):
            if selected_item["letter"] == self.target_alpha["letter"]:
                sound.play_correct()
                self.on_star_earned()
                feedback_lbl.config(text=f"🎉 Super Star! {self.target_alpha['letter']} is for {self.target_alpha['word']}!", fg="#15803d")
                sound.speak(f"Super star! {self.target_alpha['letter']} is for {self.target_alpha['word']}!")
                self.parent.after(1600, self.start_alphabet_quiz_game)
            else:
                sound.play_wrong()
                feedback_lbl.config(text=f"Try again! That's {selected_item['letter']}.", fg="#dc2626")
                sound.speak(f"Try again! That is {selected_item['letter']}.")

        for opt in options:
            btn = create_kid_button(
                opts_frame,
                text=f"  {opt['letter']}  ",
                command=lambda o=opt: check_choice(o),
                bg_color=opt["color"],
                font=FONTS["kid_giant"],
                width=4, height=1
            )
            btn.pack(side="left", padx=25)

    # =========================================================
    # 2. HINDI VARNAMALA (वर्णमाला) SECTION
    # =========================================================
    def show_hindi_menu(self):
        self.clear_view()

        nav_bar = tk.Frame(self.parent, bg=COLORS["bg_main"])
        nav_bar.pack(fill="x", padx=20, pady=10)

        create_kid_button(nav_bar, "⬅️ Back to Junior Menu", self._render_sub_menu, bg_color="#64748b").pack(side="left")

        tk.Label(nav_bar, text="🇮🇳 हिन्दी वर्णमाला (Hindi Alphabet)", font=FONTS["hindi_title"], bg=COLORS["bg_main"], fg="#c2410c").pack(side="left", padx=20)

        btn_bar = tk.Frame(nav_bar, bg=COLORS["bg_main"])
        btn_bar.pack(side="right")
        create_kid_button(btn_bar, "🍓 स्वर (Swar)", lambda: self._switch_hindi_group("swar"), bg_color="#f97316").pack(side="left", padx=4)
        create_kid_button(btn_bar, "🕊️ व्यंजन (Vyanjan)", lambda: self._switch_hindi_group("vyanjan"), bg_color="#8b5cf6").pack(side="left", padx=4)
        create_kid_button(btn_bar, "🎯 अक्षर खोजो खेल", self.start_hindi_find_game, bg_color="#10b981").pack(side="left", padx=4)

        self._switch_hindi_group("swar")

    def _switch_hindi_group(self, group_type):
        self.current_hindi_type = group_type
        self.current_hindi_list = HINDI_SWAR if group_type == "swar" else HINDI_VYANJAN
        self.current_hindi_idx = 0
        self.show_hindi_flashcard()

    def show_hindi_flashcard(self):
        for w in self.parent.winfo_children()[1:]:
            w.destroy()

        item = self.current_hindi_list[self.current_hindi_idx]
        sound.speak(f"{item.get('roman', item['phonics'])}!")

        content = tk.Frame(self.parent, bg=COLORS["bg_main"])
        content.pack(expand=True, fill="both", padx=20, pady=10)

        # Big Card
        card = tk.Frame(content, bg="#ffffff", bd=0, highlightbackground=item["color"], highlightthickness=4, padx=30, pady=15)
        card.pack(expand=True, pady=10)

        # Hindi Letter
        letter_lbl = tk.Label(
            card, text=item["letter"],
            font=FONTS["hindi_giant"], bg="#ffffff", fg=item["color"]
        )
        letter_lbl.pack()

        # Emoji
        emoji_lbl = tk.Label(card, text=item["emoji"], font=("Segoe UI Emoji", 65), bg="#ffffff")
        emoji_lbl.pack(pady=2)

        # Hindi Word
        title_text = item.get("title", f"{item['letter']} से {item['word']}")
        word_lbl = tk.Label(card, text=title_text, font=FONTS["hindi_title"], bg="#ffffff", fg="#0f172a")
        word_lbl.pack()

        # Pronunciation
        ph_lbl = tk.Label(card, text=f"({item['phonics']})", font=FONTS["kid_body"], bg="#ffffff", fg="#64748b")
        ph_lbl.pack(pady=4)

        # Speak Button
        def speak_hindi():
            sound.speak(f"{item.get('roman', item['phonics'])}!")

        create_kid_button(
            card, text="🔊 उच्चारण सुनो (Listen)", command=speak_hindi,
            bg_color=item["color"], font=FONTS["hindi_body"]
        ).pack(pady=8)

        # Nav Buttons
        ctrls = tk.Frame(content, bg=COLORS["bg_main"])
        ctrls.pack(pady=10)

        def prev_h():
            self.current_hindi_idx = (self.current_hindi_idx - 1) % len(self.current_hindi_list)
            self.show_hindi_flashcard()

        def next_h():
            self.current_hindi_idx = (self.current_hindi_idx + 1) % len(self.current_hindi_list)
            self.show_hindi_flashcard()

        def rand_h():
            self.current_hindi_idx = random.randint(0, len(self.current_hindi_list) - 1)
            self.show_hindi_flashcard()

        create_kid_button(ctrls, "⬅️ पिछला", prev_h, bg_color="#94a3b8", font=FONTS["hindi_body"]).pack(side="left", padx=10)
        create_kid_button(ctrls, "🎲 कोई भी अक्षर", rand_h, bg_color="#f59e0b", font=FONTS["hindi_body"]).pack(side="left", padx=10)
        create_kid_button(ctrls, "अगला ➡️", next_h, bg_color="#22c55e", font=FONTS["hindi_body"]).pack(side="left", padx=10)

        speak_hindi()

    def start_hindi_find_game(self):
        for w in self.parent.winfo_children()[1:]:
            w.destroy()

        pool = HINDI_SWAR + HINDI_VYANJAN
        # filter out empty ones
        pool = [p for p in pool if p["word"] != "खाली"]
        self.target_hindi = random.choice(pool)

        content = tk.Frame(self.parent, bg=COLORS["bg_main"])
        content.pack(expand=True, fill="both", padx=20, pady=15)

        q_box = tk.Frame(content, bg="#ffffff", highlightbackground="#fb923c", highlightthickness=3, padx=25, pady=15)
        q_box.pack(pady=10)

        tk.Label(
            q_box, text=f"बताओ:  {self.target_hindi['letter']}  से क्या होता है?",
            font=FONTS["hindi_title"], bg="#ffffff", fg="#c2410c"
        ).pack()

        tk.Label(
            q_box, text=f"Find:  {self.target_hindi['letter']}  ({self.target_hindi['phonics'].split(' se ')[0]})",
            font=FONTS["kid_sub"], bg="#ffffff", fg="#475569"
        ).pack(pady=3)

        def speak_prompt():
            sound.speak(f"{self.target_hindi['phonics']} kahan hai?")

        create_kid_button(q_box, "🔊 फिर से सुनो", speak_prompt, bg_color="#f97316", font=FONTS["hindi_body"]).pack(pady=5)
        speak_prompt()

        # 4 Options
        distractors = [d for d in pool if d["letter"] != self.target_hindi["letter"]]
        options = random.sample(distractors, 3) + [self.target_hindi]
        random.shuffle(options)

        opts_frame = tk.Frame(content, bg=COLORS["bg_main"])
        opts_frame.pack(expand=True, pady=15)

        feedback_lbl = tk.Label(content, text="", font=FONTS["hindi_title"], bg=COLORS["bg_main"], fg="#15803d")
        feedback_lbl.pack(pady=5)

        def pick_hindi_option(opt):
            if opt["letter"] == self.target_hindi["letter"]:
                sound.play_correct()
                self.on_star_earned()
                feedback_lbl.config(text=f"🎉 शाबाश! {self.target_hindi['letter']} से {self.target_hindi['word']} {self.target_hindi['emoji']}", fg="#15803d")
                sound.speak(f"Shabaash! {self.target_hindi['phonics']}!")
                self.parent.after(1600, self.start_hindi_find_game)
            else:
                sound.play_wrong()
                feedback_lbl.config(text=f"यह तो {opt['letter']} से {opt['word']} है। फिर से कोशिश करो!", fg="#dc2626")
                sound.speak(f"Try again! That is {opt['phonics']}.")

        for opt in options:
            card_btn = tk.Button(
                opts_frame,
                text=f"{opt['emoji']}\n{opt['word']}",
                font=FONTS["hindi_body"],
                bg="#ffffff",
                fg="#0f172a",
                activebackground="#fef08a",
                bd=0,
                highlightbackground=opt["color"],
                highlightthickness=3,
                cursor="hand2",
                width=10,
                height=4,
                command=lambda o=opt: pick_hindi_option(o)
            )
            card_btn.pack(side="left", padx=15)

    # =========================================================
    # 3. MATHS COUNTING (1 TO 20) SECTION
    # =========================================================
    def show_counting_menu(self):
        self.clear_view()

        nav_bar = tk.Frame(self.parent, bg=COLORS["bg_main"])
        nav_bar.pack(fill="x", padx=20, pady=10)

        create_kid_button(nav_bar, "⬅️ Back to Junior Menu", self._render_sub_menu, bg_color="#64748b").pack(side="left")

        tk.Label(nav_bar, text="🔢 1-2-3 Counting Safari", font=FONTS["kid_title"], bg=COLORS["bg_main"], fg="#15803d").pack(side="left", padx=20)

        btn_bar = tk.Frame(nav_bar, bg=COLORS["bg_main"])
        btn_bar.pack(side="right")
        create_kid_button(btn_bar, "👉 Tap-to-Count", self.show_counting_card, bg_color="#4ade80").pack(side="left", padx=4)
        create_kid_button(btn_bar, "🎯 How Many? Game", self.start_count_quiz_game, bg_color="#06b6d4").pack(side="left", padx=4)

        self.show_counting_card()

    def show_counting_card(self):
        for w in self.parent.winfo_children()[1:]:
            w.destroy()

        item = COUNTING_DATA[self.current_count_idx]
        self.tap_count_progress = 0

        content = tk.Frame(self.parent, bg=COLORS["bg_main"])
        content.pack(expand=True, fill="both", padx=20, pady=10)

        # Card
        card = tk.Frame(content, bg="#ffffff", highlightbackground=item["color"], highlightthickness=4, padx=25, pady=15)
        card.pack(expand=True, pady=5)

        # Big Number
        num_lbl = tk.Label(card, text=str(item["num"]), font=FONTS["kid_giant"], bg="#ffffff", fg=item["color"])
        num_lbl.pack()

        # English & Hindi Names
        name_lbl = tk.Label(
            card, text=f"{item['en']}  •  {item['hi']} {item['item_name']}",
            font=FONTS["kid_heading"], bg="#ffffff", fg="#0f172a"
        )
        name_lbl.pack(pady=2)

        instruction_lbl = tk.Label(
            card, text="👇 Tap each object below to count together! 👇",
            font=FONTS["kid_body"], bg="#ffffff", fg="#64748b"
        )
        instruction_lbl.pack(pady=4)

        # Tap-to-count items container
        items_frame = tk.Frame(card, bg="#ffffff")
        items_frame.pack(pady=10)

        tapped_counter_lbl = tk.Label(
            card, text=f"Tapped: 0 / {item['num']}",
            font=FONTS["kid_sub"], bg="#ffffff", fg="#0284c7"
        )
        tapped_counter_lbl.pack(pady=4)

        item_buttons = []

        def on_item_tap(btn, idx):
            if not getattr(btn, 'tapped', False):
                btn.tapped = True
                self.tap_count_progress += 1
                sound.play_pop()
                btn.config(bg="#fef08a", relief="sunken")
                sound.speak(str(self.tap_count_progress))
                tapped_counter_lbl.config(text=f"Tapped: {self.tap_count_progress} / {item['num']}")

                if self.tap_count_progress == item["num"]:
                    sound.play_correct()
                    self.on_star_earned()
                    tapped_counter_lbl.config(
                        text=f"🌟 Awesome! You counted all {item['num']} {item['item_name']}! 🌟",
                        fg="#15803d"
                    )
                    sound.speak(f"Awesome! That is {item['num']} {item['item_name']}! Great job!")

        # Arrange items in rows of 5 or 10
        row_f = None
        for i in range(item["num"]):
            if i % 7 == 0:
                row_f = tk.Frame(items_frame, bg="#ffffff")
                row_f.pack(pady=2)

            btn = tk.Button(
                row_f,
                text=item["emoji"],
                font=("Segoe UI Emoji", 26),
                bg="#f1f5f9",
                activebackground="#fde047",
                bd=1,
                relief="raised",
                cursor="hand2"
            )
            btn.tapped = False
            btn.config(command=lambda b=btn, idx=i: on_item_tap(b, idx))
            btn.pack(side="left", padx=4, pady=2)
            item_buttons.append(btn)

        # Controls
        ctrls = tk.Frame(content, bg=COLORS["bg_main"])
        ctrls.pack(pady=10)

        def prev_num():
            self.current_count_idx = (self.current_count_idx - 1) % len(COUNTING_DATA)
            self.show_counting_card()

        def next_num():
            self.current_count_idx = (self.current_count_idx + 1) % len(COUNTING_DATA)
            self.show_counting_card()

        create_kid_button(ctrls, "⬅️ Previous", prev_num, bg_color="#94a3b8").pack(side="left", padx=10)
        create_kid_button(ctrls, "Next Number ➡️", next_num, bg_color="#22c55e").pack(side="left", padx=10)

        sound.speak(f"Number {item['num']}, {item['en']}, {item['item_name']}!")

    def start_count_quiz_game(self):
        for w in self.parent.winfo_children()[1:]:
            w.destroy()

        # Pick random number between 1 and 10 for toddlers
        self.target_count_item = random.choice(COUNTING_DATA[:10])

        content = tk.Frame(self.parent, bg=COLORS["bg_main"])
        content.pack(expand=True, fill="both", padx=20, pady=15)

        q_box = tk.Frame(content, bg="#ffffff", highlightbackground="#06b6d4", highlightthickness=3, padx=25, pady=15)
        q_box.pack(pady=10)

        tk.Label(
            q_box,
            text=f"How many {self.target_count_item['item_name']} do you see? 👀",
            font=FONTS["kid_heading"], bg="#ffffff", fg="#0e7490"
        ).pack()

        # Display the items
        items_frame = tk.Frame(q_box, bg="#ffffff")
        items_frame.pack(pady=15)

        target_num = self.target_count_item["num"]
        for i in range(target_num):
            tk.Label(
                items_frame, text=self.target_count_item["emoji"],
                font=("Segoe UI Emoji", 34), bg="#ffffff"
            ).pack(side="left", padx=3)

        sound.speak(f"How many {self.target_count_item['item_name']} are there?")

        # 3 Number choices
        distractors = [c["num"] for c in COUNTING_DATA[:10] if c["num"] != target_num]
        options = random.sample(distractors, 2) + [target_num]
        random.shuffle(options)

        opts_frame = tk.Frame(content, bg=COLORS["bg_main"])
        opts_frame.pack(expand=True, pady=15)

        feedback_lbl = tk.Label(content, text="", font=FONTS["kid_heading"], bg=COLORS["bg_main"], fg="#15803d")
        feedback_lbl.pack(pady=5)

        def pick_count(val):
            if val == target_num:
                sound.play_correct()
                self.on_star_earned()
                feedback_lbl.config(
                    text=f"🎉 Hooray! Exactly {target_num} {self.target_count_item['item_name']}!",
                    fg="#15803d"
                )
                sound.speak(f"Hooray! Exactly {target_num} {self.target_count_item['item_name']}! You are so smart!")
                self.parent.after(1600, self.start_count_quiz_game)
            else:
                sound.play_wrong()
                feedback_lbl.config(text=f"Try again! Count carefully.", fg="#dc2626")
                sound.speak("Try again! Count carefully.")

        for num in options:
            btn = create_kid_button(
                opts_frame,
                text=f"  {num}  ",
                command=lambda n=num: pick_count(n),
                bg_color="#06b6d4",
                font=FONTS["kid_giant"],
                width=4, height=1
            )
            btn.pack(side="left", padx=20)
