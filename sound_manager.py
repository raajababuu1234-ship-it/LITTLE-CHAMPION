
HINDI_SAPI_MAP = {
    "छोटा अ से अनार": "Chhotaa aa say uh-naar", "अ से अनार": "Chhotaa aa say uh-naar",
    "बड़ा आ से आम": "Badaa aa say aam", "आ से आम": "Badaa aa say aam",
    "छोटी इ से इमली": "Chhoti ee say imlee", "इ से इमली": "Chhoti ee say imlee",
    "बड़ी ई से ईख": "Badi ee say eekh", "ई से ईख": "Badi ee say eekh",
    "छोटा उ से उल्लू": "Chhotaa oo say ool-loo", "उ से उल्लू": "Chhotaa oo say ool-loo",
    "बड़ा ऊ से ऊन": "Badaa oo say oon", "ऊ से ऊन": "Badaa oo say oon",
    "ऋ से ऋषि": "Ri say rishee",
    "छोटा ए से एड़ी": "Chhotaa ay say ay-dee", "ए से एड़ी": "Chhotaa ay say ay-dee", "ए से एड़ी": "Chhotaa ay say ay-dee",
    "बड़ा ऐ से ऐनक": "Badaa eye say eye-nuck", "ऐ से ऐनक": "Badaa eye say eye-nuck",
    "छोटा ओ से ओखली": "Chhotaa oh say oakh-lee", "ओ से ओखली": "Chhotaa oh say oakh-lee",
    "बड़ा औ से औरत": "Badaa aww say aw-rut", "औ से औरत": "Badaa aww say aw-rut",
    "अं से अंगूर": "Ung say ungoor",
    "अः खाली": "Aha khaalee, bachho bajao taalee!",
    "क से कबूतर": "Kuh say kabootar", "ख से खरगोश": "Khuh say khargosh", "ग से गमला": "Guh say gumlaa",
    "घ से घड़ी": "Ghuh say ghadee", "ङ खाली": "Ung-a khaalee", "च से चम्मच": "Chuh say chummuch",
    "छ से छाता": "Chhuh say chhaataa", "ज से जहाज": "Juh say jahaaz", "झ से झंडा": "Jhuh say jhundaa",
    "ञ खाली": "Nya khaalee", "ट से टमाटर": "Tuh say tamaatur", "ठ से ठठेरा": "Thuh say thathayraa",
    "ड से डमरू": "Duh say dumroo", "ढ से ढोलक": "Dhuh say dholuk", "ण खाली": "Ana khaalee",
    "त से तोता": "Tuh say tota", "त से तरबूज": "Tuh say tarbooj", "थ से थाली": "Thuh say thaalee",
    "द से दवात": "Duh say duwaat", "ध से धनुष": "Dhuh say dhunush", "न से नल": "Nuh say nul",
    "प से पतंग": "Puh say putung", "फ से फल": "Fuh say ful", "ब से बत्तख": "Buh say but-tukh",
    "ब से बकरी": "Buh say bukree", "भ से भालू": "Bhuh say bhaaloo", "म से मछली": "Muh say muchhlee",
    "य से यज्ञ": "Yuh say yugya", "र से रथ": "Ruh say ruth", "ल से लट्टू": "Luh say lut-too",
    "व से वक": "Vuh say vuk", "व से वक़": "Vuh say vuk", "श से शलजम": "Shuh say shuljum",
    "ष से षटकोण": "Shuh say shut-kon", "स से सेब": "Suh say sayb", "ह से हाथी": "Huh say haathee",
    "क्ष से क्षत्रिय": "Kshuh say kshutreeya", "त्र से त्रिशूल": "Truh say trishool", "ज्ञ से ज्ञानी": "Gyuh say gyaanee",
    "दो एकम दो": "Do ekam do", "दो दूनी चार": "Do doonee chaar", "दो तिया छह": "Do tiya chhah",
    "दो चौके आठ": "Do chauke aath", "दो पंजे दस": "Do panje das", "दो छक्के बारह": "Do chhakke baarah",
    "दो सत्ते चौदह": "Do satte chaudah", "दो अठे सोलह": "Do atthe solah", "दो निम्मे अठारह": "Do nimme athaarah",
    "दो धाम बीस": "Do dhaam bees"
}

def clean_hindi_for_sapi(text):
    if not text:
        return ""
    # Check if text contains Devanagari Unicode
    has_devanagari = any(0x0900 <= ord(c) <= 0x097F for c in text)
    if not has_devanagari:
        return text
    clean = text.strip()
    for k, v in HINDI_SAPI_MAP.items():
        if k in clean:
            clean = clean.replace(k, v)
    return clean
"""
Sound and Voice Manager for Kids Learning Game.
Handles speech synthesis (pyttsx3 with Windows SAPI SpVoice persistent fallback)
and retro musical chimes (winsound) asynchronously.
"""

import threading
import queue
import time
import os
import sys
import subprocess

try:
    import winsound
    HAS_WINSOUND = True
except Exception:
    HAS_WINSOUND = False

try:
    import pyttsx3
    HAS_PYTTSX3 = True
except Exception:
    HAS_PYTTSX3 = False


