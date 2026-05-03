import { Link } from 'react-router-dom'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <>
      <style>{`
        .footer {
          border-top: 1px solid rgba(124,106,255,.1);
          background: rgba(4,4,9,.8);
          backdrop-filter: blur(20px);
          padding: 3rem 2rem 2rem;
          margin-top: 4rem;
        }
        .footer-inner { max-width: 1160px; margin: 0 auto; }
        .footer-top { display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:2.5rem; margin-bottom:2.5rem; }
        .footer-brand-mark {
          width:38px; height:38px; border-radius:10px;
          background:linear-gradient(135deg,#7c6aff,#a855f7);
          display:flex; align-items:center; justify-content:center; font-size:1rem;
          margin-bottom:1rem; box-shadow:0 0 14px rgba(124,106,255,.35);
        }
        .footer-brand-name {
          font-family:'Clash Display','Bricolage Grotesque',sans-serif;
          font-weight:700; font-size:1.1rem;
          background:linear-gradient(135deg,#c4b5fd,#818cf8);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          display:block; margin-bottom:.6rem;
        }
        .footer-desc { font-size:.8rem; color:rgba(200,190,255,.3); line-height:1.7; max-width:260px; }
        .footer-col-title { font-size:.68rem; font-weight:700; color:rgba(200,190,255,.35);
          letter-spacing:.08em; text-transform:uppercase; margin-bottom:.9rem; }
        .footer-link { display:block; color:rgba(200,190,255,.35); font-size:.82rem;
          font-weight:500; padding:4px 0; transition:color .2s; }
        .footer-link:hover { color:#c4b5fd; }
        .footer-bottom {
          border-top: 1px solid rgba(255,255,255,.05);
          padding-top: 1.5rem;
          display: flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem;
        }
        .footer-copy { font-size:.76rem; color:rgba(200,190,255,.25); }
        .footer-badges { display:flex; gap:8px; flex-wrap:wrap; }
        .footer-badge {
          display:inline-flex; align-items:center; gap:5px; padding:4px 10px;
          background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07);
          border-radius:20px; font-size:.68rem; color:rgba(200,190,255,.3); font-weight:600;
        }
        @media(max-width:768px) {
          .footer-top { grid-template-columns:1fr 1fr; }
        }
        @media(max-width:480px) {
          .footer-top { grid-template-columns:1fr; }
          .footer-bottom { flex-direction:column; align-items:flex-start; }
        }
      `}</style>
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div>
              <div className="footer-brand-mark">🎬</div>
              <span className="footer-brand-name">DubStudio Pro</span>
              <p className="footer-desc">Professional AI video dubbing platform. Translate and dub any video into 50+ languages with character-aware voices.</p>
            </div>
            <div>
              <div className="footer-col-title">Product</div>
              {[['/', 'Home'], ['/studio', 'Studio'], ['/features', 'Features'], ['/pricing', 'Pricing']].map(([to,l]) => (
                <Link key={to} to={to} className="footer-link">{l}</Link>
              ))}
            </div>
            <div>
              <div className="footer-col-title">Company</div>
              {[['/about','About'],['/contact','Contact'],['/dashboard','Dashboard'],['/signup','Sign Up']].map(([to,l]) => (
                <Link key={to} to={to} className="footer-link">{l}</Link>
              ))}
            </div>
            <div>
              <div className="footer-col-title">Languages</div>
              {['Urdu • اردو','English','Arabic • عربي','Hindi • हिंदी','Spanish • ES','50+ Total'].map(l => (
                <span key={l} className="footer-link" style={{cursor:'default'}}>{l}</span>
              ))}
            </div>
          </div>
          <div className="footer-bottom">
            <span className="footer-copy">© {year} DubStudio Pro. All rights reserved.</span>
            <div className="footer-badges">
              <span className="footer-badge">🔒 Secure</span>
              <span className="footer-badge">⚡ Fast AI</span>
              <span className="footer-badge">🌐 50+ Languages</span>
              <span className="footer-badge">✅ Free to Start</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
