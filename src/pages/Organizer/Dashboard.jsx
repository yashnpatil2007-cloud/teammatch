import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import ProblemFormModal from '../../components/forms/ProblemFormModal';
import { problemApi, statsApi, errMsg } from '../../services/api';
import { FileText, Users, BarChart3, Trophy, UploadCloud, Plus, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#6C63FF', '#60A5FA', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function OrganizerDashboard(){
 const [problems,setProblems]=useState([]);
 const [stats,setStats]=useState(null);
 const [form,setForm]=useState({title:'',description:'',category:'AI/ML',prize:'₹2L',teamMin:3,teamMax:5});
 const [msg,setMsg]=useState('');
 const [err,setErr]=useState('');
 const [busy,setBusy]=useState(false);
 const [modalOpen,setModalOpen]=useState(false);
 const [editing,setEditing]=useState(null);

 const openNew = ()=>{ setEditing(null); setModalOpen(true); };
 const openEdit = (p)=>{ setEditing(p); setModalOpen(true); };

 const removeProblem = async (p)=>{
  if(!window.confirm(`Delete "${p.title}"?`)) return;
  setErr('');
  try{ await problemApi.remove(p._id); await load(); }
  catch(e){ setErr(errMsg(e)); }
 };

 const load = async ()=>{
  try{
   const [p,s]=await Promise.all([problemApi.list(), statsApi.get()]);
   setProblems(p); setStats(s);
  }catch(e){ setErr(errMsg(e)); }
 };

 useEffect(()=>{ load(); },[]);

 const submit = async (e)=>{
  e.preventDefault(); setErr(''); setBusy(true);
  try{
   const data = await problemApi.create({ title:form.title, description:form.description, category:form.category, prize:form.prize, teamSize:{min:Number(form.teamMin),max:Number(form.teamMax)} });
   setProblems(p=>[data,...p]);
   setMsg('Problem published & AI analyzed! Required skills: '+data.requiredSkills.map(s=>s.name).join(', '));
   setForm({title:'',description:'',category:'AI/ML',prize:'₹2L',teamMin:3,teamMax:5});
   statsApi.get().then(setStats).catch(()=>{});
   setTimeout(()=>setMsg(''),5000);
  }catch(e){ setErr(errMsg(e)); }
  finally{ setBusy(false); }
 };

 const stats_cards = [
  {label:'Problems Published',value:stats?.totals.problems ?? problems.length,icon:FileText,color:'from-[#6C63FF] to-[#60A5FA]'},
  {label:'Registered Participants',value:(stats?.totals.registeredParticipants ?? 0).toLocaleString(),icon:Users,color:'from-[#22C55E] to-[#60A5FA]'},
  {label:'Teams Formed',value:stats?.totals.teams ?? 0,icon:Trophy,color:'from-amber-500 to-orange-500'},
  {label:'Avg Match',value:(stats?.totals.avgMatch ?? 0)+'%',icon:BarChart3,color:'from-zinc-900 to-zinc-700'},
 ];

 const barData = stats?.categories?.length ? stats.categories.map(c=>({name:c.name,value:c.value})) : [{name:'AI/ML',value:0}];
 const statusData = (stats?.teamStatus || []).filter(s=>s.value>0).map(s=>({name:s.name, value:s.value}));
 const pieData = statusData.length ? statusData : [{name:'forming',value:1}];

 return (
 <div className="space-y-6">
 <div className="flex flex-wrap items-end justify-between gap-4">
 <div><h1 className="text-[24px] font-extrabold tracking-tight">Organizer Dashboard</h1><p className="text-[13px] text-[var(--text-secondary)]">Publish hackathons, analyze problems with AI, view analytics.</p></div>
 <div className="flex gap-2"><Button variant="ghost" onClick={load}><RefreshCw className="w-4 h-4"/> Refresh</Button><Button variant="gradient" onClick={openNew}><Plus className="w-4 h-4"/> New Hackathon</Button></div>
 </div>

 <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
 {stats_cards.map(s=> <Card key={s.label} className="p-5 flex items-center gap-4"><div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}><s.icon className="w-5 h-5 text-[var(--background)]"/></div><div><div className="text-[20px] font-extrabold leading-none">{s.value}</div><div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-secondary)]">{s.label}</div></div></Card>)}
 </div>

 <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
 <Card className="p-6">
 <h3 className="font-bold flex items-center gap-2"><UploadCloud className="w-4 h-4"/> Upload Problem Statement</h3>
 <p className="text-[12px] text-[var(--text-secondary)]">AI will extract required skills, roles, difficulty & team size prediction.</p>
 <form onSubmit={submit} className="mt-4 space-y-3">
 <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Title e.g. AI Disaster Response" className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] outline-none" required />
 <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Description — mention tech like Python, React, Solidity, Figma, AWS..." rows={4} className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] outline-none" required />
 <div className="grid grid-cols-3 gap-3">
 <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="px-3 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[13px]"><option>AI/ML</option><option>Web3</option><option>HealthTech</option><option>FinTech</option><option>EdTech</option><option>IoT</option><option>Open</option></select>
 <input value={form.prize} onChange={e=>setForm({...form,prize:e.target.value})} className="px-3 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)]" />
 <div className="flex gap-2"><input type="number" value={form.teamMin} onChange={e=>setForm({...form,teamMin:e.target.value})} className="w-1/2 px-3 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)]" placeholder="Min"/><input type="number" value={form.teamMax} onChange={e=>setForm({...form,teamMax:e.target.value})} className="w-1/2 px-3 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)]" placeholder="Max"/></div>
 </div>
 <Button type="submit" variant="gradient" className="w-full" disabled={busy}>{busy?'Publishing...':'Publish & Analyze with AI'}</Button>
 {msg && <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[12px] text-emerald-800">{msg}</div>}
 {err && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600">{err}</div>}
 </form>
 </Card>

 <div className="space-y-6">
 <Card className="p-6">
 <h4 className="font-bold text-[13px]">Category Distribution</h4>
 <div className="h-[180px] mt-4">
 <ResponsiveContainer width="100%" height="100%"><BarChart data={barData}><XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false}/><YAxis fontSize={11} axisLine={false} tickLine={false} allowDecimals={false}/><Tooltip/><Bar dataKey="value" fill="#6C63FF" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer>
 </div>
 </Card>
 <Card className="p-6">
 <h4 className="font-bold text-[13px]">Team Analytics</h4>
 <div className="h-[180px]">
 <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} innerRadius={50} outerRadius={70} dataKey="value" nameKey="name">{pieData.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}</Pie><Tooltip/><Legend /></PieChart></ResponsiveContainer>
 </div>
 </Card>
 </div>
 </div>

 <Card className="p-6">
 <h3 className="font-bold">Problem Statements</h3>
 <div className="mt-4 overflow-x-auto">
 <table className="w-full text-[13px]">
 <thead className="text-[var(--text-secondary)] text-[11px] tracking-widest uppercase"><tr><th className="text-left py-2">Problem</th><th>Category</th><th>Difficulty</th><th>Prize</th><th>Registered</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
 <tbody>
 {problems.map(p=> <tr key={p._id} className="border-t border-[var(--border)] "><td className="py-3 font-medium max-w-[280px]"><div className="truncate">{p.title}</div></td><td className="text-center"><span className="px-2 py-1 rounded-full bg-[var(--surface)] text-[11px] font-semibold">{p.category}</span></td><td className="text-center">{p.difficulty}</td><td className="text-center font-semibold">{p.prize}</td><td className="text-center">{p.registeredCount||0}</td><td className="text-center"><span className="px-2 py-1 rounded-full bg-emerald-500 text-white text-[11px] capitalize">{p.status||'published'}</span></td><td className="text-right whitespace-nowrap"><button onClick={()=>openEdit(p)} className="w-8 h-8 rounded-full border border-[var(--border)] inline-flex items-center justify-center hover:bg-[var(--surface)] mr-1" title="Edit"><Pencil className="w-3.5 h-3.5"/></button><button onClick={()=>removeProblem(p)} className="w-8 h-8 rounded-full border border-[var(--border)] inline-flex items-center justify-center text-red-500 hover:bg-red-500/10" title="Delete"><Trash2 className="w-3.5 h-3.5"/></button></td></tr>)}
 {!problems.length && <tr><td colSpan={7} className="py-8 text-center text-[var(--text-secondary)]">No problem statements yet.</td></tr>}
 </tbody>
 </table>
 </div>
 </Card>

 <ProblemFormModal open={modalOpen} onClose={()=>setModalOpen(false)} initial={editing} onSaved={()=>load()} />
 </div>
 );
}
