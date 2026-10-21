import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { errMsg } from '../../services/api';
import { UsersRound, Sparkles, ArrowRight } from 'lucide-react';

export default function Register(){
 const [form,setForm]=useState({name:'',email:'',password:'',role:'member', github:''});
 const [err,setErr]=useState('');
 const { register, loading } = useAuth();
 const nav = useNavigate();

 const handle = async (e)=>{
 e.preventDefault(); setErr('');
 if(!form.name||!form.email||!form.password) return setErr('All fields required');
 try{
 const u = await register(form);
 const dest = u.role==='organizer'?'/dashboard/organizer': u.role==='leader'?'/dashboard/leader': u.role==='admin'?'/dashboard/admin':'/dashboard/member';
 nav(dest);
 }catch(e){ setErr(errMsg(e)); }
 };

 return (
 <div className="min-h-screen grid lg:grid-cols-2 bg-[var(--background)]">
 <div className="flex items-center justify-center p-6 lg:p-12 order-2 lg:order-1 bg-[var(--background)]">
 <form onSubmit={handle} className="w-full max-w-[480px] space-y-5">
 <div><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[11px] font-semibold tracking-widest uppercase text-[var(--text-secondary)]"><Sparkles className="w-3 h-3 text-[var(--accent)]"/> Create account</div><h2 className="mt-3 text-[28px] font-extrabold text-[var(--text-primary)]">Join TeamMatch</h2><p className="text-[13px] text-[var(--text-secondary)]">Choose your role and get started in 30 seconds.</p></div>

 <div className="grid grid-cols-3 gap-2">
 {[
 {id:'organizer',label:'Organizer',desc:'Publish hackathons'},
 {id:'leader',label:'Team Leader',desc:'Create teams'},
 {id:'member',label:'Team Member',desc:'Join teams'},
 ].map(r=>(
 <button key={r.id} type="button" onClick={()=>setForm({...form,role:r.id})}
 className={`p-4 rounded-2xl border text-left ${form.role===r.id?'bg-[var(--text-primary)] text-[var(--background)] border-[var(--text-primary)]':'bg-[var(--card)] text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--surface)]'}`}>
 <div className="text-[13px] font-bold">{r.label}</div><div className={`text-[11px] ${form.role===r.id?'opacity-70':'text-[var(--text-secondary)]'}`}>{r.desc}</div>
 </button>
 ))}
 </div>

 <div className="space-y-4">
 <input placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--accent)]/20" />
 <input placeholder="Email address" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]" />
 <input placeholder="Password (min 6 chars)" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]" />
 <input placeholder="GitHub profile (optional)" value={form.github} onChange={e=>setForm({...form,github:e.target.value})} className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]" />
 </div>

 {err && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[13px] text-red-600">{err}</div>}

 <button disabled={loading} className="w-full py-3.5 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)] text-white font-semibold flex items-center justify-center gap-2">{loading?'Creating...':'Create account'} <ArrowRight className="w-4 h-4"/></button>
 <div className="text-center text-[13px] text-[var(--text-secondary)]">Already have an account? <Link to="/login" className="font-semibold text-[var(--text-primary)] underline">Login</Link></div>
 </form>
 </div>

 <div className="hidden lg:flex flex-col justify-center p-10 bg-[var(--text-primary)] text-[var(--background)] order-1 lg:order-2 relative overflow-hidden">
 <div className="flex items-center gap-2"><div className="w-9 h-9 rounded-xl bg-[var(--background)] flex items-center justify-center"><UsersRound className="w-5 h-5 text-[var(--text-primary)]"/></div><span className="font-bold">TeamMatch</span></div>
 <h2 className="mt-8 text-[36px] font-extrabold leading-tight">One platform.<br/>Every role.</h2>
 <ul className="mt-6 space-y-3 text-[13px] opacity-80">
 <li className="flex gap-2"><span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-[var(--background)]">✓</span> Organizer publishes problem, AI extracts skills</li>
 <li className="flex gap-2"><span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-[var(--background)]">✓</span> Leader creates team, invites via AI matching</li>
 <li className="flex gap-2"><span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-[var(--background)]">✓</span> Member verifies skills, earns reliability score</li>
 </ul>
 </div>
 </div>
 );
}
