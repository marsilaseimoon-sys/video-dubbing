import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div>
      <style>{`
        :root{--gradient:linear-gradient(135deg,#667eea 0%,#764ba2 100%);}
        body{background:var(--gradient);min-height:100vh;}
        .wrap{max-width:1200px;margin:0 auto;padding:2rem;}
        .header{background:white;border-radius:20px;padding:1.5rem 2rem;margin-bottom:2rem;box-shadow:0 10px 30px rgba(0,0,0,.1);display:flex;justify-content:space-between;align-items:center;}
        .brand{display:flex;align-items:center;gap:1rem;}
        .brand-icon{width:45px;height:45px;background:var(--gradient);border-radius:12px;display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem;}
        .brand-text{font-size:1.5rem;font-weight:700;color:#1e293b;}
        .nav-link{color:#64748b;font-weight:500;padding:.5rem 1rem;border-radius:8px;transition:all .2s;}
        .nav-link:hover{background:#f8f9fa;color:#1e293b;}
        .card{background:white;border-radius:20px;padding:3rem 2rem;margin-bottom:2rem;box-shadow:0 10px 30px rgba(0,0,0,.1);}
        .page-title{font-size:2.5rem;font-weight:800;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:.5rem;text-align:center;}
        .page-subtitle{color:#64748b;font-size:1.125rem;text-align:center;margin-bottom:2rem;}
        .section-title{font-size:2rem;font-weight:700;color:#1e293b;margin-bottom:1.5rem;}
        .gradient-text{background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .lead-text{font-size:1.125rem;color:#667eea;font-weight:600;margin-bottom:1rem;}
        .text-content{color:#64748b;line-height:1.8;margin-bottom:1rem;}
        .values-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:2rem;margin:2rem 0;}
        .value-card{text-align:center;padding:2rem;background:#f8f9fa;border-radius:16px;transition:all .3s;}
        .value-card:hover{transform:translateY(-5px);background:white;box-shadow:0 10px 25px rgba(0,0,0,.1);}
        .value-icon{width:70px;height:70px;background:var(--gradient);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;color:white;font-size:2rem;margin-bottom:1rem;}
        .value-title{font-size:1.25rem;font-weight:700;color:#1e293b;margin-bottom:.75rem;}
        .value-text{color:#64748b;font-size:.95rem;}
        .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1.5rem;margin:2rem 0;}
        .stat-card{background:white;padding:2rem;border-radius:16px;text-align:center;box-shadow:0 5px 15px rgba(0,0,0,.08);border:2px solid transparent;transition:all .3s;}
        .stat-card:hover{border-color:#667eea;transform:translateY(-5px);}
        .stat-number{font-size:3rem;font-weight:800;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .stat-label{color:#64748b;font-weight:600;margin-top:.5rem;}
        .team-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:2rem;margin:2rem 0;}
        .member-avatar{width:100px;height:100px;background:var(--gradient);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:white;font-size:2rem;font-weight:700;margin-bottom:1rem;}
        .member-name{font-size:1.125rem;font-weight:700;color:#1e293b;margin-bottom:.25rem;}
        .member-role{color:#667eea;font-weight:600;margin-bottom:.5rem;}
        .member-bio{color:#64748b;font-size:.875rem;}
        .cta-card{background:var(--gradient);color:white;border-radius:20px;padding:3rem 2rem;text-align:center;box-shadow:0 20px 40px rgba(102,126,234,.4);}
        .cta-title{font-size:2rem;font-weight:700;margin-bottom:1rem;}
        .btn-cta{background:white;color:#667eea;border:none;padding:1rem 2.5rem;border-radius:50px;font-weight:600;font-size:1.125rem;cursor:pointer;transition:all .3s;display:inline-flex;align-items:center;gap:.5rem;}
        .btn-cta:hover{transform:translateY(-3px);box-shadow:0 10px 25px rgba(255,255,255,.3);color:#667eea;}
        @media(max-width:768px){.wrap{padding:1rem}.header{flex-direction:column;gap:1rem}.page-title{font-size:2rem}.values-grid,.stats-grid,.team-grid{grid-template-columns:1fr}}
      `}</style>
      <div className="wrap">
        <div className="header">
          <Link to="/" className="brand" style={{textDecoration:'none'}}>
            <div className="brand-icon"><i className="bi bi-play-circle-fill"></i></div>
            <span className="brand-text">DubStudio</span>
          </Link>
          <div style={{display:'flex',gap:'.5rem'}}>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/studio" className="nav-link">Studio</Link>
            <Link to="/" className="nav-link">Home</Link>
          </div>
        </div>

        <div className="card"><h1 className="page-title">About DubStudio</h1><p className="page-subtitle">Breaking language barriers with AI technology</p></div>

        <div className="card">
          <h2 className="section-title">Our Mission</h2>
          <p className="lead-text">To make video content accessible to everyone, regardless of language.</p>
          <p className="text-content">Founded in 2024, DubStudio is revolutionizing how content creators reach global audiences through AI-powered video dubbing. We believe that language should never be a barrier to sharing knowledge, entertainment, and stories.</p>
          <p className="text-content">Our platform combines cutting-edge AI technology with an intuitive interface, making professional-quality video dubbing accessible to creators of all sizes - from individual YouTubers to major media companies.</p>
        </div>

        <div className="card">
          <h2 className="section-title" style={{textAlign:'center'}}>Our Core Values</h2>
          <p style={{textAlign:'center',color:'#64748b',marginBottom:'1rem'}}>The principles that guide everything we do</p>
          <div className="values-grid">
            {[
              {icon:'bi-lightbulb', title:'Innovation', text:'Constantly pushing boundaries in AI technology'},
              {icon:'bi-globe', title:'Accessibility', text:'Making dubbing tools available worldwide'},
              {icon:'bi-star', title:'Quality', text:'Delivering human-like voice synthesis'},
              {icon:'bi-heart', title:'Community', text:'Supporting users with excellent service'},
            ].map((v,i) => (
              <div className="value-card" key={i}>
                <div className="value-icon"><i className={`bi ${v.icon}`}></i></div>
                <div className="value-title">{v.title}</div>
                <p className="value-text">{v.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{background:'#f8f9fa'}}>
          <h2 className="section-title" style={{textAlign:'center'}}>DubStudio by the Numbers</h2>
          <p style={{textAlign:'center',color:'#64748b',marginBottom:'1rem'}}>Join thousands of creators transforming their content</p>
          <div className="stats-grid">
            {[['10K+','Active Users'],['500K+','Videos Dubbed'],['50+','Languages'],['98%','Satisfaction']].map(([n,l],i) => (
              <div className="stat-card" key={i}><div className="stat-number">{n}</div><div className="stat-label">{l}</div></div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="section-title" style={{textAlign:'center'}}>Meet Our Team</h2>
          <p style={{textAlign:'center',color:'#64748b',marginBottom:'1rem'}}>The people behind DubStudio</p>
          <div className="team-grid">
            {[['JD','John Doe','CEO & Founder','15+ years in tech'],['SM','Sarah Miller','CTO','AI expert'],['MK','Mike Kim','Head of AI','ML specialist'],['LW','Lisa Wong','Head of Product','UX advocate']].map(([init,name,role,bio],i) => (
              <div key={i} style={{textAlign:'center'}}>
                <div className="member-avatar">{init}</div>
                <div className="member-name">{name}</div>
                <div className="member-role">{role}</div>
                <p className="member-bio">{bio}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="cta-card">
          <h2 className="cta-title">Join Our Growing Community</h2>
          <p style={{fontSize:'1.125rem',marginBottom:'2rem',opacity:.95}}>Start creating multilingual content today</p>
          <Link to="/signup" className="btn-cta"><i className="bi bi-rocket-takeoff"></i>Get Started Free</Link>
        </div>
      </div>
    </div>
  )
}
