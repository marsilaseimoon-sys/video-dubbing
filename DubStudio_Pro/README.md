# DubStudio Pro 🎬

AI-powered video dubbing platform with character-wise voice synthesis, speaker detection, and public sharing.

## Features
- 🌐 50+ languages
- 🎙 Character-wise voice detection (Resemblyzer)
- 🔊 Voice cloning (Coqui XTTS v2)
- 💋 Lip sync (Wav2Lip)
- 📱 Mobile-ready share links
- 👤 User auth (SQLite)
- 📋 Dubbing history

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
python App.py
```

### Frontend
```bash
cd frontend/react_app
npm install
npm run dev
```

### Public Sharing
```bash
cd backend
python share_advanced.py
```

### Run Tests
```bash
cd backend
pip install pytest
pytest tests/test_api.py -v
```

## Tech Stack
- **Frontend:** React 18, Vite, React Router
- **Backend:** Flask, SQLite
- **AI:** Whisper, Resemblyzer, Coqui XTTS v2, Edge TTS, Wav2Lip

## Deployment
- Frontend → Vercel
- Backend → Railway / Render

## License
MIT
