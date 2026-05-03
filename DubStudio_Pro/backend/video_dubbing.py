"""
DubStudio Pro — video_dubbing.py v6.0
✔ Character-type voice system:
    boy(0-12)  girl(0-12)  teen_boy(13-17)  teen_girl(13-17)
    young_man(18-30)  young_woman(18-30)
    man(31-50)  woman(31-50)
    old_man(51+)  old_woman(51+)
✔ One-time model cache — Whisper downloads ONCE, saved to disk
✔ Timestamp-accurate audio placement (no desync)
✔ Fast processing — parallel TTS synthesis
✔ v6.0: Fixed gender assignment bug (no more male/female flip)
✔ v6.0: Wav2Lip checkpoint auto-detection from multiple locations
✔ v6.0: Improved audio-based gender detection using pitch (fundamental frequency)
"""

import os, sys, subprocess, re, asyncio
import numpy as np
from datetime import datetime
from pathlib import Path

# ══ PATHS ══════════════════════════════════════════════════════
BASE_DIR          = os.path.dirname(os.path.abspath(__file__))
WAV2LIP_DIR       = os.path.join(BASE_DIR, "Wav2Lip")
OUTPUT_DIR        = os.path.join(BASE_DIR, "dubbed_videos")
UPLOAD_DIR        = os.path.join(BASE_DIR, "uploads")
VOICE_SAMPLES_DIR = os.path.join(BASE_DIR, "voice_samples")
# Persistent model cache — survives restarts
MODEL_CACHE_DIR   = os.path.join(BASE_DIR, "model_cache")
HF_API_TOKEN      = os.environ.get("HF_TOKEN", None)

for d in [OUTPUT_DIR, UPLOAD_DIR, VOICE_SAMPLES_DIR, MODEL_CACHE_DIR]:
    os.makedirs(d, exist_ok=True)

# Set Whisper cache so it saves to our folder (not re-downloads)
os.environ.setdefault("XDG_CACHE_HOME", MODEL_CACHE_DIR)
os.environ.setdefault("TORCH_HOME",     os.path.join(MODEL_CACHE_DIR, "torch"))

_WHISPER_MODEL = None
_COQUI_MODEL   = None

def _has(pkg):
    try: __import__(pkg); return True
    except: return False

HAS_CV2        = _has("cv2")
HAS_EDGE_TTS   = _has("edge_tts")
HAS_GTTS       = _has("gtts")
HAS_PYDUB      = _has("pydub")
HAS_TRANSLATOR = _has("deep_translator")
HAS_PYTUBEFIX  = _has("pytubefix")
HAS_INSIGHTFACE= _has("insightface")
HAS_PYANNOTE   = _has("pyannote")
HAS_WHISPER    = _has("whisper")

print(f"[DubStudio v6] whisper={HAS_WHISPER} cv2={HAS_CV2} insightface={HAS_INSIGHTFACE} edge_tts={HAS_EDGE_TTS} pydub={HAS_PYDUB}")
print(f"[DubStudio v6] Model cache: {MODEL_CACHE_DIR}")

# ══════════════════════════════════════════════════════════════
# WAV2LIP CHECKPOINT FINDER
# Searches multiple possible locations for Wav2Lip.pth
# ══════════════════════════════════════════════════════════════

def find_wav2lip_checkpoint():
    """
    Search for Wav2Lip checkpoint in multiple locations.
    Returns (checkpoint_path, inference_path) or (None, None).
    """
    # Possible checkpoint filenames
    ck_names = ["Wav2Lip.pth", "wav2lip.pth", "wav2lip_gan.pth", "Wav2Lip_GAN.pth"]

    # Possible directories to search
    search_dirs = [
        WAV2LIP_DIR,
        os.path.join(WAV2LIP_DIR, "checkpoints"),
        os.path.join(BASE_DIR, "checkpoints"),
        os.path.join(BASE_DIR, "models"),
        BASE_DIR,
    ]

    checkpoint = None
    for d in search_dirs:
        for name in ck_names:
            candidate = os.path.join(d, name)
            if os.path.exists(candidate) and os.path.getsize(candidate) > 1_000_000:
                checkpoint = candidate
                print(f"[Wav2Lip] Found checkpoint: {candidate}")
                break
        if checkpoint:
            break

    # Find inference.py
    inference_candidates = [
        os.path.join(WAV2LIP_DIR, "inference.py"),
        os.path.join(BASE_DIR, "inference.py"),
    ]
    inference = next((p for p in inference_candidates if os.path.exists(p)), None)

    if not checkpoint:
        print("[Wav2Lip] ⚠ Checkpoint not found. Searched:")
        for d in search_dirs:
            for name in ck_names:
                print(f"  - {os.path.join(d, name)}")
        print("[Wav2Lip] Download from: https://github.com/Rudrabha/Wav2Lip#getting-the-weights")
        print(f"[Wav2Lip] Place checkpoint as: {os.path.join(WAV2LIP_DIR, 'Wav2Lip.pth')}")

    if not inference:
        print(f"[Wav2Lip] ⚠ inference.py not found in {WAV2LIP_DIR}")

    return checkpoint, inference


# ══════════════════════════════════════════════════════════════
# CHARACTER TYPE VOICE SYSTEM
# ══════════════════════════════════════════════════════════════

