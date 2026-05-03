// ══════════════════════ Features.jsx ══════════════════════
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const FEATS = [
  { ico:'🎙', t:'Whisper AI Transcription',  d:'OpenAI Whisper large-v3 model — near-perfect transcription with word-level timestamps in 99 languages.', badge:'AI Powered' },
  { ico:'👤', t:'Face & Gender Detection',    d:'InsightFace buffalo_l detects every character, their gender, and age — assigns appropriate voice automatically.', badge:'Advanced' },
  { ico:'🔊', t:'Voice Cloning (XTTS v2)',    d:'Coqui XTTS v2 clones the original speaker\'s voice characteristics for natural-sounding dubbed audio.', badge:'Pro' },
  { ico:'💋', t:'Per-Character Lip Sync',     d:'Wav2Lip syncs lip movements to the new dubbed audio for each detected character in the video.', badge:'Pro' },
  { ico:'👥', t:'Speaker Diarization',        d:'Pyannote 3.1 separates multiple speakers automatically — each gets their own voice in the dub.', badge:'Advanced' },
  { ico:'🌐', t:'Neural Translation',         d:'Google Translate API + deep-translator for accurate, context-aware translation in 50+ languages.', badge:'Core' },
  { ico:'⚡', t:'Edge TTS Neural Voices',     d:'Microsoft Edge TTS with 400+ neural voices — gender-matched, child/adult-aware voice selection.', badge:'Core' },
  { ico:'🔗', t:'YouTube & URL Support',      d:'yt-dlp + pytubefix downloads from YouTube, Shorts, TikTok, Instagram, Dailymotion and direct URLs.', badge:'Core' },
  { ico:'📱', t:'Mobile-Ready Output',        d:'H.264 MP4 output with AAC audio — plays perfectly on any device, shareable via public link.', badge:'Core' },
]

