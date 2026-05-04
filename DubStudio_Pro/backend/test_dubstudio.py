"""
DubStudio Pro — Complete Test Suite
=====================================
Tests: Whisper, Backend API, Libraries, Pipeline
Run: python test_dubstudio.py
"""

import os, sys, time, json, requests, subprocess
from pathlib import Path

# ══════════════════════════════════════════
# COLORS
# ══════════════════════════════════════════
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
BLUE   = "\033[94m"
RESET  = "\033[0m"
BOLD   = "\033[1m"

def ok(msg):   print(f"  {GREEN}✔ {msg}{RESET}")
def fail(msg): print(f"  {RED}✘ {msg}{RESET}")
def warn(msg): print(f"  {YELLOW}⚠ {msg}{RESET}")
def info(msg): print(f"  {BLUE}→ {msg}{RESET}")
def header(msg): print(f"\n{BOLD}{'═'*50}\n  {msg}\n{'═'*50}{RESET}")

results = {"passed": 0, "failed": 0, "warned": 0}

def test(name, condition, fail_msg="", warn_only=False):
    if condition:
        ok(name)
        results["passed"] += 1
    elif warn_only:
        warn(f"{name} — {fail_msg}")
        results["warned"] += 1
    else:
        fail(f"{name} — {fail_msg}")
        results["failed"] += 1
    return condition


# ══════════════════════════════════════════
# TEST 1: LIBRARIES
# ══════════════════════════════════════════
header("TEST 1: Required Libraries")

libs = {
    "whisper":          ("OpenAI Whisper",      False),
    "flask":            ("Flask server",         False),
    "pydub":            ("PyDub audio",          False),
    "edge_tts":         ("Edge TTS",             False),
    "deep_translator":  ("Google Translator",    False),
    "cv2":              ("OpenCV",               True),   # optional
    "numpy":            ("NumPy",                False),
    "scipy":            ("SciPy",                False),
    "ffmpeg":           ("FFmpeg (via subprocess)", False),
}

for pkg, (label, optional) in libs.items():
    if pkg == "ffmpeg":
        try:
            r = subprocess.run(["ffmpeg", "-version"], capture_output=True, timeout=5)
            test(f"{label}", r.returncode == 0, "ffmpeg not found — install ffmpeg", warn_only=optional)
        except:
            test(f"{label}", False, "ffmpeg not found in PATH", warn_only=False)
    else:
        try:
            __import__(pkg)
            test(f"{label}", True)
        except ImportError:
            test(f"{label}", False, f"pip install {pkg}", warn_only=optional)


# ══════════════════════════════════════════
# TEST 2: FILE STRUCTURE
# ══════════════════════════════════════════
header("TEST 2: Project File Structure")

BASE = Path(__file__).parent

required_files = [
    ("App.py",              "Main Flask server"),
    ("video_dubbing.py",    "AI dubbing pipeline"),
    ("database.py",         "Database module"),
    ("requirements.txt",    "Dependencies list"),
]

optional_files = [
    ("advanced_tts.py",     "Advanced TTS"),
    ("speaker_engine.py",   "Speaker engine"),
    ("railway.json",        "Railway config"),
    ("Wav2Lip/inference.py","Wav2Lip inference"),
]

for fname, label in required_files:
    fpath = BASE / fname
    test(f"{label} ({fname})", fpath.exists(), f"Missing: {fpath}")

for fname, label in optional_files:
    fpath = BASE / fname
    test(f"{label} ({fname})", fpath.exists(), "Not found", warn_only=True)

# Check model cache
model_cache = BASE / "model_cache" / "whisper"
small_pt    = model_cache / "small.pt"
medium_pt   = model_cache / "medium.pt"

if medium_pt.exists():
    size_mb = medium_pt.stat().st_size / 1024 / 1024
    test(f"Whisper medium.pt ({size_mb:.0f}MB)", size_mb > 100, "File too small — corrupt?")
elif small_pt.exists():
    size_mb = small_pt.stat().st_size / 1024 / 1024
    test(f"Whisper small.pt ({size_mb:.0f}MB)", size_mb > 50, "File too small — corrupt?")
else:
    test("Whisper model cache", False, "No .pt file found in model_cache/whisper/")


# ══════════════════════════════════════════
# TEST 3: WHISPER MODEL LOAD
# ══════════════════════════════════════════
header("TEST 3: Whisper Model Load")

try:
    import whisper
    cache_dir = str(BASE / "model_cache" / "whisper")

    # Find which model is available
    model_name = None
    for m in ["small", "medium"]:
        if (Path(cache_dir) / f"{m}.pt").exists():
            model_name = m
            break

    if model_name:
        info(f"Loading '{model_name}' model from cache...")
        t0 = time.time()
        model = whisper.load_model(model_name, download_root=cache_dir)
        elapsed = time.time() - t0
        test(f"Whisper '{model_name}' loaded in {elapsed:.1f}s", model is not None, "Load failed")

        # Quick transcription test with silence
        info("Testing transcription with silent audio...")
        import numpy as np
        silent = np.zeros(16000, dtype=np.float32)  # 1 second silence
        result = model.transcribe(silent, fp16=False, temperature=0, best_of=1, beam_size=1)
        test("Whisper transcription works", "segments" in result, "transcribe() failed")
    else:
        test("Whisper model file", False, "No model found — run App.py once to download")