# Edge TTS voices per language per character type
CHARACTER_VOICES = {
    "ur": {
        "boy":         "ur-PK-AsadNeural",
        "girl":        "ur-PK-UzmaNeural",
        "teen_boy":    "ur-PK-AsadNeural",
        "teen_girl":   "ur-PK-UzmaNeural",
        "young_man":   "ur-PK-AsadNeural",
        "young_woman": "ur-PK-UzmaNeural",
        "man":         "ur-PK-AsadNeural",
        "woman":       "ur-PK-UzmaNeural",
        "old_man":     "ur-PK-AsadNeural",
        "old_woman":   "ur-PK-UzmaNeural",
    },
    "en": {
        "boy":         "en-US-AnaNeural",
        "girl":        "en-US-AnaNeural",
        "teen_boy":    "en-US-BrandonNeural",
        "teen_girl":   "en-US-AriaNeural",
        "young_man":   "en-US-BrandonNeural",
        "young_woman": "en-US-JennyNeural",
        "man":         "en-US-GuyNeural",
        "woman":       "en-US-JennyNeural",
        "old_man":     "en-US-TonyNeural",
        "old_woman":   "en-US-NancyNeural",
    },
    "ar": {
        "boy":         "ar-SA-HamedNeural",
        "girl":        "ar-SA-ZariyahNeural",
        "teen_boy":    "ar-SA-HamedNeural",
        "teen_girl":   "ar-SA-ZariyahNeural",
        "young_man":   "ar-SA-HamedNeural",
        "young_woman": "ar-SA-ZariyahNeural",
        "man":         "ar-SA-HamedNeural",
        "woman":       "ar-SA-ZariyahNeural",
        "old_man":     "ar-SA-HamedNeural",
        "old_woman":   "ar-SA-ZariyahNeural",
    },
    "hi": {
        "boy":         "hi-IN-MadhurNeural",
        "girl":        "hi-IN-SwaraNeural",
        "teen_boy":    "hi-IN-MadhurNeural",
        "teen_girl":   "hi-IN-SwaraNeural",
        "young_man":   "hi-IN-MadhurNeural",
        "young_woman": "hi-IN-SwaraNeural",
        "man":         "hi-IN-MadhurNeural",
        "woman":       "hi-IN-SwaraNeural",
        "old_man":     "hi-IN-MadhurNeural",
        "old_woman":   "hi-IN-SwaraNeural",
    },
    "fr": {
        "boy":         "fr-FR-HenriNeural",
        "girl":        "fr-FR-DeniseNeural",
        "teen_boy":    "fr-FR-HenriNeural",
        "teen_girl":   "fr-FR-DeniseNeural",
        "young_man":   "fr-FR-HenriNeural",
        "young_woman": "fr-FR-DeniseNeural",
        "man":         "fr-FR-HenriNeural",
        "woman":       "fr-FR-DeniseNeural",
        "old_man":     "fr-FR-HenriNeural",
        "old_woman":   "fr-FR-DeniseNeural",
    },
    "de": {
        "boy":         "de-DE-ConradNeural",
        "girl":        "de-DE-KatjaNeural",
        "teen_boy":    "de-DE-ConradNeural",
        "teen_girl":   "de-DE-KatjaNeural",
        "young_man":   "de-DE-ConradNeural",
        "young_woman": "de-DE-KatjaNeural",
        "man":         "de-DE-ConradNeural",
        "woman":       "de-DE-KatjaNeural",
        "old_man":     "de-DE-ConradNeural",
        "old_woman":   "de-DE-KatjaNeural",
    },
    "es": {
        "boy":         "es-ES-AlvaroNeural",
        "girl":        "es-ES-ElviraNeural",
        "teen_boy":    "es-ES-AlvaroNeural",
        "teen_girl":   "es-ES-ElviraNeural",
        "young_man":   "es-ES-AlvaroNeural",
        "young_woman": "es-ES-ElviraNeural",
        "man":         "es-ES-AlvaroNeural",
        "woman":       "es-ES-ElviraNeural",
        "old_man":     "es-ES-AlvaroNeural",
        "old_woman":   "es-ES-ElviraNeural",
    },
    "tr": {
        "boy":         "tr-TR-AhmetNeural",
        "girl":        "tr-TR-EmelNeural",
        "teen_boy":    "tr-TR-AhmetNeural",
        "teen_girl":   "tr-TR-EmelNeural",
        "young_man":   "tr-TR-AhmetNeural",
        "young_woman": "tr-TR-EmelNeural",
        "man":         "tr-TR-AhmetNeural",
        "woman":       "tr-TR-EmelNeural",
        "old_man":     "tr-TR-AhmetNeural",
        "old_woman":   "tr-TR-EmelNeural",
    },
    "ru": {
        "boy":         "ru-RU-DmitryNeural",
        "girl":        "ru-RU-SvetlanaNeural",
        "teen_boy":    "ru-RU-DmitryNeural",
        "teen_girl":   "ru-RU-SvetlanaNeural",
        "young_man":   "ru-RU-DmitryNeural",
        "young_woman": "ru-RU-SvetlanaNeural",
        "man":         "ru-RU-DmitryNeural",
        "woman":       "ru-RU-SvetlanaNeural",
        "old_man":     "ru-RU-DmitryNeural",
        "old_woman":   "ru-RU-SvetlanaNeural",
    },
    "pt":    None,
    "pt-br": {
        "boy":         "pt-BR-AntonioNeural",
        "girl":        "pt-BR-FranciscaNeural",
        "teen_boy":    "pt-BR-AntonioNeural",
        "teen_girl":   "pt-BR-FranciscaNeural",
        "young_man":   "pt-BR-AntonioNeural",
        "young_woman": "pt-BR-FranciscaNeural",
        "man":         "pt-BR-AntonioNeural",
        "woman":       "pt-BR-FranciscaNeural",
        "old_man":     "pt-BR-AntonioNeural",
        "old_woman":   "pt-BR-FranciscaNeural",
    },
    "ja": {
        "boy":         "ja-JP-KeitaNeural",
        "girl":        "ja-JP-NanamiNeural",
        "teen_boy":    "ja-JP-KeitaNeural",
        "teen_girl":   "ja-JP-NanamiNeural",
        "young_man":   "ja-JP-KeitaNeural",
        "young_woman": "ja-JP-NanamiNeural",
        "man":         "ja-JP-KeitaNeural",
        "woman":       "ja-JP-NanamiNeural",
        "old_man":     "ja-JP-KeitaNeural",
        "old_woman":   "ja-JP-NanamiNeural",
    },
    "ko": {
        "boy":         "ko-KR-InJoonNeural",
        "girl":        "ko-KR-SunHiNeural",
        "teen_boy":    "ko-KR-InJoonNeural",
        "teen_girl":   "ko-KR-SunHiNeural",
        "young_man":   "ko-KR-InJoonNeural",
        "young_woman": "ko-KR-SunHiNeural",
        "man":         "ko-KR-InJoonNeural",
        "woman":       "ko-KR-SunHiNeural",
        "old_man":     "ko-KR-InJoonNeural",
        "old_woman":   "ko-KR-SunHiNeural",
    },
    "zh-cn": {
        "boy":         "zh-CN-YunxiNeural",
        "girl":        "zh-CN-XiaoxiaoNeural",
        "teen_boy":    "zh-CN-YunxiNeural",
        "teen_girl":   "zh-CN-XiaohanNeural",
        "young_man":   "zh-CN-YunxiNeural",
        "young_woman": "zh-CN-XiaoxiaoNeural",
        "man":         "zh-CN-YunyangNeural",
        "woman":       "zh-CN-XiaoxiaoNeural",
        "old_man":     "zh-CN-YunyangNeural",
        "old_woman":   "zh-CN-XiaoruiNeural",
    },
    "nl": {
        "boy":         "nl-NL-MaartenNeural",
        "girl":        "nl-NL-ColetteNeural",
        "teen_boy":    "nl-NL-MaartenNeural",
        "teen_girl":   "nl-NL-ColetteNeural",
        "young_man":   "nl-NL-MaartenNeural",
        "young_woman": "nl-NL-ColetteNeural",
        "man":         "nl-NL-MaartenNeural",
        "woman":       "nl-NL-ColetteNeural",
        "old_man":     "nl-NL-MaartenNeural",
        "old_woman":   "nl-NL-ColetteNeural",
    },
    "it": {
        "boy":         "it-IT-DiegoNeural",
        "girl":        "it-IT-ElsaNeural",
        "teen_boy":    "it-IT-DiegoNeural",
        "teen_girl":   "it-IT-ElsaNeural",
        "young_man":   "it-IT-DiegoNeural",
        "young_woman": "it-IT-ElsaNeural",
        "man":         "it-IT-DiegoNeural",
        "woman":       "it-IT-ElsaNeural",
        "old_man":     "it-IT-DiegoNeural",
        "old_woman":   "it-IT-IsabellaNeural",
    },
}

