"""
DubStudio Pro - Advanced TTS Engine
Uses multiple TTS backends with voice cloning capability
Priority: Coqui XTTS v2 > Edge TTS > gTTS
"""
import os, sys, subprocess, asyncio, json, tempfile, shutil
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VOICE_CACHE = os.path.join(BASE_DIR, "voice_profiles")
os.makedirs(VOICE_CACHE, exist_ok=True)

def _install(pkg, extra_args=None):
    cmd = [sys.executable, "-m", "pip", "install", pkg, "-q", "--user"]
    if extra_args:
        cmd.extend(extra_args)
    try:
        subprocess.run(cmd, capture_output=True, timeout=300)
        return True
    except:
        return False

# ── COQUI TTS (XTTS v2 - Best Quality + Voice Cloning) ─────────
COQUI_OK = False
TTS_MODEL = None

def load_coqui():
    global COQUI_OK, TTS_MODEL
    try:
        from TTS.api import TTS
        print("[TTS] Loading Coqui XTTS v2...")
        TTS_MODEL = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
        COQUI_OK = True
        print("[TTS] Coqui XTTS v2 loaded ✓")
    except ImportError:
        print("[TTS] Installing Coqui TTS...")
        _install("TTS")
        try:
            from TTS.api import TTS
            TTS_MODEL = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
            COQUI_OK = True
            print("[TTS] Coqui XTTS v2 installed & loaded ✓")
        except Exception as e:
            print(f"[TTS] Coqui failed: {e}")
    except Exception as e:
        print(f"[TTS] Coqui load error: {e}")

# Try loading Coqui
load_coqui()

# ── EDGE TTS ─────────────────────────────────────────────────────
try:
    import edge_tts
    EDGE_OK = True
except:
    EDGE_OK = False

# ── GTTS ─────────────────────────────────────────────────────────
try:
    from gtts import gTTS
    GTTS_OK = True
except:
    GTTS_OK = False

# ── PYDUB ─────────────────────────────────────────────────────────
try:
    from pydub import AudioSegment
    from pydub.effects import normalize, compress_dynamic_range
    PYDUB_OK = True
except:
    PYDUB_OK = False

# ── NUMPY ─────────────────────────────────────────────────────────
try:
    import numpy as np
    NP_OK = True
except:
    NP_OK = False

# ─────────────────────────────────────────────────────────────────
# COQUI XTTS v2 LANGUAGE CODES
# ─────────────────────────────────────────────────────────────────
COQUI_LANGS = {
    "en": "en", "fr": "fr", "de": "de", "es": "es",
    "it": "it", "pt": "pt", "pl": "pl", "tr": "tr",
    "ru": "ru", "nl": "nl", "cs": "cs", "ar": "ar",
    "zh-cn": "zh-cn", "ja": "ja", "ko": "ko", "hu": "hu",
    "hi": "hi",
    # Urdu not natively in XTTS - use Hindi as closest
    "ur": "hi",
    "pt-BR": "pt",
}

# ─────────────────────────────────────────────────────────────────
# EDGE TTS VOICE MAP
# ─────────────────────────────────────────────────────────────────
EDGE_VOICES = {
    "ur":    {"male": "ur-PK-AsadNeural",    "female": "ur-PK-UzmaNeural"},
    "en":    {"male": "en-US-GuyNeural",     "female": "en-US-JennyNeural"},
    "ar":    {"male": "ar-SA-HamedNeural",   "female": "ar-SA-ZariyahNeural"},
    "hi":    {"male": "hi-IN-MadhurNeural",  "female": "hi-IN-SwaraNeural"},
    "fr":    {"male": "fr-FR-HenriNeural",   "female": "fr-FR-DeniseNeural"},
    "de":    {"male": "de-DE-ConradNeural",  "female": "de-DE-KatjaNeural"},
    "es":    {"male": "es-ES-AlvaroNeural",  "female": "es-ES-ElviraNeural"},
    "tr":    {"male": "tr-TR-AhmetNeural",   "female": "tr-TR-EmelNeural"},
    "ru":    {"male": "ru-RU-DmitryNeural",  "female": "ru-RU-SvetlanaNeural"},
    "zh-cn": {"male": "zh-CN-YunxiNeural",   "female": "zh-CN-XiaoxiaoNeural"},
    "ja":    {"male": "ja-JP-KeitaNeural",   "female": "ja-JP-NanamiNeural"},
    "ko":    {"male": "ko-KR-InJoonNeural",  "female": "ko-KR-SunHiNeural"},
    "it":    {"male": "it-IT-DiegoNeural",   "female": "it-IT-ElsaNeural"},
    "pt":    {"male": "pt-BR-AntonioNeural", "female": "pt-BR-FranciscaNeural"},
    "pt-BR": {"male": "pt-BR-AntonioNeural", "female": "pt-BR-FranciscaNeural"},
    "nl":    {"male": "nl-NL-MaartenNeural", "female": "nl-NL-ColetteNeural"},
}

