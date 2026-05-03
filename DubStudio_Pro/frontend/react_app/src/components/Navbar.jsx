import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [scrolled,   setScrolled]   = useState(false)
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [userMenu,   setUserMenu]   = useState(false)
  const userRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { setMenuOpen(false); setUserMenu(false) }, [loc.pathname])

  const isActive = p => loc.pathname === p
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  const NAV_LINKS = [
    { to: '/features', label: 'Features' },
    { to: '/pricing',  label: 'Pricing'  },
    { to: '/about',    label: 'About'    },
    { to: '/contact',  label: 'Contact'  },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

        .nb {
          position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
          height: 64px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 2rem;
          background: ${scrolled ? 'rgba(5,5,11,.94)' : 'transparent'};
          border-bottom: 1px solid ${scrolled ? 'rgba(255,255,255,.07)' : 'transparent'};
          backdrop-filter: ${scrolled ? 'blur(28px) saturate(1.6)' : 'none'};
          transition: background .35s, border-color .35s, backdrop-filter .35s;
        }

        /* LOGO */
        .nb-logo {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; flex-shrink: 0;
        }
        .nb-logo-mark {
          position: relative; width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg, #ff6b35, #f7c59f, #ff6b35);
          background-size: 200% 200%;
          animation: logoShift 4s ease infinite;
          display: flex; align-items: center; justify-content: center;
          font-size: .9rem;
          box-shadow: 0 0 18px rgba(255,107,53,.35), 0 2px 8px rgba(0,0,0,.4);
        }
        @keyframes logoShift {
          0%,100% { background-position: 0% 50% }
          50%      { background-position: 100% 50% }
        }
        .nb-logo-name {
          font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.05rem;
          letter-spacing: -.02em; color: #f5f3ff;
        }
        .nb-logo-name span { color: #ff6b35; }

        /* LINKS */
        .nb-links {
          display: flex; align-items: center; gap: 2px;
          position: absolute; left: 50%; transform: translateX(-50%);
        }
        .nb-link {
          position: relative; color: rgba(220,215,255,.45);
          font-family: 'DM Sans', sans-serif; font-size: .83rem; font-weight: 500;
          padding: 6px 14px; border-radius: 8px; text-decoration: none;
          transition: color .2s, background .2s;
          letter-spacing: .01em;
        }
        .nb-link:hover { color: rgba(220,215,255,.9); background: rgba(255,255,255,.05); }
        .nb-link.active { color: #fff; }
        .nb-link.active::after {
          content: ''; position: absolute; bottom: -1px; left: 14px; right: 14px;
          height: 1.5px; border-radius: 1px;
          background: linear-gradient(90deg, #ff6b35, #f7c59f);
        }

        /* RIGHT */
        .nb-right { display: flex; align-items: center; gap: 10px; }

        /* CTA BUTTON */
        .nb-cta {
          position: relative; overflow: hidden;
          display: inline-flex; align-items: center; gap: 6px;
          background: linear-gradient(135deg, #ff6b35, #e85d24);
          border: none; color: white;
          padding: 8px 20px; border-radius: 50px;
          font-family: 'Syne', sans-serif; font-weight: 700; font-size: .78rem;
          letter-spacing: .02em; cursor: pointer;
          box-shadow: 0 0 20px rgba(255,107,53,.3), 0 2px 8px rgba(0,0,0,.3);
          transition: all .25s;
        }
        .nb-cta::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,.18), transparent);
          opacity: 0; transition: opacity .2s;
        }
        .nb-cta:hover { transform: translateY(-1px); box-shadow: 0 0 32px rgba(255,107,53,.5), 0 4px 14px rgba(0,0,0,.3); }
        .nb-cta:hover::before { opacity: 1; }

        /* GHOST BUTTON */
        .nb-ghost {
          background: transparent; border: 1px solid rgba(255,255,255,.1);
          color: rgba(220,215,255,.55); padding: 7px 16px; border-radius: 50px;
          font-family: 'DM Sans', sans-serif; font-size: .8rem; font-weight: 500;
          cursor: pointer; transition: all .2s;
        }
        .nb-ghost:hover { border-color: rgba(255,255,255,.25); color: #f5f3ff; }

        /* USER AVATAR */
        .nb-avatar-wrap { position: relative; }
        .nb-avatar {
          width: 34px; height: 34px; border-radius: 50%; cursor: pointer; flex-shrink: 0;
          background: linear-gradient(135deg, #ff6b35, #a855f7);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif; font-size: .72rem; font-weight: 800; color: white;
          border: 1.5px solid rgba(255,107,53,.4);
          box-shadow: 0 0 12px rgba(255,107,53,.2);
          transition: all .2s;
        }
        .nb-avatar:hover { transform: scale(1.07); box-shadow: 0 0 20px rgba(255,107,53,.4); }

        /* DROPDOWN */
        .nb-dropdown {
          position: absolute; top: calc(100% + 10px); right: 0; min-width: 200px;
          background: rgba(10,10,20,.97); border: 1px solid rgba(255,255,255,.08);
          border-radius: 14px; padding: 6px;
          box-shadow: 0 16px 48px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.04);
          backdrop-filter: blur(24px);
          animation: dropIn .18s ease;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px) scale(.97) }
          to   { opacity: 1; transform: translateY(0) scale(1) }
        }
        .nb-dd-user {
          padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,.06); margin-bottom: 4px;
        }
        .nb-dd-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: .82rem; color: #f5f3ff; }
        .nb-dd-email { font-size: .72rem; color: rgba(220,215,255,.35); margin-top: 2px; }
        .nb-dd-item {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 12px; border-radius: 8px; text-decoration: none;
          color: rgba(220,215,255,.55); font-family: 'DM Sans', sans-serif;
          font-size: .82rem; font-weight: 500; cursor: pointer;
          background: transparent; border: none; width: 100%; text-align: left;
          transition: all .15s;
        }
        .nb-dd-item:hover { background: rgba(255,255,255,.05); color: #f5f3ff; }
        .nb-dd-item.danger:hover { background: rgba(248,113,113,.08); color: #fca5a5; }
        .nb-dd-divider { border: none; border-top: 1px solid rgba(255,255,255,.05); margin: 4px 0; }

        /* MOBILE HAMBURGER */
        .nb-ham {
          display: none; background: none; border: none; cursor: pointer;
          flex-direction: column; gap: 5px; padding: 4px;
        }
        .nb-ham-line {
          display: block; width: 22px; height: 1.5px;
          background: rgba(220,215,255,.6); border-radius: 1px;
          transition: all .3s; transform-origin: center;
        }

        /* MOBILE MENU */
        .nb-mobile {
          display: none; position: fixed; top: 64px; left: 0; right: 0; bottom: 0;
          background: rgba(5,5,11,.98); backdrop-filter: blur(24px);
          flex-direction: column; padding: 1.5rem;
          border-top: 1px solid rgba(255,255,255,.06);
          animation: slideDown .25s ease;
          z-index: 999;
        }
        @keyframes slideDown { from { opacity:0; transform:translateY(-12px) } to { opacity:1; transform:translateY(0) } }
        .nb-mobile.open { display: flex; }
        .nb-m-link {
          color: rgba(220,215,255,.5); font-family: 'Syne', sans-serif; font-weight: 600;
          font-size: 1rem; padding: 14px 4px; border-bottom: 1px solid rgba(255,255,255,.05);
          text-decoration: none; transition: color .2s;
        }
        .nb-m-link:hover, .nb-m-link.active { color: #f5f3ff; }
        .nb-m-btns { display: flex; gap: 10px; margin-top: 1.5rem; }
        .nb-m-btn-ghost {
          flex: 1; padding: 12px; background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.1); color: rgba(220,215,255,.6);
          border-radius: 12px; font-family: 'Syne', sans-serif; font-weight: 600; font-size: .88rem;
          cursor: pointer;
        }
        .nb-m-btn-fill {
          flex: 1; padding: 12px; background: linear-gradient(135deg,#ff6b35,#e85d24);
          border: none; color: white; border-radius: 12px;
          font-family: 'Syne', sans-serif; font-weight: 700; font-size: .88rem; cursor: pointer;
        }

        @media (max-width: 820px) {
          .nb-links { display: none; }
          .nb-ham { display: flex; }
          .nb-ghost, .nb-avatar-wrap { display: none; }
          .nb-cta { display: none; }
        }
      `}</style>

      <nav className="nb">
        {/* LOGO */}
        <Link to="/" className="nb-logo">
          <div className="nb-logo-mark">🎬</div>
          <span className="nb-logo-name">Dub<span>Studio</span></span>
        </Link>

        {/* CENTER LINKS */}
        <div className="nb-links">
          {NAV_LINKS.map(({ to, label }) => (
            <Link key={to} to={to} className={`nb-link ${isActive(to) ? 'active' : ''}`}>
              {label}
            </Link>
          ))}
        </div>

        {/* RIGHT SIDE */}
        <div className="nb-right">
          {user ? (
            <>
              <Link to="/studio">
                <button className="nb-cta">+ New Dub</button>
              </Link>
              <div className="nb-avatar-wrap" ref={userRef}>
                <div className="nb-avatar" onClick={() => setUserMenu(v => !v)}>
                  {initials}
                </div>
                {userMenu && (
                  <div className="nb-dropdown">
                    <div className="nb-dd-user">
                      <div className="nb-dd-name">{user.name}</div>
                      <div className="nb-dd-email">{user.email}</div>
                    </div>
                    <Link to="/dashboard" className="nb-dd-item">📊 Dashboard</Link>
                    <Link to="/studio"    className="nb-dd-item">🎬 New Project</Link>
                    <Link to="/pricing"   className="nb-dd-item">💎 Upgrade Plan</Link>
                    <hr className="nb-dd-divider"/>
                    <button className="nb-dd-item danger" onClick={() => { logout(); nav('/') }}>
                      🚪 Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login">
                <button className="nb-ghost">Login</button>
              </Link>
              <Link to="/signup">
                <button className="nb-cta">Get Started →</button>
              </Link>
            </>
          )}

          {/* HAMBURGER */}
          <button className="nb-ham" onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
            <span className="nb-ham-line" style={{ transform: menuOpen ? 'rotate(45deg) translateY(6.5px)' : '' }} />
            <span className="nb-ham-line" style={{ opacity: menuOpen ? 0 : 1 }} />
            <span className="nb-ham-line" style={{ transform: menuOpen ? 'rotate(-45deg) translateY(-6.5px)' : '' }} />
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <div className={`nb-mobile ${menuOpen ? 'open' : ''}`}>
        {NAV_LINKS.map(({ to, label }) => (
          <Link key={to} to={to} className={`nb-m-link ${isActive(to) ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}>
            {label}
          </Link>
        ))}
        {user && (
          <>
            <Link to="/dashboard" className="nb-m-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
            <Link to="/studio"    className="nb-m-link" onClick={() => setMenuOpen(false)}>Studio</Link>
          </>
        )}
        <div className="nb-m-btns">
          {user ? (
            <button className="nb-m-btn-ghost" onClick={() => { logout(); nav('/'); setMenuOpen(false) }}>
              Sign Out
            </button>
          ) : (
            <>
              <Link to="/login" style={{ flex: 1 }} onClick={() => setMenuOpen(false)}>
                <button className="nb-m-btn-ghost" style={{ width: '100%' }}>Login</button>
              </Link>
              <Link to="/signup" style={{ flex: 1 }} onClick={() => setMenuOpen(false)}>
                <button className="nb-m-btn-fill" style={{ width: '100%' }}>Get Started</button>
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  )
}