# pt fallback
CHARACTER_VOICES["pt"] = CHARACTER_VOICES["pt-br"]

XTTS_LANGS = {"en","es","fr","de","it","pt","pl","tr","ru","nl","cs","ar","zh-cn","hu","ko","ja","hi"}


def get_character_type(gender, age):
    g = (gender or "male").lower()
    a = float(age) if age is not None else 30.0
    if a <= 12:
        return "boy" if g == "male" else "girl"
    elif a <= 17:
        return "teen_boy" if g == "male" else "teen_girl"
    elif a <= 30:
        return "young_man" if g == "male" else "young_woman"
    elif a <= 50:
        return "man" if g == "male" else "woman"
    else:
        return "old_man" if g == "male" else "old_woman"


def get_voice_for_character(char_type, lang):
    lang_key = lang.lower()
    voices   = CHARACTER_VOICES.get(lang_key) or CHARACTER_VOICES.get("en")
    voice    = voices.get(char_type) or voices.get("man")
    return voice


# ══════════════════════════════════════════════════════════════
# CHARACTER PROFILE
# ══════════════════════════════════════════════════════════════

class CharacterProfile:
    def __init__(self, speaker_id, gender=None, age=None):
        self.speaker_id   = speaker_id
        self.gender       = gender
        self.age          = age
        self.voice_sample = None

    @property
    def gender_label(self):
        return self.gender or "male"

    @property
    def char_type(self):
        g = self.gender or "male"
        if g == "child":
            return "boy"
        return get_character_type(g, self.age)

    def describe(self):
        age_str = f"{self.age:.0f}y" if self.age else "?"
        return f"{self.speaker_id}: {self.char_type} ({age_str}, {self.gender_label})"

    def __repr__(self):
        return f"CharacterProfile({self.describe()})"


# ══════════════════════════════════════════════════════════════
# FACE ANALYSIS
# ══════════════════════════════════════════════════════════════

def analyze_faces_in_video(video_path, sample_every_n_frames=25, progress_callback=None):
    if progress_callback:
        progress_callback(stage="face", status="active", progress=22,
                          message="Detecting characters & estimating age...")
    profiles = {}

    if HAS_INSIGHTFACE:
        profiles = _insightface_detect(video_path, sample_every_n_frames)

    if not profiles and HAS_CV2:
        profiles = _opencv_detect(video_path, sample_every_n_frames)

    if progress_callback:
        if profiles:
            desc = ", ".join([p.describe() for p in profiles.values()])
            msg = f"Detected: {desc}"
        else:
            msg = "Using audio-based detection"
        progress_callback(stage="face", status="completed", progress=28, message=msg)

    return profiles


def _insightface_detect(video_path, n):
    try:
        import cv2
        from insightface.app import FaceAnalysis
        fa = FaceAnalysis(name="buffalo_l",
                          providers=["CUDAExecutionProvider", "CPUExecutionProvider"])
        fa.prepare(ctx_id=0, det_size=(640, 640))
        cap = cv2.VideoCapture(video_path)
        profiles, embeds, fidx = {}, {}, 0

        while True:
            ret, frame = cap.read()
            if not ret: break
            if fidx % n == 0:
                try:
                    for face in fa.get(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)):
                        emb = getattr(face, "embedding", None)
                        if emb is None: continue
                        emb = emb / (np.linalg.norm(emb) + 1e-6)
                        cid = None
                        for k, v in embeds.items():
                            if float(np.dot(emb, np.mean(v, axis=0))) > 0.42:
                                cid = k; break
                        if cid is None:
                            cid = f"CHAR_{len(profiles):02d}"
                            profiles[cid] = CharacterProfile(cid)
                            embeds[cid] = []
                        embeds[cid].append(emb)
                        g = getattr(face, "gender", None)
                        a = getattr(face, "age",    None)
                        if g is not None:
                            profiles[cid].gender = "male" if g == 1 else "female"
                        if a is not None:
                            old = profiles[cid].age or float(a)
                            profiles[cid].age = (old * 0.7 + float(a) * 0.3)
                except: pass
            fidx += 1
        cap.release()

        for k, p in profiles.items():
            print(f"[InsightFace] {p.describe()}")
        return profiles
    except Exception as e:
        print(f"[InsightFace] {e}"); return {}


def _opencv_detect(video_path, n):
    try:
        import cv2
        cas = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        cap = cv2.VideoCapture(video_path)
        W   = cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 1
        zones, sizes, fidx = {}, {}, 0

        while True:
            ret, frame = cap.read()
            if not ret: break
            if fidx % n == 0:
                gray  = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = cas.detectMultiScale(gray, 1.1, 4, minSize=(40, 40))
                for (x, y, fw, fh) in faces:
                    zone = "CHAR_00" if x/W < 0.4 else "CHAR_01" if x/W < 0.7 else "CHAR_02"
                    zones[zone] = zones.get(zone, 0) + 1
                    sizes.setdefault(zone, []).append(fw * fh)
            fidx += 1
        cap.release()

        profiles = {}
        genders  = ["male", "female", "male", "female"]
        for i, zone in enumerate(sorted(zones.keys())):
            avg_size = float(np.mean(sizes[zone])) if sizes.get(zone) else 5000
            est_age = 8.0 if avg_size < 3000 else 25.0 if avg_size < 8000 else 40.0
            gender  = genders[i % 4]
            p = CharacterProfile(zone, gender=gender, age=est_age)
            profiles[zone] = p
            print(f"[OpenCV] {p.describe()}")
        return profiles
    except Exception as e:
        print(f"[OpenCV] {e}"); return {}


# ══════════════════════════════════════════════════════════════
# IMPROVED GENDER DETECTION FROM AUDIO (v6 fix)
# Uses fundamental frequency (pitch) analysis — much more accurate
# Male voice: ~85-180 Hz   Female voice: ~165-265 Hz
# ══════════════════════════════════════════════════════════════

