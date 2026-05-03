import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

/* ── DATA ────────────────────────────────────────────────────── */
const LANGS = [
  { flag: '🇵🇰', name: 'Urdu'     }, { flag: '🇬🇧', name: 'English'  },
  { flag: '🇸🇦', name: 'Arabic'   }, { flag: '🇮🇳', name: 'Hindi'    },
  { flag: '🇪🇸', name: 'Spanish'  }, { flag: '🇫🇷', name: 'French'   },
  { flag: '🇩🇪', name: 'German'   }, { flag: '🇨🇳', name: 'Chinese'  },
  { flag: '🇯🇵', name: 'Japanese' }, { flag: '🇰🇷', name: 'Korean'   },
  { flag: '🇮🇹', name: 'Italian'  }, { flag: '🇷🇺', name: 'Russian'  },
  { flag: '🇹🇷', name: 'Turkish'  }, { flag: '🇧🇷', name: 'Port. BR' },
  { flag: '🇳🇱', name: 'Dutch'    }, { flag: '🇵🇱', name: 'Polish'   },
]

const FEATURES = [
  {
    icon: '🎙', title: 'Whisper AI Transcription',
    desc: 'OpenAI Whisper large model with word-level timestamps. 99% accuracy in 99 languages.',
    tag: 'CORE AI',
  },
  {
    icon: '👤', title: 'Face & Gender Detection',
    desc: 'InsightFace detects every character, their gender and age — voice assigned automatically.',
    tag: 'SMART',
  },
  {
    icon: '🔊', title: 'XTTS v2 Voice Cloning',
    desc: 'Coqui XTTS v2 clones the original speaker\'s voice. Not TTS — actual voice DNA.',
    tag: 'PRO',
  },
  {
    icon: '💋', title: 'Wav2Lip Sync',
    desc: 'Per-character lip sync. Every face in the video gets lips matched to new audio.',
    tag: 'ADVANCED',
  },
  {
    icon: '👥', title: 'Speaker Diarization',
    desc: 'Pyannote 3.1 separates speakers automatically. Each gets their own dubbed voice.',
    tag: 'AI',
  },
  {
    icon: '🔗', title: 'Any Platform',
    desc: 'YouTube, Shorts, TikTok, Instagram, direct URL, local file. Everything works.',
    tag: 'FLEXIBLE',
  },
]

const STEPS = [
  { n: '01', icon: '📁', title: 'Drop Your Video',  desc: 'Upload MP4/MOV/AVI or paste any YouTube, TikTok, or direct URL.' },
  { n: '02', icon: '🌍', title: 'Pick a Language',  desc: 'Choose from 50+ target languages including Urdu, Arabic, Hindi, English.' },
  { n: '03', icon: '🤖', title: 'AI Does the Work', desc: 'Whisper → Face detect → Translate → Clone voices → Lip sync. Automatic.' },
  { n: '04', icon: '⬇',  title: 'Download & Share', desc: 'Preview, download MP4, or share via public link. Mobile-ready output.' },
]

const REVIEWS = [
  { name: 'Ahmed H.', role: 'YouTuber · 2M subs', init: 'AH', stars: 5,
    text: 'We now publish in 8 languages every week. DubStudio cut our production cost by 90%.' },
  { name: 'Fatima S.', role: 'Content Creator', init: 'FS', stars: 5,
    text: 'The character voice detection correctly identified 3 speakers in my drama clip. Insane.' },
  { name: 'Ali R.', role: 'Video Producer', init: 'AR', stars: 5,
    text: 'Production-ready quality. I charged clients for this work before discovering DubStudio.' },
]

const STATS = [
  { value: '50+',   label: 'Languages'     },
  { value: '10K+',  label: 'Videos Dubbed' },
  { value: '98%',   label: 'Satisfaction'  },
  { value: 'Free',  label: 'To Start'      },
]

