import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { teamApi, errMsg } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { RefreshCw } from 'lucide-react';

export default function Strength(){
 const [teams,setTeams]=useState([]);
 const [teamId,setTeamId]=useState('');
 const [data,setData]=useState(null);
 const [err,setErr]=useState('');
 const [loading,setLoading]=useState(false);

 useEffect(()=>{
  teamApi.mine().then(list=>{ setTeams(list); if(list[0]) setTeamId(list[0]._id); }).catch(e=>setErr(errMsg(e)));
 },[]);

 const load = async (id=teamId)=>{
  if(!id) return;
  setLoading(true); setErr('');
  try{ setData(await teamApi.analyze(id)); }
  catch(e){ setErr(errMsg(e)); setData(null); }
  finally{ setLoading(false); }
 };

 useEffect(()=>{ if(teamId) load(teamId); },[teamId]); // eslint-disable-line

 const problem = data?.problem;
 const members = data?.team?.members || [];
 const coverage = problem?.requiredSkills?.map(ps=>{
  const levels = members.map(m=> (m.skills||[]).find(s=>s.name.toLowerCase()===ps.name.toLowerCase())?.level || 0);
  const best = Math.max(0, ...levels);
  return { name: ps.name, pct: Math.min(100, Math.round((best/ps.level)*100)) };
 }) || [];
 const radar = coverage.map(c=>({ skill:c.name, A:c.pct }));

 return (
 <div className="space-y-6">
 <div className="flex flex-wrap items-end justify-between gap-4">
 <div><h1 className="text-[24px] font-extrabold">Team Strength Analyzer</h1><p className="text-[13px] text-[var(--text-secondary)]">Coverage % • Skill distribution • Missing roles • Balance score</p></div>
 <div className="flex gap-2 items-center">
 {teams.length>0 && <select value={teamId} onChange={e=>setTeamId(e.target.value)} className="px-4 py-2.5 rounded-full border border-[var(--border)] bg-[var(--card)] text-[13px]">{teams.map(t=><option key={t._id} value={t._id}>{t.name}</option>)}</select>}
 <button onClick={()=>load()} className="flex items-center gap-2 text-[12px] font-semibold px-3 py-1.5 rounded-full bg-[var(--card)] border border-[var(--border)]"><RefreshCw className="w-3.5 h-3.5"/> Refresh</button>
 </div>
 </div>

 {err && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600">{err}</div>}

 {!teams.length && !loading ? (
 <Card className="p-10 text-center text-[13px] text-[var(--text-secondary)]">You're not part of any team yet. Create or join a team to see strength analysis.</Card>
 ) : data && (
 <>
 <div className="grid lg:grid-cols-3 gap-6">
 <Card className="p-6 text-center"><div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-secondary)]">Team Coverage</div><div className="text-[32px] font-extrabold">{data.coverage}%</div><div className="text-[12px] text-[var(--text-secondary)]">{members.length} members • {problem?.title}</div><div className="mt-4 h-2 bg-[var(--surface)] rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#6C63FF] to-[#60A5FA]" style={{width:`${data.coverage}%`}}/></div></Card>
 <Card className="p-6 text-center"><div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-secondary)]">Balance Score</div><div className="text-[32px] font-extrabold">{data.balance}<span className="text-[16px] text-[var(--text-secondary)]">/10</span></div><div className="text-[12px] text-[var(--text-secondary)]">Across {members.length} members</div></Card>
 <Card className="p-6 text-center"><div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-secondary)]">Missing Skills</div>{data.missingSkills?.length? <><div className="mt-2 text-[13px] font-bold text-red-600 capitalize">{data.missingSkills.join(', ')}</div><div className="text-[11px] text-[var(--text-secondary)]">Invite specialists to improve</div></> : <div className="mt-2 text-[13px] font-bold text-emerald-600">All required skills covered 🎉</div>}</Card>
 </div>

 <div className="grid lg:grid-cols-2 gap-6">
 <Card className="p-6">
 <h3 className="font-bold text-[13px]">Skill Distribution</h3>
 <div className="mt-4 space-y-3">
 {coverage.map(c=> <div key={c.name} className="flex items-center gap-3"><span className="w-[120px] text-[12px] font-medium capitalize">{c.name}</span><div className="flex-1 h-2 bg-[var(--surface)] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${c.pct}%`, background: c.pct<50?'#ef4444': c.pct<80?'#f59e0b':'#6C63FF'}}/></div><span className="w-10 text-right text-[12px] font-bold">{c.pct}%</span></div>)}
 {!coverage.length && <div className="text-[13px] text-[var(--text-secondary)]">No required skills defined.</div>}
 </div>
 </Card>
 <Card className="p-6">
 <h3 className="font-bold text-[13px]">Radar — Team Balance</h3>
 <div className="h-[260px]"><ResponsiveContainer width="100%" height="100%"><RadarChart data={radar}><PolarGrid/><PolarAngleAxis dataKey="skill" fontSize={11}/><Radar dataKey="A" stroke="#6C63FF" fill="#6C63FF" fillOpacity={0.25}/></RadarChart></ResponsiveContainer></div>
 </Card>
 </div>

 <Card className="p-6">
 <h3 className="font-bold">Detailed Breakdown</h3>
 <div className="h-[220px] mt-4"><ResponsiveContainer width="100%" height="100%"><BarChart data={coverage}><XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false}/><YAxis fontSize={11} axisLine={false} tickLine={false}/><Tooltip/><Bar dataKey="pct" fill="#6C63FF" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></div>
 </Card>
 </>
 )}
 </div>
 );
}