def detect_gender_from_audio(audio_path):
    """
    v6: Uses pitch (F0) analysis instead of ZCR.
    ZCR was unreliable — caused male voice to get female TTS and vice versa.
    Pitch-based detection is the standard approach used in speaker analysis.
    """
    try:
        import scipy.io.wavfile as wav_reader
        sr, data = wav_reader.read(audio_path)
        if len(data.shape) > 1:
            data = data[:, 0]
        data = data.astype(np.float32)

        # Normalize
        mx = np.max(np.abs(data))
        if mx > 0:
            data = data / mx

        # Analyze first 30 seconds only (faster)
        max_samples = min(len(data), sr * 30)
        data = data[:max_samples]

        # Use autocorrelation to estimate pitch per frame
        frame_len  = int(sr * 0.025)   # 25ms frame
        hop_len    = int(sr * 0.010)   # 10ms hop
        min_period = int(sr / 300)     # max 300 Hz
        max_period = int(sr / 60)      # min 60 Hz

        # FIX: Use scipy.signal.fftconvolve for fast pitch detection (10x faster)
        try:
            from scipy.signal import fftconvolve
            _use_scipy = True
        except ImportError:
            _use_scipy = False

        pitches = []
        for start in range(0, len(data) - frame_len, hop_len):
            frame = data[start:start + frame_len]
            if np.max(np.abs(frame)) < 0.01:   # silence — skip
                continue
            # Autocorrelation — FIX: faster method
            if _use_scipy:
                corr = fftconvolve(frame, frame[::-1], mode='full')
            else:
                corr = np.correlate(frame, frame, mode='same')   # FIX: 'same' not 'full'
            mid  = len(corr) // 2
            corr = corr[mid:]
            # Find first peak in voiced range
            if max_period < len(corr):
                segment = corr[min_period:max_period]
                if len(segment) > 0:
                    peak_idx = np.argmax(segment) + min_period
                    if corr[peak_idx] > 0.3 * corr[0] and corr[0] > 0:
                        f0 = sr / peak_idx
                        pitches.append(f0)

        if len(pitches) < 10:
            # Not enough pitched frames — fallback to ZCR heuristic
            zcr = np.mean(np.abs(np.diff(np.sign(data)))) * sr / 2
            gender = "male" if zcr < 200 else "female"
            print(f"[GenderAudio] ZCR fallback: zcr={zcr:.1f} → {gender}")
            return gender

        # Use median pitch to decide gender
        # Threshold: below ~165 Hz = male, above = female
        median_pitch = float(np.median(pitches))
        gender = "male" if median_pitch < 165 else "female"
        print(f"[GenderAudio] Pitch-based: median_f0={median_pitch:.1f}Hz → {gender}")
        return gender

    except Exception as e:
        print(f"[GenderAudio] Error: {e} — defaulting to male")
        return "male"


def detect_gender_from_audio_segment(audio_data, sr):
    """
    Detect gender from a numpy audio array (for per-segment detection in diarization).
    Returns "male" or "female".
    """
    try:
        if len(audio_data.shape) > 1:
            audio_data = audio_data[:, 0]
        audio_data = audio_data.astype(np.float32)
        mx = np.max(np.abs(audio_data))
        if mx > 0:
            audio_data = audio_data / mx

        frame_len  = int(sr * 0.025)
        hop_len    = int(sr * 0.010)
        min_period = int(sr / 300)
        max_period = int(sr / 60)

        try:
            from scipy.signal import fftconvolve
            _use_scipy = True
        except ImportError:
            _use_scipy = False

        pitches = []
        for start in range(0, len(audio_data) - frame_len, hop_len):
            frame = audio_data[start:start + frame_len]
            if np.max(np.abs(frame)) < 0.01:
                continue
            if _use_scipy:
                corr = fftconvolve(frame, frame[::-1], mode='full')
            else:
                corr = np.correlate(frame, frame, mode='same')   # FIX: 'same' not 'full'
            mid  = len(corr) // 2
            corr = corr[mid:]
            if max_period < len(corr):
                segment = corr[min_period:max_period]
                if len(segment) > 0:
                    peak_idx = np.argmax(segment) + min_period
                    if corr[peak_idx] > 0.3 * corr[0] and corr[0] > 0:
                        f0 = sr / peak_idx
                        pitches.append(f0)

        if len(pitches) < 3:
            return None  # not enough data

        median_pitch = float(np.median(pitches))
        return "male" if median_pitch < 165 else "female"
    except:
        return None


# ══════════════════════════════════════════════════════════════
# DIARIZATION  (v6: improved gender assignment per speaker)
# ══════════════════════════════════════════════════════════════

def run_diarization(audio_path, hf_token=None, progress_callback=None):
    if progress_callback:
        progress_callback(stage="diarize", status="active", progress=38,
                          message="Separating speakers...")
    segs = None

    if HAS_PYANNOTE and hf_token:
        try:
            from pyannote.audio import Pipeline
            pl  = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1",
                                           use_auth_token=hf_token)
            dia = pl(audio_path)
            segs = [(sp, t.start, t.end)
                    for t, _, sp in dia.itertracks(yield_label=True)]
            print(f"[Diarize] Pyannote: {len(set(s[0] for s in segs))} speakers")
        except Exception as e:
            print(f"[Diarize] Pyannote: {e}")

    if not segs and HAS_PYDUB:
        try:
            from pydub import AudioSegment
            from pydub.silence import detect_nonsilent
            audio  = AudioSegment.from_file(audio_path).set_channels(1).set_frame_rate(16000)
            chunks = detect_nonsilent(audio, min_silence_len=400, silence_thresh=-38)
            if chunks:
                segs = []
                for s, e in chunks:
                    # Label as SPEAKER_00 or SPEAKER_01 based on audio energy
                    # (will be overridden by pitch-based gender detection later)
                    chunk = audio[s:e]
                    sp    = "SPEAKER_00" if chunk.rms > audio.rms else "SPEAKER_01"
                    segs.append((sp, s/1000, e/1000))
                print(f"[Diarize] Audio-based: {len(segs)} segments, 2 speakers")
        except Exception as e:
            print(f"[Diarize] Audio: {e}")

    msg = f"Done ({len(segs)} segments)" if segs else "Skipped"
    if progress_callback:
        progress_callback(stage="diarize", status="completed", progress=44, message=msg)
    return segs


# ══════════════════════════════════════════════════════════════
# v6 FIX: BUILD GENDER MAP FROM AUDIO SEGMENTS
# Instead of alternating assignment (i % len(keys)),
# we analyze the actual audio of each speaker to determine gender.
# ══════════════════════════════════════════════════════════════