# ─────────────────────────────────────────────────────────────────
# VOICE REFERENCE EXTRACTION
# Extract reference audio clip for each unique speaker
# ─────────────────────────────────────────────────────────────────
def extract_speaker_reference(audio_path, segments, speaker_id, duration=8.0):
    """
    Extract a clean audio sample of a specific speaker.
    Used for voice cloning with Coqui XTTS v2.
    Returns path to reference audio file.
    """
    ref_path = os.path.join(VOICE_CACHE, f"ref_{speaker_id}.wav")
    
    # Return cached if exists
    if os.path.exists(ref_path):
        return ref_path
    
    if not PYDUB_OK:
        return None
    
    try:
        # Find segments belonging to this speaker
        speaker_segs = [s for s in segments if s.get("speaker") == speaker_id]
        if not speaker_segs:
            return None
        
        # Pick best segments (longer ones, avoid very short clips)
        good_segs = [s for s in speaker_segs if (s.get("end",0)-s.get("start",0)) > 1.5]
        if not good_segs:
            good_segs = speaker_segs
        
        audio = AudioSegment.from_file(audio_path)
        combined = AudioSegment.empty()
        
        for seg in good_segs[:5]:  # max 5 segments
            start_ms = int(seg["start"] * 1000)
            end_ms   = int(seg["end"]   * 1000)
            chunk = audio[start_ms:end_ms]
            if len(chunk) > 500:  # min 0.5s
                combined += chunk
            if len(combined) >= int(duration * 1000):
                break
        
        if len(combined) < 1000:
            return None
        
        # Trim to duration and normalize
        combined = combined[:int(duration * 1000)]
        try:
            combined = normalize(combined)
        except:
            pass
        
        # Export as 22050Hz mono WAV (optimal for XTTS)
        combined = combined.set_frame_rate(22050).set_channels(1)
        combined.export(ref_path, format="wav")
        
        size = os.path.getsize(ref_path)
        print(f"[TTS] Reference extracted: {speaker_id} ({size//1024} KB)")
        return ref_path
        
    except Exception as e:
        print(f"[TTS] Reference extraction failed for {speaker_id}: {e}")
        return None

# ─────────────────────────────────────────────────────────────────
# COQUI XTTS v2 - Voice Cloning TTS
# ─────────────────────────────────────────────────────────────────
def synth_coqui_clone(text, speaker_wav, lang, out_path):
    """
    Generate speech cloning the voice from speaker_wav.
    Uses Coqui XTTS v2 - best quality voice cloning.
    """
    if not COQUI_OK or TTS_MODEL is None:
        return False
    
    coqui_lang = COQUI_LANGS.get(lang.lower(), "en")
    
    try:
        TTS_MODEL.tts_to_file(
            text=text,
            speaker_wav=speaker_wav,
            language=coqui_lang,
            file_path=out_path,
        )
        return os.path.exists(out_path) and os.path.getsize(out_path) > 100
    except Exception as e:
        print(f"[TTS] Coqui clone error: {e}")
        return False

# ─────────────────────────────────────────────────────────────────
# EDGE TTS - Neural Voices (Fallback)
# ─────────────────────────────────────────────────────────────────
async def _edge_gen(text, voice, out, rate="+0%", pitch="+0Hz"):
    await edge_tts.Communicate(text, voice, rate=rate, pitch=pitch).save(out)

def synth_edge(text, voice, out, rate="+0%", pitch="+0Hz"):
    if not EDGE_OK:
        return False
    try:
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    pool.submit(asyncio.run, _edge_gen(text,voice,out,rate,pitch)).result(timeout=60)
            else:
                loop.run_until_complete(_edge_gen(text,voice,out,rate,pitch))
        except RuntimeError:
            asyncio.run(_edge_gen(text,voice,out,rate,pitch))
        return os.path.exists(out) and os.path.getsize(out) > 100
    except Exception as e:
        print(f"[TTS] Edge error: {e}")
        return False

