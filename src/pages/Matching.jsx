import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { problemApi, teamApi, errMsg } from '../services/api';
import { Brain, UserPlus, AlertTriangle, Star, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Matching(){
 const [problems,setProblems]=useState([]);
 const [selected,setSelected]=useState('');
 const [results,setResults]=useState([]);
 const [problem,setProblem]=useState(null);
 const [myTeams,setMyTeams]=useState([]);
 const [teamId,setTeamId]=useState('');
 const [loading,setLoading]=useState(false);
 const [msg,setMsg]=useState('');
 const [err,setErr]=useState('');

 useEffect(()=>{
  problemApi.list().then(r=>{setProblems(r); if(r[0]) setSelected(r[0]._id);}).catch(e=>setErr(errMsg(e)));
  teamApi.mine().then(r=>{setMyTeams(r); if(r[0]) setTeamId(r[0]._id);}).catch(()=>{});
 },[]);

 const run = async (id=selected)=>{
  if(!id) return;
  setLoading(true); setErr('');
  try{
   const data = await teamApi.match(id);
   setResults(data.recommendations || []);
   setProblem(data.problem);
  }catch(e){ setErr(errMsg(e)); setResults([]); }
  setLoading(false);
 };

 useEffect(()=>{ if(selected) run(selected); },[selected]);

 const invite = async (userId)=>{
  setMsg(''); setErr('');
  if(!teamId){ setErr('Create a team first to send invites.'); return; }
  try{
   const data = await teamApi.invite(teamId, userId);
   setMsg(`Invite sent to ${data.team.invites[data.team.invites.length-1].user.name}`);
   setTimeout(()=>setMsg(''),3500);
  }catch(e){ setErr(errMsg(e)); }
 };

 const chartData = results.slice(0,5).map(r=> ({name:r.user.name.split(' ')[0], match:r.match}));

 return (
 <div className="space-y-6">
 <div><h1 className="text-[24px] font-extrabold flex items-center gap-2"><Brain className="w-6 h-6 text-[#6C63FF]"/> AI Team Matching Engine</h1><p className="text-[13px] text-[var(--text-secondary)]">Match percentage • Missing skills detection • Recommended members • Skill gap analysis</p></div>

 {err && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600">{err}</div>}
 {msg && <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[12px] text-emerald-800 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/>{msg}</div>}

 <Card className="p-6">
 <div className="flex flex-wrap gap-3 items-center">
 <select value={selected} onChange={e=>setSelected(e.target.value)} className="flex-1 min-w-[240px] px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)]">
 {problems.map(p=> <option key={p._id} value={p._id}>{p.title} — {p.category}</option>)}
 </select>
 <Button variant="gradient" onClick={()=>run()} disabled={loading}>{loading?'Matching...':'Run Matching'}</Button>
 </div>

 {myTeams.length>0 && (
 <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px]">
 <span className="text-[var(--text-secondary)]">Invite to team:</span>
 <select value={teamId} onChange={e=>setTeamId(e.target.value)} className="px-3 py-2 rounded-full border border-[var(--border)] bg-[var(--card)]">
 {myTeams.map(t=><option key={t._id} value={t._id}>{t.name}</option>)}
 </select>
 </div>
 )}

 <div className="mt-6 grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
 <div className="space-y-3">
 {results.map(r=>(
 <div key={r.user._id} className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:shadow-md transition-shadow">
 <img src={r.user.avatar} className="w-10 h-10 rounded-full" alt=""/>
 <div className="flex-1 min-w-0"><div className="text-[13px] font-bold">{r.user.name}</div><div className="text-[11px] text-[var(--text-secondary)] truncate">{r.user.skills?.map(s=>s.name).join(', ')}</div><div className="text-[11px] text-amber-600 flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400"/> Reliability {r.reliabilityScore}</div></div>
 <div className="text-right"><div className="text-[18px] font-extrabold">{r.match}%</div><div className="text-[11px] text-[var(--text-secondary)]">Match</div></div>
 <button onClick={()=>invite(r.user._id)} className="px-4 py-2 rounded-full bg-[var(--text-primary)] text-[var(--background)] text-[12px] font-semibold flex items-center gap-1"><UserPlus className="w-3 h-3"/> Invite</button>
 </div>
 ))}
 {!results.length && <div className="p-8 text-center text-[var(--text-secondary)] border border-dashed rounded-2xl">Select a problem to see recommendations</div>}
 </div>

 <div className="space-y-4">
 <Card className="p-5">
 <h4 className="font-bold text-[13px]">Top Matches Chart</h4>
 <div className="h-[180px] mt-3"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false}/><YAxis fontSize={11} axisLine={false} tickLine={false}/><Tooltip/><Bar dataKey="match" fill="#6C63FF" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></div>
 </Card>
 <Card className="p-5 bg-amber-50 border-amber-200">
 <h4 className="font-bold text-[13px] flex items-center gap-2 text-amber-900"><AlertTriangle className="w-4 h-4"/> Missing Skills Detection</h4>
 <div className="mt-2 text-[12px] text-amber-800">Problem requires: <b>{problem?.requiredSkills?.map(s=>s.name).join(', ')||'—'}</b></div>
 {results[0]?.missing?.length ? <div className="mt-1 text-[12px] text-amber-800">Gaps for top candidate: <b>{results[0].missing.join(', ')}</b></div> : null}
 </Card>
 </div>
 </div>
 </Card>
 </div>
 );
}
