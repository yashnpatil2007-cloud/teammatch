import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { problemApi, errMsg } from '../../services/api';
import { Brain, Target, Zap } from 'lucide-react';

export default function Analyzer(){
 const [title,setTitle]=useState('AI-Powered Disaster Response System');
 const [desc,setDesc]=useState('Build using Python, TensorFlow, GIS, React and Node.js for real-time mapping and rescue coordination');
 const [res,setRes]=useState(null);
 const [loading,setLoading]=useState(false);
 const [err,setErr]=useState('');

 const analyze = async ()=>{
 setLoading(true); setErr('');
 try{
 const data = await problemApi.analyze(title, desc);
 setRes(data);
 }catch(e){ setErr(errMsg(e)); }
 setLoading(false);
 };

 return (
 <div className="space-y-6 max-w-[900px]">
 <div><h1 className="text-[24px] font-extrabold flex items-center gap-2"><Brain className="w-6 h-6 text-[#6C63FF]"/> Problem Statement AI Analysis</h1><p className="text-[13px] text-[var(--text-secondary)]">Extract required skills, roles, difficulty score & team requirement prediction.</p></div>

 <Card className="p-6 space-y-4">
 <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Problem title" className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] outline-none" />
 <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={4} placeholder="Problem description" className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] outline-none" />
 <Button variant="gradient" onClick={analyze} disabled={loading}>{loading?'Analyzing...':'Analyze with AI'} <Zap className="w-4 h-4"/></Button>
 {err && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600">{err}</div>}
 </Card>

 {res && (
 <div className="grid lg:grid-cols-2 gap-6">
 <Card className="p-6">
 <h3 className="font-bold flex items-center gap-2"><Target className="w-4 h-4"/> Required Skills</h3>
 <div className="mt-4 space-y-3">
 {res.requiredSkills.map(s=> <div key={s.name} className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] "><span className="px-3 py-1 rounded-full bg-[var(--text-primary)] text-[var(--background)] text-[11px] font-bold uppercase">{s.name}</span><div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#6C63FF] to-[#60A5FA]" style={{width:`${s.weight*10}%`}}/></div><span className="text-[12px] font-bold">L{s.level}</span></div>)}
 </div>
 </Card>
 <div className="space-y-6">
 <Card className="p-6">
 <h3 className="font-bold">Required Roles</h3>
 <div className="mt-3 flex flex-wrap gap-2">{res.requiredRoles.map(r=> <span key={r} className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#6C63FF] to-[#5B5BEF] text-white text-[12px] font-semibold">{r}</span>)}</div>
 </Card>
 <div className="grid grid-cols-3 gap-3">
 <Card className="p-4 text-center"><div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-secondary)]">Difficulty</div><div className="text-[18px] font-extrabold">{res.difficulty}</div><div className="text-[12px] font-bold text-[#6C63FF]">{res.difficultyScore}/10</div></Card>
 <Card className="p-4 text-center"><div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-secondary)]">Team Size</div><div className="text-[18px] font-extrabold">{res.teamRequirement.min}-{res.teamRequirement.max}</div><div className="text-[11px] text-[var(--text-secondary)]">members</div></Card>
 <Card className="p-4 text-center"><div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-secondary)]">AI Confidence</div><div className="text-[18px] font-extrabold">{res.confidence || 90}%</div><div className="text-[11px] text-emerald-600">High</div></Card>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
