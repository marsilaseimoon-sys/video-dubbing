import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const STYLES = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes floatBg { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-20px) rotate(5deg)} }
  .auth-page{min-height:100vh;background:#040409;display:flex;align-items:center;justify-content:center;padding:2rem 1rem;position:relative;overflow:hidden}
  .auth-bg{position:fixed;inset:0;pointer-events:none;z-index:0}
  .auth-orb1{position:absolute;width:500px;height:500px;border-radius:50%;top:-150px;left:-150px;background:radial-gradient(circle,rgba(124,106,255,.15) 0,transparent 70%);animation:floatBg 8s ease infinite}
  .auth-orb2{position:absolute;width:400px;height:400px;border-radius:50%;bottom:-100px;right:-100px;background:radial-gradient(circle,rgba(168,85,247,.1) 0,transparent 70%);animation:floatBg 10s ease infinite reverse}
  .auth-grid{position:absolute;inset:0;opacity:.02;background-image:linear-gradient(rgba(124,106,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(124,106,255,1) 1px,transparent 1px);background-size:40px 40px}
  .auth-card{position:relative;z-index:1;background:rgba(8,8,16,.9);border:1px solid rgba(124,106,255,.18);border-radius:26px;padding:2.5rem;width:100%;max-width:440px;backdrop-filter:blur(28px);animation:fadeUp .5s ease;box-shadow:0 24px 80px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.04)}
  .auth-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;border-radius:26px 26px 0 0;background:linear-gradient(90deg,transparent,rgba(124,106,255,.6),rgba(168,85,247,.6),transparent)}
  .auth-logo{text-align:center;margin-bottom:1.75rem}
  .auth-logo-mark{width:52px;height:52px;border-radius:14px;margin:0 auto .7rem;background:linear-gradient(135deg,#7c6aff,#a855f7);display:flex;align-items:center;justify-content:center;font-size:1.4rem;box-shadow:0 0 24px rgba(124,106,255,.45)}
  .auth-logo-name{font-family:'Clash Display','Bricolage Grotesque',sans-serif;font-size:1.05rem;font-weight:700;background:linear-gradient(135deg,#c4b5fd,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .auth-h{font-family:'Clash Display','Bricolage Grotesque',sans-serif;font-size:1.25rem;font-weight:700;color:#eeeaff;text-align:center;margin-bottom:.25rem}
  .auth-sub{font-size:.8rem;color:rgba(200,190,255,.35);text-align:center;margin-bottom:1.6rem}
  .auth-label{display:block;font-size:.66rem;font-weight:700;color:rgba(200,190,255,.3);letter-spacing:.08em;text-transform:uppercase;margin-bottom:5px}
  .auth-iw{position:relative;margin-bottom:.9rem}
  .auth-inp{width:100%;background:rgba(255,255,255,.04);border:1.5px solid rgba(124,106,255,.13);border-radius:11px;padding:10px 13px 10px 40px;font-size:.865rem;color:#eeeaff;font-family:'Bricolage Grotesque',sans-serif;outline:none;transition:all .3s}
  .auth-inp:focus{border-color:rgba(124,106,255,.5);background:rgba(124,106,255,.05);box-shadow:0 0 0 3px rgba(124,106,255,.1)}
  .auth-inp::placeholder{color:rgba(200,190,255,.18)}
  .auth-icon{position:absolute;left:.85rem;top:50%;transform:translateY(-50%);color:rgba(200,190,255,.25);font-size:.9rem;pointer-events:none}
  .auth-eye{position:absolute;right:.85rem;top:50%;transform:translateY(-50%);background:none;border:none;color:rgba(200,190,255,.25);cursor:pointer;font-size:.88rem;padding:.2rem}
  .auth-eye:hover{color:#c4b5fd}
  .auth-err{background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.2);border-radius:10px;padding:9px 13px;font-size:.79rem;color:#fca5a5;margin-bottom:.9rem;display:flex;align-items:center;gap:.5rem}
  .auth-submit{width:100%;padding:.9rem;background:linear-gradient(135deg,#7c6aff,#a855f7);border:none;border-radius:12px;color:white;font-family:'Clash Display','Bricolage Grotesque',sans-serif;font-size:.9rem;font-weight:700;cursor:pointer;transition:all .25s;box-shadow:0 4px 20px rgba(124,106,255,.35);margin-bottom:1.25rem;position:relative;overflow:hidden}
  .auth-submit::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.15),transparent);opacity:0;transition:.2s}
  .auth-submit:hover:not(:disabled)::before{opacity:1}
  .auth-submit:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 32px rgba(124,106,255,.55)}
  .auth-submit:disabled{opacity:.4;cursor:not-allowed;transform:none}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .auth-agree{font-size:.76rem;color:rgba(200,190,255,.3);margin:.85rem 0;line-height:1.6}
  .auth-agree a{color:#a78bfa}
  .auth-bottom{text-align:center;font-size:.8rem;color:rgba(200,190,255,.35);margin-top:1.1rem}
  .auth-bottom a{color:#a78bfa;font-weight:600}
  .auth-back{display:flex;align-items:center;justify-content:center;gap:5px;color:rgba(200,190,255,.22);font-size:.76rem;margin-top:1rem;transition:color .2s}
  .auth-back:hover{color:#c4b5fd}
  @media(max-width:480px){.auth-card{padding:2rem 1.4rem}.grid2{grid-template-columns:1fr}}
`

export default function Signup() {
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', password:'', confirm:'' })
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [err,      setErr]      = useState('')
  const { register } = useAuth()
  const nav = useNavigate()

  const set = k => e => setForm(f => ({...f, [k]: e.target.value}))

  async function submit(e) {
    e.preventDefault(); setErr('')
    if (form.password !== form.confirm) { setErr('Passwords do not match'); return }
    if (form.password.length < 6)       { setErr('Password must be at least 6 characters'); return }
    setLoading(true)
    const r = await register(form.firstName, form.lastName, form.email, form.password)
    if (r.success) nav('/dashboard')
    else setErr(r.error || 'Registration failed')
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <style>{STYLES}</style>
      <div className="auth-bg"><div className="auth-orb1"/><div className="auth-orb2"/><div className="auth-grid"/></div>
      <div style={{position:'relative',zIndex:1,width:'100%',maxWidth:'440px'}}>
        <div className="auth-card">
          <div className="auth-logo">
            <Link to="/"><div className="auth-logo-mark">🎬</div></Link>
            <Link to="/"><span className="auth-logo-name">DubStudio Pro</span></Link>
          </div>
          <h4 className="auth-h">Create Account</h4>
          <p className="auth-sub">Start dubbing for free — no credit card needed</p>
          {err && <div className="auth-err">❌ {err}</div>}
          <form onSubmit={submit}>
            <div className="grid2">
              <div>
                <label className="auth-label">First Name</label>
                <div className="auth-iw">
                  <span className="auth-icon">👤</span>
                  <input type="text" className="auth-inp" placeholder="Ahmed" required value={form.firstName} onChange={set('firstName')}/>
                </div>
              </div>
              <div>
                <label className="auth-label">Last Name</label>
                <div className="auth-iw">
                  <span className="auth-icon">👤</span>
                  <input type="text" className="auth-inp" placeholder="Hassan" required value={form.lastName} onChange={set('lastName')}/>
                </div>
              </div>
            </div>
            <label className="auth-label">Email Address</label>
            <div className="auth-iw">
              <span className="auth-icon">📧</span>
              <input type="email" className="auth-inp" placeholder="you@example.com" required value={form.email} onChange={set('email')}/>
            </div>
            <label className="auth-label">Password</label>
            <div className="auth-iw">
              <span className="auth-icon">🔒</span>
              <input type={showPass?'text':'password'} className="auth-inp" placeholder="Min 6 characters" required value={form.password} onChange={set('password')}/>
              <button type="button" className="auth-eye" onClick={()=>setShowPass(v=>!v)}>{showPass?'🙈':'👁'}</button>
            </div>
            <label className="auth-label">Confirm Password</label>
            <div className="auth-iw">
              <span className="auth-icon">🔒</span>
              <input type={showPass?'text':'password'} className="auth-inp" placeholder="Repeat password" required value={form.confirm} onChange={set('confirm')}/>
            </div>
            <p className="auth-agree">By signing up you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.</p>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? '⏳ Creating account…' : '✨ Create Free Account'}
            </button>
          </form>
          <div className="auth-bottom">Already have an account? <Link to="/login">Sign in</Link></div>
        </div>
        <Link to="/" className="auth-back">← Back to Home</Link>
      </div>
    </div>
  )
}
