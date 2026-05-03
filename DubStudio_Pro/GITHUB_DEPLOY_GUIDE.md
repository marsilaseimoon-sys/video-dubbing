# GitHub Upload + Deploy Guide

## STEP 1: GitHub Upload

### Install Git (if not installed)
Download from: https://git-scm.com/download/win

### Upload to GitHub (CMD mein):
```bash
cd E:\Downloads\DubStudio_Pro

git init
git add .
git commit -m "Initial commit: DubStudio Pro AI Dubbing Platform"
```

### GitHub pe new repository banao:
1. github.com pe login karo
2. "New repository" click karo
3. Name: `dubstudio-pro`
4. Public/Private choose karo
5. "Create repository" click karo

### Push karo:
```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/dubstudio-pro.git
git push -u origin main
```

---

## STEP 2: Vercel pe Frontend Deploy

1. **vercel.com** pe jao — GitHub se login karo
2. "New Project" click karo
3. `dubstudio-pro` repo select karo
4. Settings:
   - **Root Directory:** `frontend/react_app`
   - **Framework:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. **Deploy** click karo

✅ Frontend URL milega: `https://dubstudio-pro.vercel.app`

---

## STEP 3: Railway pe Backend Deploy

1. **railway.app** pe jao — GitHub se login karo
2. "New Project" → "Deploy from GitHub repo"
3. `dubstudio-pro` repo select karo
4. **Root Directory:** `backend`
5. Environment Variables add karo:
   - `PORT` = `5000`
   - `FLASK_ENV` = `production`
6. Deploy!

✅ Backend URL milega: `https://dubstudio-pro.railway.app`

---

## STEP 4: Connect Frontend to Backend

Vercel mein Environment Variable add karo:
- `VITE_API_URL` = `https://dubstudio-pro.railway.app`

Studio.jsx mein update:
```js
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'
```

---

## Note: Backend Heavy Dependencies
Railway free tier mein Whisper + PyTorch install hoga (time lagega).
For production: Use **Render.com** (more RAM) or **Heroku**.

Heavy models (Whisper, Coqui) work better on paid plans.
For demo/submission: Local backend + Vercel frontend is fine.

