from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os, re, threading, json
from datetime import datetime
from werkzeug.utils import secure_filename

from database import (
    register_user, login_user, verify_token,
    save_dub_history, get_user_history, init_db
)
init_db()

from video_dubbing import (
    process_video_pipeline,
    download_video_from_url,
    is_url, is_yt,
    OUTPUT_DIR, UPLOAD_DIR, HF_API_TOKEN,
)

app = Flask("DubStudio")
CORS(app, origins="*")
app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024 * 1024

ALLOWED = {"mp4","mov","avi","mkv","webm","flv","wmv"}
jobs = {}

def allowed(f): return "." in f and f.rsplit(".",1)[1].lower() in ALLOWED

@app.after_request
def add_cors(r):
    r.headers["Access-Control-Allow-Origin"]   = "*"
    r.headers["Access-Control-Allow-Methods"]  = "GET, POST, OPTIONS"
    r.headers["Access-Control-Allow-Headers"]  = "Content-Type, Range"
    r.headers["Access-Control-Expose-Headers"] = "Content-Range, Accept-Ranges, Content-Length"
    return r

# ── AUTH: REGISTER ────────────────────────────────────────────
@app.route("/api/auth/register", methods=["POST"])
def register():
    try:
        d = request.get_json() or {}
        ok, result = register_user(
            d.get("firstName",""), d.get("lastName",""),
            d.get("email",""), d.get("password","")
        )
        if ok:
            return jsonify({"success":True, "user":result, "token":result["token"]})
        return jsonify({"success":False, "error":result}), 400
    except Exception as e:
        return jsonify({"success":False, "error":str(e)}), 500

# ── AUTH: LOGIN ────────────────────────────────────────────────
@app.route("/api/auth/login", methods=["POST"])
def login():
    try:
        d = request.get_json() or {}
        ok, result = login_user(d.get("email",""), d.get("password",""))
        if ok:
            return jsonify({"success":True, "user":result, "token":result["token"]})
        return jsonify({"success":False, "error":result}), 401
    except Exception as e:
        return jsonify({"success":False, "error":str(e)}), 500

# ── AUTH: VERIFY ───────────────────────────────────────────────
@app.route("/api/auth/verify", methods=["POST"])
def verify():
    try:
        token = (request.get_json() or {}).get("token","")
        user = verify_token(token)
        if user:
            return jsonify({"success":True, "user":user})
        return jsonify({"success":False, "error":"Invalid token"}), 401
    except Exception as e:
        return jsonify({"success":False, "error":str(e)}), 500

# ── AUTH: LOGOUT ───────────────────────────────────────────────
@app.route("/api/auth/logout", methods=["POST"])
def logout():
    return jsonify({"success":True, "message":"Logged out"})

# ── USER HISTORY ───────────────────────────────────────────────
@app.route("/api/history", methods=["GET"])
def history():
    try:
        token = request.headers.get("Authorization","").replace("Bearer ","")
        user = verify_token(token)
        if not user:
            return jsonify({"success":False,"error":"Unauthorized"}), 401
        return jsonify({"success":True, "history": get_user_history(user["id"])})
    except Exception as e:
        return jsonify({"success":False,"error":str(e)}), 500

# ── UPLOAD ─────────────────────────────────────────────────────
@app.route("/api/upload", methods=["POST"])
def upload():
    try:
        if "video" not in request.files:
            return jsonify({"success":False,"error":"No file"}), 400
        f = request.files["video"]
        if not f.filename or not allowed(f.filename):
            return jsonify({"success":False,"error":"Invalid file type"}), 400
        fname = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{secure_filename(f.filename)}"
        fpath = os.path.join(UPLOAD_DIR, fname)
        f.save(fpath)
        return jsonify({"success":True,"filename":fname,"filepath":fpath})
    except Exception as e:
        return jsonify({"success":False,"error":str(e)}), 500

# ── LOAD URL ───────────────────────────────────────────────────
@app.route("/api/load_url", methods=["POST"])
def load_url():
    try:
        url = (request.get_json() or {}).get("url","").strip()
        if not url or not re.match(r"^https?://", url):
            return jsonify({"success":False,"error":"Invalid URL"}), 400
        return jsonify({"success":True,"url":url,"filepath":url,
                        "source_type":"youtube" if is_yt(url) else "direct"})
    except Exception as e:
        return jsonify({"success":False,"error":str(e)}), 500