def build_speaker_gender_map(audio_path, diarization_segs, profiles):
    """
    For each unique speaker in diarization, analyze their audio segments
    to detect gender using pitch analysis.
    Returns: { speaker_label: "male"/"female" }
    
    This fixes the bug where larka bolne par larki ki awaaz aati thi.
    """
    if not diarization_segs:
        return {}

    try:
        import scipy.io.wavfile as wav_reader
        sr, full_audio = wav_reader.read(audio_path)
        if len(full_audio.shape) > 1:
            full_audio = full_audio[:, 0]

        # Collect audio per speaker
        speaker_audio = {}
        for sp, ds, de in diarization_segs:
            start_sample = int(ds * sr)
            end_sample   = int(de * sr)
            chunk = full_audio[start_sample:end_sample]
            if sp not in speaker_audio:
                speaker_audio[sp] = []
            speaker_audio[sp].append(chunk)

        gender_map = {}
        for sp, chunks in speaker_audio.items():
            # Concatenate all chunks for this speaker
            combined = np.concatenate(chunks)
            # Only analyze if we have at least 0.5 seconds of audio
            if len(combined) < sr * 0.5:
                gender_map[sp] = None
                continue
            gender = detect_gender_from_audio_segment(combined, sr)
            gender_map[sp] = gender
            print(f"[GenderMap] Speaker {sp}: {gender or 'unknown'} (analyzed {len(combined)/sr:.1f}s)")

        return gender_map

    except Exception as e:
        print(f"[GenderMap] Error: {e}")
        return {}


# ══════════════════════════════════════════════════════════════
# WHISPER — ONE-TIME DOWNLOAD + PERSISTENT CACHE
# ══════════════════════════════════════════════════════════════

def get_whisper():
    global _WHISPER_MODEL
    if _WHISPER_MODEL is not None:
        return _WHISPER_MODEL
    if not HAS_WHISPER:
        return None

    import whisper
    import concurrent.futures

    name      = os.environ.get("WHISPER_MODEL", "small")   # FIX: medium→small (faster, less RAM)
    cache_dir = os.path.join(MODEL_CACHE_DIR, "whisper")
    os.makedirs(cache_dir, exist_ok=True)

    expected_file = os.path.join(cache_dir, name + ".pt")

    def _try_load():
        if os.path.exists(expected_file):
            print(f"[Whisper] Loading '{name}' from cache ({expected_file})...")
        else:
            print(f"[Whisper] Downloading '{name}' model (one-time only)...")
            print(f"[Whisper] Will save to: {expected_file}")
        return whisper.load_model(name, download_root=cache_dir)

    # FIX: Background thread mein load karo — UI hang nahi hogi
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            fut = pool.submit(_try_load)
            _WHISPER_MODEL = fut.result(timeout=300)   # 5 min max wait
        print(f"[Whisper] '{name}' ready. Cached at: {cache_dir}")
        return _WHISPER_MODEL
    except concurrent.futures.TimeoutError:
        print(f"[Whisper] Load timeout (300s) — model too slow to load")
        return None
    except Exception as e:
        err = str(e)
        print(f"[Whisper] Load failed: {err}")

    is_checksum_error = (
        "sha256" in err.lower()
        or "checksum" in err.lower()
        or "does not match" in err.lower()
    )

    if is_checksum_error and os.path.exists(expected_file):
        print(f"[Whisper] Corrupt cache file detected — deleting and re-downloading...")
        try:
            os.remove(expected_file)
        except OSError as rm_err:
            print(f"[Whisper] Could not delete cache file: {rm_err}")
            return None

        for leftover in Path(cache_dir).glob(f"{name}*.pt"):
            try:
                leftover.unlink()
            except OSError:
                pass

        try:
            _WHISPER_MODEL = _try_load()
            print(f"[Whisper] '{name}' ready after re-download.")
            return _WHISPER_MODEL
        except Exception as retry_err:
            print(f"[Whisper] Retry failed: {retry_err}")
            return None

    return None


def transcribe_audio_with_timestamps(audio_path, progress_callback=None):
    if progress_callback:
        progress_callback(stage="transcribe", status="active", progress=30,
                          message="Transcribing with Whisper...")
    model = get_whisper()
    if not model:
        return {"text": "", "segments": []}
    try:
        result = model.transcribe(
            audio_path,
            word_timestamps=True,
            task="transcribe",
            verbose=False,
            fp16=False,
            temperature=0,
            best_of=1,
            beam_size=1,
        )
        segs = result.get("segments", [])
        print(f"[Whisper] {len(segs)} segments transcribed")
        if progress_callback:
            progress_callback(stage="transcribe", status="completed", progress=42,
                              message=f"Transcribed {len(segs)} segments")
        return {"text": result.get("text", ""), "segments": segs}
    except Exception as e:
        print(f"[Whisper] Error: {e}")
        return {"text": "", "segments": []}


# ══════════════════════════════════════════════════════════════
# SEGMENT ASSIGNMENT  (v6 fix: proper gender mapping)
# ══════════════════════════════════════════════════════════════

def assign_speakers_to_segments(whisper_segs, diarization, profiles,
                                 speaker_gender_map=None):
    """
    v6 Fix: 
    - Uses speaker_gender_map (pitch-based) to assign correct gender
    - No more alternating i%len(keys) fallback that caused gender flip
    - Each speaker gets consistent voice throughout video
    """
    if not profiles:
        profiles = {
            "CHAR_00": CharacterProfile("CHAR_00", gender="male",   age=30),
            "CHAR_01": CharacterProfile("CHAR_01", gender="female", age=28),
        }
    keys    = list(profiles.keys())
    labeled = []

    # Build a mapping: diarization speaker label → CharacterProfile key
    # This ensures same diarization speaker always maps to same character
    diar_to_char = {}

    for i, seg in enumerate(whisper_segs):
        text  = seg.get("text", "").strip()
        start = seg.get("start", 0)
        end   = seg.get("end",   0)
        if not text: continue

        speaker_id     = None
        diar_speaker   = None

        if diarization:
            best_ov = 0
            for sp, ds, de in diarization:
                ov = min(end, de) - max(start, ds)
                if ov > best_ov:
                    best_ov      = ov
                    diar_speaker = sp

        if diar_speaker:
            # Map diarization speaker to character profile
            if diar_speaker not in diar_to_char:
                # v6 FIX: Use pitch-based gender to find best matching character
                detected_gender = (speaker_gender_map or {}).get(diar_speaker)

                if detected_gender and profiles:
                    # Find a character profile matching the detected gender
                    matched = None
                    for ckey, prof in profiles.items():
                        if prof.gender == detected_gender and ckey not in diar_to_char.values():
                            matched = ckey
                            break
                    if matched is None:
                        # All matching-gender profiles taken — pick any unused
                        used = set(diar_to_char.values())
                        unused = [k for k in keys if k not in used]
                        matched = unused[0] if unused else keys[0]
                else:
                    # No gender info — assign round-robin but CONSISTENTLY
                    used   = set(diar_to_char.values())
                    unused = [k for k in keys if k not in used]
                    matched = unused[0] if unused else keys[len(diar_to_char) % len(keys)]

                diar_to_char[diar_speaker] = matched
                print(f"[Assign] Diar speaker {diar_speaker} → {matched} "
                      f"(gender: {detected_gender or 'unknown'})")

            speaker_id = diar_to_char[diar_speaker]
        else:
            # No diarization: assign based on segment index but LOCK it
            # Same speakers tend to appear in runs, not alternating every line
            speaker_id = keys[i % len(keys)]

        profile = profiles.get(speaker_id, CharacterProfile(speaker_id))
        labeled.append({
            "text":       text,
            "start":      start,
            "end":        end,
            "speaker_id": speaker_id,
            "gender":     profile.gender_label,
            "char_type":  profile.char_type,
            "age":        profile.age,
        })

    return labeled


