import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API = 'http://localhost:5000'

const LANGS=[
  {flag:'🇵🇰',name:'Urdu',   code:'ur'   },{flag:'🇬🇧',name:'English', code:'en'   },
  {flag:'🇸🇦',name:'Arabic', code:'ar'   },{flag:'🇮🇳',name:'Hindi',   code:'hi'   },
  {flag:'🇪🇸',name:'Spanish',code:'es'   },{flag:'🇫🇷',name:'French',  code:'fr'   },
  {flag:'🇩🇪',name:'German', code:'de'   },{flag:'🇮🇹',name:'Italian', code:'it'   },
  {flag:'🇵🇹',name:'Portug.',code:'pt'   },{flag:'🇯🇵',name:'Japanese',code:'ja'   },
  {flag:'🇨🇳',name:'Chinese',code:'zh-cn'},{flag:'🇰🇷',name:'Korean',  code:'ko'   },
  {flag:'🇷🇺',name:'Russian',code:'ru'   },{flag:'🇧🇷',name:'Port.BR', code:'pt-BR'},
  {flag:'🇹🇷',name:'Turkish',code:'tr'   },{flag:'🇳🇱',name:'Dutch',   code:'nl'   },
]
const STAGES=[
  {key:'download',  icon:'⬇',label:'Download',  desc:'Fetching from URL'   },
  {key:'upload',    icon:'⬆',label:'Upload',     desc:'Processing file'     },
  {key:'extract',   icon:'🎵',label:'Audio',      desc:'Extracting audio'    },
  {key:'face',      icon:'👤',label:'Face AI',    desc:'Detecting characters'},
  {key:'transcribe',icon:'🎙',label:'Whisper',    desc:'Transcribing speech' },
  {key:'diarize',   icon:'👥',label:'Speakers',   desc:'Separating speakers' },
  {key:'translate', icon:'🌐',label:'Translate',  desc:'Neural translation'  },
  {key:'synthesize',icon:'🔊',label:'Voice Synth',desc:'Character voices'    },
  {key:'merge',     icon:'🎬',label:'Lip Sync',   desc:'Wav2Lip sync'        },
]
const PLATFORMS=[
  {name:'YouTube',   url:'https://youtube.com',       icon:'▶' },
  {name:'Shorts',    url:'https://youtube.com/shorts', icon:'📱'},
  {name:'TikTok',    url:'https://tiktok.com',         icon:'🎵'},
  {name:'Instagram', url:'https://instagram.com',      icon:'📸'},
  {name:'Facebook',  url:'https://facebook.com/watch', icon:'👍'},
  {name:'Vimeo',     url:'https://vimeo.com',          icon:'🎥'},
]
const CHAR_INFO={
  boy:        {icon:'👦',label:'Boy',      color:'#60a5fa'},
  girl:       {icon:'👧',label:'Girl',     color:'#f472b6'},
  teen_boy:   {icon:'🧑',label:'Teen Boy', color:'#818cf8'},
  teen_girl:  {icon:'👩',label:'Teen Girl',color:'#e879f9'},
  young_man:  {icon:'👨',label:'Young Man',color:'#34d399'},
  young_woman:{icon:'👩',label:'Yng Woman',color:'#f472b6'},
  man:        {icon:'👨',label:'Man',      color:'#ff6b35'},
  woman:      {icon:'👩',label:'Woman',    color:'#f7c59f'},
  old_man:    {icon:'👴',label:'Old Man',  color:'#94a3b8'},
  old_woman:  {icon:'👵',label:'Old Woman',color:'#cbd5e1'},
}

function isYT(u){return /youtube\.com|youtu\.be/i.test(u)}
function isURL(u){return /^https?:\/\/.+/i.test(u)}
function getYTId(u){const m=u.match(/(?:watch\?v=|shorts\/|youtu\.be\/)([^?&/\s]+)/);return m?m[1]:null}
function fmtBytes(b){if(!b)return '';return b<1048576?`${(b/1024).toFixed(1)} KB`:`${(b/1048576).toFixed(1)} MB`}

function Waveform({active}){
  return <div style={{display:'flex',alignItems:'center',gap:2,height:24}}>
    {[.4,.7,1,.85,.6,.9,.5,.75,1,.65,.5,.8].map((h,i)=>(
      <div key={i} style={{width:2.5,borderRadius:2,
        background:active?`hsl(${20+i*8},90%,62%)`:'rgba(255,107,53,.15)',
        height:active?`${h*100}%`:'22%',
        transition:`height ${.25+i*.04}s ease`,
        animation:active?`waveBar ${.6+i*.1}s ease-in-out infinite alternate`:'none',
        animationDelay:`${i*.06}s`}}/>
    ))}
  </div>
}

function CharBadge({id,charType,age}){
  const info=CHAR_INFO[charType]||CHAR_INFO['man']
  return <div style={{display:'inline-flex',alignItems:'center',gap:5,padding:'5px 11px',
    borderRadius:20,background:`${info.color}12`,border:`1px solid ${info.color}35`,
    fontSize:'.72rem',fontWeight:700,color:info.color,fontFamily:"'JetBrains Mono',monospace"}}>
    <span style={{fontSize:'.9rem'}}>{info.icon}</span>
    <span>{id}</span><span style={{opacity:.55}}>· {info.label}</span>
    {age&&<span style={{opacity:.4}}>~{Math.round(age)}y</span>}
  </div>
}