def get_edge_voice(gender, lang):
    lang_key = lang.lower()
    voices = EDGE_VOICES.get(lang_key, EDGE_VOICES.get(lang_key.split("-")[0], EDGE_VOICES["en"]))
    return voices.get(gender, voices.get("male", "en-US-GuyNeural"))

# ─────────────────────────────────────────────────────────────────
# GTTS FALLBACK
# ─────────────────────────────────────────────────────────────────
def synth_gtts(text, lang, out):
    if not GTTS_OK:
        return False
    try:
        lang_code = lang.split("-")[0].lower()
        if lang_code == "ur":
            lang_code = "hi"  # Hindi as fallback for Urdu
        gTTS(text=text, lang=lang_code, slow=False).save(out)
        return os.path.exists(out) and os.path.getsize(out) > 100
    except Exception as e:
        print(f"[TTS] gTTS error: {e}")
        return False

# ─────────────────────────────────────────────────────────────────
# AUDIO DURATION
# ─────────────────────────────────────────────────────────────────
def get_duration(path):
    try:
        r = subprocess.run(
            ["ffprobe","-v","quiet","-print_format","json","-show_streams",path],
            capture_output=True, text=True, timeout=8)
        for s in json.loads(r.stdout).get("streams",[]):
            if "duration" in s:
                return float(s["duration"])
    except:
        pass
    try:
        if PYDUB_OK:
            return len(AudioSegment.from_file(path)) / 1000.0
    except:
        pass
    return 0.0

# ─────────────────────────────────────────────────────────────────
# STRETCH AUDIO TO TARGET DURATION
# ─────────────────────────────────────────────────────────────────
def stretch_to_duration(src, target_dur, dst):
    """Stretch/compress audio to match video timing"""
    cur = get_duration(src)
    if cur <= 0 or target_dur <= 0:
        shutil.copy(src, dst)
        return dst
    
    ratio = max(0.4, min(cur / target_dur, 3.5))
    
    # Build atempo filter chain
    if 0.5 <= ratio <= 2.0:
        af = f"atempo={ratio:.5f}"
    elif ratio > 2.0:
        r1 = min(ratio, 2.0)
        r2 = min(ratio / r1, 2.0)
        r3 = ratio / (r1 * r2)
        if r3 > 1.0:
            af = f"atempo={r1:.5f},atempo={r2:.5f},atempo={r3:.5f}"
        else:
            af = f"atempo={r1:.5f},atempo={r2:.5f}"
    else:
        r1 = max(ratio, 0.5)
        r2 = max(ratio / r1, 0.5)
        af = f"atempo={r1:.5f},atempo={r2:.5f}"
    
    cmd = ["ffmpeg", "-y", "-i", src, "-filter:a", af, dst]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    if r.returncode == 0 and os.path.exists(dst):
        return dst
    shutil.copy(src, dst)
    return dst

# ─────────────────────────────────────────────────────────────────
# MAIN: SYNTHESIZE SEGMENT
# ─────────────────────────────────────────────────────────────────
def synthesize_segment(text, lang, gender, speaker_ref_wav, out_path, style=None):
    """
    Synthesize speech for one segment.
    Priority: Coqui XTTS v2 (clone) > Edge TTS > gTTS
    
    Args:
        text: translated text
        lang: target language code
        gender: 'male' or 'female'
        speaker_ref_wav: path to speaker reference audio (for cloning)
        out_path: output file path
        style: dict with rate/pitch for edge TTS
    """
    # Method 1: Coqui XTTS v2 voice cloning (best quality)
    if COQUI_OK and speaker_ref_wav and os.path.exists(speaker_ref_wav):
        ok = synth_coqui_clone(text, speaker_ref_wav, lang, out_path)
        if ok:
            print(f"[TTS] ✓ Coqui XTTS v2 (cloned voice)")
            return out_path
    
    # Method 2: Edge TTS neural voice
    if EDGE_OK:
        voice = get_edge_voice(gender, lang)
        rate  = style.get("rate",  "+0%") if style else "+0%"
        pitch = style.get("pitch", "+0Hz") if style else "+0Hz"
        ok = synth_edge(text, voice, out_path, rate=rate, pitch=pitch)
        if ok:
            print(f"[TTS] ✓ Edge TTS ({voice})")
            return out_path
    
    # Method 3: gTTS fallback
    ok = synth_gtts(text, lang, out_path)
    if ok:
        print(f"[TTS] ✓ gTTS fallback")
        return out_path
    
    print(f"[TTS] ✗ All methods failed for: {text[:30]}")
    return None

