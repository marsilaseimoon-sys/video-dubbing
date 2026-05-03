@echo off
title DubStudio Pro - Install Libraries
color 0A
echo.
echo ============================================
echo   Installing All Required Libraries
echo ============================================
echo.
echo [1/6] Flask + CORS...
python -m pip install flask flask-cors werkzeug -q --user
echo [2/6] Whisper (AI Transcription)...
python -m pip install openai-whisper -q --user
echo [3/6] Translation + TTS...
python -m pip install deep-translator edge-tts gTTS pydub -q --user
echo [4/6] YouTube Download...
python -m pip install pytubefix yt-dlp -q --user
echo [5/6] Resemblyzer (Speaker ID)...
python -m pip install resemblyzer scipy numpy -q --user
echo [6/6] Other utilities...
python -m pip install pyannote.audio -q --user
echo.
echo ============================================
echo   All libraries installed!
echo   Run run_all.bat to start DubStudio Pro
echo ============================================
pause