# ── PROCESS ────────────────────────────────────────────────────
@app.route("/api/process", methods=["POST"])
def process():
    try:
        data = request.get_json() or {}
        lang       = data.get("language","en")
        diar       = bool(data.get("diarization", True))
        face_det   = bool(data.get("face_detection", True))
        wav2lip    = bool(data.get("wav2lip", True))
        raw_url    = str(data.get("url","")).strip()
        raw_path   = str(data.get("filepath","")).strip()

        if raw_url and re.match(r"^https?://", raw_url):
            video_input = raw_url
        elif raw_path and re.match(r"^https?://", raw_path):
            video_input = raw_path
        elif raw_path and os.path.exists(raw_path):
            video_input = raw_path
        else:
            return jsonify({"success":False,"error":"No valid video source"}), 400

        job_id = f"job_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
        jobs[job_id] = {
            "status":"processing","stage":"download" if is_url(video_input) else "upload",
            "stage_status":"active" if is_url(video_input) else "completed",
            "progress":3,"message":"Starting...",
            "characters":[]
        }

        def update(stage, status, progress, message, characters=None):
            jobs[job_id].update({"status":"processing","stage":stage,
                                  "stage_status":status,"progress":progress,"message":message})
            # Update detected characters when face analysis completes
            if characters:
                jobs[job_id]["characters"] = characters
            # When face stage completes, read from pipeline if available
            if stage == "face" and status == "completed":
                try:
                    char_list = jobs[job_id].get("_profiles", [])
                    if char_list:
                        jobs[job_id]["characters"] = char_list
                except: pass

        def run():
            try:
                out = process_video_pipeline(
                    video_input, target_lang=lang,
                    use_diarization=diar,
                    use_wav2lip=wav2lip,
                    use_face_detection=face_det,
                    progress_callback=update
                )
                if out and os.path.exists(out):
                    jobs[job_id].update({
                        "status":"completed","stage":"merge","stage_status":"completed",
                        "progress":100,"message":"Dubbing complete!",
                        "output_path":out,
                        "download_url":f"/api/download/{os.path.basename(out)}",
                        "file_size":os.path.getsize(out)
                    })
                    # Save to history if user logged in
                    try:
                        token = jobs[job_id].get("user_token","")
                        user = verify_token(token) if token else None
                        if user:
                            save_dub_history(user["id"], jobs[job_id].get("video_name","unknown"),
                                           lang, "completed", os.path.basename(out))
                    except: pass
                else:
                    jobs[job_id].update({"status":"failed","stage_status":"error",
                                          "progress":0,"message":"Pipeline failed"})
            except Exception as e:
                jobs[job_id].update({"status":"failed","stage_status":"error",
                                      "progress":0,"message":str(e)})

        threading.Thread(target=run, daemon=True).start()
        return jsonify({"success":True,"job_id":job_id})
    except Exception as e:
        return jsonify({"success":False,"error":str(e)}), 500

# ── STATUS ─────────────────────────────────────────────────────
@app.route("/api/status/<job_id>")
def status(job_id):
    if job_id not in jobs:
        return jsonify({"success":False,"error":"Not found"}), 404
    return jsonify({"success":True,"job":jobs[job_id]})

# ── DOWNLOAD / STREAM ──────────────────────────────────────────
@app.route("/api/download/<filename>")
@app.route("/api/stream/<filename>")
def download(filename):
    path = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(path):
        return jsonify({"success":False,"error":"File not found"}), 404
    rh = request.headers.get("Range")
    if rh:
        size = os.path.getsize(path)
        m    = re.search(r"bytes=(\d+)-(\d*)", rh)
        b1   = int(m.group(1)) if m else 0
        b2   = int(m.group(2)) if m and m.group(2) else size-1
        b2   = min(b2, size-1)
        ln   = b2 - b1 + 1
        with open(path,"rb") as f:
            f.seek(b1); data = f.read(ln)
        rv = app.response_class(data, 206, mimetype="video/mp4", direct_passthrough=True)
        rv.headers.update({"Content-Range":f"bytes {b1}-{b2}/{size}",
                           "Accept-Ranges":"bytes","Content-Length":str(ln)})
        return rv
    resp = send_file(path, mimetype="video/mp4", as_attachment=False,
                     download_name=f"dubbed_{filename}")
    resp.headers["Accept-Ranges"]      = "bytes"
    resp.headers["Content-Disposition"] = f"inline; filename=\"dubbed_{filename}\""
    return resp