export default function Studio(){
  // Safe useAuth — never crashes even if context missing
  let user=null,logout=()=>{}
  try{const a=useAuth();user=a?.user||null;logout=a?.logout||logout}catch(e){}
  const navigate=useNavigate()

  const [scrolled,   setScrolled]  =useState(false)
  const [menuOpen,   setMenuOpen]  =useState(false)
  const [tab,        setTab]       =useState('upload')
  const [lang,       setLang]      =useState('ur')
  const [filePath,   setFilePath]  =useState(null)
  const [fileInfo,   setFileInfo]  =useState(null)
  const [urlVal,     setUrlVal]    =useState('')
  const [urlState,   setUrlState]  =useState(null)
  const [ytId,       setYtId]      =useState(null)
  const [ytMeta,     setYtMeta]    =useState(null)
  const [confirmed,  setConfirmed] =useState(false)
  const [uploading,  setUploading] =useState(false)
  const [uploadPct,  setUploadPct] =useState(0)
  const [dragOver,   setDragOver]  =useState(false)
  const [processing, setProcessing]=useState(false)
  const [stages,     setStages]    =useState({})
  const [progress,   setProgress]  =useState(0)
  const [curStage,   setCurStage]  =useState('')
  const [done,       setDone]      =useState(false)
  const [toast,      setToast]     =useState(null)
  const [dlUrl,      setDlUrl]     =useState(null)
  const [pubUrl,     setPubUrl]    =useState(null)
  const [characters, setCharacters]=useState([])
  const [copied,     setCopied]    =useState(null)
  const [diarization,setDiarization]=useState(true)
  const [faceDetect, setFaceDetect]=useState(true)
  const [lipSync,    setLipSync]   =useState(true)
  const [showAdv,    setShowAdv]   =useState(false)

  const fileRef=useRef(),pollRef=useRef(),ytDebRef=useRef(),confRef=useRef(),videoRef=useRef(),urlRef=useRef()

  useEffect(()=>{
    const fn=()=>setScrolled(window.scrollY>20)
    window.addEventListener('scroll',fn,{passive:true})
    return()=>window.removeEventListener('scroll',fn)
  },[])

  useEffect(()=>{
    fetch(`${API}/api/public-url`).then(r=>r.json()).then(d=>{if(d?.url)setPubUrl(d.url)}).catch(()=>{})
  },[])

  function msg(type,text,dur=4000){setToast({type,text});setTimeout(()=>setToast(null),dur)}

  function reset(newTab){
    clearInterval(pollRef.current);clearTimeout(confRef.current);clearTimeout(ytDebRef.current)
    if(newTab!==undefined)setTab(newTab)
    setFilePath(null);setFileInfo(null);setUrlVal('');setUrlState(null);setYtId(null);setYtMeta(null)
    setConfirmed(false);setUploading(false);setUploadPct(0);setDragOver(false)
    setStages({});setProgress(0);setCurStage('');setProcessing(false);setDone(false)
    setToast(null);setDlUrl(null);setCharacters([]);setCopied(null)
  }

  useEffect(()=>{
    clearTimeout(confRef.current);clearTimeout(ytDebRef.current)
    const v=urlVal.trim()
    if(!v){setUrlState(null);setYtId(null);setConfirmed(false);setFilePath(null);return}
    if(isYT(v)){
      setUrlState('yt')
      const id=getYTId(v)
      if(id&&id!==ytId){setYtId(id);setYtMeta(null);ytDebRef.current=setTimeout(()=>fetchMeta(v),700)}
      confRef.current=setTimeout(()=>{setFilePath(v);setConfirmed(true)},1400)
    }else if(isURL(v)){
      setUrlState('direct')
      confRef.current=setTimeout(()=>{setFilePath(v);setConfirmed(true)},800)
    }else{setUrlState('invalid');setConfirmed(false);setFilePath(null)}
  },[urlVal])

  async function fetchMeta(u){
    try{const r=await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(u)}&format=json`);if(r.ok)setYtMeta(await r.json())}catch{}
  }

  function handleFile(f){
    if(!f||!f.type.startsWith('video/')){msg('error','Valid video file select karo.');return}
    setFileInfo({name:f.name,size:f.size});setUploading(true);setUploadPct(0)
    const xhr=new XMLHttpRequest()
    xhr.upload.onprogress=e=>{if(e.lengthComputable)setUploadPct(Math.round(e.loaded/e.total*100))}
    xhr.onload=()=>{
      setUploading(false)
      try{const d=JSON.parse(xhr.responseText);setFilePath(d.success?d.filepath:f.name)}catch{setFilePath(f.name)}
      msg('success',`✅ ${f.name} ready!`)
    }
    xhr.onerror=()=>{setUploading(false);setFilePath(f.name);msg('success',`✅ ${f.name} ready!`)}
    xhr.open('POST',`${API}/api/upload`)
    const fd=new FormData();fd.append('video',f);xhr.send(fd)
  }

  function onDrop(e){e.preventDefault();setDragOver(false);e.dataTransfer.files[0]&&handleFile(e.dataTransfer.files[0])}

  async function startDub(){
    if(!filePath&&!confirmed){msg('error','Video add karo.');return}
    setProcessing(true);setDone(false);setStages({});setProgress(3);setCharacters([])
    const payload={language:lang,diarization,face_detection:faceDetect,wav2lip:lipSync}
    if(tab==='url')payload.url=urlVal||filePath;else payload.filepath=filePath
    try{
      const res=await fetch(`${API}/api/process`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      const data=await res.json()
      if(data.success){msg('info','🔄 Processing started…');pollRef.current=setInterval(()=>poll(data.job_id),2000)}
      else throw new Error(data.error)
    }catch{msg('info','🎮 Demo mode — backend connect karo.');runDemo()}
  }

  function runDemo(){
    const list=tab==='url'
      ?['download','extract','face','transcribe','diarize','translate','synthesize','merge']
      :['extract','face','transcribe','diarize','translate','synthesize','merge']
    setTimeout(()=>setCharacters([
      {id:'CHAR_00',charType:'man',age:38},
      {id:'CHAR_01',charType:'woman',age:28},
      {id:'CHAR_02',charType:'teen_boy',age:15},
    ]),3500)
    let i=0
    const iv=setInterval(()=>{
      if(i>0)setStages(p=>({...p,[list[i-1]]:'done'}))
      if(i<list.length){setStages(p=>({...p,[list[i]]:'active'}));setCurStage(list[i]);setProgress(Math.round((i+1)/list.length*92)+3);i++}
      else{clearInterval(iv);setStages(p=>({...p,[list[list.length-1]]:'done'}));setProgress(100);setDone(true);setProcessing(false);setCurStage('');msg('success','🎉 Dubbing complete!')}
    },1100)
    pollRef.current=iv
  }

  async function poll(jobId){
    try{
      const r=await fetch(`${API}/api/status/${jobId}`)
      const d=await r.json();if(!d?.success)return
      const j=d.job
      setProgress(j.progress||0)
      if(j.stage){setStages(p=>({...p,[j.stage]:j.stage_status}));setCurStage(j.stage)}
      if(j.characters?.length>0)setCharacters(j.characters)
      if(j.status==='completed'){
        clearInterval(pollRef.current);setDone(true);setProcessing(false);setCurStage('')
        setDlUrl(j.download_url);msg('success','🎉 Dubbed video ready!')
      }else if(j.status==='failed'){
        clearInterval(pollRef.current);setProcessing(false);setCurStage('')
        msg('error',j.message||'Processing failed.')
      }
    }catch{}
  }

  function copy(text,key){navigator.clipboard.writeText(text).then(()=>{setCopied(key);setTimeout(()=>setCopied(null),2000)})}

  const canStart=(!!filePath||confirmed)&&!processing&&!uploading
  const localUrl=dlUrl?`${API}${dlUrl}`:null
  const pubVideoUrl=dlUrl&&pubUrl?`${pubUrl}${dlUrl}`:null
  const initials=user?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)||''

  return(
<div style={{minHeight:'100vh',background:'#06060e',color:'#ede8ff',fontFamily:"'DM Sans',sans-serif",overflowX:'hidden'}}>
<style>{`
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{background:#06060e;min-height:100vh}
::-webkit-scrollbar{width:4px;background:#06060e}::-webkit-scrollbar-thumb{background:rgba(255,107,53,.2);border-radius:2px}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes popIn{0%{transform:scale(.92);opacity:0}70%{transform:scale(1.02)}100%{transform:scale(1);opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes waveBar{from{transform:scaleY(1)}to{transform:scaleY(.25)}}
@keyframes pulse{0%,100%{border-color:rgba(255,107,53,.25)}50%{border-color:rgba(255,107,53,.6)}}
@keyframes glow{0%,100%{box-shadow:0 0 12px rgba(255,107,53,.2)}50%{box-shadow:0 0 28px rgba(255,107,53,.55)}}
@keyframes logoS{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes slideD{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}

/* NAV */
.snv{position:fixed;top:0;left:0;right:0;z-index:9000;height:62px;display:flex;align-items:center;justify-content:space-between;padding:0 2rem;background:rgba(6,6,14,.0);transition:background .35s,border-color .35s,backdrop-filter .35s}
.snv.on{background:rgba(6,6,14,.95);border-bottom:1px solid rgba(255,107,53,.12);backdrop-filter:blur(28px);box-shadow:0 2px 24px rgba(0,0,0,.5)}
.nbrand{display:flex;align-items:center;gap:10px;text-decoration:none;flex-shrink:0}
.nmark{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#ff6b35,#f7c59f,#ff6b35);background-size:200% 200%;animation:logoS 4s ease infinite;display:flex;align-items:center;justify-content:center;font-size:.9rem;box-shadow:0 0 16px rgba(255,107,53,.35)}
.nname{font-family:'Syne',sans-serif;font-weight:800;font-size:1.05rem;letter-spacing:-.02em;color:#f5f3ff}
.nname b{color:#ff6b35;font-weight:800}
.nlinks{display:flex;align-items:center;gap:2px;position:absolute;left:50%;transform:translateX(-50%)}
.nlink{color:rgba(220,215,255,.42);font-family:'DM Sans',sans-serif;font-size:.82rem;font-weight:500;padding:6px 14px;border-radius:8px;text-decoration:none;transition:all .2s}
.nlink:hover{color:rgba(220,215,255,.9);background:rgba(255,255,255,.05)}
.nright{display:flex;align-items:center;gap:8px}
.nbtn{background:linear-gradient(135deg,#ff6b35,#e85d24);border:none;color:white;padding:7px 18px;border-radius:20px;font-family:'Syne',sans-serif;font-weight:700;font-size:.78rem;cursor:pointer;box-shadow:0 0 14px rgba(255,107,53,.3);transition:all .2s;text-decoration:none;display:inline-flex;align-items:center}
.nbtn:hover{transform:translateY(-1px);box-shadow:0 0 24px rgba(255,107,53,.5)}
.nghost{background:transparent;border:1px solid rgba(255,255,255,.1);color:rgba(220,215,255,.55);padding:7px 16px;border-radius:20px;font-family:'DM Sans',sans-serif;font-size:.8rem;cursor:pointer;transition:all .2s;text-decoration:none;display:inline-flex;align-items:center}
.nghost:hover{border-color:rgba(255,255,255,.25);color:#f5f3ff}
.nava{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#ff6b35,#a855f7);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:.72rem;font-weight:800;color:white;cursor:pointer;border:1.5px solid rgba(255,107,53,.4);transition:all .2s;flex-shrink:0}
.nava:hover{transform:scale(1.07)}
.nham{display:none;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:4px}
.nhl{display:block;width:22px;height:1.5px;background:rgba(220,215,255,.6);border-radius:1px;transition:all .3s;transform-origin:center}
.nmenu{display:none;position:fixed;top:62px;left:0;right:0;background:rgba(4,4,9,.98);border-top:1px solid rgba(255,255,255,.06);padding:1.25rem;flex-direction:column;gap:4px;z-index:8999;backdrop-filter:blur(24px)}
.nmenu.open{display:flex;animation:slideD .2s ease}
.nmlink{color:rgba(220,215,255,.5);font-family:'Syne',sans-serif;font-weight:600;font-size:.95rem;padding:12px 4px;border-bottom:1px solid rgba(255,255,255,.05);text-decoration:none;transition:color .2s}
.nmlink:hover{color:#f5f3ff}
.nmbtns{display:flex;gap:10px;margin-top:1.25rem}
.nmfill{flex:1;padding:11px;background:linear-gradient(135deg,#ff6b35,#e85d24);border:none;color:white;border-radius:12px;font-family:'Syne',sans-serif;font-weight:700;font-size:.88rem;cursor:pointer}
.nmout{flex:1;padding:11px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:rgba(220,215,255,.6);border-radius:12px;font-family:'Syne',sans-serif;font-weight:600;font-size:.88rem;cursor:pointer}

/* BACKGROUND */
.sbg{position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse 80vw 60vh at 10% 5%,rgba(255,107,53,.07) 0,transparent 55%),radial-gradient(ellipse 60vw 50vh at 85% 90%,rgba(168,85,247,.05) 0,transparent 55%),#06060e}
.sgrid{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.018;background-image:linear-gradient(rgba(255,107,53,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,107,53,1) 1px,transparent 1px);background-size:48px 48px}

/* CONTENT */
.sw{position:relative;z-index:1;max-width:980px;margin:0 auto;padding:82px 18px 80px}
.sc{background:rgba(10,10,20,.8);border:1px solid rgba(255,255,255,.07);border-radius:20px;padding:22px;margin-bottom:14px;backdrop-filter:blur(18px);animation:fadeUp .4s ease both;box-shadow:0 8px 36px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.03);position:relative;overflow:hidden}
.sc::before{content:'';position:absolute;top:0;left:12%;right:12%;height:1px;background:linear-gradient(90deg,transparent,rgba(255,107,53,.2),transparent)}
.sh{display:flex;align-items:center;gap:8px;margin-bottom:16px;font-family:'Syne',sans-serif;font-size:.72rem;font-weight:700;color:rgba(200,185,255,.4);letter-spacing:.09em;text-transform:uppercase}
.sh::before{content:'';width:16px;height:2px;border-radius:1px;background:linear-gradient(90deg,#ff6b35,#f7c59f);flex-shrink:0}
.shb{margin-left:auto;padding:3px 9px;border-radius:20px;font-size:.62rem;font-weight:700;background:rgba(255,107,53,.1);border:1px solid rgba(255,107,53,.22);color:#ff9a6c}

/* TABS */
.stabs{display:flex;gap:4px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:13px;padding:4px;margin-bottom:18px}
.stab{flex:1;padding:10px;border:none;background:transparent;cursor:pointer;border-radius:9px;font-size:.8rem;font-weight:600;color:rgba(200,185,255,.3);transition:all .22s;font-family:'Syne',sans-serif;display:flex;align-items:center;justify-content:center;gap:6px}
.stab.on{background:rgba(255,107,53,.15);color:#ff9a6c;border:1px solid rgba(255,107,53,.25)}
.stab:hover:not(.on){color:rgba(200,185,255,.6);background:rgba(255,255,255,.04)}

/* PLATFORMS */
.platrow{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
.plat{display:flex;align-items:center;gap:4px;padding:5px 11px;border-radius:20px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);font-size:.72rem;font-weight:600;color:rgba(200,185,255,.35);text-decoration:none;transition:all .2s}
.plat:hover{background:rgba(255,255,255,.08);color:#ede8ff;transform:translateY(-2px)}

/* URL */
.urfw{display:flex;align-items:center;background:rgba(255,255,255,.03);border:1.5px solid rgba(255,107,53,.15);border-radius:13px;overflow:hidden;transition:all .3s}
.urfw:focus-within{border-color:rgba(255,107,53,.5);box-shadow:0 0 0 3px rgba(255,107,53,.08)}
.urfw.yt{border-color:rgba(255,68,68,.4)}.urfw.ok{border-color:rgba(52,211,153,.35)}
.urlico{padding:0 13px;font-size:.9rem;color:rgba(200,185,255,.25);flex-shrink:0}
.urlin{flex:1;border:none;background:transparent;padding:13px 4px;font-size:.85rem;font-family:'JetBrains Mono',monospace;color:#ede8ff;outline:none}
.urlin::placeholder{color:rgba(200,185,255,.18);font-family:'DM Sans',sans-serif}
.urlx{padding:0 13px;background:none;border:none;color:rgba(200,185,255,.2);cursor:pointer;font-size:.9rem}.urlx:hover{color:#f87171}

/* UPLOAD */
.dropz{border:2px dashed rgba(255,107,53,.15);border-radius:15px;padding:44px 20px;text-align:center;cursor:pointer;background:rgba(255,107,53,.02);transition:all .3s}
.dropz.ov,.dropz:hover{border-color:rgba(255,107,53,.4);background:rgba(255,107,53,.06);box-shadow:0 0 36px rgba(255,107,53,.07) inset}
.dropico{font-size:2.8rem;display:block;margin-bottom:10px;line-height:1}
.droptit{font-family:'Syne',sans-serif;font-weight:700;font-size:.95rem;color:#ff9a6c;margin-bottom:5px}
.dropsub{font-size:.72rem;color:rgba(200,185,255,.25)}
.upbar{height:3px;background:rgba(255,255,255,.05);border-radius:2px;overflow:hidden;margin-top:12px}
.upfill{height:100%;border-radius:2px;transition:width .4s ease;background:linear-gradient(90deg,#ff6b35,#f7c59f);background-size:200% 100%;animation:shimmer 2s linear infinite;box-shadow:0 0 8px rgba(255,107,53,.5)}
.confrow{display:flex;align-items:center;gap:9px;padding:10px 13px;margin-top:10px;background:rgba(52,211,153,.06);border:1px solid rgba(52,211,153,.18);border-radius:11px;animation:popIn .3s ease}
.confl{font-size:.62rem;font-weight:700;color:#34d399;text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:2px}
.confu{font-size:.78rem;color:#ede8ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.confx{background:none;border:none;color:rgba(200,185,255,.2);cursor:pointer;font-size:.9rem}.confx:hover{color:#f87171}
.ytcard{background:rgba(255,68,68,.05);border:1px solid rgba(255,68,68,.15);border-radius:13px;padding:14px;margin-top:12px;animation:fadeUp .3s ease}
.ytthumb{width:108px;height:64px;border-radius:8px;object-fit:cover;background:rgba(255,68,68,.08);flex-shrink:0;border:1px solid rgba(255,68,68,.12)}
.yttit{font-size:.84rem;font-weight:600;color:#ede8ff;margin-bottom:4px;line-height:1.4}
.ytch{font-size:.7rem;color:rgba(200,185,255,.4);margin-bottom:8px}
.ytopen{display:inline-flex;align-items:center;gap:4px;padding:5px 12px;background:rgba(255,0,0,.12);border:1.5px solid rgba(255,0,0,.25);border-radius:7px;color:#fca5a5;font-size:.72rem;font-weight:700;text-decoration:none}.ytopen:hover{background:rgba(255,0,0,.2)}

/* LANG */
.lgg{display:grid;grid-template-columns:repeat(auto-fill,minmax(78px,1fr));gap:7px}
.lgi{background:rgba(255,255,255,.025);border:1.5px solid rgba(255,255,255,.05);border-radius:11px;padding:10px 5px;text-align:center;cursor:pointer;transition:all .22s}
.lgi:hover{border-color:rgba(255,107,53,.25);transform:translateY(-2px)}
.lgi.on{border-color:#ff6b35;background:rgba(255,107,53,.1);box-shadow:0 0 0 1px #ff6b35,0 4px 18px rgba(255,107,53,.18);animation:pulse 2s ease infinite}
.lgf{font-size:1.7rem;display:block;margin-bottom:4px;line-height:1}
.lgn{font-size:.62rem;font-weight:600;color:rgba(200,185,255,.3)}.lgi.on .lgn{color:#ff9a6c}

/* PIPELINE */
.pipegrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:7px;margin-bottom:18px}
.stg{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.05);border-radius:11px;padding:12px 13px;display:flex;flex-direction:column;gap:5px;transition:all .28s}
.stg.active{background:rgba(255,107,53,.08);border-color:rgba(255,107,53,.3);animation:pulse 1.8s ease infinite}
.stg.done{background:rgba(52,211,153,.05);border-color:rgba(52,211,153,.2)}
.stg.err{background:rgba(239,68,68,.05);border-color:rgba(239,68,68,.2)}
.stico{width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,.04);display:flex;align-items:center;justify-content:center;font-size:.85rem}
.stg.active .stico{background:rgba(255,107,53,.18)}.stg.done .stico{background:rgba(52,211,153,.12)}
.stlb{font-family:'Syne',sans-serif;font-weight:700;font-size:.7rem;color:rgba(200,185,255,.4)}
.stg.active .stlb{color:#ff9a6c}.stg.done .stlb{color:#6ee7b7}
.stdesc{font-size:.6rem;color:rgba(200,185,255,.2);line-height:1.4}
.ststat{font-size:.59rem;font-weight:700;color:rgba(200,185,255,.15);letter-spacing:.04em}
.stg.active .ststat{color:#ff6b35}.stg.done .ststat{color:#34d399}
.progbar{flex:1;height:3px;background:rgba(255,255,255,.05);border-radius:2px;overflow:hidden}
.progfill{height:100%;border-radius:2px;transition:width .5s ease;background:linear-gradient(90deg,#ff6b35,#f7c59f,#ff6b35);background-size:200% 100%;animation:shimmer 2s linear infinite;box-shadow:0 0 8px rgba(255,107,53,.5)}
.chpanel{background:rgba(255,107,53,.06);border:1px solid rgba(255,107,53,.15);border-radius:13px;padding:12px 14px;margin-bottom:13px;animation:popIn .4s ease}
.chhd{font-family:'Syne',sans-serif;font-size:.7rem;font-weight:700;color:rgba(255,154,108,.5);letter-spacing:.06em;text-transform:uppercase;margin-bottom:9px}
.chrow{display:flex;flex-wrap:wrap;gap:6px}
.advbtn{display:flex;align-items:center;gap:7px;background:none;border:1px solid rgba(255,255,255,.07);border-radius:9px;padding:8px 14px;color:rgba(200,185,255,.3);font-size:.74rem;font-weight:600;cursor:pointer;transition:all .2s;margin-bottom:12px;font-family:'Syne',sans-serif}
.advbtn:hover{border-color:rgba(255,107,53,.25);color:#ff9a6c}
.advpanel{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:13px;padding:14px;margin-bottom:14px;animation:fadeUp .2s ease}
.trow{display:flex;gap:8px;flex-wrap:wrap}
.tchip{display:flex;align-items:center;gap:5px;padding:7px 12px;border-radius:20px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);font-size:.73rem;font-weight:600;color:rgba(200,185,255,.3);cursor:pointer;transition:all .2s;font-family:'DM Sans',sans-serif}
.tchip.on{background:rgba(255,107,53,.12);color:#ff9a6c;border-color:rgba(255,107,53,.25)}
.tchip .dot{width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.5}.tchip.on .dot{opacity:1;box-shadow:0 0 7px currentColor}
.btnstart{width:100%;padding:15px;border:none;border-radius:13px;cursor:pointer;font-family:'Syne',sans-serif;font-size:.92rem;font-weight:800;background:linear-gradient(135deg,#ff6b35,#e85d24,#ff6b35);background-size:200% auto;color:white;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .25s;margin-top:14px;box-shadow:0 4px 22px rgba(255,107,53,.35);animation:shimmer 4s linear infinite}
.btnstart:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 36px rgba(255,107,53,.55)}
.btnstart:disabled{opacity:.3;cursor:not-allowed;transform:none;animation:none}
.spin{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,.2);border-top:2px solid white;border-radius:50%;animation:spin .7s linear infinite}
.donebanner{background:linear-gradient(135deg,rgba(52,211,153,.1),rgba(16,185,129,.05));border:1px solid rgba(52,211,153,.22);border-radius:15px;padding:18px 20px;display:flex;align-items:flex-start;gap:14px;margin-bottom:16px;animation:popIn .5s ease}
.doneico{width:48px;height:48px;background:rgba(52,211,153,.1);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0;animation:glow 2s ease infinite}
.donetit{font-family:'Syne',sans-serif;font-weight:800;font-size:1.05rem;color:#ede8ff;margin-bottom:4px}
.donesub{font-size:.79rem;color:rgba(200,185,255,.4);line-height:1.6}
.vidwrap{background:#000;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.07);margin-bottom:14px;box-shadow:0 12px 48px rgba(0,0,0,.5)}
.vidwrap video{width:100%;display:block;max-height:420px}
.sharebox{background:rgba(10,10,20,.7);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:15px 17px;margin-bottom:12px}
.sharehd{font-size:.67rem;font-weight:700;color:rgba(200,185,255,.3);letter-spacing:.07em;text-transform:uppercase;margin-bottom:9px;display:flex;align-items:center;gap:6px}
.linkrow{display:flex;gap:6px;align-items:center}
.linkinp{flex:1;background:rgba(255,255,255,.04);border:1.5px solid rgba(255,255,255,.08);border-radius:9px;padding:8px 11px;font-size:.74rem;color:#a5f3fc;font-family:'JetBrains Mono',monospace;outline:none;cursor:text}
.linkinp.grn{color:#6ee7b7;border-color:rgba(52,211,153,.2)}
.copybtn{background:rgba(255,107,53,.12);border:1px solid rgba(255,107,53,.2);border-radius:9px;padding:8px 13px;color:#ff9a6c;font-size:.72rem;font-weight:700;cursor:pointer;white-space:nowrap;font-family:'DM Sans',sans-serif;transition:all .2s}
.copybtn:hover{background:rgba(255,107,53,.22)}.copybtn.ok{background:rgba(52,211,153,.15);border-color:rgba(52,211,153,.25);color:#6ee7b7}
.openbtn{background:rgba(56,189,248,.08);border:1px solid rgba(56,189,248,.18);border-radius:9px;padding:8px 13px;color:#7dd3fc;font-size:.72rem;font-weight:700;text-decoration:none;white-space:nowrap}
.openbtn.grn{background:rgba(52,211,153,.08);border-color:rgba(52,211,153,.2);color:#6ee7b7}
.socrow{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}
.soc{display:flex;align-items:center;gap:5px;padding:7px 13px;border-radius:20px;font-size:.73rem;font-weight:600;text-decoration:none;transition:all .2s}
.wa{background:rgba(37,211,102,.1);border:1px solid rgba(37,211,102,.2);color:#4ade80}.wa:hover{background:rgba(37,211,102,.2)}
.tg{background:rgba(0,136,204,.1);border:1px solid rgba(0,136,204,.2);color:#7dd3fc}.tg:hover{background:rgba(0,136,204,.2)}
.sh2{background:rgba(168,85,247,.1);border:1px solid rgba(168,85,247,.2);color:#c084fc;cursor:pointer;font-family:inherit}
.dlrow{display:flex;gap:9px;margin-top:4px}
.btndl{flex:1;padding:13px;background:linear-gradient(135deg,#ff6b35,#e85d24);border:none;border-radius:12px;color:white;font-family:'Syne',sans-serif;font-size:.86rem;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .22s;box-shadow:0 4px 18px rgba(255,107,53,.3)}
.btndl:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(255,107,53,.5)}
.btnnew{padding:13px 20px;background:transparent;border:1.5px solid rgba(255,255,255,.09);border-radius:12px;color:rgba(200,185,255,.4);font-family:'Syne',sans-serif;font-size:.86rem;font-weight:700;cursor:pointer;transition:all .2s}
.btnnew:hover{border-color:rgba(255,107,53,.3);color:#ff9a6c}
.tst{position:fixed;bottom:28px;right:20px;z-index:9999;padding:12px 16px;border-radius:12px;font-size:.8rem;font-weight:600;display:flex;align-items:center;gap:8px;max-width:340px;backdrop-filter:blur(20px);animation:popIn .3s ease;box-shadow:0 8px 32px rgba(0,0,0,.4)}
.tst.success{background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.25);color:#6ee7b7}
.tst.error{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.25);color:#fca5a5}
.tst.info{background:rgba(255,107,53,.12);border:1px solid rgba(255,107,53,.25);color:#ff9a6c}
.pubbadge{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.25);border-radius:20px;font-size:.64rem;font-weight:700;color:#34d399;margin-left:auto}
@media(max-width:820px){.nlinks{display:none}.nham{display:flex}.nghost{display:none}.nbtn{display:none}}
@media(max-width:640px){.sw{padding:74px 12px 60px}.pipegrid{grid-template-columns:repeat(2,1fr)}.lgg{grid-template-columns:repeat(4,1fr)}.dlrow{flex-direction:column}}
`}</style>

<div className="sbg"/><div className="sgrid"/>
{toast&&<div className={`tst ${toast.type}`}>{toast.type==='success'?'✅':toast.type==='error'?'❌':'🔄'} {toast.text}</div>}

{/* ── NAVBAR ── */}
<nav className={`snv ${scrolled?'on':''}`}>
  <Link to="/" className="nbrand">
    <div className="nmark">🎬</div>
    <span className="nname">Dub<b>Studio</b></span>
  </Link>
  <div className="nlinks">
    <Link to="/"        className="nlink">Home</Link>
    <Link to="/features"className="nlink">Features</Link>
    <Link to="/pricing" className="nlink">Pricing</Link>
    <Link to="/about"   className="nlink">About</Link>
  </div>
  <div className="nright">
    {user?(
      <>
        {initials&&<div className="nava">{initials}</div>}
        <Link to="/dashboard" className="nbtn">Dashboard</Link>
      </>
    ):(
      <>
        <Link to="/login"  className="nghost">Login</Link>
        <Link to="/signup" className="nbtn">Get Started</Link>
      </>
    )}
    <button className="nham" onClick={()=>setMenuOpen(v=>!v)} aria-label="Menu">
      <span className="nhl" style={{transform:menuOpen?'rotate(45deg) translateY(6.5px)':''}}/>
      <span className="nhl" style={{opacity:menuOpen?0:1}}/>
      <span className="nhl" style={{transform:menuOpen?'rotate(-45deg) translateY(-6.5px)':''}}/>
    </button>
  </div>
</nav>

{/* MOBILE MENU */}
<div className={`nmenu ${menuOpen?'open':''}`}>
  {[['/',       'Home'],
    ['/features','Features'],
    ['/pricing', 'Pricing'],
    ['/about',   'About']].map(([to,lbl])=>(
    <Link key={to} to={to} className="nmlink" onClick={()=>setMenuOpen(false)}>{lbl}</Link>
  ))}
  <div className="nmbtns">
    {user?(
      <button className="nmout" onClick={()=>{logout();navigate('/');setMenuOpen(false)}}>Logout</button>
    ):(
      <>
        <Link to="/login"  style={{flex:1}} onClick={()=>setMenuOpen(false)}><button className="nmout"  style={{width:'100%'}}>Login</button></Link>
        <Link to="/signup" style={{flex:1}} onClick={()=>setMenuOpen(false)}><button className="nmfill" style={{width:'100%'}}>Sign Up</button></Link>
      </>
    )}
  </div>
</div>

{/* ── MAIN ── */}
<div className="sw">

  {/* CARD 1 — VIDEO */}
  <div className="sc" style={{animationDelay:'.05s'}}>
    <div className="sh">Video Source <span className="shb">AUTO-DETECT</span></div>
    <div className="stabs">
      <button className={`stab ${tab==='upload'?'on':''}`} onClick={()=>reset('upload')}>⬆ Upload File</button>
      <button className={`stab ${tab==='url'   ?'on':''}`} onClick={()=>reset('url'   )}>🔗 URL / YouTube</button>
    </div>

    {tab==='upload'&&(
      <>
        <div className={`dropz ${dragOver?'ov':''}`}
          onClick={()=>!uploading&&fileRef.current.click()}
          onDragOver={e=>{e.preventDefault();setDragOver(true)}}
          onDragLeave={()=>setDragOver(false)} onDrop={onDrop}>
          <span className="dropico">{uploading?<span className="spin"/>:'📂'}</span>
          <div className="droptit">{uploading?`Uploading… ${uploadPct}%`:'Drop video or click to browse'}</div>
          <div className="dropsub">MP4 · MOV · AVI · MKV · WebM</div>
          {uploading&&<div className="upbar"><div className="upfill" style={{width:`${uploadPct}%`}}/></div>}
        </div>
        <input type="file" ref={fileRef} style={{display:'none'}} accept="video/*"
          onChange={e=>e.target.files[0]&&handleFile(e.target.files[0])}/>
        {fileInfo&&!uploading&&(
          <div className="confrow">
            <span>✅</span>
            <div style={{flex:1,overflow:'hidden'}}>
              <span className="confl">Ready</span>
              <span className="confu">{fileInfo.name} — {fmtBytes(fileInfo.size)}</span>
            </div>
          </div>
        )}
      </>
    )}

    {tab==='url'&&(
      <>
        <div className="platrow">
          {PLATFORMS.map(p=>(
            <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" className="plat">
              <span>{p.icon}</span>{p.name}
            </a>
          ))}
        </div>
        <div className={`urfw ${confirmed?'ok':urlState==='yt'?'yt':''}`}>
          <span className="urlico">{confirmed?'✅':urlState==='yt'?'▶':'🔗'}</span>
          <input ref={urlRef} type="text" className="urlin"
            placeholder="Paste YouTube, Shorts, TikTok, or direct URL…"
            value={urlVal} onChange={e=>setUrlVal(e.target.value)} readOnly={confirmed}/>
          {urlVal&&<button className="urlx" onClick={()=>{clearTimeout(confRef.current);setUrlVal('');setUrlState(null);setYtId(null);setConfirmed(false);setFilePath(null)}}>✕</button>}
        </div>
        {urlState==='yt'&&!confirmed&&(
          <div style={{fontSize:'.7rem',color:'#fca5a5',display:'flex',alignItems:'center',gap:5,margin:'4px 0 8px'}}>
            <span className="spin" style={{borderColor:'rgba(252,165,165,.3)',borderTopColor:'#fca5a5',width:11,height:11}}/> Auto-detecting…
          </div>
        )}
        {urlState==='invalid'&&<div style={{fontSize:'.7rem',color:'#fbbf24',margin:'4px 0 8px'}}>⚠ Valid https:// URL daalo</div>}
        {ytId&&ytMeta&&(
          <div className="ytcard">
            <div style={{display:'flex',gap:13,alignItems:'flex-start'}}>
              <img className="ytthumb" src={ytMeta.thumbnail_url} alt="" onError={e=>e.target.style.display='none'}/>
              <div style={{flex:1,minWidth:0}}>
                <div className="yttit">{ytMeta.title}</div>
                <div className="ytch">📺 {ytMeta.author_name}</div>
                <a className="ytopen" href={urlVal} target="_blank" rel="noopener noreferrer">▶ Watch</a>
              </div>
            </div>
          </div>
        )}
        {confirmed&&(
          <div className="confrow">
            <span>✅</span>
            <div style={{flex:1,overflow:'hidden'}}>
              <span className="confl">{urlState==='yt'?'YouTube':'Direct URL'} — Ready</span>
              <span className="confu">{urlVal}</span>
            </div>
            <button className="confx" onClick={()=>{clearTimeout(confRef.current);setUrlVal('');setUrlState(null);setYtId(null);setConfirmed(false);setFilePath(null)}}>✕</button>
          </div>
        )}
      </>
    )}
  </div>

  {/* CARD 2 — LANGUAGE */}
  <div className="sc" style={{animationDelay:'.1s'}}>
    <div className="sh">Target Language</div>
    <div className="lgg">
      {LANGS.map(l=>(
        <div key={l.code} className={`lgi ${lang===l.code?'on':''}`} onClick={()=>setLang(l.code)}>
          <span className="lgf">{l.flag}</span>
          <div className="lgn">{l.name}</div>
        </div>
      ))}
    </div>
  </div>

  {/* CARD 3 — PIPELINE */}
  <div className="sc" style={{animationDelay:'.15s'}}>
    <div className="sh">Processing Pipeline <span className="shb">AI-POWERED</span></div>
    <button className="advbtn" onClick={()=>setShowAdv(v=>!v)}>
      {showAdv?'▲':'▼'} Advanced Settings
      <span style={{marginLeft:'auto',fontSize:'.64rem',color:'rgba(200,185,255,.3)',fontFamily:"'JetBrains Mono',monospace"}}>
        {faceDetect?'face✓':'face✗'} · {diarization?'diarize✓':'diarize✗'} · {lipSync?'lipsync✓':'lipsync✗'}
      </span>
    </button>
    {showAdv&&(
      <div className="advpanel">
        <div className="trow">
          {[[faceDetect,setFaceDetect,'👤 Face Detection'],
            [diarization,setDiarization,'👥 Speakers'],
            [lipSync,setLipSync,'💋 Lip Sync']].map(([v,s,l])=>(
            <button key={l} className={`tchip ${v?'on':''}`} onClick={()=>s(x=>!x)}>
              <span className="dot"/>{l}
            </button>
          ))}
        </div>
      </div>
    )}
    {characters.length>0&&(
      <div className="chpanel">
        <div className="chhd">👤 Detected Characters ({characters.length})</div>
        <div className="chrow">
          {characters.map((c,i)=><CharBadge key={c.id||i} id={c.id} charType={c.charType||c.char_type||'man'} age={c.age}/>)}
        </div>
      </div>
    )}
    <div className="pipegrid">
      {STAGES.filter(s=>{
        if(tab==='url'    &&s.key==='upload')  return false
        if(tab==='upload' &&s.key==='download') return false
        if(!diarization   &&s.key==='diarize')  return false
        if(!faceDetect    &&s.key==='face')     return false
        return true
      }).map(s=>{
        const st=stages[s.key]
        const cls=(st==='active'||st==='processing')?'active':(st==='done'||st==='completed')?'done':(st==='error'||st==='failed')?'err':''
        const stxt=cls==='active'?'Running…':cls==='done'?'Done ✓':cls==='err'?'Failed ✗':'Pending'
        return(
          <div key={s.key} className={`stg ${cls}`}>
            <div className="stico">{cls==='active'?<span className="spin"/>:s.icon}</div>
            <div className="stlb">{s.label}</div>
            <div className="stdesc">{s.desc}</div>
            <div className="ststat">{stxt}</div>
          </div>
        )
      })}
    </div>
    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
      <Waveform active={processing}/>
      <div style={{flex:1}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:5,fontSize:'.66rem',fontWeight:700,color:'rgba(200,185,255,.25)',textTransform:'uppercase',letterSpacing:'.06em'}}>
          <span>{processing&&curStage?`Processing: ${curStage}`:done?'Complete!':'Waiting'}</span>
          <span>{progress}%</span>
        </div>
        <div className="progbar"><div className="progfill" style={{width:`${progress}%`}}/></div>
      </div>
    </div>
    {!done&&(
      <button className="btnstart" onClick={startDub} disabled={!canStart}>
        {processing?<><span className="spin"/><span>Processing…</span></>:<><span>🎙</span><span>Start Dubbing</span></>}
      </button>
    )}

    {/* DONE */}
    {done&&(
      <div style={{marginTop:22,paddingTop:22,borderTop:'1px solid rgba(255,255,255,.05)',animation:'fadeUp .5s ease'}}>
        <div className="donebanner">
          <div className="doneico">🎉</div>
          <div>
            <div className="donetit">Dubbing Complete!</div>
            <div className="donesub">{localUrl?'Video ready — preview, share or download!':'Demo done. Run: python App.py'}</div>
          </div>
        </div>
        {localUrl&&<div className="vidwrap"><video ref={videoRef} controls autoPlay playsInline><source src={localUrl} type="video/mp4"/></video></div>}
        {localUrl&&<>
          <div className="sharebox">
            <div className="sharehd">🖥️ Local Link</div>
            <div className="linkrow">
              <input className="linkinp" readOnly value={localUrl} onClick={e=>e.target.select()}/>
              <button className={`copybtn ${copied==='l'?'ok':''}`} onClick={()=>copy(localUrl,'l')}>{copied==='l'?'✓ Copied':'📋 Copy'}</button>
              <a className="openbtn" href={localUrl} target="_blank" rel="noopener noreferrer">Open</a>
            </div>
          </div>
          {pubVideoUrl?(
            <div className="sharebox" style={{borderColor:'rgba(52,211,153,.2)',background:'rgba(52,211,153,.03)'}}>
              <div className="sharehd">🌍 Public Link <span className="pubbadge">✓ Mobile + Laptop</span></div>
              <div className="linkrow">
                <input className="linkinp grn" readOnly value={pubVideoUrl} onClick={e=>e.target.select()}/>
                <button className={`copybtn ${copied==='p'?'ok':''}`} style={{background:'rgba(52,211,153,.12)',borderColor:'rgba(52,211,153,.22)',color:'#6ee7b7'}} onClick={()=>copy(pubVideoUrl,'p')}>{copied==='p'?'✓ Copied':'📋 Copy'}</button>
                <a className="openbtn grn" href={pubVideoUrl} target="_blank" rel="noopener noreferrer">Open</a>
              </div>
              <div className="socrow">
                <a className="soc wa" href={`https://wa.me/?text=${encodeURIComponent('Dubbed video 🎬: '+pubVideoUrl)}`} target="_blank" rel="noopener noreferrer">📱 WhatsApp</a>
                <a className="soc tg" href={`https://t.me/share/url?url=${encodeURIComponent(pubVideoUrl)}&text=${encodeURIComponent('Dubbed video! 🎬')}`} target="_blank" rel="noopener noreferrer">✈️ Telegram</a>
                <button className="soc sh2" onClick={()=>{if(navigator.share)navigator.share({title:'Dubbed Video',url:pubVideoUrl});else copy(pubVideoUrl,'p')}}>🔗 Share</button>
              </div>
            </div>
          ):(
            <div style={{background:'rgba(245,158,11,.05)',border:'1px solid rgba(245,158,11,.15)',borderRadius:12,padding:'13px 15px',marginBottom:12}}>
              <div style={{fontSize:'.76rem',fontWeight:700,color:'#fbbf24',marginBottom:5}}>🌍 Public link ke liye:</div>
              <code style={{display:'block',background:'rgba(0,0,0,.3)',borderRadius:7,padding:'7px 11px',fontSize:'.74rem',color:'#fbbf24',fontFamily:"'JetBrains Mono',monospace"}}>python share_advanced.py</code>
            </div>
          )}
          <div className="dlrow">
            <button className="btndl" onClick={()=>{const a=document.createElement('a');a.href=localUrl;a.download='dubbed_video.mp4';document.body.appendChild(a);a.click();document.body.removeChild(a)}}>⬇ Download MP4</button>
            <button className="btnnew" onClick={()=>reset('upload')}>+ New Project</button>
          </div>
        </>}
        {!localUrl&&<div style={{marginTop:12,padding:'11px 14px',background:'rgba(255,107,53,.07)',border:'1px solid rgba(255,107,53,.15)',borderRadius:11,fontSize:'.76rem',color:'rgba(200,185,255,.4)',lineHeight:1.7}}>
          💡 Real video ke liye:<br/><code style={{display:'block',marginTop:5,background:'rgba(0,0,0,.3)',padding:'6px 11px',borderRadius:7,color:'#ff9a6c',fontFamily:"'JetBrains Mono',monospace",fontSize:'.73rem'}}>cd backend && python App.py</code>
        </div>}
      </div>
    )}
  </div>
</div>
</div>
  )
}
