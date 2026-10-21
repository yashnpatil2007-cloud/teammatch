import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { errMsg } from '../../services/api';
import { UsersRound, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';

export default function Login(){
 const [email,setEmail]=useState('member@demo.com');
 const [password,setPassword]=useState('demo123');
 const [show,setShow]=useState(false);
 const [err,setErr]=useState('');
 const { login, loading } = useAuth();
 const nav = useNavigate();

 const handle = async (e) =>{
 e.preventDefault(); setErr('');
 try{
 const u = await login(email,password);
 const dest = u.role==='organizer'?'/dashboard/organizer': u.role==='leader'?'/dashboard/leader': u.role==='admin'?'/dashboard/admin':'/dashboard/member';
 nav(dest);
 }catch(e){ setErr(errMsg(e)); }
 };

 return (
 <div className="min-h-screen grid lg:grid-cols-2 bg-[var(--background)]">
 <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-[var(--accent)] via-[var(--accent-strong)] to-[#60A5FA] text-white relative overflow-hidden">
 <div className="flex items-center gap-2"><div className="w-9 h-9 rounded-xl bg-[var(--card)] flex items-center justify-center"><UsersRound className="w-5 h-5 text-[var(--accent)]"/></div><span className="font-bold text-[18px]">TeamMatch</span></div>
 <div><h1 className="text-[42px] font-extrabold leading-[0.95]">Welcome back.<br/>Build faster.</h1><p className="mt-4 text-white/80 max-w-[420px]">AI-powered team formation for hackathons, projects and innovation challenges.</p>
 <div className="mt-8 grid grid-cols-3 gap-4 text-center"><div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20"><div className="text-[22px] font-bold">95%</div><div className="text-[11px] opacity-80">Accuracy</div></div><div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20"><div className="text-[22px] font-bold">5K+</div><div className="text-[11px] opacity-80">Students</div></div><div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20"><div className="text-[22px] font-bold">1K+</div><div className="text-[11px] opacity-80">Teams</div></div></div>
 </div>
 <div className="text-[12px] opacity-60">© 2026 TeamMatch</div>
 <div className="absolute -right-20 -bottom-20 w-[400px] h-[400px] bg-white/10 blur-[60px] rounded-full"/>
 </div>

 <div className="flex items-center justify-center p-6 lg:p-12 bg-[var(--background)]">
 <form onSubmit={handle} className="w-full max-w-[420px] space-y-6">
 <div><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[11px] font-semibold tracking-widest uppercase text-[var(--text-secondary)]"><Sparkles className="w-3 h-3 text-[var(--accent)]"/> Sign in</div><h2 className="mt-3 text-[28px] font-extrabold tracking-tight text-[var(--text-primary)]">Login to your account</h2><p className="text-[13px] text-[var(--text-secondary)]">Use demo accounts: <b className="text-[var(--text-primary)]">member@demo.com</b> / demo123</p></div>

 <div className="grid grid-cols-2 gap-2">
 {[
 {e:'organizer@demo.com',l:'Organizer'},
 {e:'leader@demo.com',l:'Team Leader'},
 {e:'member@demo.com',l:'Member'},
 {e:'admin@demo.com',l:'Admin'},
 ].map(b=> <button key={b.e} type="button" onClick={()=>{setEmail(b.e);setPassword('demo123');}} className={`px-3 py-2.5 rounded-full border text-[12px] font-semibold ${email===b.e?'bg-[var(--text-primary)] text-[var(--background)] border-[var(--text-primary)]':'bg-[var(--card)] text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--surface)]'}`}>{b.l}</button>)}
 </div>

 <div className="space-y-4">
 <div><label className="text-[12px] font-semibold text-[var(--text-primary)]">Email</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@college.edu" className="mt-1 w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--accent)]/20" /></div>
 <div><label className="text-[12px] font-semibold text-[var(--text-primary)]">Password</label><div className="mt-1 relative"><input type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-4 py-3 pr-10 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]" /><button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">{show?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div></div>
 </div>

 {err && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[13px] text-red-600">{err}</div>}

 <button disabled={loading} className="w-full py-3.5 rounded-full bg-[var(--text-primary)] text-[var(--background)] font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90">{loading?'Signing in...':'Sign in'} <ArrowRight className="w-4 h-4"/></button>

 <div className="text-center text-[13px] text-[var(--text-secondary)]">No account? <Link to="/register" className="font-semibold text-[var(--text-primary)] underline">Register</Link></div>
 </form>
 </div>
 </div>
 );
}
