import { Link } from 'react-router-dom'

const features = [
  {icon:'bi-globe', title:'50+ Languages', text:'Support for all major world languages with accurate translation and natural pronunciation.'},
  {icon:'bi-soundwave', title:'Natural Voice Synthesis', text:'AI-powered voices that sound human, with emotion and tone that match the original speaker.'},
  {icon:'bi-lightning-charge', title:'Fast Processing', text:'Process videos in minutes with our optimized AI pipeline. No waiting around.'},
  {icon:'bi-shield-check', title:'Secure & Private', text:'Your content is encrypted and never shared. Full privacy guaranteed.'},
  {icon:'bi-people', title:'Speaker Diarization', text:'Automatically detect and differentiate multiple speakers in your video.'},
  {icon:'bi-link-45deg', title:'URL Support', text:'Process YouTube videos and direct video URLs without downloading first.'},
  {icon:'bi-phone', title:'Mobile Friendly', text:'Access DubStudio from any device, anywhere in the world.'},
  {icon:'bi-arrow-repeat', title:'Batch Processing', text:'Process multiple videos at once to save time and increase productivity.'},
  {icon:'bi-download', title:'HD Download', text:'Download your dubbed videos in high definition, ready for publishing.'},
]

export default function Features() {
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
        .page-header{background:white;border-radius:20px;padding:3rem 2rem;margin-bottom:2rem;box-shadow:0 10px 30px rgba(0,0,0,.1);text-align:center;}
        .page-title{font-size:2.5rem;font-weight:800;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:.5rem;}
        .gradient-text{background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .page-subtitle{color:#64748b;font-size:1.125rem;}
        .features-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.5rem;margin-bottom:2rem;}
        .feature-card{background:white;border-radius:16px;padding:2rem;box-shadow:0 10px 20px rgba(0,0,0,.08);border:1px solid #e2e8f0;transition:all .3s;}
        .feature-card:hover{transform:translateY(-5px);box-shadow:0 15px 35px rgba(0,0,0,.12);border-color:#667eea;}
        .feature-icon{width:60px;height:60px;background:var(--gradient);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;color:white;font-size:1.75rem;margin-bottom:1.25rem;}
        .feature-title{font-size:1.25rem;font-weight:700;color:#1e293b;margin-bottom:.75rem;}
        .feature-text{color:#64748b;line-height:1.6;}
        .cta-card{background:var(--gradient);color:white;border-radius:20px;padding:3rem 2rem;text-align:center;box-shadow:0 20px 40px rgba(102,126,234,.4);}
        .btn-cta{background:white;color:#667eea;border:none;padding:1rem 2.5rem;border-radius:50px;font-weight:600;font-size:1.125rem;cursor:pointer;transition:all .3s;display:inline-flex;align-items:center;gap:.5rem;}
        .btn-cta:hover{transform:translateY(-3px);box-shadow:0 10px 25px rgba(255,255,255,.3);color:#667eea;}
        @media(max-width:768px){.wrap{padding:1rem}.header{flex-direction:column;gap:1rem}.page-title{font-size:2rem}}
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

        <div className="page-header">
          <h1 className="page-title">Powerful Features for <span className="gradient-text">Professional Dubbing</span></h1>
          <p className="page-subtitle">Everything you need to create world-class dubbed videos</p>
        </div>

        <div className="features-grid">
          {features.map((f,i) => (
            <div className="feature-card" key={i}>
              <div className="feature-icon"><i className={`bi ${f.icon}`}></i></div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-text">{f.text}</p>
            </div>
          ))}
        </div>

        <div className="cta-card">
          <h2 style={{fontSize:'2rem',fontWeight:700,marginBottom:'1rem'}}>Ready to Experience These Features?</h2>
          <p style={{fontSize:'1.125rem',marginBottom:'2rem',opacity:.95}}>Start your free trial today — no credit card required</p>
          <Link to="/signup" className="btn-cta"><i className="bi bi-rocket-takeoff"></i>Get Started Free</Link>
        </div>
      </div>
    </div>
  )
}
