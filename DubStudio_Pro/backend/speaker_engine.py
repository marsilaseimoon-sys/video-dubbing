"""
DubStudio Pro - Advanced Speaker Engine
Uses resemblyzer for voice fingerprinting + gender detection via pitch
Each speaker gets unique consistent voice throughout video
"""
import os, sys, subprocess, json, tempfile
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROFILES_DIR = os.path.join(BASE_DIR, "voice_profiles")
os.makedirs(PROFILES_DIR, exist_ok=True)

def _install(pkg):
    subprocess.run([sys.executable,"-m","pip","install",pkg,"-q","--user"],
                   capture_output=True, timeout=180)

# ── RESEMBLYZER ────────────────────────────────────────────────
ENCODER = None
RESEMBLYZER_OK = False
try:
    from resemblyzer import VoiceEncoder, preprocess_wav
    from pathlib import Path
    ENCODER = VoiceEncoder()
    RESEMBLYZER_OK = True
    print("[ENGINE] Resemblyzer loaded ✓")
except:
    try:
        print("[ENGINE] Installing resemblyzer...")
        _install("resemblyzer")
        from resemblyzer import VoiceEncoder, preprocess_wav
        from pathlib import Path
        ENCODER = VoiceEncoder()
        RESEMBLYZER_OK = True
        print("[ENGINE] Resemblyzer installed ✓")
    except Exception as e:
        print(f"[ENGINE] Resemblyzer unavailable: {e}")

# ── PYDUB ──────────────────────────────────────────────────────
try:
    from pydub import AudioSegment
except:
    AudioSegment = None

# ─────────────────────────────────────────────────────────────
# VOICE POOLS — Multiple unique voices per language
# ─────────────────────────────────────────────────────────────
VOICE_POOLS = {
    "ur": {
        "male":   ["ur-PK-AsadNeural"],
        "female": ["ur-PK-UzmaNeural"],
    },
    "en": {
        "male":   ["en-US-GuyNeural","en-US-EricNeural","en-US-DavisNeural",
                   "en-US-TonyNeural","en-US-ChristopherNeural"],
        "female": ["en-US-JennyNeural","en-US-AriaNeural","en-US-NancyNeural",
                   "en-US-SaraNeural","en-US-JaneNeural"],
    },
    "hi": {
        "male":   ["hi-IN-MadhurNeural"],
        "female": ["hi-IN-SwaraNeural"],
    },
    "ar": {
        "male":   ["ar-SA-HamedNeural","ar-EG-ShakirNeural","ar-AE-HamdanNeural"],
        "female": ["ar-SA-ZariyahNeural","ar-EG-SalmaNeural","ar-AE-FatimaNeural"],
    },
    "tr": {
        "male":   ["tr-TR-AhmetNeural"],
        "female": ["tr-TR-EmelNeural"],
    },
    "fr": {
        "male":   ["fr-FR-HenriNeural","fr-FR-JeromeNeural"],
        "female": ["fr-FR-DeniseNeural","fr-FR-BrigitteNeural"],
    },
    "de": {
        "male":   ["de-DE-ConradNeural","de-DE-BerndNeural"],
        "female": ["de-DE-KatjaNeural","de-DE-AmalaNeural"],
    },
    "es": {
        "male":   ["es-ES-AlvaroNeural","es-MX-JorgeNeural"],
        "female": ["es-ES-ElviraNeural","es-MX-DaliaNeural"],
    },
    "zh-cn": {
        "male":   ["zh-CN-YunxiNeural","zh-CN-YunyangNeural"],
        "female": ["zh-CN-XiaoxiaoNeural","zh-CN-XiaohanNeural"],
    },
    "ja": {
        "male":   ["ja-JP-KeitaNeural","ja-JP-DaichiNeural"],
        "female": ["ja-JP-NanamiNeural","ja-JP-AoiNeural"],
    },
    "ko": {
        "male":   ["ko-KR-InJoonNeural","ko-KR-HyunsuNeural"],
        "female": ["ko-KR-SunHiNeural"],
    },
    "ru": {
        "male":   ["ru-RU-DmitryNeural"],
        "female": ["ru-RU-SvetlanaNeural","ru-RU-DariyaNeural"],
    },
    "pt": {
        "male":   ["pt-BR-AntonioNeural"],
        "female": ["pt-BR-FranciscaNeural"],
    },
    "pt-BR": {
        "male":   ["pt-BR-AntonioNeural"],
        "female": ["pt-BR-FranciscaNeural"],
    },
}

