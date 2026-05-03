// ═══════════════════════════════════════════
//  Login.jsx
// ═══════════════════════════════════════════
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const AUTH_STYLES = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes floatBg { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-20px) rotate(5deg)} }
  .auth-page { min-height:100vh; background:#040409; display:flex; align-items:center; justify-content:center; padding:2rem 1rem; position:relative; overflow:hidden; }
  .auth-bg { position:fixed; inset:0; pointer-events:none; z-index:0; }
  .auth-orb1 { position:absolute; width:500px; height:500px; border-radius:50%; top:-150px; left:-150px;
    background:radial-gradient(circle, rgba(124,106,255,.15) 0, transparent 70%); animation:floatBg 8s ease infinite; }
  .auth-orb2 { position:absolute; width:400px; height:400px; border-radius:50%; bottom:-100px; right:-100px;
    background:radial-gradient(circle, rgba(168,85,247,.1) 0, transparent 70%); animation:floatBg 10s ease infinite reverse; }
  .auth-grid { position:absolute; inset:0; opacity:.02;
    background-image:linear-gradient(rgba(124,106,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(124,106,255,1) 1px,transparent 1px);
    background-size:40px 40px; }
  .auth-card {
    position:relative; z-index:1;
    background:rgba(8,8,16,.9); border:1px solid rgba(124,106,255,.18);
    border-radius:26px; padding:2.75rem 2.5rem; width:100%; max-width:420px;
    backdrop-filter:blur(28px); animation:fadeUp .5s ease;
    box-shadow:0 24px 80px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.04);
  }
  .auth-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; border-radius:26px 26px 0 0;
    background:linear-gradient(90deg,transparent,rgba(124,106,255,.6),rgba(168,85,247,.6),transparent); }
  .auth-logo { text-align:center; margin-bottom:2rem; }
  .auth-logo-mark { width:56px; height:56px; border-radius:16px; margin:0 auto .75rem;
    background:linear-gradient(135deg,#7c6aff,#a855f7);
    display:flex; align-items:center; justify-content:center; font-size:1.5rem;
    box-shadow:0 0 28px rgba(124,106,255,.45); }
  .auth-logo-name { font-family:'Clash Display','Bricolage Grotesque',sans-serif; font-size:1.1rem; font-weight:700;
    background:linear-gradient(135deg,#c4b5fd,#818cf8); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .auth-h { font-family:'Clash Display','Bricolage Grotesque',sans-serif; font-size:1.3rem; font-weight:700;
    color:#eeeaff; text-align:center; margin-bottom:.3rem; }
  .auth-sub { font-size:.82rem; color:rgba(200,190,255,.35); text-align:center; margin-bottom:1.75rem; }
  .auth-label { display:block; font-size:.67rem; font-weight:700; color:rgba(200,190,255,.35);
    letter-spacing:.08em; text-transform:uppercase; margin-bottom:5px; }
  .auth-iw { position:relative; margin-bottom:1rem; }
  .auth-inp { width:100%; background:rgba(255,255,255,.04); border:1.5px solid rgba(124,106,255,.14);
    border-radius:12px; padding:11px 14px 11px 42px; font-size:.875rem; color:#eeeaff;
    font-family:'Bricolage Grotesque',sans-serif; outline:none; transition:all .3s; }
  .auth-inp:focus { border-color:rgba(124,106,255,.55); background:rgba(124,106,255,.06);
    box-shadow:0 0 0 3px rgba(124,106,255,.1); }
  .auth-inp::placeholder { color:rgba(200,190,255,.18); }
  .auth-icon { position:absolute; left:.9rem; top:50%; transform:translateY(-50%);
    color:rgba(200,190,255,.28); font-size:.95rem; pointer-events:none; }
  .auth-eye { position:absolute; right:.85rem; top:50%; transform:translateY(-50%);
    background:none; border:none; color:rgba(200,190,255,.28); cursor:pointer; font-size:.9rem; padding:.2rem; }
  .auth-eye:hover { color:#c4b5fd; }
  .auth-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
  .auth-rem { display:flex; align-items:center; gap:.4rem; font-size:.78rem; color:rgba(200,190,255,.35); cursor:pointer; }
  .auth-rem input { accent-color:#7c6aff; }
  .auth-forgot { font-size:.78rem; color:#a78bfa; transition:color .2s; }
  .auth-forgot:hover { color:#c4b5fd; }
  .auth-err { background:rgba(248,113,113,.08); border:1px solid rgba(248,113,113,.2);
    border-radius:10px; padding:9px 13px; font-size:.8rem; color:#fca5a5;
    margin-bottom:1rem; display:flex; align-items:center; gap:.5rem; }
  .auth-submit { width:100%; padding:.95rem; background:linear-gradient(135deg,#7c6aff,#a855f7);
    border:none; border-radius:13px; color:white;
    font-family:'Clash Display','Bricolage Grotesque',sans-serif; font-size:.95rem; font-weight:700;
    cursor:pointer; transition:all .25s; box-shadow:0 4px 20px rgba(124,106,255,.35); margin-bottom:1.5rem;
    position:relative; overflow:hidden; }
  .auth-submit::before { content:''; position:absolute; inset:0;
    background:linear-gradient(135deg,rgba(255,255,255,.15),transparent); opacity:0; transition:.2s; }
  .auth-submit:hover:not(:disabled)::before { opacity:1; }
  .auth-submit:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 32px rgba(124,106,255,.55); }
  .auth-submit:disabled { opacity:.4; cursor:not-allowed; transform:none; }
  .auth-div { display:flex; align-items:center; margin:.75rem 0 1rem; }
  .auth-div::before,.auth-div::after { content:''; flex:1; border-top:1px solid rgba(255,255,255,.06); }
  .auth-div span { padding:0 .85rem; font-size:.67rem; font-weight:700; color:rgba(200,190,255,.25); text-transform:uppercase; letter-spacing:.05em; }
  .auth-social { width:100%; padding:.82rem; background:rgba(255,255,255,.03);
    border:1.5px solid rgba(255,255,255,.07); border-radius:11px;
    color:rgba(200,190,255,.45); font-weight:600; font-size:.82rem; cursor:pointer;
    transition:all .2s; display:flex; align-items:center; justify-content:center; gap:.5rem; margin-bottom:.6rem; }
  .auth-social:hover { border-color:rgba(124,106,255,.3); color:#c4b5fd; background:rgba(124,106,255,.06); }
  .auth-bottom { text-align:center; font-size:.82rem; color:rgba(200,190,255,.35); margin-top:1.25rem; }
  .auth-bottom a { color:#a78bfa; font-weight:600; transition:color .2s; }
  .auth-bottom a:hover { color:#c4b5fd; }
  .auth-back { display:flex; align-items:center; justify-content:center; gap:5px;
    color:rgba(200,190,255,.25); font-size:.78rem; margin-top:1.1rem; transition:color .2s; }
  .auth-back:hover { color:#c4b5fd; }
  .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  @media(max-width:480px) { .auth-card { padding:2rem 1.5rem; } .grid2 { grid-template-columns:1fr; } }
`

export function Login() {
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [err,     setErr]       = useState('')
  const { login } = useAuth()
  const nav = useNavigate()

  async function submit(e) {
    e.preventDefault(); setErr(''); setLoading(true)
    const r = await login(email, pass)
    if (r.success) nav('/dashboard')
    else setErr(r.error || 'Login failed')
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <style>{AUTH_STYLES}</style>
      <div className="auth-bg">
        <div className="auth-orb1"/><div className="auth-orb2"/><div className="auth-grid"/>
      </div>
      <div style={{position:'relative',zIndex:1,width:'100%',maxWidth:'420px'}}>
        <div className="auth-card">
          <div className="auth-logo">
            <Link to="/"><div className="auth-logo-mark">🎬</div></Link>
            <Link to="/"><span className="auth-logo-name">DubStudio Pro</span></Link>
          </div>
          <h4 className="auth-h">Welcome Back</h4>
          <p className="auth-sub">Sign in to continue dubbing</p>
          {err && <div className="auth-err">❌ {err}</div>}
          <form onSubmit={submit}>
            <label className="auth-label">Email</label>
            <div className="auth-iw">
              <span className="auth-icon">📧</span>
              <input type="email" className="auth-inp" placeholder="you@example.com" required value={email} onChange={e=>setEmail(e.target.value)}/>
            </div>
            <label className="auth-label">Password</label>
            <div className="auth-iw">
              <span className="auth-icon">🔒</span>
              <input type={showPass?'text':'password'} className="auth-inp" placeholder="Your password" required value={pass} onChange={e=>setPass(e.target.value)}/>
              <button type="button" className="auth-eye" onClick={()=>setShowPass(v=>!v)}>{showPass?'🙈':'👁'}</button>
            </div>
            <div className="auth-row">
              <label className="auth-rem"><input type="checkbox"/> Remember me</label>
              <a href="#" className="auth-forgot">Forgot password?</a>
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? '⏳ Signing in…' : '→ Sign In'}
            </button>
          </form>
          <div className="auth-div"><span>Or continue with</span></div>
          <button className="auth-social">🌐 Continue with Google</button>
          <button className="auth-social">⚙ Continue with GitHub</button>
          <div className="auth-bottom">Don't have an account? <Link to="/signup">Sign up free</Link></div>
        </div>
        <Link to="/" className="auth-back">← Back to Home</Link>
      </div>
    </div>
  )
}

export default Login

// ═══════════════════════════════════════════
// Also export Signup below — save as Signup.jsx separately
// ═══════════════════════════════════════════