except Exception as e:
    test("Whisper load", False, str(e))


# ══════════════════════════════════════════
# TEST 4: EDGE TTS
# ══════════════════════════════════════════
header("TEST 4: Edge TTS Voice Synthesis")

try:
    import asyncio, edge_tts, tempfile

    async def _test_tts():
        out = tempfile.mktemp(suffix=".wav")
        await edge_tts.Communicate("Hello, this is a test.", "en-US-GuyNeural").save(out)
        return out

    info("Testing Edge TTS (en-US-GuyNeural)...")
    out = asyncio.run(_test_tts())
    size = os.path.getsize(out) if os.path.exists(out) else 0
    test(f"Edge TTS synthesis ({size} bytes)", size > 100, "No audio generated")
    if os.path.exists(out): os.remove(out)

    # Test Urdu voice
    async def _test_urdu():
        out = tempfile.mktemp(suffix=".wav")
        await edge_tts.Communicate("یہ ایک ٹیسٹ ہے", "ur-PK-AsadNeural").save(out)
        return out

    info("Testing Urdu TTS (ur-PK-AsadNeural)...")
    out = asyncio.run(_test_urdu())
    size = os.path.getsize(out) if os.path.exists(out) else 0
    test(f"Urdu TTS synthesis ({size} bytes)", size > 100, "No audio generated")
    if os.path.exists(out): os.remove(out)

except Exception as e:
    test("Edge TTS", False, str(e))


# ══════════════════════════════════════════
# TEST 5: TRANSLATION
# ══════════════════════════════════════════
header("TEST 5: Google Translation")

try:
    from deep_translator import GoogleTranslator
    info("Translating 'Hello world' to Urdu...")
    result = GoogleTranslator(source="en", target="ur").translate("Hello world")
    test(f"Translation works: '{result}'", bool(result), "Empty result")
except Exception as e:
    test("Google Translation", False, str(e))


# ══════════════════════════════════════════
# TEST 6: BACKEND SERVER
# ══════════════════════════════════════════
header("TEST 6: Backend API Server")

BASE_URL = "http://127.0.0.1:5000"

# Check if server is running
try:
    r = requests.get(f"{BASE_URL}/api/health", timeout=3)
    server_running = r.status_code == 200
except:
    server_running = False

if not server_running:
    warn("Backend server not running — start it with: python App.py")
    warn("Skipping API tests")
    results["warned"] += 1
else:
    ok("Backend server is running!")
    results["passed"] += 1

    # Test health endpoint
    try:
        r = requests.get(f"{BASE_URL}/api/health", timeout=5)
        data = r.json()
        test("Health endpoint (/api/health)", r.status_code == 200, f"Status: {r.status_code}")
        info(f"Server response: {data}")
    except Exception as e:
        test("Health endpoint", False, str(e))

    # Test status endpoint
    try:
        r = requests.get(f"{BASE_URL}/api/status/test_job", timeout=5)
        test("Status endpoint (/api/status/...)", r.status_code in [200, 404], f"Status: {r.status_code}")
    except Exception as e:
        test("Status endpoint", False, str(e))

    # Test languages endpoint
    try:
        r = requests.get(f"{BASE_URL}/api/languages", timeout=5)
        test("Languages endpoint (/api/languages)", r.status_code == 200, f"Status: {r.status_code}")
        if r.status_code == 200:
            langs = r.json()
            info(f"Available languages: {len(langs)} found")
    except Exception as e:
        test("Languages endpoint", False, str(e), warn_only=True)


# ══════════════════════════════════════════
# TEST 7: DATABASE
# ══════════════════════════════════════════
header("TEST 7: Database")

try:
    sys.path.insert(0, str(BASE))
    from database import init_db, get_db
    info("Initializing database...")
    init_db()
    test("Database init", True)

    db_file = BASE / "dubstudio.db"
    test(f"DB file exists ({db_file.name})", db_file.exists(), "DB file not created")
except Exception as e:
    test("Database", False, str(e))


# ══════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════
total = results["passed"] + results["failed"] + results["warned"]
header("TEST SUMMARY")
print(f"  {GREEN}Passed:  {results['passed']}{RESET}")
print(f"  {RED}Failed:  {results['failed']}{RESET}")
print(f"  {YELLOW}Warnings:{results['warned']}{RESET}")
print(f"  Total:   {total}\n")

if results["failed"] == 0:
    print(f"{GREEN}{BOLD}  ✔ All tests passed! System ready.{RESET}\n")
elif results["failed"] <= 2:
    print(f"{YELLOW}{BOLD}  ⚠ Minor issues — system may still work.{RESET}\n")
else:
    print(f"{RED}{BOLD}  ✘ Multiple failures — fix issues above.{RESET}\n")