# Unique speaking styles for character variety
STYLES = [
    {"rate":"+0%",   "pitch":"+0Hz"},    # Normal
    {"rate":"-5%",   "pitch":"-3Hz"},    # Deep/serious
    {"rate":"+5%",   "pitch":"+3Hz"},    # Energetic
    {"rate":"-8%",   "pitch":"+5Hz"},    # Warm/older
    {"rate":"+8%",   "pitch":"-2Hz"},    # Fast/young
    {"rate":"-3%",   "pitch":"-6Hz"},    # Very deep
    {"rate":"+3%",   "pitch":"+6Hz"},    # Very high
]

def extract_wav_chunk(audio_path, start, end, sr=16000):
    """Extract audio chunk as numpy array via ffmpeg"""
    dur = end - start
    if dur < 0.3:
        return None
    cmd = [
        "ffmpeg", "-y",
        "-ss", str(start),
        "-t",  str(min(dur, 6.0)),
        "-i",  audio_path,
        "-ar", str(sr), "-ac", "1",
        "-f",  "wav", "-"
    ]
    try:
        r = subprocess.run(cmd, capture_output=True, timeout=15)
        if r.returncode != 0 or len(r.stdout) < 500:
            return None
        # Write to temp file for resemblyzer
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tf:
            tf.write(r.stdout)
            tmp = tf.name
        return tmp
    except:
        return None

def get_embedding(audio_path, start, end):
    """Get 256-dim voice embedding using resemblyzer"""
    if not RESEMBLYZER_OK or ENCODER is None:
        return None
    tmp = extract_wav_chunk(audio_path, start, end)
    if not tmp:
        return None
    try:
        wav = preprocess_wav(Path(tmp))
        emb = ENCODER.embed_utterance(wav)
        return emb
    except:
        return None
    finally:
        try: os.remove(tmp)
        except: pass

def cosine_sim(a, b):
    """Cosine similarity between two vectors"""
    try:
        a, b = np.array(a), np.array(b)
        na, nb = np.linalg.norm(a), np.linalg.norm(b)
        if na == 0 or nb == 0:
            return 0.0
        return float(np.dot(a/na, b/nb))
    except:
        return 0.0

def detect_gender_pitch(audio_path, start, end):
    """
    Detect gender using Zero Crossing Rate (pitch estimate).
    Returns: ('male'|'female'|'unknown', confidence)
    """
    dur = end - start
    if dur < 0.3:
        return "unknown", 0.5
    try:
        cmd = [
            "ffmpeg", "-y",
            "-ss", str(start), "-t", str(min(dur, 4.0)),
            "-i", audio_path,
            "-ar", "8000", "-ac", "1",
            "-f", "f32le", "-"
        ]
        r = subprocess.run(cmd, capture_output=True, timeout=12)
        if r.returncode != 0 or not r.stdout:
            return "unknown", 0.5

        samples = np.frombuffer(r.stdout, dtype=np.float32)
        if len(samples) < 256:
            return "unknown", 0.5

        # Zero crossing rate
        zcr = float(np.mean(np.abs(np.diff(np.sign(samples)))) / 2)

        # RMS energy (filter out silence)
        rms = float(np.sqrt(np.mean(samples**2)))
        if rms < 0.001:
            return "unknown", 0.5

        # ZCR thresholds at 8kHz:
        # Female voices typically > 0.10
        # Male voices typically < 0.08
        if zcr > 0.11:
            conf = min(0.95, 0.60 + (zcr - 0.11) * 5)
            return "female", conf
        elif zcr < 0.075:
            conf = min(0.95, 0.60 + (0.075 - zcr) * 8)
            return "male", conf
        else:
            # Ambiguous — use energy pattern
            return ("female" if zcr > 0.093 else "male"), 0.55

    except Exception as e:
        return "unknown", 0.5


