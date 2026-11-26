import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
 Sparkles, ArrowRight, Play, Brain, BadgeCheck, UsersRound, BarChart3, Star, MessageSquareHeart,
 Search, Zap, CheckCircle2, Award, ChevronRight, TrendingUp, Layers, Trophy, Menu, X,
 Mail, Phone, MapPin, Clock, Send, Copy, Check, Headphones, Globe, MessageSquare, ExternalLink, Code2
} from "lucide-react";
import { Link } from "react-router-dom";
import { healthApi } from "../services/api";

function Navbar(){
 const [scrolled,setScrolled]=useState(false); const [open,setOpen]=useState(false);
 useEffect(()=>{const onScroll=()=>setScrolled(window.scrollY>10); window.addEventListener("scroll",onScroll); return()=>window.removeEventListener("scroll",onScroll);},[]);
 const links=[{label:"Home",href:"#home"},{label:"Features",href:"#features"},{label:"Problem Statements",href:"#problems"},{label:"How It Works",href:"#how"},{label:"Leaderboard",href:"#leaderboard"},{label:"Contact",href:"#contact"}];
 return (
 <header className={`fixed top-0 inset-x-0 z-50 ${scrolled?"bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)] shadow-[0_1px_20px_rgba(0,0,0,0.04)]":"bg-transparent border-b border-transparent"}`}>
 <div className="max-w-[1220px] mx-auto px-6 lg:px-8 h-[68px] flex items-center justify-between">
 <a href="#home" className="flex items-center gap-2.5"><div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] flex items-center justify-center"><UsersRound className="w-[18px] h-[18px] text-[var(--background)]"/></div><span className="text-[19px] font-bold tracking-tight text-[var(--text-primary)]">TeamMatch</span><span className="hidden sm:inline-flex ml-1 text-[11px] font-semibold tracking-widest uppercase px-1.5 py-0.5 rounded-md bg-[var(--text-primary)] text-[var(--background)]">AI</span></a>
 <nav className="hidden lg:flex items-center gap-7">{links.map(l=><a key={l.label} href={l.href} className="text-[13.5px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">{l.label}</a>)}</nav>
 <div className="hidden lg:flex items-center gap-3"><Link to="/login" className="text-[13.5px] font-medium px-4 py-2 rounded-full text-[var(--text-primary)] hover:bg-[var(--surface)]">Login</Link><Link to="/register" className="inline-flex items-center gap-2 bg-[var(--text-primary)] text-[var(--background)] text-[13.5px] font-semibold px-5 py-2.5 rounded-full hover:opacity-90">Register <ArrowRight className="w-3.5 h-3.5"/></Link></div>
 <button onClick={()=>setOpen(!open)} className="lg:hidden w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center bg-[var(--card)] text-[var(--text-primary)]">{open?<X className="w-4 h-4"/>:<Menu className="w-4 h-4"/>}</button>
 </div>
 <AnimatePresence>{open && <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="lg:hidden bg-[var(--card)] border-t border-[var(--border)] shadow-xl"><div className="px-6 py-6 flex flex-col gap-4">{links.map(l=><a key={l.label} href={l.href} onClick={()=>setOpen(false)} className="text-[15px] font-medium text-[var(--text-secondary)] py-1">{l.label}</a>)}<div className="flex gap-3 pt-4 border-t border-[var(--border)]"><Link to="/login" className="flex-1 text-center py-3 rounded-full border border-[var(--border)] font-medium text-[var(--text-primary)] bg-[var(--card)]">Login</Link><Link to="/register" className="flex-1 text-center py-3 rounded-full bg-[var(--text-primary)] text-[var(--background)] font-semibold">Register</Link></div></div></motion.div>}</AnimatePresence>
 </header>
 );
}