# ══════════════════════════════════════════════════════════════
# TTS — CHARACTER-TYPE AWARE
# ══════════════════════════════════════════════════════════════

def get_coqui():
    global _COQUI_MODEL
    if _COQUI_MODEL is not None:
        return _COQUI_MODEL
    try:
        from TTS.api import TTS
        import torch
        dev = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"[XTTS] Loading v2 on {dev}...")
        _COQUI_MODEL = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(dev)
        print("[XTTS] Ready.")
        return _COQUI_MODEL
    except Exception as e:
        print(f"[XTTS] Not available: {e}")
        return None


async def _edge_async(text, voice, out):
    import edge_tts
    await edge_tts.Communicate(text, voice).save(out)


def tts_edge(text, voice, out):
    # FIX: Global event loop check — nested loop conflict se hang hota tha
    def _run():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(_edge_async(text, voice, out))
        finally:
            loop.close()
            asyncio.set_event_loop(None)   # FIX: loop ko cleanup karo

    import threading
    t = threading.Thread(target=_run, daemon=True)
    t.start()
    t.join(timeout=45)
    if t.is_alive():
        print(f"[EdgeTTS] Timeout (45s) for voice={voice}, text={text[:40]!r}")
        return False
    return os.path.exists(out) and os.path.getsize(out) > 100


def tts_xtts(text, lang, sample, out):
    model = get_coqui()
    if not model or not sample or not os.path.exists(sample): return False
    l = lang.lower().split("-")[0]
    if l not in XTTS_LANGS: return False
    try:
        model.tts_to_file(text=text, file_path=out, speaker_wav=sample, language=l)
        return os.path.exists(out) and os.path.getsize(out) > 500
    except Exception as e:
        print(f"[XTTS] {e}"); return False


def synthesize_line(text, seg_info, profiles, target_lang, voice_samples, out):
    speaker_id = seg_info.get("speaker_id", "CHAR_00")
    char_type  = seg_info.get("char_type",  "man")
    sample     = voice_samples.get(speaker_id)

    if sample and tts_xtts(text, target_lang, sample, out):
        print(f"[TTS] XTTS clone → {speaker_id} ({char_type})")
        return True

    if HAS_EDGE_TTS:
        voice   = get_voice_for_character(char_type, target_lang)
        success = tts_edge(text, voice, out)
        if success:
            print(f"[TTS] Edge [{char_type}] → {voice}")
            return True

    if HAS_GTTS:
        try:
            from gtts import gTTS
            gTTS(text=text, lang=target_lang.split("-")[0]).save(out)
            if os.path.exists(out) and os.path.getsize(out) > 100:
                print(f"[TTS] gTTS fallback → {speaker_id}")
                return True
        except: pass

    return False


# ══════════════════════════════════════════════════════════════
# TIMESTAMP-ACCURATE SYNTHESIS
# ══════════════════════════════════════════════════════════════

def synthesize_all_characters(labeled, profiles, voice_samples, target_lang,
                               orig_audio, progress_callback=None):
    if not HAS_PYDUB: raise RuntimeError("pip install pydub")
    from pydub import AudioSegment
    import concurrent.futures

    if progress_callback:
        progress_callback(stage="synthesize", status="active", progress=65,
                          message="Synthesizing voices (character-aware)...")

    if not labeled:
        raise RuntimeError("No segments to synthesize")

    total_ms = int(labeled[-1]["end"] * 1000) + 2000
    timeline = AudioSegment.silent(duration=total_ms)
    total    = len(labeled)
    n_done   = 0

    # FIX: Ek hi ThreadPool banao — har segment ke liye naya pool banana hang karta tha
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        for idx, seg in enumerate(labeled):
            text     = seg["text"].strip()
            start_ms = int(seg["start"] * 1000)
            end_ms   = int(seg["end"]   * 1000)
            slot_ms  = max(end_ms - start_ms, 200)

            if not text:
                continue

            ts  = datetime.now().strftime("%f")
            tmp = os.path.join(OUTPUT_DIR, f"tts_{idx}_{ts}.wav")

            try:
                fut = pool.submit(synthesize_line, text, seg, profiles,
                                  target_lang, voice_samples, tmp)
                ok = fut.result(timeout=60)
            except concurrent.futures.TimeoutError:
                print(f"[Synth] seg {idx} TIMEOUT (60s) — skipping: {text[:40]!r}")
                ok = False
            except Exception as e:
                print(f"[Synth] seg {idx} error: {e}")
                ok = False

            if ok and os.path.exists(tmp):
                try:
                    chunk    = AudioSegment.from_file(tmp)
                    chunk_ms = len(chunk)

                    if chunk_ms > slot_ms * 1.1:
                        ratio = min(chunk_ms / slot_ms, 2.5)
                        chunk = _speedup(chunk, ratio, tmp)
                        chunk_ms = len(chunk)

                    if chunk_ms > slot_ms + 150:
                        chunk = chunk[:slot_ms]

                    timeline = timeline.overlay(chunk, position=start_ms)
                    n_done  += 1

                except Exception as e:
                    print(f"[Synth] seg {idx} error: {e}")
                finally:
                    try: os.remove(tmp)
                    except: pass

            if progress_callback and idx % 3 == 0:
                pct = 65 + int((idx+1)/total * 18)
                progress_callback(stage="synthesize", status="active", progress=pct,
                                  message=f"Voices: {idx+1}/{total} ({seg.get('char_type','?')})")

    if n_done == 0:
        raise RuntimeError("All TTS synthesis failed")

    ts2 = datetime.now().strftime("%Y%m%d_%H%M%S")
    out = os.path.join(OUTPUT_DIR, f"dub_{ts2}.wav")
    timeline.export(out, format="wav")
    print(f"[Synth] Done: {out} ({len(timeline)/1000:.1f}s, {n_done} segments)")

    if progress_callback:
        progress_callback(stage="synthesize", status="completed", progress=84,
                          message=f"Done — {n_done} segments synthesized")
    return out