class WindowsSapiWorker:
    """Persistent PowerShell SAPI speech worker for zero-latency speech when pyttsx3 lacks COM."""
    def __init__(self):
        self.process = None
        self.lock = threading.Lock()
        self._start_worker()

    def _start_worker(self):
        try:
            cmd = [
                "powershell", "-NoProfile", "-NonInteractive", "-Command",
                "$s = New-Object -ComObject SAPI.SpVoice; $s.Rate = 0; $s.Volume = 100; "
                "while($true){ $l = [Console]::In.ReadLine(); if($l -eq $null -or $l -eq '<<QUIT>>'){ break }; "
                "if($l.Trim().Length -gt 0){ try { $s.Speak($l) } catch {} } }"
            ]
            self.process = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                text=True,
                encoding='utf-8',
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
            )
        except Exception as e:
            print(f"[SoundManager] SAPI Worker init error: {e}")
            self.process = None

    def speak(self, text):
        with self.lock:
            if not self.process or self.process.poll() is not None:
                self._start_worker()
            if self.process and self.process.stdin:
                try:
                    clean = text.replace('\n', ' ').strip()
                    if clean:
                        self.process.stdin.write(clean + "\n")
                        self.process.stdin.flush()
                except Exception:
                    self._start_worker()

    def stop(self):
        with self.lock:
            if self.process:
                try:
                    self.process.stdin.write("<<QUIT>>\n")
                    self.process.stdin.flush()
                    self.process.terminate()
                except Exception:
                    pass
                self.process = None


class SoundManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SoundManager, cls).__new__(cls)
            cls._instance._init_manager()
        return cls._instance

    def _init_manager(self):
        self.muted = False
        self.speech_queue = queue.Queue()
        self.engine = None
        self.sapi_worker = None

        # 1. Try pyttsx3 first
        if HAS_PYTTSX3:
            try:
                self.engine = pyttsx3.init()
                self.engine.setProperty('rate', 145)  # Friendly, clear pace for kids
                self.engine.setProperty('volume', 1.0)
                voices = self.engine.getProperty('voices')
                for v in voices:
                    if "zira" in v.name.lower() or "female" in v.name.lower():
                        self.engine.setProperty('voice', v.id)
                        break
            except Exception as e:
                # pyttsx3 failed (e.g. missing pythoncom)
                self.engine = None

        # 2. If pyttsx3 is unavailable on Windows, use WindowsSapiWorker
        if self.engine is None and os.name == 'nt':
            self.sapi_worker = WindowsSapiWorker()

        # Start speech processing thread
        self.worker_thread = threading.Thread(target=self._speech_worker, daemon=True)
        self.worker_thread.start()

    def toggle_mute(self):
        self.muted = not self.muted
        if self.muted:
            while not self.speech_queue.empty():
                try:
                    self.speech_queue.get_nowait()
                    self.speech_queue.task_done()
                except Exception:
                    break
        return self.muted

    def is_muted(self):
        return self.muted

    def _speech_worker(self):
        while True:
            text = self.speech_queue.get()
            if text is None:
                break
            if not self.muted:
                if self.engine:
                    try:
                        self.engine.say(text)
                        self.engine.runAndWait()
                    except Exception:
                        pass
                elif self.sapi_worker:
                    try:
                        self.sapi_worker.speak(text)
                    except Exception:
                        pass
            self.speech_queue.task_done()

    def speak(self, text, interrupt=True):
        """Speak a given text aloud for children."""
        if self.muted or not text:
            return
        text = clean_hindi_for_sapi(text)
        if interrupt:
            while not self.speech_queue.empty():
                try:
                    self.speech_queue.get_nowait()
                    self.speech_queue.task_done()
                except Exception:
                    break
        self.speech_queue.put(text)

    def _play_async(self, func):
        if self.muted or not HAS_WINSOUND:
            return
        t = threading.Thread(target=func, daemon=True)
        t.start()

    def play_pop(self):
        """Balloon pop sound."""
        def _sound():
            try:
                winsound.Beep(920, 35)
                winsound.Beep(1200, 20)
            except Exception:
                pass
        self._play_async(_sound)

    def play_click(self):
        """Button click sound."""
        def _sound():
            try:
                winsound.Beep(980, 25)
            except Exception:
                pass
        self._play_async(_sound)

    def play_correct(self):
        """Joyful ascending musical chime: C5, E5, G5, High C6."""
        def _sound():
            try:
                notes = [(523, 60), (659, 60), (784, 60), (1046, 130)]
                for freq, dur in notes:
                    if self.muted:
                        break
                    winsound.Beep(freq, dur)
                    time.sleep(0.01)
            except Exception:
                pass
        self._play_async(_sound)

    def play_wrong(self):
        """Gentle sad descending boing tone for oops/try again."""
        def _sound():
            try:
                notes = [(392, 100), (330, 100), (261, 200)]
                for freq, dur in notes:
                    if self.muted:
                        break
                    winsound.Beep(freq, dur)
                    time.sleep(0.02)
            except Exception:
                pass
        self._play_async(_sound)

    def play_star(self):
        """Sparkle sound when earning a star."""
        def _sound():
            try:
                winsound.Beep(784, 40)
                winsound.Beep(988, 40)
                winsound.Beep(1175, 80)
            except Exception:
                pass
        self._play_async(_sound)

    def play_fanfare(self):
        """Celebratory victory fanfare for completing a game or milestone!"""
        def _sound():
            try:
                tune = [
                    (523, 90), (659, 90), (784, 90), (1046, 200),
                    (880, 90), (1046, 120), (1318, 300)
                ]
                for freq, dur in tune:
                    if self.muted:
                        break
                    winsound.Beep(freq, dur)
                    time.sleep(0.03)
            except Exception:
                pass
        self._play_async(_sound)


# Global singleton instance
sound = SoundManager()