export function Features() {
  return (
    <div style={{background:'#040409',minHeight:'100vh',color:'#eeeaff'}}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .feat-big-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
        .feat-big-card{background:rgba(10,10,20,.75);border:1px solid rgba(124,106,255,.1);
          border-radius:20px;padding:1.75rem;backdrop-filter:blur(12px);transition:all .3s;
          animation:fadeUp .4s ease;position:relative;overflow:hidden}
        .feat-big-card:hover{border-color:rgba(124,106,255,.3);transform:translateY(-4px);box-shadow:0 16px 40px rgba(0,0,0,.4)}
        .feat-big-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;
          background:linear-gradient(90deg,transparent,rgba(124,106,255,.35),transparent);opacity:0;transition:.3s}
        .feat-big-card:hover::before{opacity:1}
        .fb-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem}
        .fb-ico{font-size:2rem;filter:drop-shadow(0 4px 8px rgba(0,0,0,.4))}
        .fb-badge{font-size:.62rem;font-weight:700;padding:3px 9px;border-radius:20px;
          background:rgba(124,106,255,.12);border:1px solid rgba(124,106,255,.2);color:#a78bfa;letter-spacing:.05em}
        .fb-title{font-family:'Clash Display','Bricolage Grotesque',sans-serif;font-size:.95rem;font-weight:700;color:#eeeaff;margin-bottom:.5rem}
        .fb-desc{font-size:.8rem;color:rgba(200,190,255,.38);line-height:1.7}

        /* PIPELINE VIZ */
        .pipeline{background:rgba(10,10,20,.7);border:1px solid rgba(124,106,255,.12);
          border-radius:20px;padding:2rem;margin-bottom:2rem;backdrop-filter:blur(12px)}
        .pipeline-title{font-family:'Clash Display','Bricolage Grotesque',sans-serif;font-weight:700;
          color:#c4b5fd;margin-bottom:1.5rem;font-size:1rem}
        .pipeline-steps{display:flex;align-items:center;flex-wrap:wrap;gap:0}
        .ps{display:flex;flex-direction:column;align-items:center;gap:.4rem;min-width:80px}
        .ps-ico{width:44px;height:44px;border-radius:12px;background:rgba(124,106,255,.12);
          border:1px solid rgba(124,106,255,.2);display:flex;align-items:center;justify-content:center;font-size:1rem}
        .ps-label{font-size:.63rem;font-weight:700;color:rgba(200,190,255,.35);text-align:center;letter-spacing:.03em}
        .ps-arrow{font-size:1.2rem;color:rgba(124,106,255,.3);margin:0 2px;margin-bottom:18px}
      `}</style>
      <div className="page-bg"/><div className="grid-bg"/><div className="noise"/>
      <div className="page-wrap">
        <Navbar/>
        <div className="section">
          <div className="sec-header">
            <div className="tag">Features</div>
            <h2 className="sec-title">Full AI <span className="gt">Dubbing Pipeline</span></h2>
            <p className="sec-sub">9-stage professional pipeline — not just TTS, but complete character-aware dubbing</p>
          </div>

          <div className="pipeline">
            <div className="pipeline-title">🔄 Processing Pipeline</div>
            <div className="pipeline-steps">
              {[['⬇','Download'],['🎵','Extract'],['👤','Face AI'],['🎙','Whisper'],['👥','Diarize'],['🌐','Translate'],['🔊','Synthesize'],['💋','Lip Sync'],['🎬','Merge']].map(([ico,label],i,arr)=>(
                <div key={i} style={{display:'flex',alignItems:'center'}}>
                  <div className="ps">
                    <div className="ps-ico">{ico}</div>
                    <div className="ps-label">{label}</div>
                  </div>
                  {i < arr.length-1 && <div className="ps-arrow">→</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="feat-big-grid">
            {FEATS.map((f,i)=>(
              <div key={i} className="feat-big-card" style={{animationDelay:`${i*.06}s`}}>
                <div className="fb-top">
                  <span className="fb-ico">{f.ico}</span>
                  <span className="fb-badge">{f.badge}</span>
                </div>
                <div className="fb-title">{f.t}</div>
                <p className="fb-desc">{f.d}</p>
              </div>
            ))}
          </div>

          <div style={{textAlign:'center',marginTop:'3rem'}}>
            <Link to="/signup"><button className="btn-primary" style={{padding:'14px 36px',fontSize:'1rem'}}>🚀 Try It Free</button></Link>
          </div>
        </div>
        <Footer/>
      </div>
    </div>
  )
}

// ══════════════════════ About.jsx ══════════════════════
export function About() {
  return (
    <div style={{background:'#040409',minHeight:'100vh',color:'#eeeaff'}}>
      <div className="page-bg"/><div className="grid-bg"/><div className="noise"/>
      <div className="page-wrap">
        <Navbar/>
        <div className="section">
          <div className="sec-header">
            <div className="tag">About Us</div>
            <h2 className="sec-title">Built for <span className="gt">Global Creators</span></h2>
            <p className="sec-sub">DubStudio Pro makes professional AI dubbing accessible to everyone — from solo YouTubers to production studios.</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'2rem'}}>
            {[
              { ico:'🎯', t:'Our Mission',      d:'Make language barriers disappear for content creators. Every video should be watchable in every language.' },
              { ico:'🤖', t:'Our Technology',   d:'We combine Whisper AI, XTTS voice cloning, InsightFace detection, and Wav2Lip to build the most complete dubbing pipeline available.' },
              { ico:'🌍', t:'Our Community',    d:'Serving creators in Pakistan, India, Saudi Arabia, Turkey, and 60+ countries who want to reach global audiences.' },
              { ico:'🚀', t:'Our Vision',       d:'A world where language is no longer a barrier to great content — where any video can speak any language.' },
            ].map((c,i)=>(
              <div key={i} className="glass" style={{padding:'1.75rem',transition:'all .3s'}}>
                <div style={{fontSize:'2rem',marginBottom:'.75rem'}}>{c.ico}</div>
                <div style={{fontFamily:"'Clash Display','Bricolage Grotesque',sans-serif",fontWeight:700,fontSize:'.95rem',color:'#eeeaff',marginBottom:'.5rem'}}>{c.t}</div>
                <p style={{fontSize:'.8rem',color:'rgba(200,190,255,.4)',lineHeight:1.7}}>{c.d}</p>
              </div>
            ))}
          </div>
          <div style={{textAlign:'center'}}>
            <Link to="/studio"><button className="btn-primary" style={{padding:'14px 36px',fontSize:'1rem'}}>🎬 Try Studio</button></Link>
          </div>
        </div>
        <Footer/>
      </div>
    </div>
  )
}

// ══════════════════════ Contact.jsx ══════════════════════
export function Contact() {
  return (
    <div style={{background:'#040409',minHeight:'100vh',color:'#eeeaff'}}>
      <style>{`
        .contact-form{background:rgba(10,10,20,.8);border:1px solid rgba(124,106,255,.14);
          border-radius:22px;padding:2.5rem;max-width:560px;margin:0 auto;backdrop-filter:blur(16px);
          box-shadow:0 16px 60px rgba(0,0,0,.4)}
        .contact-form::before{content:'';display:block;height:2px;margin:-2.5rem -2.5rem 2rem;
          background:linear-gradient(90deg,transparent,rgba(124,106,255,.5),rgba(168,85,247,.5),transparent)}
        .cf-label{display:block;font-size:.67rem;font-weight:700;color:rgba(200,190,255,.3);
          letter-spacing:.08em;text-transform:uppercase;margin-bottom:5px}
        .cf-inp{width:100%;background:rgba(255,255,255,.04);border:1.5px solid rgba(124,106,255,.12);
          border-radius:11px;padding:11px 14px;font-size:.875rem;color:#eeeaff;
          font-family:'Bricolage Grotesque',sans-serif;outline:none;transition:all .3s;margin-bottom:.9rem}
        .cf-inp:focus{border-color:rgba(124,106,255,.5);background:rgba(124,106,255,.05);box-shadow:0 0 0 3px rgba(124,106,255,.1)}
        .cf-inp::placeholder{color:rgba(200,190,255,.18)}
        textarea.cf-inp{resize:vertical;min-height:130px;line-height:1.6}
      `}</style>
      <div className="page-bg"/><div className="grid-bg"/><div className="noise"/>
      <div className="page-wrap">
        <Navbar/>
        <div className="section">
          <div className="sec-header">
            <div className="tag">Contact</div>
            <h2 className="sec-title">Get in <span className="gt">Touch</span></h2>
            <p className="sec-sub">Have questions or feedback? We'd love to hear from you.</p>
          </div>
          <div className="contact-form">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
              <div>
                <label className="cf-label">First Name</label>
                <input type="text" className="cf-inp" placeholder="Ahmed"/>
              </div>
              <div>
                <label className="cf-label">Last Name</label>
                <input type="text" className="cf-inp" placeholder="Hassan"/>
              </div>
            </div>
            <label className="cf-label">Email</label>
            <input type="email" className="cf-inp" placeholder="you@example.com"/>
            <label className="cf-label">Subject</label>
            <input type="text" className="cf-inp" placeholder="How can we help?"/>
            <label className="cf-label">Message</label>
            <textarea className="cf-inp" placeholder="Describe your question or feedback…"/>
            <button className="btn-primary" style={{width:'100%',padding:'13px',fontSize:'.9rem',justifyContent:'center'}}>
              📤 Send Message
            </button>
          </div>
        </div>
        <Footer/>
      </div>
    </div>
  )
}

export default Features
