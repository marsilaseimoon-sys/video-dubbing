import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const PLANS = [
  { name:'Starter', price:'$0', period:'/mo', desc:'Perfect for trying out AI dubbing', popular:false, color:'rgba(124,106,255,.3)',
    features:['5 videos / month','Up to 5 min per video','3 languages','720p quality','Community support'],
    btn:'Get Started Free', to:'/signup' },
  { name:'Creator', price:'$29', period:'/mo', desc:'Built for serious content creators', popular:true, color:'#7c6aff',
    features:['50 videos / month','Up to 30 min per video','All 50+ languages','4K quality','Priority support','Advanced voice options','Batch processing','Character detection'],
    btn:'Start Free Trial', to:'/signup' },
  { name:'Studio', price:'$99', period:'/mo', desc:'For production teams & agencies', popular:false, color:'rgba(168,85,247,.5)',
    features:['Unlimited videos','Unlimited duration','All 50+ languages','4K quality','24/7 dedicated support','Custom voice training','API access','Team workspace','White-label output'],
    btn:'Contact Sales', to:'/contact' },
]

const FAQS = [
  ['Can I switch plans anytime?', 'Yes — upgrade or downgrade instantly. Changes apply immediately with prorated billing.'],
  ['Is there a free trial?', 'All paid plans include a 14-day free trial. No credit card required to start.'],
  ['Which languages are supported?', 'We support 50+ languages including Urdu, Arabic, Hindi, English, Spanish, French, German, Chinese, Japanese, Korean and more.'],
  ['How does billing work?', 'Monthly or annual billing. Annual plans save 30%. Cancel anytime — no hidden fees.'],
]

