import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

const API = 'http://localhost:5000/api'

export default function Dashboard() {
  const { user, token, logout } = useAuth()
  const nav = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { nav('/login'); return }
    if (token && token !== 'demo') {
      fetch(`${API}/history`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => { if (d.success) setHistory(d.history) })
        .catch(() => {}).finally(() => setLoading(false))
    } else setLoading(false)
  }, [user, token])

  const initials = user?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) || 'U'
  const completed = history.filter(h => h.status === 'completed').length
  const langs = new Set(history.map(h => h.target_lang)).size

  const STATS = [
    { ico:'🎬', label:'Total Projects', val: history.length || 0,   color:'#7c6aff' },
    { ico:'✅', label:'Completed',      val: completed,               color:'#34d399' },
    { ico:'🌐', label:'Languages Used', val: langs || 0,              color:'#38bdf8' },
    { ico:'⭐', label:'Current Plan',   val: 'Free',                  color:'#fbbf24' },
  ]

  const QUICK = [
    { ico:'🎬', t:'New Dubbing',    d:'Upload or paste URL',         to:'/studio'   },
    { ico:'⚡', t:'Features',       d:'See what AI can do',          to:'/features' },
    { ico:'💎', t:'Upgrade Plan',   d:'Get unlimited dubbing',       to:'/pricing'  },
  ]

  return (
    <div style={{background:'#040409',minHeight:'100vh',color:'#eeeaff'}}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .db-bg{position:fixed;inset:0;background:radial-gradient(ellipse 80vw 60vh at 20% 10%,rgba(124,106,255,.1) 0,transparent 55%),#040409;pointer-events:none;z-index:0}
        .db-wrap{position:relative;z-index:1;max-width:1000px;margin:0 auto;padding:2rem 1.5rem 4rem}

        /* WELCOME */
        .welcome{background:linear-gradient(135deg,#7c6aff,#a855f7,#38bdf8);border-radius:22px;padding:2.25rem 2.25rem;
          margin-bottom:1.25rem;display:flex;align-items:center;justify-content:space-between;gap:1.5rem;flex-wrap:wrap;
          box-shadow:0 8px 36px rgba(124,106,255,.4);animation:fadeUp .4s ease;position:relative;overflow:hidden}
        .welcome::before{content:'';position:absolute;inset:0;
          background:radial-gradient(ellipse 60% 80% at 80% 50%,rgba(255,255,255,.07),transparent);pointer-events:none}
        .welcome-ava{width:58px;height:58px;border-radius:50%;background:rgba(255,255,255,.2);
          display:flex;align-items:center;justify-content:center;font-family:'Clash Display','Bricolage Grotesque',sans-serif;
          font-size:1.25rem;font-weight:700;color:white;flex-shrink:0;
          border:2px solid rgba(255,255,255,.25)}
        .welcome-title{font-family:'Clash Display','Bricolage Grotesque',sans-serif;font-size:1.45rem;font-weight:700;color:white;margin-bottom:.2rem}
        .welcome-sub{font-size:.82rem;color:rgba(255,255,255,.65)}
        .welcome-right{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
        .btn-w-new{background:white;color:#7c6aff;border:none;padding:9px 22px;border-radius:50px;
          font-family:'Clash Display','Bricolage Grotesque',sans-serif;font-weight:700;font-size:.85rem;
          cursor:pointer;transition:all .2s;white-space:nowrap}
        .btn-w-new:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.25)}
        .btn-w-out{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:white;
          padding:9px 18px;border-radius:50px;font-size:.82rem;font-weight:600;cursor:pointer;transition:all .2s}
        .btn-w-out:hover{background:rgba(255,255,255,.2)}

        /* STATS */
        .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:1.25rem}
        .stat-card{background:rgba(10,10,20,.75);border:1px solid rgba(124,106,255,.1);
          border-radius:18px;padding:1.25rem;text-align:center;backdrop-filter:blur(12px);
          animation:fadeUp .4s ease;transition:all .3s}
        .stat-card:hover{transform:translateY(-3px);border-color:rgba(124,106,255,.25)}
        .stat-ico{font-size:1.65rem;margin-bottom:.5rem}
        .stat-val{font-family:'Clash Display','Bricolage Grotesque',sans-serif;font-size:1.7rem;font-weight:700;margin-bottom:.2rem}
        .stat-lbl{font-size:.7rem;color:rgba(200,190,255,.35);font-weight:600;text-transform:uppercase;letter-spacing:.05em}

        /* QUICK */
        .qa-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:1.25rem}
        .qa-card{background:rgba(10,10,20,.7);border:1px solid rgba(124,106,255,.09);
          border-radius:17px;padding:1.4rem;text-align:center;transition:all .3s;
          backdrop-filter:blur(12px);cursor:pointer}
        .qa-card:hover{border-color:rgba(124,106,255,.35);transform:translateY(-4px);
          background:rgba(124,106,255,.07);box-shadow:0 12px 32px rgba(0,0,0,.35)}
        .qa-ico{font-size:1.85rem;margin-bottom:.55rem}
        .qa-t{font-family:'Clash Display','Bricolage Grotesque',sans-serif;font-size:.88rem;font-weight:600;color:#eeeaff;margin-bottom:.22rem}
        .qa-d{font-size:.72rem;color:rgba(200,190,255,.35)}

        /* HISTORY */
        .hist{background:rgba(10,10,20,.75);border:1px solid rgba(124,106,255,.1);
          border-radius:20px;padding:1.5rem;backdrop-filter:blur(12px);animation:fadeUp .5s ease}
        .hist-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem}
        .hist-title{font-family:'Clash Display','Bricolage Grotesque',sans-serif;font-weight:700;
          color:#c4b5fd;display:flex;align-items:center;gap:.5rem;font-size:.95rem}
        .hist-count{font-size:.7rem;color:rgba(200,190,255,.3);font-weight:600;
          background:rgba(124,106,255,.1);padding:3px 9px;border-radius:20px}
        .hi{display:flex;align-items:center;justify-content:space-between;
          padding:.85rem 1rem;background:rgba(255,255,255,.025);border-radius:11px;
          margin-bottom:.5rem;border:1px solid rgba(255,255,255,.04);transition:all .2s}
        .hi:hover{background:rgba(124,106,255,.06);border-color:rgba(124,106,255,.15)}
        .hi-name{font-size:.83rem;font-weight:600;color:#eeeaff;margin-bottom:.18rem}
        .hi-meta{font-size:.7rem;color:rgba(200,190,255,.35)}
        .hi-right{display:flex;align-items:center;gap:.75rem}
        .badge{font-size:.67rem;padding:.2rem .7rem;border-radius:20px;font-weight:700}
        .badge-done{background:rgba(52,211,153,.12);color:#6ee7b7;border:1px solid rgba(52,211,153,.2)}
        .badge-fail{background:rgba(248,113,113,.12);color:#fca5a5;border:1px solid rgba(248,113,113,.2)}
        .hi-dl{font-size:.72rem;color:#a78bfa;font-weight:700;transition:color .2s}
        .hi-dl:hover{color:#c4b5fd}
        .empty{text-align:center;padding:3rem 1rem;color:rgba(200,190,255,.28);font-size:.85rem}
        .empty-ico{font-size:2.5rem;display:block;margin-bottom:.75rem;opacity:.4}

        .shimmer{background:rgba(255,255,255,.04);background-image:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.08) 50%,rgba(255,255,255,.04) 75%);
          background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:8px}

        @media(max-width:640px){.stats-grid{grid-template-columns:repeat(2,1fr)}.qa-grid{grid-template-columns:1fr 1fr}.db-wrap{padding:1rem 1rem 3rem}}
      `}</style>

      <div className="db-bg"/>
      <Navbar />
      <div className="db-wrap">

        {/* Welcome */}
        <div className="welcome">
          <div style={{display:'flex',alignItems:'center',gap:'1.1rem'}}>
            <div className="welcome-ava">{initials}</div>
            <div>
              <div className="welcome-title">Welcome back, {user?.name?.split(' ')[0]}! 👋</div>
              <div className="welcome-sub">{user?.email} · Free Plan · {history.length} projects</div>
            </div>
          </div>
          <div className="welcome-right">
            <Link to="/studio"><button className="btn-w-new">✨ New Project</button></Link>
            <button className="btn-w-out" onClick={() => { logout(); nav('/') }}>Logout</button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {STATS.map((s,i) => (
            <div className="stat-card" key={i} style={{animationDelay:`${i*.07}s`}}>
              <div className="stat-ico">{s.ico}</div>
              <div className="stat-val" style={{color:s.color}}>{s.val}</div>
              <div className="stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="qa-grid">
          {QUICK.map((q,i) => (
            <Link key={i} to={q.to} style={{textDecoration:'none'}}>
              <div className="qa-card">
                <div className="qa-ico">{q.ico}</div>
                <div className="qa-t">{q.t}</div>
                <div className="qa-d">{q.d}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* History */}
        <div className="hist">
          <div className="hist-top">
            <div className="hist-title">📋 Dubbing History</div>
            <span className="hist-count">{history.length} projects</span>
          </div>

          {loading ? (
            Array(3).fill(0).map((_,i) => (
              <div key={i} className="hi">
                <div>
                  <div className="shimmer" style={{width:'180px',height:'14px',marginBottom:'6px'}}/>
                  <div className="shimmer" style={{width:'120px',height:'11px'}}/>
                </div>
              </div>
            ))
          ) : history.length === 0 ? (
            <div className="empty">
              <span className="empty-ico">🎬</span>
              No projects yet —{' '}
              <Link to="/studio" style={{color:'#a78bfa',fontWeight:700}}>start your first dub!</Link>
            </div>
          ) : history.map((h,i) => (
            <div className="hi" key={i}>
              <div>
                <div className="hi-name">{h.video_name || 'Unknown Video'}</div>
                <div className="hi-meta">🌐 {h.target_lang?.toUpperCase()} · 📅 {h.created_at?.split('T')[0] || h.created_at}</div>
              </div>
              <div className="hi-right">
                <span className={`badge ${h.status==='completed'?'badge-done':'badge-fail'}`}>
                  {h.status==='completed'?'✓ Done':'✗ Failed'}
                </span>
                {h.output_file && (
                  <a href={`${API}/download/${h.output_file}`} className="hi-dl">⬇ Download</a>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