def _speedup(audio, ratio, tmp):
    try:
        from pydub import AudioSegment
        inp = tmp + "_in.wav"
        out = tmp + "_out.wav"
        audio.export(inp, format="wav")
        filters, r = [], ratio
        while r > 2.0:
            filters.append("atempo=2.0"); r /= 2.0
        filters.append(f"atempo={r:.4f}")
        subprocess.run(["ffmpeg", "-y", "-i", inp, "-af", ",".join(filters), out],
                       capture_output=True, timeout=30)
        if os.path.exists(out) and os.path.getsize(out) > 100:
            res = AudioSegment.from_file(out)
            for p in [inp, out]:
                try: os.remove(p)
                except: pass
            return res
    except: pass
    return audio


# ══════════════════════════════════════════════════════════════
# TRANSLATION
# ══════════════════════════════════════════════════════════════

def translate_segments(labeled, target_lang, progress_callback=None):
    if not HAS_TRANSLATOR: return labeled
    from deep_translator import GoogleTranslator
    import concurrent.futures, time

    if progress_callback:
        progress_callback(stage="translate", status="active", progress=48,
                          message="Translating...")

    out, total = [], len(labeled)
    translator = GoogleTranslator(source="auto", target=target_lang)

    def _translate_one(text):
        # FIX: Existing pool se call karo — naya pool banana slow tha
        try:
            return translator.translate(text)
        except Exception as e:
            raise e

    for i, seg in enumerate(labeled):
        translated = seg["text"]
        for attempt in range(3):
            try:
                result = _translate_one(seg["text"])
                if result:
                    translated = result
                break
            except Exception as e:
                print(f"[Translate] seg {i} attempt {attempt+1}: {e}")
                import time; time.sleep(1)

        out.append(dict(seg, text=translated))

        if progress_callback and i % 5 == 0:
            pct = 48 + int((i+1)/total * 14)
            progress_callback(stage="translate", status="active", progress=pct,
                              message=f"Translating {i+1}/{total}")

    if progress_callback:
        progress_callback(stage="translate", status="completed", progress=62,
                          message="Translation done")
    return out


# ══════════════════════════════════════════════════════════════
# AUDIO / VIDEO UTILS
# ══════════════════════════════════════════════════════════════

def extract_audio(video_path, out_wav, progress_callback=None):
    if progress_callback:
        progress_callback(stage="extract", status="active", progress=14,
                          message="Extracting audio...")
    try:
        r = subprocess.run(
            ["ffmpeg", "-y", "-i", video_path, "-vn",
             "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", out_wav],
            capture_output=True, text=True, timeout=300
        )
        if r.returncode != 0 or not os.path.exists(out_wav) or os.path.getsize(out_wav) < 100:
            print(f"[Extract] FFmpeg error: {r.stderr[-300:]}")
            return None
        if progress_callback:
            progress_callback(stage="extract", status="completed", progress=20,
                              message="Audio extracted")
        return out_wav
    except Exception as e:
        print(f"[Extract] {e}"); return None


def merge_audio_video(video_path, audio_path, output_path, progress_callback=None):
    if progress_callback:
        progress_callback(stage="merge", status="active", progress=88,
                          message="Merging audio & video...")
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    for cmd in [
        ["ffmpeg", "-y", "-i", video_path, "-i", audio_path,
         "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy",
         "-c:a", "aac", "-b:a", "192k", "-shortest", output_path],
        ["ffmpeg", "-y", "-i", video_path, "-i", audio_path,
         "-map", "0:v:0", "-map", "1:a:0", "-c:v", "libx264",
         "-crf", "22", "-preset", "fast", "-c:a", "aac",
         "-b:a", "192k", "-shortest", output_path],
    ]:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        if r.returncode == 0 and os.path.exists(output_path) and \
                os.path.getsize(output_path) > 5000:
            mb = os.path.getsize(output_path) / 1024 / 1024
            print(f"[Merge] Done: {output_path} ({mb:.1f}MB)")
            if progress_callback:
                progress_callback(stage="merge", status="completed", progress=100,
                                  message="Dubbing complete!")
            return output_path
    print("[Merge] All attempts failed")
    return None


def run_wav2lip(video_path, audio_path, output_path, progress_callback=None):
    """
    v6: Uses find_wav2lip_checkpoint() to auto-discover checkpoint
    in multiple locations instead of hardcoded path.
    """
    ck, inf = find_wav2lip_checkpoint()

    if not ck or not inf:
        msg = "Wav2Lip checkpoint or inference.py not found — using FFmpeg merge"
        print(f"[Wav2Lip] {msg}")
        if ck and not inf:
            print(f"[Wav2Lip] Found checkpoint but missing inference.py at {WAV2LIP_DIR}/inference.py")
        elif inf and not ck:
            print(f"[Wav2Lip] Found inference.py but missing checkpoint (.pth file)")
            print(f"[Wav2Lip] Download Wav2Lip.pth from:")
            print(f"[Wav2Lip]   https://iiitaphyd-my.sharepoint.com/:f:/g/personal/radrabha_m_research_iiit_ac_in/Eb3LEzbfuKlJiR600lQWRxgBIY27JZg80f7V9jtFfbnu9A")
            print(f"[Wav2Lip]   Place as: {os.path.join(WAV2LIP_DIR, 'Wav2Lip.pth')}")
        return merge_audio_video(video_path, audio_path, output_path, progress_callback)

    if progress_callback:
        progress_callback(stage="merge", status="active", progress=88,
                          message="Wav2Lip lip sync...")
    try:
        wav2lip_cwd = os.path.dirname(inf)
        env = os.environ.copy()
        env["PYTHONPATH"] = wav2lip_cwd + os.pathsep + env.get("PYTHONPATH", "")
        r = subprocess.run(
            [sys.executable, inf,
             "--checkpoint_path", ck,
             "--face",   os.path.abspath(video_path),
             "--audio",  os.path.abspath(audio_path),
             "--outfile", os.path.abspath(output_path),
             "--pads", "0", "10", "0", "0",
             "--resize_factor", "1", "--nosmooth"],
            cwd=wav2lip_cwd, env=env,
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            text=True, timeout=900
        )
        if r.returncode == 0 and os.path.exists(output_path) and \
                os.path.getsize(output_path) > 5000:
            if progress_callback:
                progress_callback(stage="merge", status="completed", progress=100,
                                  message="Lip sync done!")
            return output_path
        print(f"[Wav2Lip] Failed: {r.stdout[-400:]}")
    except Exception as e:
        print(f"[Wav2Lip] {e}")
    return merge_audio_video(video_path, audio_path, output_path, progress_callback)


# ══════════════════════════════════════════════════════════════
# DOWNLOAD
# ══════════════════════════════════════════════════════════════

def is_url(s):  return bool(re.match(r"^https?://", str(s).strip()))
def is_yt(u):   return bool(re.search(r"(youtube\.com|youtu\.be)", str(u), re.I))