/* ── TICKER COMPONENT ───────────────────────────────────────── */
function LangTicker() {
  const doubled = [...LANGS, ...LANGS]
  return (
    <div style={{ overflow: 'hidden', position: 'relative' }}>
      <div style={{
        display: 'flex', gap: '12px',
        animation: 'tickerScroll 28s linear infinite',
        width: 'max-content',
      }}>
        {doubled.map((l, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '8px 16px', borderRadius: '50px',
            background: 'rgba(255,255,255,.04)',
            border: '1px solid rgba(255,255,255,.08)',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            <span style={{ fontSize: '1.1rem' }}>{l.flag}</span>
            <span style={{ fontSize: '.78rem', fontWeight: 600, color: 'rgba(220,215,255,.5)', fontFamily: "'DM Sans', sans-serif" }}>{l.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── COUNTER ────────────────────────────────────────────────── */
function Counter({ target, duration = 1800 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const num = parseInt(target.replace(/\D/g, ''))
        if (!num) { setCount(target); return }
        const step = num / (duration / 16)
        let cur = 0
        const timer = setInterval(() => {
          cur = Math.min(cur + step, num)
          setCount(Math.floor(cur) + (target.includes('+') ? '+' : target.includes('%') ? '%' : ''))
          if (cur >= num) clearInterval(timer)
        }, 16)
      }
    }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target, duration])

  return <span ref={ref}>{count || '0'}</span>
}

/* ── MAIN ───────────────────────────────────────────────────── */
export default function Home() {
  return (
    <div style={{ background: '#06060e', minHeight: '100vh', color: '#ede8ff', overflowX: 'hidden' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }

        @keyframes fadeUp    { from { opacity:0; transform:translateY(22px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn    { from { opacity:0 } to { opacity:1 } }
        @keyframes float     { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-10px) } }
        @keyframes tickerScroll { 0% { transform:translateX(0) } 100% { transform:translateX(-50%) } }
        @keyframes orb1      { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,-30px) scale(1.08)} }
        @keyframes orb2      { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-30px,40px) scale(1.05)} }
        @keyframes gridFade  { 0%,100%{opacity:.022} 50%{opacity:.035} }
        @keyframes shine     { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes borderPulse { 0%,100%{border-color:rgba(255,107,53,.25)} 50%{border-color:rgba(255,107,53,.55)} }
        @keyframes badgePop  { 0%{transform:scale(.9);opacity:0} 70%{transform:scale(1.04)} 100%{transform:scale(1);opacity:1} }

        /* SHARED */
        .home-wrap { position: relative; z-index: 1; }
        .section { max-width: 1120px; margin: 0 auto; padding: 0 1.5rem; }
        .sec-tag {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: 'JetBrains Mono', monospace; font-size: .68rem; font-weight: 500;
          letter-spacing: .1em; text-transform: uppercase;
          color: #ff6b35; margin-bottom: 1rem;
        }
        .sec-tag::before { content: '—'; opacity: .5; }
        h2.sec-title {
          font-family: 'Syne', sans-serif; font-size: clamp(2rem,4.5vw,3rem);
          font-weight: 800; line-height: 1.1; letter-spacing: -.025em;
          color: #f5f3ff; margin-bottom: .85rem;
        }
        .sec-sub { color: rgba(200,190,255,.4); font-size: .95rem; line-height: 1.75; max-width: 480px; }
        .gt { background: linear-gradient(135deg, #ff6b35 0%, #f7c59f 40%, #ff6b35 80%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          animation: shine 4s linear infinite; }

        /* BG ELEMENTS */
        .bg-fixed { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
        .bg-orb1 {
          position: absolute; width: 700px; height: 700px; border-radius: 50%;
          top: -200px; left: -200px;
          background: radial-gradient(circle, rgba(255,107,53,.09) 0, transparent 65%);
          animation: orb1 12s ease-in-out infinite;
        }
        .bg-orb2 {
          position: absolute; width: 600px; height: 600px; border-radius: 50%;
          bottom: -150px; right: -150px;
          background: radial-gradient(circle, rgba(168,85,247,.07) 0, transparent 65%);
          animation: orb2 15s ease-in-out infinite;
        }
        .bg-grid {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,107,53,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,107,53,.04) 1px, transparent 1px);
          background-size: 48px 48px;
          animation: gridFade 6s ease-in-out infinite;
        }

        /* ── HERO ── */
        .hero { padding: 148px 0 80px; text-align: center; }
        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 16px; border-radius: 50px;
          background: rgba(255,107,53,.08); border: 1px solid rgba(255,107,53,.2);
          font-family: 'DM Sans', sans-serif; font-size: .75rem; font-weight: 600;
          color: #ff6b35; margin-bottom: 2rem; letter-spacing: .04em;
          animation: badgePop .6s ease both;
        }
        .hero-eyebrow-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #ff6b35;
          box-shadow: 0 0 8px #ff6b35; animation: float 2s ease-in-out infinite;
        }
        .hero h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2.8rem, 7.5vw, 5.5rem);
          font-weight: 800; line-height: 1.05; letter-spacing: -.035em;
          color: #f5f3ff; margin-bottom: 1.5rem;
          animation: fadeUp .7s ease both; animation-delay: .1s;
        }
        .hero h1 em {
          font-style: normal; display: block;
          background: linear-gradient(135deg, #ff6b35 0%, #f7c59f 35%, #ff9a6c 65%, #ff6b35 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          animation: shine 3.5s linear infinite;
        }
        .hero-sub {
          font-size: clamp(.95rem, 2vw, 1.1rem); color: rgba(200,190,255,.45);
          line-height: 1.8; max-width: 560px; margin: 0 auto 2.75rem;
          animation: fadeUp .7s ease both; animation-delay: .2s;
        }
        .hero-btns {
          display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
          margin-bottom: 3.5rem;
          animation: fadeUp .7s ease both; animation-delay: .3s;
        }
        .btn-primary {
          position: relative; overflow: hidden;
          display: inline-flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, #ff6b35, #e85d24);
          border: none; color: white; padding: 14px 32px; border-radius: 50px;
          font-family: 'Syne', sans-serif; font-weight: 700; font-size: .92rem;
          cursor: pointer; letter-spacing: .01em;
          box-shadow: 0 0 32px rgba(255,107,53,.35), 0 4px 16px rgba(0,0,0,.3);
          transition: all .3s;
        }
        .btn-primary::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,.2), transparent);
          opacity: 0; transition: .2s;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 0 48px rgba(255,107,53,.55), 0 6px 20px rgba(0,0,0,.3); }
        .btn-primary:hover::before { opacity: 1; }
        .btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; border: 1px solid rgba(255,255,255,.12);
          color: rgba(220,215,255,.65); padding: 14px 28px; border-radius: 50px;
          font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: .9rem;
          cursor: pointer; transition: all .25s;
        }
        .btn-outline:hover { border-color: rgba(255,107,53,.4); color: #f5f3ff; background: rgba(255,107,53,.06); }

        /* HERO STATS */
        .hero-stats {
          display: flex; gap: 0; justify-content: center; flex-wrap: wrap;
          background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06);
          border-radius: 20px; padding: 1.5rem 2rem; max-width: 560px; margin: 0 auto;
          animation: fadeUp .7s ease both; animation-delay: .4s;
        }
        .hero-stat {
          flex: 1; min-width: 110px; text-align: center; padding: .5rem;
          position: relative;
        }
        .hero-stat:not(:last-child)::after {
          content: ''; position: absolute; right: 0; top: 20%; bottom: 20%;
          width: 1px; background: rgba(255,255,255,.07);
        }
        .hero-stat-val {
          font-family: 'Syne', sans-serif; font-size: 1.75rem; font-weight: 800;
          color: #ff6b35; display: block; margin-bottom: .2rem;
        }
        .hero-stat-lbl {
          font-size: .7rem; font-weight: 600; color: rgba(200,190,255,.3);
          text-transform: uppercase; letter-spacing: .07em;
        }

        /* ── TICKER ── */
        .ticker-section { padding: 60px 0; border-top: 1px solid rgba(255,255,255,.05); border-bottom: 1px solid rgba(255,255,255,.05); overflow: hidden; }

        /* ── PIPELINE DEMO ── */
        .demo-section { padding: 100px 0; }
        .demo-label {
          font-family: 'JetBrains Mono', monospace; font-size: .68rem; font-weight: 500;
          color: rgba(200,190,255,.3); letter-spacing: .1em; text-transform: uppercase;
          text-align: center; margin-bottom: 2.5rem;
        }
        .demo-card {
          background: rgba(10,10,22,.8); border: 1px solid rgba(255,255,255,.07);
          border-radius: 20px; overflow: hidden;
          box-shadow: 0 24px 80px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.03);
          backdrop-filter: blur(16px); max-width: 900px; margin: 0 auto;
        }
        .demo-topbar {
          background: rgba(255,255,255,.03); border-bottom: 1px solid rgba(255,255,255,.06);
          padding: 12px 18px; display: flex; align-items: center; gap: 8px;
        }
        .demo-dot { width: 11px; height: 11px; border-radius: 50%; }
        .demo-url-bar {
          flex: 1; margin: 0 12px; background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.06); border-radius: 8px;
          padding: 5px 14px; font-family: 'JetBrains Mono', monospace;
          font-size: .7rem; color: rgba(200,190,255,.25);
        }
        .demo-body { padding: 1.75rem; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .demo-stage {
          display: flex; align-items: center; gap: 12px;
          background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.05);
          border-radius: 12px; padding: 13px 15px; transition: all .3s;
        }
        .demo-stage.done   { background: rgba(52,211,153,.05);  border-color: rgba(52,211,153,.18);  }
        .demo-stage.active { background: rgba(255,107,53,.07);  border-color: rgba(255,107,53,.3);   animation: borderPulse 2s ease infinite; }
        .demo-stage-ico {
          width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
          background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07);
          display: flex; align-items: center; justify-content: center; font-size: .9rem;
        }
        .demo-stage.done   .demo-stage-ico { background: rgba(52,211,153,.1);  border-color: rgba(52,211,153,.2);  }
        .demo-stage.active .demo-stage-ico { background: rgba(255,107,53,.12); border-color: rgba(255,107,53,.25); }
        .demo-stage-name   { font-family: 'DM Sans', sans-serif; font-size: .78rem; font-weight: 600; color: rgba(200,190,255,.5); }
        .demo-stage.done   .demo-stage-name { color: #6ee7b7; }
        .demo-stage.active .demo-stage-name { color: #ff9a6c; }
        .demo-stage-status {
          font-family: 'JetBrains Mono', monospace; font-size: .62rem;
          color: rgba(200,190,255,.2); margin-top: 2px;
        }
        .demo-stage.done   .demo-stage-status { color: rgba(110,231,183,.6); }
        .demo-stage.active .demo-stage-status { color: rgba(255,154,108,.7); }
        .demo-progress-row {
          grid-column: 1 / -1; display: flex; align-items: center;
          justify-content: space-between; gap: 14px; padding-top: 4px;
        }
        .demo-pbar { flex: 1; height: 3px; background: rgba(255,255,255,.05); border-radius: 2px; overflow: hidden; }
        .demo-pbar-fill {
          height: 100%; width: 64%; border-radius: 2px;
          background: linear-gradient(90deg, #ff6b35, #f7c59f, #ff6b35);
          background-size: 200% 100%;
          animation: shine 2s linear infinite;
          box-shadow: 0 0 8px rgba(255,107,53,.5);
        }
        .demo-pct { font-family: 'JetBrains Mono', monospace; font-size: .8rem; font-weight: 500; color: #ff9a6c; }

        /* ── FEATURES ── */
        .feat-section { padding: 100px 0; }
        .feat-header { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: end; margin-bottom: 3.5rem; }
        .feat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .feat-card {
          background: rgba(10,10,22,.7); border: 1px solid rgba(255,255,255,.06);
          border-radius: 18px; padding: 1.75rem; transition: all .3s;
          position: relative; overflow: hidden; cursor: default;
        }
        .feat-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,107,53,.3), transparent);
          opacity: 0; transition: opacity .3s;
        }
        .feat-card:hover { border-color: rgba(255,107,53,.22); transform: translateY(-4px);
          box-shadow: 0 20px 48px rgba(0,0,0,.4); }
        .feat-card:hover::before { opacity: 1; }
        .feat-tag {
          display: inline-block; font-family: 'JetBrains Mono', monospace;
          font-size: .6rem; font-weight: 500; letter-spacing: .1em;
          color: #ff6b35; margin-bottom: 1rem; opacity: .7;
        }
        .feat-icon { font-size: 2rem; display: block; margin-bottom: .9rem;
          animation: float 3s ease-in-out infinite; filter: drop-shadow(0 4px 8px rgba(0,0,0,.3)); }
        .feat-title {
          font-family: 'Syne', sans-serif; font-size: .92rem; font-weight: 700;
          color: #f5f3ff; margin-bottom: .5rem; letter-spacing: -.01em;
        }
        .feat-desc { font-size: .8rem; color: rgba(200,190,255,.38); line-height: 1.7; }

        /* ── STEPS ── */
        .steps-section { padding: 100px 0; }
        .steps-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
        .steps-left {}
        .steps-right { display: flex; flex-direction: column; gap: 14px; }
        .step-row {
          display: flex; gap: 16px; padding: 1.25rem 1.5rem;
          background: rgba(10,10,22,.6); border: 1px solid rgba(255,255,255,.05);
          border-radius: 16px; transition: all .3s; cursor: default;
        }
        .step-row:hover { border-color: rgba(255,107,53,.2); background: rgba(255,107,53,.04); }
        .step-num {
          font-family: 'JetBrains Mono', monospace; font-size: .65rem; font-weight: 500;
          color: rgba(255,107,53,.6); min-width: 24px; padding-top: 3px; letter-spacing: .05em;
        }
        .step-ico-wrap {
          width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
          background: linear-gradient(135deg, rgba(255,107,53,.15), rgba(168,85,247,.1));
          border: 1px solid rgba(255,107,53,.15);
          display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
        }
        .step-title { font-family: 'Syne', sans-serif; font-size: .9rem; font-weight: 700; color: #f5f3ff; margin-bottom: .3rem; }
        .step-desc { font-size: .78rem; color: rgba(200,190,255,.38); line-height: 1.65; }

        /* ── REVIEWS ── */
        .reviews-section { padding: 100px 0; }
        .reviews-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 3.5rem; }
        .review-card {
          background: rgba(10,10,22,.7); border: 1px solid rgba(255,255,255,.06);
          border-radius: 18px; padding: 1.75rem; transition: all .3s;
        }
        .review-card:hover { border-color: rgba(255,107,53,.18); transform: translateY(-3px); }
        .review-stars { color: #ff6b35; font-size: .9rem; margin-bottom: .9rem; letter-spacing: .1em; }
        .review-text {
          font-size: .85rem; color: rgba(200,190,255,.55); line-height: 1.75;
          font-style: italic; margin-bottom: 1.25rem;
        }
        .review-text::before { content: '"'; }
        .review-text::after  { content: '"'; }
        .review-avatar {
          width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #ff6b35, #a855f7);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif; font-size: .72rem; font-weight: 800; color: white;
        }
        .review-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: .84rem; color: #f5f3ff; }
        .review-role { font-size: .72rem; color: rgba(200,190,255,.35); margin-top: 2px; }

        /* ── CTA BAND ── */
        .cta-band {
          margin: 0 1.5rem 100px; border-radius: 24px;
          background: linear-gradient(135deg, rgba(255,107,53,.12) 0%, rgba(168,85,247,.08) 50%, rgba(255,107,53,.06) 100%);
          border: 1px solid rgba(255,107,53,.2);
          padding: 5rem 2rem; text-align: center; position: relative; overflow: hidden;
        }
        .cta-band::before {
          content: ''; position: absolute; top: -40%; left: -10%; right: -10%; bottom: -40%;
          background: radial-gradient(ellipse 60% 60% at 50% 50%, rgba(255,107,53,.07), transparent);
          pointer-events: none;
        }
        .cta-h {
          font-family: 'Syne', sans-serif; font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 800; letter-spacing: -.025em; color: #f5f3ff;
          margin-bottom: 1rem; line-height: 1.1;
        }
        .cta-sub {
          color: rgba(200,190,255,.4); font-size: .95rem; max-width: 420px;
          margin: 0 auto 2.5rem; line-height: 1.75;
        }
        .cta-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .cta-trust {
          margin-top: 1.5rem; font-size: .75rem; color: rgba(200,190,255,.25);
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .feat-grid   { grid-template-columns: repeat(2, 1fr); }
          .reviews-grid{ grid-template-columns: 1fr; }
          .steps-inner { grid-template-columns: 1fr; }
          .feat-header { grid-template-columns: 1fr; }
          .demo-body   { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .hero { padding: 120px 1rem 60px; }
          .feat-grid { grid-template-columns: 1fr; }
          .hero-stats { flex-wrap: wrap; gap: .5rem; }
          .hero-stat:not(:last-child)::after { display: none; }
        }
      `}</style>

      {/* BG */}
      <div className="bg-fixed">
        <div className="bg-orb1" /><div className="bg-orb2" /><div className="bg-grid" />
      </div>

      <div className="home-wrap">
        <Navbar />

        {/* ══ HERO ════════════════════════════════════════════ */}
        <div className="hero section">
          <div className="hero-eyebrow">
            <div className="hero-eyebrow-dot" />
            Advanced AI Video Dubbing Platform
          </div>

          <h1>
            Dub Any Video Into<br />
            <em>50+ Languages</em>
          </h1>

          <p className="hero-sub">
            Character-wise voices, lip sync, face detection. Upload a file
            or paste a YouTube URL — professional dubbed video in minutes.
          </p>

          <div className="hero-btns">
            <Link to="/signup">
              <button className="btn-primary">🚀 Start Free</button>
            </Link>
            <Link to="/studio">
              <button className="btn-outline">▶ Live Demo</button>
            </Link>
          </div>

          <div className="hero-stats">
            {STATS.map((s, i) => (
              <div key={i} className="hero-stat">
                <span className="hero-stat-val">
                  {s.value.match(/\d/) ? <Counter target={s.value} /> : s.value}
                </span>
                <span className="hero-stat-lbl">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ══ LANG TICKER ═════════════════════════════════════ */}
        <div className="ticker-section">
          <LangTicker />
        </div>

        {/* ══ PIPELINE DEMO ═══════════════════════════════════ */}
        <div className="demo-section section">
          <div className="demo-label">// live processing pipeline</div>
          <div className="demo-card">
            <div className="demo-topbar">
              <div className="demo-dot" style={{ background: '#ff5f57' }} />
              <div className="demo-dot" style={{ background: '#febc2e' }} />
              <div className="demo-dot" style={{ background: '#28c840' }} />
              <div className="demo-url-bar">localhost:5173/studio — Processing: my_video.mp4 → Urdu</div>
            </div>
            <div className="demo-body">
              {[
                { icon: '⬇', name: 'Download',     status: 'Done ✓',     state: 'done'   },
                { icon: '🎵', name: 'Audio Extract', status: 'Done ✓',     state: 'done'   },
                { icon: '👤', name: 'Face Analysis', status: 'Done ✓',     state: 'done'   },
                { icon: '🎙', name: 'Transcribe',    status: 'Running…',   state: 'active' },
                { icon: '🌐', name: 'Translate',     status: 'Pending',    state: ''       },
                { icon: '🔊', name: 'Voice Synth',   status: 'Pending',    state: ''       },
                { icon: '💋', name: 'Lip Sync',      status: 'Pending',    state: ''       },
                { icon: '🎬', name: 'Merge',         status: 'Pending',    state: ''       },
              ].map((s, i) => (
                <div key={i} className={`demo-stage ${s.state}`}>
                  <div className="demo-stage-ico">{s.icon}</div>
                  <div>
                    <div className="demo-stage-name">{s.name}</div>
                    <div className="demo-stage-status">{s.status}</div>
                  </div>
                </div>
              ))}
              <div className="demo-progress-row">
                <div className="demo-pbar"><div className="demo-pbar-fill" /></div>
                <div className="demo-pct">42%</div>
              </div>
            </div>
          </div>
        </div>

        {/* ══ FEATURES ════════════════════════════════════════ */}
        <div className="feat-section">
          <div className="section">
            <div className="feat-header">
              <div>
                <div className="sec-tag">What We Use</div>
                <h2 className="sec-title">Not just TTS.<br/><span className="gt">Full AI pipeline.</span></h2>
              </div>
              <p className="sec-sub">
                9 stages of AI processing — face detection, voice cloning, lip sync.
                Every feature is purpose-built for professional dubbing.
              </p>
            </div>
            <div className="feat-grid">
              {FEATURES.map((f, i) => (
                <div key={i} className="feat-card" style={{ animationDelay: `${i * .07}s` }}>
                  <div className="feat-tag">{f.tag}</div>
                  <span className="feat-icon" style={{ animationDelay: `${i * .3}s` }}>{f.icon}</span>
                  <div className="feat-title">{f.title}</div>
                  <p className="feat-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ HOW IT WORKS ════════════════════════════════════ */}
        <div className="steps-section" style={{ borderTop: '1px solid rgba(255,255,255,.05)' }}>
          <div className="section">
            <div className="steps-inner">
              <div className="steps-left">
                <div className="sec-tag">How It Works</div>
                <h2 className="sec-title">
                  From video to<br/>
                  <span className="gt">dubbed in minutes.</span>
                </h2>
                <p className="sec-sub" style={{ marginBottom: '2rem' }}>
                  No setup, no coding. Paste a URL or upload a file — our AI handles everything.
                </p>
                <Link to="/signup">
                  <button className="btn-primary">Get Started Free →</button>
                </Link>
              </div>
              <div className="steps-right">
                {STEPS.map((s, i) => (
                  <div key={i} className="step-row">
                    <div className="step-num">{s.n}</div>
                    <div className="step-ico-wrap">{s.icon}</div>
                    <div>
                      <div className="step-title">{s.title}</div>
                      <p className="step-desc">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══ REVIEWS ═════════════════════════════════════════ */}
        <div className="reviews-section" style={{ borderTop: '1px solid rgba(255,255,255,.05)' }}>
          <div className="section">
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <div className="sec-tag" style={{ justifyContent: 'center' }}>Real Users</div>
              <h2 className="sec-title">What creators say</h2>
              <p className="sec-sub" style={{ margin: '0 auto' }}>
                Trusted by thousands of creators, producers, and teams worldwide.
              </p>
            </div>
            <div className="reviews-grid">
              {REVIEWS.map((r, i) => (
                <div key={i} className="review-card">
                  <div className="review-stars">{'★'.repeat(r.stars)}</div>
                  <p className="review-text">{r.text}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="review-avatar">{r.init}</div>
                    <div>
                      <div className="review-name">{r.name}</div>
                      <div className="review-role">{r.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ CTA ════════════════════════════════════════════ */}
        <div className="cta-band">
          <div className="sec-tag" style={{ justifyContent: 'center', marginBottom: '1.25rem' }}>Start Today</div>
          <h2 className="cta-h">Ready to go <span className="gt">global?</span></h2>
          <p className="cta-sub">
            Start dubbing your videos for free. No credit card. No setup. Just results.
          </p>
          <div className="cta-btns">
            <Link to="/signup">
              <button className="btn-primary" style={{ fontSize: '1rem', padding: '15px 36px' }}>
                🚀 Start Free
              </button>
            </Link>
            <Link to="/pricing">
              <button className="btn-outline" style={{ padding: '14px 28px' }}>View Pricing</button>
            </Link>
          </div>
          <div className="cta-trust">
            <span>✓</span> Free plan available &nbsp;·&nbsp;
            <span>✓</span> No credit card &nbsp;·&nbsp;
            <span>✓</span> Cancel anytime
          </div>
        </div>

        <Footer />
      </div>
    </div>
  )
}
