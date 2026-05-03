"""
DubStudio Pro - Advanced Public Sharing
Creates shareable links for dubbed videos
Works on mobile, laptop, anywhere!
"""
import os, sys, subprocess, time, re, json, socket, threading
import urllib.request

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except: return "localhost"

def save_public_url(url):
    with open(os.path.join(BASE_DIR, "public_url.txt"), "w") as f:
        f.write(url.strip())

def clear_public_url():
    try: os.remove(os.path.join(BASE_DIR, "public_url.txt"))
    except: pass

def print_qr_terminal(url):
    """Print QR code in terminal using qrcode library"""
    try:
        import qrcode
        qr = qrcode.QRCode(border=1)
        qr.add_data(url)
        qr.make(fit=True)
        qr.print_ascii(invert=True)
        print(f"\n  Scan QR code with your phone to open!")
    except ImportError:
        subprocess.run([sys.executable, "-m", "pip", "install", "qrcode", "-q", "--user"],
                      capture_output=True)
        try:
            import qrcode
            qr = qrcode.QRCode(border=1)
            qr.add_data(url)
            qr.make(fit=True)
            qr.print_ascii(invert=True)
        except:
            print(f"  (Install qrcode for QR: pip install qrcode)")

def start_backend():
    print("  Starting backend server...")
    proc = subprocess.Popen(
        [sys.executable, "App.py"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        cwd=BASE_DIR
    )
    time.sleep(4)
    return proc

def try_localtunnel():
    """Use localtunnel - completely free, no account"""
    print("  Trying localtunnel...")
    proc = subprocess.Popen(
        "npx --yes localtunnel --port 5000",
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True, shell=True, cwd=BASE_DIR
    )
    for line in iter(proc.stdout.readline, ""):
        line = line.strip()
        if line: print(f"    {line}")
        m = re.search(r"https://[a-z0-9\-]+\.loca\.lt", line)
        if m:
            return proc, m.group(0)
    return proc, None

def try_serveo():
    """Use serveo.net - SSH based, no install"""
    print("  Trying serveo.net...")
    try:
        proc = subprocess.Popen(
            ["ssh", "-o", "StrictHostKeyChecking=no",
             "-o", "ServerAliveInterval=60",
             "-R", "80:localhost:5000", "serveo.net"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        for line in iter(proc.stdout.readline, ""):
            line = line.strip()
            if line: print(f"    {line}")
            m = re.search(r"https?://\S+\.serveo\.net", line)
            if m: return proc, m.group(0)
        return proc, None
    except: return None, None

def create_video_share_page(video_filename, public_url):
    """
    Create a beautiful HTML share page for the video.
    This page works on ANY device - mobile, tablet, laptop.
    """
    video_url = f"{public_url}/api/stream/{video_filename}"
    download_url = f"{public_url}/api/download/{video_filename}"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DubStudio Pro - Dubbed Video</title>
<style>
  *{{box-sizing:border-box;margin:0;padding:0}}
  body{{background:#07070f;color:#e8e6ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh}}
  .page{{max-width:800px;margin:0 auto;padding:1.5rem}}
  .header{{text-align:center;padding:2rem 0 1.5rem}}
  .logo{{font-size:2rem;margin-bottom:.5rem}}
  .title{{font-size:1.5rem;font-weight:700;background:linear-gradient(135deg,#c4b5fd,#818cf8);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}}
  .subtitle{{font-size:.9rem;color:rgba(200,195,255,.5);margin-top:.25rem}}
  .video-wrap{{background:#000;border-radius:16px;overflow:hidden;margin:1.5rem 0;
    border:1px solid rgba(109,90,255,.2);box-shadow:0 8px 32px rgba(0,0,0,.5)}}
  video{{width:100%;display:block;max-height:70vh}}
  .actions{{display:flex;gap:.75rem;flex-wrap:wrap;justify-content:center;margin:1.5rem 0}}
  .btn{{display:inline-flex;align-items:center;gap:.5rem;padding:.85rem 1.75rem;
    border-radius:50px;font-weight:600;font-size:.9rem;cursor:pointer;transition:all .2s;
    text-decoration:none;border:none}}
  .btn-dl{{background:linear-gradient(135deg,#22c55e,#16a34a);color:white;
    box-shadow:0 4px 16px rgba(34,197,94,.3)}}
  .btn-dl:hover{{transform:translateY(-2px);box-shadow:0 8px 24px rgba(34,197,94,.4)}}
  .btn-share{{background:rgba(109,90,255,.15);color:#c4b5fd;
    border:1.5px solid rgba(109,90,255,.3)}}
  .btn-share:hover{{background:rgba(109,90,255,.25)}}
  .share-links{{background:rgba(13,13,26,.8);border:1px solid rgba(109,90,255,.15);
    border-radius:14px;padding:1.25rem;margin:1rem 0}}
  .share-title{{font-size:.8rem;font-weight:700;color:rgba(200,195,255,.45);
    text-transform:uppercase;letter-spacing:.06em;margin-bottom:.85rem}}
  .share-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.6rem}}
  .share-btn{{display:flex;align-items:center;gap:.5rem;padding:.65rem 1rem;
    border-radius:10px;font-size:.82rem;font-weight:600;text-decoration:none;
    transition:all .2s;border:1px solid;cursor:pointer;background:none;font-family:inherit;
    color:inherit;width:100%;justify-content:center}}
  .wa{{background:rgba(37,211,102,.1);border-color:rgba(37,211,102,.25);color:#4ade80}}
  .wa:hover{{background:rgba(37,211,102,.2)}}
  .tg{{background:rgba(0,136,204,.1);border-color:rgba(0,136,204,.25);color:#7dd3fc}}
  .tg:hover{{background:rgba(0,136,204,.2)}}
  .cp{{background:rgba(109,90,255,.1);border-color:rgba(109,90,255,.25);color:#c4b5fd}}
  .cp:hover{{background:rgba(109,90,255,.2)}}
  .url-box{{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
    border-radius:10px;padding:.75rem 1rem;font-size:.82rem;color:#a78bfa;
    font-family:monospace;word-break:break-all;margin-top:.75rem;cursor:pointer}}
  .footer{{text-align:center;padding:2rem 0 1rem;font-size:.78rem;color:rgba(200,195,255,.25)}}
  @media(max-width:480px){{.actions{{flex-direction:column}}.btn{{width:100%;justify-content:center}}}}
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="logo">🎬</div>
    <div class="title">DubStudio Pro</div>
    <div class="subtitle">Your dubbed video is ready to watch & share</div>
  </div>

  <div class="video-wrap">
    <video controls autoplay playsinline preload="metadata"
           poster="" id="vid">
      <source src="{video_url}" type="video/mp4">
      <p style="padding:2rem;text-align:center;color:#fca5a5">
        Your browser doesn't support HTML5 video.
        <a href="{download_url}" style="color:#a78bfa">Download the video</a> instead.
      </p>
    </video>
  </div>

  <div class="actions">
    <a href="{download_url}" class="btn btn-dl" download>
      ⬇ Download Video
    </a>
    <button class="btn btn-share" onclick="copyLink()">
      🔗 Copy Link
    </button>
  </div>

  <div class="share-links">
    <div class="share-title">📱 Share on</div>
    <div class="share-grid">
      <a class="share-btn wa"
         href="https://wa.me/?text={urllib.parse.quote(f'Watch this dubbed video: {public_url}/share/{video_filename}')}"
         target="_blank">
        📱 WhatsApp
      </a>
      <a class="share-btn tg"
         href="https://t.me/share/url?url={urllib.parse.quote(f'{public_url}/share/{video_filename}')}&text={urllib.parse.quote('Watch this dubbed video!')}"
         target="_blank">
        ✈️ Telegram
      </a>
      <button class="share-btn cp" onclick="copyLink()">
        📋 Copy Link
      </button>
    </div>
    <div class="url-box" onclick="copyLink()" title="Click to copy">
      {public_url}/share/{video_filename}
    </div>
  </div>

  <div class="footer">Powered by DubStudio Pro · AI Video Dubbing</div>
</div>

<script>
function copyLink() {{
  const url = "{public_url}/share/{video_filename}";
  navigator.clipboard.writeText(url).then(() => {{
    alert("Link copied! Share it with anyone.");
  }}).catch(() => {{
    prompt("Copy this link:", url);
  }});
}}
// Auto-quality for slow connections
const vid = document.getElementById("vid");
if (vid) {{
  vid.addEventListener("error", function() {{
    console.log("Video load error, trying again...");
    setTimeout(() => vid.load(), 2000);
  }});
}}
</script>
</body>
</html>"""
    return html


def main():
    print("\n" + "="*60)
    print("  DubStudio Pro - Advanced Public Video Sharing")
    print("  Works on Mobile, Tablet, Laptop - Anywhere!")
    print("="*60 + "\n")

    local_ip = get_local_ip()
    print(f"  Local IP: {local_ip}")

    # Start backend
    print("\n[1/3] Starting backend server...")
    be = start_backend()
    print(f"  Backend: http://localhost:5000\n")

    # Create public tunnel
    print("[2/3] Creating public tunnel (free)...")
    tunnel_proc = None
    public_url = None

    try:
        tunnel_proc, public_url = try_localtunnel()
    except Exception as e:
        print(f"  localtunnel error: {e}")

    if not public_url:
        try:
            tunnel_proc, public_url = try_serveo()
        except: pass

    if public_url:
        save_public_url(public_url)

        print("\n" + "="*60)
        print("  ✅ PUBLIC URL READY!")
        print("="*60)
        print(f"\n  🌍 Public URL  : {public_url}")
        print(f"  🖥️  Local URL   : http://localhost:5000")
        print(f"  🌐 Frontend    : http://localhost:5173")
        print(f"\n  📱 Share video link format:")
        print(f"  {public_url}/share/[dubbed_video_filename].mp4")
        print(f"\n  💡 After dubbing, video link auto-shows in Studio!")

        # Print QR code
        print(f"\n  📷 QR Code (scan with phone):")
        print_qr_terminal(public_url)

        print(f"\n  ⚠️  Ctrl+C to stop sharing")
        print("="*60 + "\n")

        try:
            if tunnel_proc:
                tunnel_proc.wait()
        except KeyboardInterrupt:
            print("\n  Stopping...")
    else:
        print("\n  ❌ Public tunnel failed.")
        print(f"\n  📱 Local network sharing:")
        print(f"  http://{local_ip}:5000")
        print(f"  (Works on same WiFi network)")
        print(f"\n  To use from anywhere:")
        print(f"  npm install -g localtunnel")
        print(f"  lt --port 5000")

    clear_public_url()
    try:
        if tunnel_proc: tunnel_proc.terminate()
        be.terminate()
    except: pass

if __name__ == "__main__":
    import urllib.parse
    main()
