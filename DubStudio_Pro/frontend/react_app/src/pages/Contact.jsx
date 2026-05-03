import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Contact() {
  const [form, setForm] = useState({firstName:'', lastName:'', email:'', subject:'', message:''})
  const [sent, setSent] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setSent(true)
  }

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
        .gradient-text{background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .content-card{background:white;border-radius:20px;padding:3rem 2rem;margin-bottom:2rem;box-shadow:0 10px 30px rgba(0,0,0,.1);}
        .page-title{font-size:2.5rem;font-weight:800;margin-bottom:.5rem;text-align:center;}
        .contact-grid{display:grid;grid-template-columns:2fr 1fr;gap:2rem;}
        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem;}
        .form-label{font-weight:600;color:#333;margin-bottom:.5rem;display:block;}
        .form-control{width:100%;padding:.85rem 1rem;border-radius:10px;border:2px solid #e0e0e0;transition:all .3s;font-size:.95rem;outline:none;font-family:inherit;}
        .form-control:focus{border-color:#667eea;box-shadow:0 0 0 .2rem rgba(102,126,234,.15);}
        textarea.form-control{resize:vertical;min-height:120px;}
        .mb-3{margin-bottom:1rem;}
        .btn-submit{width:100%;padding:.9rem;border-radius:10px;background:var(--gradient);border:none;color:white;font-weight:600;font-size:1rem;cursor:pointer;transition:all .3s;box-shadow:0 5px 15px rgba(102,126,234,.3);}
        .btn-submit:hover{transform:translateY(-2px);}
        .success-msg{background:linear-gradient(135deg,rgba(34,197,94,.15),rgba(16,185,129,.08));border:1px solid rgba(34,197,94,.3);border-radius:16px;padding:2rem;text-align:center;}
        .success-icon{font-size:3rem;color:#22c55e;margin-bottom:1rem;}
        .info-card{background:#f8f9fa;border-radius:16px;padding:2rem;}
        .info-item{display:flex;align-items:flex-start;gap:1rem;margin-bottom:1.5rem;}
        .info-icon{width:44px;height:44px;background:var(--gradient);border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-size:1.2rem;flex-shrink:0;}
        .info-label{font-weight:600;color:#1e293b;margin-bottom:.25rem;}
        .info-val{color:#64748b;font-size:.9rem;}
        @media(max-width:768px){.wrap{padding:1rem}.header{flex-direction:column;gap:1rem}.contact-grid{grid-template-columns:1fr}.form-row{grid-template-columns:1fr}}
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

        <div className="content-card" style={{textAlign:'center'}}>
          <h1 className="page-title">Get in <span className="gradient-text">Touch</span></h1>
          <p style={{color:'#64748b',fontSize:'1.125rem'}}>We'd love to hear from you</p>
        </div>

        <div className="contact-grid">
          <div>
            {sent ? (
              <div className="content-card">
                <div className="success-msg">
                  <div className="success-icon"><i className="bi bi-check-circle-fill"></i></div>
                  <h4 style={{fontWeight:700,color:'#1e293b',marginBottom:'.5rem'}}>Message Sent!</h4>
                  <p style={{color:'#64748b'}}>We'll get back to you within 24 hours.</p>
                </div>
              </div>
            ) : (
              <div className="content-card">
                <h3 style={{fontWeight:700,marginBottom:'1.5rem'}}>Send us a Message</h3>
                <form onSubmit={handleSubmit}>
                  <div className="form-row mb-3">
                    <div>
                      <label className="form-label">First Name</label>
                      <input type="text" className="form-control" placeholder="John" required value={form.firstName} onChange={e => setForm({...form,firstName:e.target.value})} />
                    </div>
                    <div>
                      <label className="form-label">Last Name</label>
                      <input type="text" className="form-control" placeholder="Doe" required value={form.lastName} onChange={e => setForm({...form,lastName:e.target.value})} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email Address</label>
                    <input type="email" className="form-control" placeholder="john@example.com" required value={form.email} onChange={e => setForm({...form,email:e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Subject</label>
                    <input type="text" className="form-control" placeholder="How can we help?" required value={form.subject} onChange={e => setForm({...form,subject:e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Message</label>
                    <textarea className="form-control" placeholder="Tell us more about your inquiry…" required value={form.message} onChange={e => setForm({...form,message:e.target.value})}></textarea>
                  </div>
                  <button type="submit" className="btn-submit"><i className="bi bi-send" style={{marginRight:'.5rem'}}></i>Send Message</button>
                </form>
              </div>
            )}
          </div>

          <div>
            <div className="content-card">
              <h3 style={{fontWeight:700,marginBottom:'1.5rem'}}>Contact Info</h3>
              <div className="info-card">
                {[
                  {icon:'bi-envelope-fill', label:'Email', val:'support@dubstudio.com'},
                  {icon:'bi-telephone-fill', label:'Phone', val:'+1 (555) 123-4567'},
                  {icon:'bi-geo-alt-fill', label:'Address', val:'123 AI Street, San Francisco, CA 94105'},
                  {icon:'bi-clock-fill', label:'Hours', val:'Mon-Fri: 9AM - 6PM PST'},
                ].map((item,i) => (
                  <div className="info-item" key={i}>
                    <div className="info-icon"><i className={`bi ${item.icon}`}></i></div>
                    <div>
                      <div className="info-label">{item.label}</div>
                      <div className="info-val">{item.val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