class SpeakerEngine:
    """
    Advanced speaker identification engine.
    Uses resemblyzer embeddings for speaker fingerprinting.
    Auto-detects gender and assigns unique voices.
    """

    def __init__(self, target_lang="ur", similarity_threshold=0.75):
        self.target_lang = target_lang
        self.threshold = similarity_threshold
        self.speakers = {}       # sp_id -> profile
        self.next_id = 0
        lang_key = target_lang.lower()
        self.voices = VOICE_POOLS.get(
            lang_key,
            VOICE_POOLS.get(lang_key.split("-")[0], VOICE_POOLS["en"])
        )
        print(f"[ENGINE] SpeakerEngine ready | lang={target_lang} | resemblyzer={'ON' if RESEMBLYZER_OK else 'OFF'}")
        print(f"[ENGINE] Male voices: {self.voices['male']}")
        print(f"[ENGINE] Female voices: {self.voices['female']}")

    def _find_speaker(self, embedding):
        """Find best matching speaker by cosine similarity"""
        if embedding is None:
            return None, 0.0
        best_id, best_sim = None, 0.0
        for sp_id, prof in self.speakers.items():
            if prof.get("embedding") is not None:
                sim = cosine_sim(embedding, prof["embedding"])
                if sim > best_sim:
                    best_sim = sim
                    best_id = sp_id
        return best_id, best_sim

    def _assign_voice(self, gender):
        """Assign next available voice for given gender"""
        pool = self.voices.get(gender, self.voices.get("male", ["en-US-GuyNeural"]))
        used = sum(1 for p in self.speakers.values() if p.get("gender") == gender)
        return pool[used % len(pool)]

    def identify(self, embedding, gender, seg_idx):
        """Identify speaker or create new one"""
        if embedding is not None:
            best_id, best_sim = self._find_speaker(embedding)
            if best_id and best_sim >= self.threshold:
                # Update embedding average
                alpha = 0.15
                old = self.speakers[best_id]["embedding"]
                self.speakers[best_id]["embedding"] = old*(1-alpha) + embedding*alpha
                self.speakers[best_id]["count"] += 1
                return best_id

        # New speaker
        if gender == "unknown":
            gender = "male" if self.next_id % 2 == 0 else "female"

        sp_id = f"SPEAKER_{self.next_id:02d}"
        voice = self._assign_voice(gender)
        style = STYLES[self.next_id % len(STYLES)]

        self.speakers[sp_id] = {
            "embedding": embedding,
            "gender": gender,
            "voice": voice,
            "style": style,
            "count": 1,
        }
        self.next_id += 1
        print(f"[ENGINE] New: {sp_id} | gender={gender} | voice={voice} | style={style}")
        return sp_id

    def process(self, segments, audio_path):
        """Process all segments — identify speakers, assign voices"""
        print(f"\n[ENGINE] Processing {len(segments)} segments...")
        total = len(segments)

        for i, seg in enumerate(segments):
            start = seg.get("start", 0)
            end   = seg.get("end",   start + 2)

            # Get voice embedding
            emb = get_embedding(audio_path, start, end) if RESEMBLYZER_OK else None

            # Detect gender from pitch
            gender, conf = detect_gender_pitch(audio_path, start, end)

            # Identify speaker
            sp_id = self.identify(emb, gender, i)
            prof  = self.speakers[sp_id]

            seg["speaker"]   = sp_id
            seg["tts_voice"] = prof["voice"]
            seg["tts_style"] = prof["style"]
            seg["gender"]    = prof["gender"]

            if i % 8 == 0:
                print(f"[ENGINE] [{i+1}/{total}] {sp_id} ({prof['gender']}) | {seg.get('text','')[:45]}")

        # Summary
        print(f"\n[ENGINE] ══ Speaker Summary ══")
        unique = set(s["speaker"] for s in segments)
        for sp_id in sorted(unique):
            if sp_id in self.speakers:
                p = self.speakers[sp_id]
                count = sum(1 for s in segments if s["speaker"] == sp_id)
                print(f"  {sp_id} | {p['gender']:6} | voice={p['voice']} | segs={count}")
        print(f"[ENGINE] Total speakers: {len(unique)}\n")
        return segments