export default function Pricing() {
  return (
    <div style={{background:'#040409',minHeight:'100vh',color:'#eeeaff'}}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes borderGlow{0%,100%{box-shadow:0 0 0 0 rgba(124,106,255,.0)}50%{box-shadow:0 0 24px 2px rgba(124,106,255,.25)}}

        .pricing-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:16px;margin-bottom:2rem}
        .plan-card{background:rgba(10,10,20,.75);border:1px solid rgba(124,106,255,.1);
          border-radius:22px;padding:2rem;backdrop-filter:blur(16px);transition:all .3s;
          position:relative;overflow:hidden;animation:fadeUp .4s ease}
        .plan-card.popular{border-color:#7c6aff;animation:borderGlow 3s ease infinite}
        .plan-card:hover{transform:translateY(-5px);box-shadow:0 20px 50px rgba(0,0,0,.4)}
        .plan-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px}
        .plan-card.popular::before{background:linear-gradient(90deg,#7c6aff,#a855f7,#38bdf8)}
        .pop-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;
          background:linear-gradient(135deg,#7c6aff,#a855f7);border-radius:20px;
          font-size:.68rem;font-weight:700;color:white;margin-bottom:1rem;
          box-shadow:0 0 12px rgba(124,106,255,.4)}
        .plan-name{font-family:'Clash Display','Bricolage Grotesque',sans-serif;font-size:1.15rem;font-weight:700;color:#eeeaff;margin-bottom:.4rem}
        .plan-price{display:flex;align-items:baseline;gap:3px;margin:.7rem 0}
        .plan-price-num{font-family:'Clash Display','Bricolage Grotesque',sans-serif;font-size:2.75rem;font-weight:700;
          background:linear-gradient(135deg,#c4b5fd,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .plan-price-period{font-size:.82rem;color:rgba(200,190,255,.35);font-weight:500}
        .plan-desc{font-size:.8rem;color:rgba(200,190,255,.38);margin-bottom:1.5rem;line-height:1.6}
        .plan-features{list-style:none;margin-bottom:1.75rem}
        .plan-feat{display:flex;align-items:flex-start;gap:.6rem;padding:.45rem 0;
          font-size:.8rem;color:rgba(200,190,255,.55);border-bottom:1px solid rgba(255,255,255,.04)}
        .plan-feat:last-child{border-bottom:none}
        .plan-feat-ico{color:#34d399;flex-shrink:0;margin-top:1px}
        .plan-btn{width:100%;padding:.9rem;border-radius:12px;font-family:'Clash Display','Bricolage Grotesque',sans-serif;
          font-size:.88rem;font-weight:700;cursor:pointer;transition:all .25s}
        .plan-btn-fill{background:linear-gradient(135deg,#7c6aff,#a855f7);border:none;color:white;
          box-shadow:0 4px 18px rgba(124,106,255,.35)}
        .plan-btn-fill:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(124,106,255,.55)}
        .plan-btn-out{background:transparent;border:1.5px solid rgba(124,106,255,.25);color:rgba(200,190,255,.65)}
        .plan-btn-out:hover{border-color:#7c6aff;color:#c4b5fd;background:rgba(124,106,255,.08)}

        /* FAQ */
        .faq-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px}
        .faq-item{background:rgba(10,10,20,.6);border:1px solid rgba(124,106,255,.09);
          border-radius:16px;padding:1.5rem;backdrop-filter:blur(12px);transition:all .3s}
        .faq-item:hover{border-color:rgba(124,106,255,.22);transform:translateY(-2px)}
        .faq-q{font-family:'Clash Display','Bricolage Grotesque',sans-serif;font-weight:700;
          color:#c4b5fd;font-size:.88rem;margin-bottom:.65rem;display:flex;align-items:flex-start;gap:.5rem}
        .faq-a{font-size:.8rem;color:rgba(200,190,255,.4);line-height:1.7}

        /* GUARANTEE */
        .guarantee{background:rgba(52,211,153,.05);border:1px solid rgba(52,211,153,.15);
          border-radius:18px;padding:2rem;text-align:center;margin:0 0 2rem}
        .g-ico{font-size:2.5rem;margin-bottom:.75rem;display:block}
        .g-title{font-family:'Clash Display','Bricolage Grotesque',sans-serif;font-size:1.1rem;font-weight:700;color:#6ee7b7;margin-bottom:.4rem}
        .g-sub{font-size:.82rem;color:rgba(110,231,183,.5);line-height:1.7}

        @media(max-width:640px){.pricing-grid{grid-template-columns:1fr}}
      `}</style>

      <div className="page-bg"/><div className="grid-bg"/><div className="noise"/>
      <div className="page-wrap">
        <Navbar/>
        <div className="section">
          <div className="sec-header">
            <div className="tag">Pricing</div>
            <h2 className="sec-title">Simple, <span className="gt">Transparent</span> Pricing</h2>
            <p className="sec-sub">Start free — upgrade when you need more. No hidden fees, cancel anytime.</p>
          </div>

          <div className="pricing-grid">
            {PLANS.map((p,i) => (
              <div key={i} className={`plan-card ${p.popular?'popular':''}`} style={{animationDelay:`${i*.1}s`}}>
                {p.popular && <div className="pop-badge">⭐ Most Popular</div>}
                <div className="plan-name">{p.name}</div>
                <div className="plan-price">
                  <span className="plan-price-num">{p.price}</span>
                  <span className="plan-price-period">{p.period}</span>
                </div>
                <p className="plan-desc">{p.desc}</p>
                <ul className="plan-features">
                  {p.features.map((f,fi) => (
                    <li key={fi} className="plan-feat">
                      <span className="plan-feat-ico">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Link to={p.to}>
                  <button className={`plan-btn ${p.popular?'plan-btn-fill':'plan-btn-out'}`}>{p.btn}</button>
                </Link>
              </div>
            ))}
          </div>

          <div className="guarantee">
            <span className="g-ico">🛡️</span>
            <div className="g-title">14-Day Money-Back Guarantee</div>
            <p className="g-sub">Not satisfied? Get a full refund within 14 days — no questions asked.</p>
          </div>

          <div className="sec-header">
            <div className="tag">FAQ</div>
            <h2 className="sec-title">Common <span className="gt2">Questions</span></h2>
          </div>
          <div className="faq-grid">
            {FAQS.map(([q,a],i) => (
              <div key={i} className="faq-item">
                <div className="faq-q">💬 {q}</div>
                <p className="faq-a">{a}</p>
              </div>
            ))}
          </div>
        </div>
        <Footer/>
      </div>
    </div>
  )
}