# ── CANCEL ─────────────────────────────────────────────────────
@app.route("/api/cancel/<job_id>", methods=["POST"])
def cancel(job_id):
    if job_id in jobs:
        jobs[job_id]["status"] = "cancelled"
        return jsonify({"success":True})
    return jsonify({"success":False}), 404

# ── LANGUAGES ──────────────────────────────────────────────────
@app.route("/api/languages")
def languages():
    return jsonify({"success":True,"languages":[
        {"code":"ur","name":"Urdu","flag":"🇵🇰"},
        {"code":"en","name":"English","flag":"🇬🇧"},
        {"code":"ar","name":"Arabic","flag":"🇸🇦"},
        {"code":"hi","name":"Hindi","flag":"🇮🇳"},
        {"code":"tr","name":"Turkish","flag":"🇹🇷"},
        {"code":"fr","name":"French","flag":"🇫🇷"},
        {"code":"de","name":"German","flag":"🇩🇪"},
        {"code":"es","name":"Spanish","flag":"🇪🇸"},
        {"code":"zh-cn","name":"Chinese","flag":"🇨🇳"},
        {"code":"ja","name":"Japanese","flag":"🇯🇵"},
        {"code":"ko","name":"Korean","flag":"🇰🇷"},
        {"code":"ru","name":"Russian","flag":"🇷🇺"},
        {"code":"pt-BR","name":"Portuguese","flag":"🇧🇷"},
        {"code":"it","name":"Italian","flag":"🇮🇹"},
        {"code":"nl","name":"Dutch","flag":"🇳🇱"},
    ]})

# ── PUBLIC URL ─────────────────────────────────────────────────
@app.route("/api/public-url")
def public_url():
    f = os.path.join(os.path.dirname(__file__),"public_url.txt")
    if os.path.exists(f):
        try:
            url = open(f).read().strip()
            if url: return jsonify({"success":True,"url":url})
        except: pass
    return jsonify({"success":False,"url":None})

# ── SHARE PAGE ─────────────────────────────────────────────────
@app.route("/share/<filename>")
def share_page(filename):
    """Beautiful share page for dubbed video - works on any device"""
    try:
        from share_advanced import create_video_share_page
        # Get public URL
        pub_url = "http://localhost:5000"
        url_file = os.path.join(os.path.dirname(__file__), "public_url.txt")
        if os.path.exists(url_file):
            pub_url = open(url_file).read().strip() or pub_url
        html = create_video_share_page(filename, pub_url)
        return html, 200, {"Content-Type": "text/html; charset=utf-8"}
    except Exception as e:
        # Fallback simple page
        filepath = os.path.join(OUTPUT_DIR, filename)
        if not os.path.exists(filepath):
            return "<h1>Video not found</h1>", 404
        return f"""<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Dubbed Video</title>
<style>body{{background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}}
video{{max-width:100%;max-height:100vh}}</style></head>
<body><video controls autoplay src="/api/stream/{filename}"></video></body></html>""", 200, {"Content-Type":"text/html"}

# ── GENERATE SHARE LINK ────────────────────────────────────────
@app.route("/api/share-link/<filename>")
def get_share_link(filename):
    """Get shareable link for a dubbed video"""
    filepath = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(filepath):
        return jsonify({"success":False,"error":"File not found"}), 404
    pub_url = "http://localhost:5000"
    url_file = os.path.join(os.path.dirname(__file__), "public_url.txt")
    if os.path.exists(url_file):
        try:
            pub_url = open(url_file).read().strip() or pub_url
        except: pass
    share_link  = f"{pub_url}/share/{filename}"
    stream_link = f"{pub_url}/api/stream/{filename}"
    dl_link     = f"{pub_url}/api/download/{filename}"
    whatsapp    = f"https://wa.me/?text=Watch%20this%20dubbed%20video%3A%20{share_link}"
    telegram    = f"https://t.me/share/url?url={share_link}&text=Watch%20this%20dubbed%20video!"
    return jsonify({
        "success":    True,
        "share_link": share_link,
        "stream_link":stream_link,
        "download_link": dl_link,
        "whatsapp":   whatsapp,
        "telegram":   telegram,
        "public_url": pub_url,
    })

if __name__ == "__main__":
    print("="*55)
    print("  DubStudio Pro Backend — http://localhost:5000")
    print("  React Frontend       — http://localhost:5173")
    print("="*55)
    app.run(debug=True, host="0.0.0.0", port=5000, use_reloader=False)