# ─────────────────────────────────────────────────────────────────
# MAIN: BUILD COMPLETE DUBBED AUDIO
# ─────────────────────────────────────────────────────────────────
def build_dubbed_audio(segments, lang, video_duration,
                        original_audio_path, progress_callback=None):
    """
    Build the complete dubbed audio track.
    - Extracts voice reference for each speaker
    - Generates TTS for each segment (with voice cloning if available)
    - Stretches audio to match original timing
    - Overlays all segments onto a silent base track
    """
    if not PYDUB_OK:
        raise RuntimeError("pip install pydub")
    if not segments:
        raise RuntimeError("No segments to synthesize")
    
    if progress_callback:
        progress_callback("synthesize", "active", 60,
                         "Extracting speaker voice samples...")
    
    # ── Step 1: Extract reference audio for each unique speaker ──
    speakers = list(set(s.get("speaker","SPEAKER_00") for s in segments))
    ref_wavs = {}
    
    for sp in speakers:
        if original_audio_path and os.path.exists(original_audio_path):
            ref = extract_speaker_reference(
                original_audio_path, segments, sp, duration=8.0)
            ref_wavs[sp] = ref
            status = "✓" if ref else "✗"
            print(f"[TTS] Speaker {sp} reference: {status}")
        else:
            ref_wavs[sp] = None
    
    if progress_callback:
        progress_callback("synthesize", "active", 64, "Generating voices...")
    
    # ── Step 2: Generate TTS for each segment ──
    ts = datetime.now().strftime("%Y%m%d%H%M%S")
    seg_files = []
    total = len(segments)
    
    # Import OUTPUT_DIR
    from video_dubbing import OUTPUT_DIR
    
    for idx, seg in enumerate(segments):
        text   = seg.get("translated") or seg.get("text", "")
        if not text.strip():
            continue
        
        sp     = seg.get("speaker", "SPEAKER_00")
        gender = seg.get("gender", "male")
        style  = seg.get("tts_style", {"rate": "+0%", "pitch": "+0Hz"})
        start  = seg.get("start", 0)
        end    = seg.get("end", start + 3)
        dur    = end - start
        
        ref_wav = ref_wavs.get(sp)
        raw_out = os.path.join(OUTPUT_DIR, f"seg_{ts}_{idx}_raw.wav")
        
        # Synthesize
        result = synthesize_segment(
            text=text,
            lang=lang,
            gender=gender,
            speaker_ref_wav=ref_wav,
            out_path=raw_out,
            style=style
        )
        
        if result and os.path.exists(result):
            # Stretch to match original timing
            str_out = os.path.join(OUTPUT_DIR, f"seg_{ts}_{idx}_str.wav")
            stretch_to_duration(result, dur, str_out)
            try: os.remove(result)
            except: pass
            
            seg_files.append({
                "path": str_out,
                "start": start,
                "dur": dur,
                "speaker": sp,
                "text": text[:40]
            })
            print(f"[TTS] [{idx+1}/{total}] {sp}({gender}) | {text[:38]}...")
        else:
            print(f"[TTS] Failed seg {idx}: {text[:30]}")
        
        if progress_callback and total > 0:
            pct = 64 + int((idx + 1) / total * 20)
            progress_callback("synthesize", "active", pct,
                             f"Generating voice {idx+1}/{total} [{sp}]...")
    
    if not seg_files:
        raise RuntimeError("No TTS segments generated")
    
    # ── Step 3: Overlay all segments onto silent base track ──
    total_ms = int((video_duration or
                   (seg_files[-1]["start"] + seg_files[-1]["dur"] + 2)) * 1000) + 2000
    final = AudioSegment.silent(duration=total_ms)
    
    for sf in seg_files:
        try:
            a = AudioSegment.from_file(sf["path"])
            try: a = normalize(a)
            except: pass
            pos = int(sf["start"] * 1000)
            final = final.overlay(a, position=pos)
        except Exception as e:
            print(f"[TTS] Overlay error: {e}")
        finally:
            try: os.remove(sf["path"])
            except: pass
    
    # Export
    from video_dubbing import OUTPUT_DIR as OUT
    out_path = os.path.join(OUT, f"dubbed_audio_{ts}.wav")
    final.export(out_path, format="wav")
    
    sz = os.path.getsize(out_path)
    print(f"[TTS] Final audio: {out_path} ({sz//1024} KB)")
    
    if sz < 1000:
        raise RuntimeError(f"Audio file too small: {sz} bytes")
    
    if progress_callback:
        progress_callback("synthesize", "completed", 85, "Voice synthesis complete ✓")
    
    return out_path