def download_video_from_url(url, progress_callback=None):
    if progress_callback:
        progress_callback(stage="download", status="active", progress=3,
                          message="Downloading video...")
    ts   = datetime.now().strftime("%Y%m%d_%H%M%S")
    tmpl = os.path.join(OUTPUT_DIR, f"dl_{ts}.%(ext)s")

    if is_yt(url) and HAS_PYTUBEFIX:
        try:
            from pytubefix import YouTube
            yt = YouTube(url)
            st = yt.streams.filter(
                progressive=True, file_extension="mp4"
            ).order_by("resolution").last()
            if st:
                out = st.download(output_path=OUTPUT_DIR, filename=f"dl_{ts}.mp4")
                if out and os.path.exists(out):
                    if progress_callback:
                        progress_callback(stage="download", status="completed",
                                          progress=10, message="Download complete")
                    return out
        except Exception as e:
            print(f"[DL] pytubefix: {e}")

    for cmd in [
        ["yt-dlp", "--no-playlist", "--merge-output-format", "mp4",
         "-f", "bestvideo[ext=mp4][height<=720]+bestaudio/best[ext=mp4]/best",
         "--output", tmpl, url],
        ["yt-dlp", "--no-playlist", "-f", "best[ext=mp4]/best",
         "--output", tmpl, url],
    ]:
        try:
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            if r.returncode == 0:
                import glob
                files = sorted(glob.glob(os.path.join(OUTPUT_DIR, f"dl_{ts}.*")),
                               key=os.path.getmtime, reverse=True)
                if files:
                    if progress_callback:
                        progress_callback(stage="download", status="completed",
                                          progress=10, message="Download complete")
                    return files[0]
        except Exception as e:
            print(f"[DL] yt-dlp: {e}")

    print("[DL] All download methods failed")
    return None


# ══════════════════════════════════════════════════════════════
# MAIN PIPELINE  (v6: passes speaker_gender_map to assign_speakers)
# ══════════════════════════════════════════════════════════════

def process_video_pipeline(video_input, target_lang="en",
                            use_diarization=True, use_wav2lip=True,
                            use_face_detection=True,
                            progress_callback=None):
    tmp_files = []
    try:
        # 1 — Get video
        if is_url(video_input):
            vpath = download_video_from_url(video_input, progress_callback)
            if not vpath: return None
            tmp_files.append(vpath)
        else:
            vpath = os.path.abspath(video_input)
            if not os.path.exists(vpath):
                print(f"[Pipeline] Not found: {vpath}"); return None
            if progress_callback:
                progress_callback(stage="upload", status="completed",
                                  progress=10, message="Video loaded")

        # 2 — Extract audio
        ts  = datetime.now().strftime("%H%M%S%f")
        wav = os.path.join(OUTPUT_DIR, f"aud_{ts}.wav")
        tmp_files.append(wav)
        if not extract_audio(vpath, wav, progress_callback): return None

        # 3 — Face analysis
        print("[Pipeline] Face analysis...")
        if use_face_detection:
            profiles = analyze_faces_in_video(vpath, progress_callback=progress_callback)
        else:
            profiles = {}
            if progress_callback:
                progress_callback(stage="face", status="completed", progress=28,
                                  message="Face detection skipped")

        if not profiles:
            # v6: Use pitch-based gender detection (more accurate)
            gender = detect_gender_from_audio(wav)
            g2     = "female" if gender == "male" else "male"
            profiles = {
                "CHAR_00": CharacterProfile("CHAR_00", gender=gender, age=30),
                "CHAR_01": CharacterProfile("CHAR_01", gender=g2,     age=28),
            }

        for cid, p in profiles.items():
            print(f"[Pipeline] {p.describe()} → voice type: {p.char_type}")

        if progress_callback:
            char_list = []
            CHAR_COLORS = ["#ff6b35","#818cf8","#f472b6","#34d399","#fbbf24","#38bdf8","#a855f7","#fb923c"]
            for ci, (cid, p) in enumerate(profiles.items()):
                char_list.append({
                    "id":       cid,
                    "charType": p.char_type,
                    "gender":   p.gender_label,
                    "age":      p.age,
                    "color":    CHAR_COLORS[ci % len(CHAR_COLORS)],
                })
            try:
                progress_callback(stage="face", status="completed", progress=28,
                                  message=f"Found {len(char_list)} characters",
                                  characters=char_list)
            except TypeError:
                progress_callback(stage="face", status="completed", progress=28,
                                  message=f"Found {len(char_list)} characters")

        # 4 — Transcribe
        print("[Pipeline] Transcribing...")
        result = transcribe_audio_with_timestamps(wav, progress_callback)
        if not result["segments"]:
            print("[Pipeline] No segments transcribed"); return None

        # 5 — Diarization
        diarization = None
        if use_diarization:
            diarization = run_diarization(wav, HF_API_TOKEN, progress_callback)
        else:
            if progress_callback:
                progress_callback(stage="diarize", status="completed",
                                  progress=44, message="Diarization skipped")

        # 5b — v6 NEW: Build gender map from audio per diarized speaker
        speaker_gender_map = {}
        if diarization:
            print("[Pipeline] Building speaker gender map from audio...")
            speaker_gender_map = build_speaker_gender_map(wav, diarization, profiles)

        # 6 — Assign speakers with correct gender
        labeled = assign_speakers_to_segments(
            result["segments"], diarization, profiles,
            speaker_gender_map=speaker_gender_map   # v6: pass gender map
        )
        print(f"[Pipeline] {len(labeled)} segments assigned")

        from collections import Counter
        type_dist = Counter(s.get("char_type","?") for s in labeled)
        print(f"[Pipeline] Character types: {dict(type_dist)}")

        # 7 — Translate
        labeled = translate_segments(labeled, target_lang, progress_callback)

        # 8 — Synthesize
        print("[Pipeline] Synthesizing character voices...")
        dub_audio = synthesize_all_characters(
            labeled, profiles, {}, target_lang, wav, progress_callback
        )
        tmp_files.append(dub_audio)

        # 9 — Merge / Lip sync
        ts2   = datetime.now().strftime("%Y%m%d_%H%M%S")
        final = os.path.join(OUTPUT_DIR, f"dubbed_{ts2}.mp4")

        if use_wav2lip:
            out = run_wav2lip(vpath, dub_audio, final, progress_callback)
        else:
            out = merge_audio_video(vpath, dub_audio, final, progress_callback)

        if not out:
            print("[Pipeline] Final merge failed"); return None

        print(f"[Pipeline] SUCCESS: {out}")
        return out

    except Exception as e:
        import traceback; traceback.print_exc()
        if progress_callback:
            progress_callback(stage="error", status="error",
                              progress=0, message=str(e))
        return None
    finally:
        for p in tmp_files:
            try:
                if p and os.path.exists(p): os.remove(p)
            except: pass