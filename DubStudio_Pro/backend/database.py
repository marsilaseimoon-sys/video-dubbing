"""
DubStudio Pro - Database Module
SQLite - User Authentication
"""
import sqlite3, os, hashlib, secrets, re
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH  = os.path.join(BASE_DIR, "dubstudio.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Create tables if not exist"""
    conn = get_db()
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name  TEXT NOT NULL,
            last_name   TEXT NOT NULL,
            email       TEXT UNIQUE NOT NULL,
            password    TEXT NOT NULL,
            token       TEXT,
            created_at  TEXT DEFAULT (datetime('now')),
            last_login  TEXT
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS dub_history (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL,
            video_name  TEXT,
            target_lang TEXT,
            status      TEXT,
            output_file TEXT,
            created_at  TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    conn.commit()
    conn.close()
    print("[DB] Database initialized ✓")

def hash_password(pw):
    salt = "dubstudio_salt_2025"
    return hashlib.sha256(f"{salt}{pw}".encode()).hexdigest()

def generate_token():
    return secrets.token_hex(32)

def is_valid_email(email):
    return bool(re.match(r'^[^@]+@[^@]+\.[^@]+$', email))

# ── REGISTER ──────────────────────────────────────────────────
def register_user(first_name, last_name, email, password):
    if not all([first_name, last_name, email, password]):
        return False, "All fields required"
    if not is_valid_email(email):
        return False, "Invalid email"
    if len(password) < 6:
        return False, "Password must be at least 6 characters"
    try:
        conn = get_db()
        c = conn.cursor()
        # Check if email exists
        c.execute("SELECT id FROM users WHERE email=?", (email.lower(),))
        if c.fetchone():
            conn.close()
            return False, "Email already registered"
        token = generate_token()
        c.execute('''
            INSERT INTO users (first_name, last_name, email, password, token)
            VALUES (?, ?, ?, ?, ?)
        ''', (first_name.strip(), last_name.strip(),
              email.lower().strip(), hash_password(password), token))
        conn.commit()
        user_id = c.lastrowid
        conn.close()
        return True, {
            "id": user_id,
            "name": f"{first_name} {last_name}",
            "email": email.lower(),
            "token": token
        }
    except Exception as e:
        return False, str(e)

# ── LOGIN ─────────────────────────────────────────────────────
def login_user(email, password):
    if not email or not password:
        return False, "Email and password required"
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE email=? AND password=?",
                  (email.lower().strip(), hash_password(password)))
        user = c.fetchone()
        if not user:
            conn.close()
            return False, "Invalid email or password"
        # Update token and last login
        token = generate_token()
        c.execute("UPDATE users SET token=?, last_login=datetime('now') WHERE id=?",
                  (token, user["id"]))
        conn.commit()
        conn.close()
        return True, {
            "id":    user["id"],
            "name":  f"{user['first_name']} {user['last_name']}",
            "email": user["email"],
            "token": token
        }
    except Exception as e:
        return False, str(e)

# ── VERIFY TOKEN ──────────────────────────────────────────────
def verify_token(token):
    if not token: return None
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE token=?", (token,))
        user = c.fetchone()
        conn.close()
        if user:
            return {"id": user["id"], "name": f"{user['first_name']} {user['last_name']}",
                    "email": user["email"]}
        return None
    except: return None

# ── SAVE DUB HISTORY ──────────────────────────────────────────
def save_dub_history(user_id, video_name, target_lang, status, output_file=None):
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute('''
            INSERT INTO dub_history (user_id, video_name, target_lang, status, output_file)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, video_name, target_lang, status, output_file))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[DB] History save error: {e}")

# ── GET USER HISTORY ──────────────────────────────────────────
def get_user_history(user_id):
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute('''
            SELECT * FROM dub_history WHERE user_id=?
            ORDER BY created_at DESC LIMIT 20
        ''', (user_id,))
        rows = [dict(r) for r in c.fetchall()]
        conn.close()
        return rows
    except: return []

# Initialize on import
init_db()