export default function Landing(){
 const [copiedEmail, setCopiedEmail] = useState(false);
 const [formSent, setFormSent] = useState(false);
 const [contactForm, setContactForm] = useState({
  name: "",
  email: "",
  role: "student",
  subject: "",
  message: ""
 });

 const handleCopyEmail = () => {
  navigator.clipboard?.writeText("teammatch@gmail.com");
  setCopiedEmail(true);
  setTimeout(() => setCopiedEmail(false), 2500);
 };

 const handleContactSubmit = (e) => {
  e.preventDefault();
  if (!contactForm.name || !contactForm.email || !contactForm.message) return;
  setFormSent(true);
 };

 useEffect(() => {
  healthApi.check().catch(() => {});
 }, []);
 return (
 <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
 <Navbar/>
 {/* Hero */}
 <section id="home" className="relative overflow-hidden bg-[var(--background)] pt-[68px] scroll-mt-[68px]">
 <div className="absolute inset-0 pointer-events-none"><div className="absolute inset-0 bg-gradient-to-b from-[var(--surface)] via-[var(--background)] to-[var(--background)]"/><div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-gradient-to-r from-[var(--accent)]/12 via-[#60A5FA]/10 to-[#22C55E]/8 blur-[60px] rounded-full"/></div>
 <div className="relative max-w-[1220px] mx-auto px-6 lg:px-8 py-10 lg:py-16">
 <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
 <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.6}}>
 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--card)] border border-[var(--border)] shadow-[0_4px_16px_rgba(0,0,0,0.06)] text-[12px] font-medium text-[var(--text-primary)]"><span className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent)] to-[#60A5FA] flex items-center justify-center"><Sparkles className="w-3 h-3 text-[var(--background)]"/></span><span className="text-[var(--text-primary)]">AI-Powered Team Formation Platform</span><span className="hidden sm:inline-flex w-6 h-6 rounded-full bg-[var(--text-primary)] items-center justify-center ml-1"><ChevronRight className="w-3 h-3 text-[var(--background)]"/></span></div>
 <h1 className="mt-6 text-[36px] lg:text-[52px] font-extrabold tracking-[-0.04em] leading-[0.95] text-[var(--text-primary)]">Find the Right Team.<br/><span className="bg-gradient-to-r from-[var(--accent)] via-[var(--accent-strong)] to-[#60A5FA] bg-clip-text text-transparent">Build Something Great.</span></h1>
 <p className="mt-5 text-[16px] lg:text-[17px] leading-[1.6] text-[var(--text-secondary)] max-w-[560px]">TeamMatch analyzes project requirements, verifies student skills, and creates balanced teams for projects, hackathons, and innovation challenges.</p>
 <div className="mt-8 flex flex-wrap gap-3"><Link to="/register" className="inline-flex items-center gap-2 bg-[var(--text-primary)] text-[var(--background)] px-7 py-3.5 rounded-full font-semibold text-[14px] shadow-[0_10px_24px_rgba(0,0,0,0.14)]">Get Started <ArrowRight className="w-4 h-4"/></Link><a href="#problems" className="inline-flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] px-7 py-3.5 rounded-full font-semibold text-[14px] text-[var(--text-primary)]"><Play className="w-4 h-4 fill-[var(--text-primary)]"/> Explore Problems</a></div>
  <div className="mt-8 flex items-center gap-4"><div className="flex -space-x-2"><img src="https://i.pravatar.cc/100?img=32" className="w-8 h-8 rounded-full border-2 border-[var(--background)]" alt="Aarav Sharma avatar" loading="lazy"/><img src="https://i.pravatar.cc/100?img=14" className="w-8 h-8 rounded-full border-2 border-[var(--background)]" alt="Priya Patel avatar" loading="lazy"/><img src="https://i.pravatar.cc/100?img=33" className="w-8 h-8 rounded-full border-2 border-[var(--background)]" alt="Kabir Das avatar" loading="lazy"/><img src="https://i.pravatar.cc/100?img=5" className="w-8 h-8 rounded-full border-2 border-[var(--background)]" alt="Ananya Roy avatar" loading="lazy"/></div><div className="text-[13px] leading-tight"><div className="flex items-center gap-1 font-semibold text-[var(--text-primary)]"> <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400"/> 4.9/5<span className="font-normal text-[var(--text-secondary)]">from 2,000+ reviews</span></div><div className="text-[var(--text-secondary)]">Trusted by top universities & hackathons</div></div></div>
 </motion.div>
 <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.7,delay:0.15}} className="relative lg:h-[520px] flex items-center justify-center">
 <div className="relative w-full max-w-[520px] bg-[var(--card)] rounded-[24px] border border-[var(--border)] shadow-[0_24px_64px_rgba(0,0,0,0.08)] overflow-hidden">
  <div className="h-[52px] flex items-center justify-between px-5 border-b border-[var(--border)] bg-[var(--surface)]/50"><div className="flex gap-2"><span className="w-3 h-3 rounded-full bg-red-400"/><span className="w-3 h-3 rounded-full bg-yellow-400"/><span className="w-3 h-3 rounded-full bg-green-400"/></div><div className="text-[12px] font-medium text-[var(--text-secondary)] flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/> AI Matching Live</div><div className="w-7 h-7 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center"><Search className="w-3.5 h-3.5 text-[var(--text-secondary)]" aria-hidden="true"/></div></div>
 <div className="p-6">
 <div className="flex items-center justify-between mb-4"><h3 className="text-[14px] font-semibold flex items-center gap-2 text-[var(--text-primary)]"><span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[#60A5FA] flex items-center justify-center"><BarChart3 className="w-3.5 h-3.5 text-[var(--background)]"/></span>Skill Analytics</h3><span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">95% Match</span></div>
 <div className="grid grid-cols-3 gap-3 mb-5">{[{label:"Frontend",val:92},{label:"AI/ML",val:88},{label:"Design",val:74}].map(s=><div key={s.label} className="bg-[var(--surface)] rounded-2xl p-3 border border-[var(--border)]"><div className="text-[11px] text-[var(--text-secondary)]">{s.label}</div><div className="text-[18px] font-bold text-[var(--text-primary)]">{s.val}%</div><div className="mt-2 h-1.5 bg-[var(--border)] rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[var(--accent)] to-[#60A5FA] rounded-full" style={{width:`${s.val}%`}}/></div></div>)}</div>
 <div className="space-y-3"><div className="text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest">Recommended Team</div>{[{name:"Aarav Sharma",role:"Full-Stack • React / Node",img:"12",score:"98%"},{name:"Priya Patel",role:"AI/ML • Python • TensorFlow",img:"26",score:"96%"},{name:"Kabir Das",role:"Product Designer • Figma",img:"15",score:"94%"}].map(m=><div key={m.name} className="flex items-center gap-3 p-3 rounded-2xl border border-[var(--border)] bg-[var(--card)]"><img src={`https://i.pravatar.cc/100?img=${m.img}`} className="w-10 h-10 rounded-full" alt=""/><div className="flex-1"><div className="text-[13px] font-semibold leading-none text-[var(--text-primary)]">{m.name}</div><div className="text-[11px] text-[var(--text-secondary)]">{m.role}</div></div><span className="text-[11px] font-bold px-2 py-1 rounded-full bg-[var(--text-primary)] text-[var(--background)]">{m.score}</span></div>)}</div>
 <div className="mt-5 flex gap-2"><Link to="/register" className="flex-1 text-center py-3 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)] text-white text-[13px] font-semibold">Form Team — 1 Click</Link><Link to="/register" className="px-4 py-3 rounded-full border border-[var(--border)] text-[13px] font-medium text-[var(--text-primary)] bg-[var(--card)]">Details</Link></div>
 </div>
 </div>
 <motion.div animate={{y:[0,-6,0]}} transition={{duration:3,repeat:Infinity}} className="absolute -left-2 lg:-left-6 top-10 bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-[0_12px_32px_rgba(0,0,0,0.10)] px-4 py-3 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[#60A5FA] flex items-center justify-center"><UsersRound className="w-5 h-5 text-[var(--background)]"/></div><div><div className="text-[16px] font-bold leading-none text-[var(--text-primary)]">5,000+</div><div className="text-[11px] text-[var(--text-secondary)]">Students</div></div><span className="ml-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center"><TrendingUp className="w-3.5 h-3.5 text-[var(--background)]"/></span></motion.div>
 <motion.div animate={{y:[0,6,0]}} transition={{duration:3.2,repeat:Infinity,delay:0.6}} className="absolute -right-2 top-28 bg-[var(--card)] rounded-2xl border border-[var(--border)] px-4 py-3 flex items-center gap-3 shadow-[0_12px_32px_rgba(0,0,0,0.10)]"><div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-[var(--background)]"/></div><div><div className="text-[16px] font-bold leading-none text-[var(--text-primary)]">1,000+</div><div className="text-[11px] text-[var(--text-secondary)]">Teams Formed</div></div></motion.div>
 <motion.div animate={{y:[0,-4,0]}} transition={{duration:3.4,repeat:Infinity,delay:1}} className="absolute left-1/2 -translate-x-1/2 bottom-0 bg-[var(--text-primary)] text-[var(--background)] rounded-2xl px-4 py-3 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center"><Zap className="w-5 h-5 text-[var(--background)]"/></div><div><div className="text-[16px] font-bold leading-none">95%</div><div className="text-[11px] opacity-70">Matching Accuracy</div></div><span className="text-[11px] font-bold px-2 py-1 rounded-full bg-[var(--background)] text-[var(--text-primary)]">AI</span></motion.div>
 </motion.div>
 </div>
 </div>
 </section>

 {/* Features */}
 <section id="features" className="py-20 bg-[var(--surface)] border-y border-[var(--border)] scroll-mt-[68px]">
 <div className="max-w-[1220px] mx-auto px-6 lg:px-8">
 <div className="max-w-[640px] mx-auto text-center"><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--card)] border border-[var(--border)] text-[11px] font-semibold tracking-widest uppercase text-[var(--text-secondary)]"><Sparkles className="w-3 h-3 text-[var(--accent)]"/> Features</div><h2 className="mt-4 text-[32px] lg:text-[42px] font-extrabold tracking-tight text-[var(--text-primary)]">Everything to build <span className="bg-gradient-to-r from-[var(--accent)] to-[#60A5FA] bg-clip-text text-transparent">high-performing teams</span></h2></div>
 <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
 {[
 {icon:Brain,title:"AI Problem Statement Analysis",desc:"Extract required skills automatically"},
 {icon:BadgeCheck,title:"Skill Verification System",desc:"Certificates, quizzes and experience tracking"},
 {icon:UsersRound,title:"AI Team Matching",desc:"Match based on skills and compatibility"},
 {icon:BarChart3,title:"Team Strength Analysis",desc:"Detect missing skills and balance"},
 {icon:Star,title:"Reliability Score",desc:"Reviews, performance and contributions"},
 {icon:MessageSquareHeart,title:"Smart Review System",desc:"Team leader & peer reviews"},
 ].map((f,i)=><motion.div key={f.title} initial={{opacity:0,y:12}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.06}} className="bg-[var(--card)] rounded-[20px] border border-[var(--border)] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.04)]"><div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[#60A5FA] flex items-center justify-center"><f.icon className="w-5 h-5 text-[var(--background)]"/></div><h3 className="mt-4 text-[15px] font-bold text-[var(--text-primary)]">{f.title}</h3><p className="mt-2 text-[13.5px] text-[var(--text-secondary)]">{f.desc}</p></motion.div>)}
 </div>
 </div>
 </section>

 {/* Problems */}
 <section id="problems" className="py-20 bg-[var(--background)] border-b border-[var(--border)] scroll-mt-[68px]">
 <div className="max-w-[1220px] mx-auto px-6 lg:px-8">
 <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
  <div><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--card)] border border-[var(--border)] text-[11px] font-semibold tracking-widest uppercase text-[var(--text-secondary)]"><Layers className="w-3 h-3 text-[var(--accent)]"/> Problem Statements</div><h2 className="mt-4 text-[32px] lg:text-[42px] font-extrabold tracking-tight text-[var(--text-primary)]">Live challenges to <span className="bg-gradient-to-r from-[var(--accent)] to-[#60A5FA] bg-clip-text text-transparent">build teams for</span></h2><p className="mt-2 text-[13.5px] text-[var(--text-secondary)] max-w-[560px]">Organizers upload problem statements — our AI extracts the skills and difficulty, then matches the right teammates.</p></div>
  <Link to="/register" className="inline-flex items-center gap-2 bg-[var(--text-primary)] text-[var(--background)] px-6 py-3 rounded-full font-semibold text-[13.5px] shrink-0">Browse all problems <ArrowRight className="w-4 h-4"/></Link>
 </div>
 <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
  {[
   {title:"AI-Powered Disaster Response System",category:"AI/ML",difficulty:"Hard",prize:"₹2.5L",size:"3–5 members",skills:["Python","TensorFlow","GIS","React"]},
   {title:"Decentralized Student Credential Vault",category:"Web3",difficulty:"Medium",prize:"₹1.8L",size:"2–4 members",skills:["Solidity","Node.js","IPFS"]},
   {title:"Real-time Sign Language Translator",category:"HealthTech",difficulty:"Hard",prize:"₹3L",size:"3–5 members",skills:["CV","PyTorch","Mobile"]},
  ].map((p,i)=>{
   const tone=p.difficulty==="Hard"?"bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30":p.difficulty==="Medium"?"bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30":"bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30";
   return (
  <motion.div key={p.title} initial={{opacity:0,y:12}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.06}} className="bg-[var(--card)] rounded-[20px] border border-[var(--border)] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.04)] flex flex-col">
   <div className="flex items-center justify-between"><span className="text-[10.5px] font-semibold tracking-widest uppercase text-[var(--text-secondary)]">{p.category}</span><span className={`text-[10.5px] font-bold px-2 py-1 rounded-full border ${tone}`}>{p.difficulty}</span></div>
   <h3 className="mt-3 text-[15.5px] font-bold text-[var(--text-primary)] leading-snug">{p.title}</h3>
   <div className="mt-4 flex flex-wrap gap-2">{p.skills.map(s=><span key={s} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]">{s}</span>)}</div>
   <div className="mt-5 pt-4 border-t border-[var(--border)] flex items-center justify-between text-[12px] text-[var(--text-secondary)]"><span>Team size · {p.size}</span><span className="font-bold text-[var(--text-primary)]">{p.prize} prize</span></div>
   <Link to="/register" className="mt-4 block text-center w-full py-2.5 rounded-full bg-[var(--text-primary)] text-[var(--background)] text-[12.5px] font-semibold">Analyze &amp; Match</Link>
  </motion.div>);
  })}
 </div>
 </div>
 </section>

 {/* How */}
 <section id="how" className="py-20 bg-[var(--card)] border-y border-[var(--border)] scroll-mt-[68px]">
 <div className="max-w-[1220px] mx-auto px-6 lg:px-8"><h2 className="text-center text-[32px] font-extrabold text-[var(--text-primary)]">From idea to team in 6 steps</h2><p className="text-center text-[13px] text-[var(--text-secondary)] mt-2">Theme-aware, accessible timeline for both modes</p><div className="mt-10 grid lg:grid-cols-3 gap-6">{["Upload problem","AI extracts skills","Verified profiles","Recommend teammates","Analyze strength","Form team"].map((t,i)=><div key={t} className={`rounded-[20px] border p-6 ${i===0?"bg-[var(--text-primary)] text-[var(--background)] border-[var(--text-primary)]":"bg-[var(--background)] text-[var(--text-primary)] border-[var(--border)]"}`}><div className="text-[11px] font-bold tracking-widest opacity-60">STEP 0{i+1}</div><div className="mt-2 font-bold">{t}</div></div>)}</div></div>
 </section>

 {/* Leaderboard */}
 <section id="leaderboard" className="py-20 bg-[var(--background)] border-b border-[var(--border)] scroll-mt-[68px]">
 <div className="max-w-[1220px] mx-auto px-6 lg:px-8">
  <div className="max-w-[640px] mx-auto text-center"><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--card)] border border-[var(--border)] text-[11px] font-semibold tracking-widest uppercase text-[var(--text-secondary)]"><Trophy className="w-3 h-3 text-[var(--accent)]"/> Leaderboard</div><h2 className="mt-4 text-[32px] lg:text-[42px] font-extrabold tracking-tight text-[var(--text-primary)]">Top <span className="bg-gradient-to-r from-[var(--accent)] to-[#60A5FA] bg-clip-text text-transparent">members, teams &amp; skills</span></h2></div>
  <div className="mt-12 grid lg:grid-cols-3 gap-6">
   <div className="lg:col-span-2 bg-[var(--card)] rounded-[20px] border border-[var(--border)] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
    <h3 className="text-[13px] font-bold text-[var(--text-primary)] flex items-center gap-2"><Award className="w-4 h-4 text-[var(--accent)]"/> Top Members</h3>
    <div className="mt-4 space-y-2">
     {[{name:"Aarav Sharma",skills:"Full-Stack • React/Node",badge:"Platinum",score:98,img:12},{name:"Priya Patel",skills:"AI/ML • TensorFlow",badge:"Gold",score:96,img:26},{name:"Kabir Das",skills:"Product Design • Figma",badge:"Gold",score:94,img:15},{name:"Ananya Roy",skills:"Backend • Go • K8s",badge:"Silver",score:91,img:5},{name:"Rohan Mehta",skills:"Web3 • Solidity",badge:"Silver",score:89,img:33}].map((m,i)=><div key={m.name} className="flex items-center gap-3 p-3 rounded-2xl border border-[var(--border)] bg-[var(--background)]"><span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold ${i===0?"bg-gradient-to-br from-amber-400 to-amber-600 text-white":"bg-[var(--surface)] text-[var(--text-secondary)]"}`}>{i+1}</span><img src={`https://i.pravatar.cc/100?img=${m.img}`} className="w-9 h-9 rounded-full" alt=""/><div className="flex-1 min-w-0"><div className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{m.name}</div><div className="text-[11px] text-[var(--text-secondary)] truncate">{m.skills}</div></div><span className="hidden sm:inline-flex text-[10px] font-bold px-2 py-1 rounded-full bg-[var(--text-primary)] text-[var(--background)]">{m.badge}</span><span className="text-[13px] font-bold text-[var(--text-primary)] w-10 text-right">{m.score}</span></div>)}
    </div>
   </div>
   <div className="space-y-6">
    <div className="bg-[var(--card)] rounded-[20px] border border-[var(--border)] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.04)]"><h3 className="text-[13px] font-bold text-[var(--text-primary)] flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500"/> Trending Skills</h3><div className="mt-4 space-y-3">{[{s:"React",v:92},{s:"Python / AI-ML",v:88},{s:"Node.js",v:81},{s:"Figma / UI",v:74}].map(x=><div key={x.s}><div className="flex justify-between text-[11.5px] text-[var(--text-secondary)]"><span>{x.s}</span><span className="font-semibold text-[var(--text-primary)]">{x.v}%</span></div><div className="mt-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[var(--accent)] to-[#60A5FA] rounded-full" style={{width:`${x.v}%`}}/></div></div>)}</div></div>
    <div className="bg-[var(--text-primary)] text-[var(--background)] rounded-[20px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.14)]"><h3 className="text-[13px] font-bold flex items-center gap-2"><UsersRound className="w-4 h-4"/> Top Teams</h3><div className="mt-4 space-y-2 text-[12.5px]">{[{n:"Team Nexus",s:97},{n:"ByteForge",s:95},{n:"Quantum Coders",s:92}].map((t,i)=><div key={t.n} className="flex items-center justify-between py-1.5"><span className="opacity-90">{i+1}. {t.n}</span><span className="font-bold">{t.s}</span></div>)}</div></div>
   </div>
  </div>
 </div>
 </section>

 {/* Contact & Support Section */}
  <section id="contact" className="py-24 bg-[var(--surface)] border-t border-[var(--border)] scroll-mt-[68px]">
   <div className="max-w-[1220px] mx-auto px-6 lg:px-8">
    <div className="max-w-[680px] mx-auto text-center mb-14">
     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--card)] border border-[var(--border)] text-[11px] font-semibold tracking-widest uppercase text-[var(--text-secondary)] shadow-sm">
      <Mail className="w-3.5 h-3.5 text-[var(--accent)]" /> Get In Touch
     </div>
     <h2 className="mt-4 text-[32px] lg:text-[42px] font-extrabold tracking-tight text-[var(--text-primary)]">
      Let&apos;s Connect &amp; <span className="bg-gradient-to-r from-[var(--accent)] to-[#60A5FA] bg-clip-text text-transparent">Build Together</span>
     </h2>
     <p className="mt-3 text-[15px] text-[var(--text-secondary)] leading-relaxed">
      Have questions, feedback, or want to host your college hackathon on TeamMatch? We&apos;re here to support students, mentors, and organizers.
     </p>
    </div>

    <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
     {/* Left: Contact Channels */}
     <div className="space-y-4">
      {/* Primary Official Email Card */}
      <div className="p-6 rounded-[24px] bg-gradient-to-br from-[var(--accent)]/10 via-[var(--card)] to-[var(--card)] border-2 border-[var(--accent)]/30 shadow-[0_8px_30px_rgba(0,0,0,0.06)] relative overflow-hidden">
       <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/10 rounded-full blur-2xl pointer-events-none" />
       <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
         <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] flex items-center justify-center text-white shadow-md shrink-0">
          <Mail className="w-6 h-6" />
         </div>
         <div>
          <div className="flex items-center gap-2">
           <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded-md">
            Primary Email
           </span>
           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h3 className="text-[17px] font-bold text-[var(--text-primary)] mt-1">Official Inbox</h3>
         </div>
        </div>
        <button
         type="button"
         onClick={handleCopyEmail}
         className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border border-[var(--border)] bg-[var(--card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition cursor-pointer"
         title="Copy Email Address"
        >
         {copiedEmail ? (
          <>
           <Check className="w-3.5 h-3.5 text-emerald-600" />
           <span className="text-emerald-600 font-bold">Copied!</span>
          </>
         ) : (
          <>
           <Copy className="w-3.5 h-3.5" />
           <span>Copy</span>
          </>
         )}
        </button>
       </div>

       <div className="mt-4 pt-3 border-t border-[var(--border)]/60 flex flex-wrap items-center justify-between gap-3">
        <div>
         <a
          href="mailto:teammatch@gmail.com?subject=TeamMatch%20Inquiry"
          className="text-[18px] sm:text-[20px] font-black text-[var(--text-primary)] hover:text-[var(--accent)] transition tracking-tight flex items-center gap-2"
         >
          teammatch@gmail.com
          <ExternalLink className="w-4 h-4 opacity-50" />
         </a>
         <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
          Fast response within 2–4 hours for students &amp; teams.
         </p>
        </div>
        <a
         href="mailto:teammatch@gmail.com?subject=TeamMatch%20Inquiry"
         className="px-4 py-2 rounded-xl bg-[var(--text-primary)] text-[var(--background)] text-[12px] font-bold hover:opacity-90 transition shrink-0"
        >
         Send Email →
        </a>
       </div>
      </div>

      {/* Secondary Cards Grid */}
      <div className="grid sm:grid-cols-2 gap-4">
       {/* Phone & WhatsApp */}
       <div className="p-5 rounded-[20px] bg-[var(--card)] border border-[var(--border)] shadow-sm hover:border-[var(--accent)]/40 transition">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
         <Phone className="w-5 h-5" />
        </div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Student Helpline &amp; WhatsApp</div>
        <div className="text-[15px] font-bold text-[var(--text-primary)] mt-1">+91 98765 43210</div>
        <p className="text-[11.5px] text-[var(--text-secondary)] mt-1.5 leading-relaxed">
         Direct call or WhatsApp chat for team formation support and fast resolution.
        </p>
        <a
         href="https://wa.me/919876543210?text=Hi%20TeamMatch%20Support"
         target="_blank"
         rel="noreferrer"
         className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] font-bold text-emerald-600 hover:underline"
        >
         Chat on WhatsApp →
        </a>
       </div>

       {/* Hackathon Partnerships */}
       <div className="p-5 rounded-[20px] bg-[var(--card)] border border-[var(--border)] shadow-sm hover:border-[var(--accent)]/40 transition">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-3">
         <Headphones className="w-5 h-5" />
        </div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Organizer Partnerships</div>
        <div className="text-[15px] font-bold text-[var(--text-primary)] mt-1 truncate">organizer@teammatch.ai</div>
        <p className="text-[11.5px] text-[var(--text-secondary)] mt-1.5 leading-relaxed">
         Dedicated onboarding, custom problem statement setup, and judging panels.
        </p>
        <a
         href="mailto:teammatch@gmail.com?subject=Hackathon%20Organizer%20Partnership"
         className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] font-bold text-purple-600 hover:underline"
        >
         Host Your Hackathon →
        </a>
       </div>

       {/* Location / Innovation Center */}
       <div className="p-5 rounded-[20px] bg-[var(--card)] border border-[var(--border)] shadow-sm hover:border-[var(--accent)]/40 transition">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-3">
         <MapPin className="w-5 h-5" />
        </div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Innovation Hub &amp; Chapters</div>
        <div className="text-[14px] font-bold text-[var(--text-primary)] mt-1">Cyber City Innovation Park</div>
        <p className="text-[11.5px] text-[var(--text-secondary)] mt-1.5 leading-relaxed">
         Pune • Mumbai • Bengaluru Campus Connect Hubs, Maharashtra, India.
        </p>
        <span className="mt-2.5 inline-block text-[11px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
         University Network Active
        </span>
       </div>

       {/* Support Schedule */}
       <div className="p-5 rounded-[20px] bg-[var(--card)] border border-[var(--border)] shadow-sm hover:border-[var(--accent)]/40 transition">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3">
         <Clock className="w-5 h-5" />
        </div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Support Schedule</div>
        <div className="text-[14px] font-bold text-[var(--text-primary)] mt-1">Mon – Sat: 9:00 AM – 8:00 PM</div>
        <p className="text-[11.5px] text-[var(--text-secondary)] mt-1.5 leading-relaxed">
         <strong className="text-[var(--text-primary)]">24/7 Rapid Emergency Support</strong> active during all live hackathons.
        </p>
       </div>
      </div>
     </div>

     {/* Right: Quick Interactive Message Box */}
     <div className="p-7 rounded-[24px] bg-[var(--card)] border border-[var(--border)] shadow-[0_12px_36px_rgba(0,0,0,0.05)]">
      {formSent ? (
       <div className="py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
         <CheckCircle2 className="w-9 h-9" />
        </div>
        <h3 className="text-[20px] font-black text-[var(--text-primary)]">Message Sent!</h3>
        <p className="text-[13px] text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
         Thank you, <strong className="text-[var(--text-primary)]">{contactForm.name}</strong>. Your note has been delivered to <strong className="text-[var(--accent)]">teammatch@gmail.com</strong>. We will reply to <span className="underline">{contactForm.email}</span> shortly.
        </p>
        <button
         type="button"
         onClick={() => {
          setFormSent(false);
          setContactForm({ name: "", email: "", role: "student", subject: "", message: "" });
         }}
         className="mt-4 px-6 py-2.5 rounded-full bg-[var(--surface)] hover:bg-[var(--border)] text-[12.5px] font-bold text-[var(--text-primary)] border border-[var(--border)] transition cursor-pointer"
        >
         Send Another Message
        </button>
       </div>
      ) : (
       <form onSubmit={handleContactSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
         <div>
          <h3 className="text-[18px] font-bold text-[var(--text-primary)]">Send Us a Direct Message</h3>
          <p className="text-[12px] text-[var(--text-secondary)]">
           Drop a line directly to our team inbox.
          </p>
         </div>
         <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
          Active Now
         </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 pt-2">
         <div>
          <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
           Your Name *
          </label>
          <input
           required
           type="text"
           placeholder="e.g. Yash Patil"
           value={contactForm.name}
           onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
           className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition"
          />
         </div>
         <div>
          <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
           Email Address *
          </label>
          <input
           required
           type="email"
           placeholder="you@domain.com"
           value={contactForm.email}
           onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
           className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition"
          />
         </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
         <div>
          <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
           I am a...
          </label>
          <select
           value={contactForm.role}
           onChange={(e) => setContactForm({ ...contactForm, role: e.target.value })}
           className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition"
          >
           <option value="student">Student / Team Member</option>
           <option value="leader">Team Leader</option>
           <option value="organizer">Hackathon Organizer</option>
           <option value="faculty">College Faculty / Mentor</option>
           <option value="other">Other / General Partner</option>
          </select>
         </div>
         <div>
          <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
           Subject
          </label>
          <input
           type="text"
           placeholder="e.g. Hackathon Team Formation"
           value={contactForm.subject}
           onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
           className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition"
          />
         </div>
        </div>

        <div>
         <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
          Message *
         </label>
         <textarea
          required
          rows={4}
          placeholder="Tell us what you need help with or ask any questions..."
          value={contactForm.message}
          onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition resize-none"
         />
        </div>

        <button
         type="submit"
         className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)] hover:opacity-95 text-white font-bold text-[13.5px] shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
        >
         <Send className="w-4 h-4" /> Send to teammatch@gmail.com
        </button>
        <p className="text-[11px] text-center text-[var(--text-secondary)]">
         Protected by TeamMatch verification. Direct dispatch to teammatch@gmail.com.
        </p>
       </form>
      )}
     </div>
    </div>
   </div>
  </section>

  {/* Modern Full Footer */}
  <footer className="bg-[var(--card)] border-t border-[var(--border)] text-[var(--text-secondary)] pt-16 pb-12">
   <div className="max-w-[1220px] mx-auto px-6 lg:px-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[var(--border)]">
     {/* Brand Column */}
     <div className="lg:col-span-2 space-y-4">
      <a href="#home" className="flex items-center gap-2.5">
       <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] flex items-center justify-center">
        <UsersRound className="w-[18px] h-[18px] text-[var(--background)]" />
       </div>
       <span className="text-[20px] font-bold tracking-tight text-[var(--text-primary)]">TeamMatch</span>
       <span className="text-[11px] font-semibold tracking-widest uppercase px-1.5 py-0.5 rounded-md bg-[var(--text-primary)] text-[var(--background)]">
        AI
       </span>
      </a>
      <p className="text-[13.5px] leading-relaxed max-w-sm">
       The smart AI-driven matchmaking and assessment ecosystem for hackathons, capstone projects, and student innovation teams.
      </p>
      <div className="pt-1 flex items-center gap-3">
       <a
        href="mailto:teammatch@gmail.com"
        className="w-9 h-9 rounded-full bg-[var(--surface)] hover:bg-[var(--accent)] hover:text-white flex items-center justify-center transition border border-[var(--border)]"
        title="Email Us: teammatch@gmail.com"
       >
        <Mail className="w-4 h-4" />
       </a>
       <a
        href="tel:+919876543210"
        className="w-9 h-9 rounded-full bg-[var(--surface)] hover:bg-emerald-600 hover:text-white flex items-center justify-center transition border border-[var(--border)]"
        title="Call Us: +91 98765 43210"
       >
        <Phone className="w-4 h-4" />
       </a>
       <a
        href="https://github.com/yashnpatil2007-cloud/teammatch"
        target="_blank"
        rel="noreferrer"
        className="w-9 h-9 rounded-full bg-[var(--surface)] hover:bg-[var(--text-primary)] hover:text-[var(--background)] flex items-center justify-center transition border border-[var(--border)]"
        title="GitHub Repository"
       >
        <Code2 className="w-4 h-4" />
       </a>
       <a
        href="https://discord.gg"
        target="_blank"
        rel="noreferrer"
        className="w-9 h-9 rounded-full bg-[var(--surface)] hover:bg-[#5865F2] hover:text-white flex items-center justify-center transition border border-[var(--border)]"
        title="Discord Community"
       >
        <MessageSquare className="w-4 h-4" />
       </a>
      </div>
     </div>

     {/* Platform Column */}
     <div>
      <div className="text-[12px] font-extrabold uppercase tracking-widest text-[var(--text-primary)] mb-4">
       Platform
      </div>
      <ul className="space-y-2.5 text-[13px]">
       <li><a href="#features" className="hover:text-[var(--text-primary)] transition">AI Features</a></li>
       <li><a href="#problems" className="hover:text-[var(--text-primary)] transition">Problem Statements</a></li>
       <li><a href="#how" className="hover:text-[var(--text-primary)] transition">How It Works</a></li>
       <li><a href="#leaderboard" className="hover:text-[var(--text-primary)] transition">Leaderboard</a></li>
       <li><Link to="/register" className="hover:text-[var(--text-primary)] transition">Assessment Center</Link></li>
      </ul>
     </div>

     {/* Portals Column */}
     <div>
      <div className="text-[12px] font-extrabold uppercase tracking-widest text-[var(--text-primary)] mb-4">
       Portals
      </div>
      <ul className="space-y-2.5 text-[13px]">
       <li><Link to="/login" className="hover:text-[var(--text-primary)] transition">Student &amp; Member Login</Link></li>
       <li><Link to="/login" className="hover:text-[var(--text-primary)] transition">Team Leader Hub</Link></li>
       <li><Link to="/login" className="hover:text-[var(--text-primary)] transition">Organizer Workspace</Link></li>
       <li><Link to="/login" className="hover:text-[var(--text-primary)] transition">Admin Console</Link></li>
       <li><Link to="/register" className="text-[var(--accent)] font-semibold hover:underline">Create Account →</Link></li>
      </ul>
     </div>

     {/* Direct Contact Column */}
     <div>
      <div className="text-[12px] font-extrabold uppercase tracking-widest text-[var(--text-primary)] mb-4">
       Direct Contact
      </div>
      <ul className="space-y-3 text-[12.5px]">
       <li className="flex items-start gap-2">
        <Mail className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
        <div>
         <div className="font-semibold text-[var(--text-primary)]">Email</div>
         <a href="mailto:teammatch@gmail.com" className="hover:underline text-[var(--accent)] font-bold">
          teammatch@gmail.com
         </a>
        </div>
       </li>
       <li className="flex items-start gap-2">
        <Phone className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <div>
         <div className="font-semibold text-[var(--text-primary)]">Helpline</div>
         <a href="tel:+919876543210" className="hover:underline">
          +91 98765 43210
         </a>
        </div>
       </li>
       <li className="flex items-start gap-2">
        <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div>
         <div className="font-semibold text-[var(--text-primary)]">Location</div>
         <span>Innovation Hub, Pune, India</span>
        </div>
       </li>
      </ul>
     </div>
    </div>

    {/* Bottom Bar */}
    <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12.5px]">
     <div>
      © 2026 <strong>TeamMatch AI</strong>. Built for Hackathons &amp; Capstone Innovators.
     </div>
     <div className="flex items-center gap-6">
      <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> All Systems Online
      </span>
      <a href="#contact" className="hover:text-[var(--text-primary)]">Support Desk</a>
      <Link to="/login" className="text-[var(--text-primary)] font-bold hover:underline">
       Go to Dashboard →
      </Link>
     </div>
    </div>
   </div>
  </footer>
 </div>
 );
}
