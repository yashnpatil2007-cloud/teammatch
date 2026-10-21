import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { userApi, teamApi, statsApi, errMsg } from '../services/api';
import { Trophy, Star, Medal, Crown, UsersRound, TrendingUp, Search, X } from 'lucide-react';

const matchUser = (u, q) =>
  (u.name || '').toLowerCase().includes(q) ||
  (u.role || '').toLowerCase().includes(q) ||
  (u.skills || []).some((s) => s.name.toLowerCase().includes(q));
const matchTeam = (t, q) =>
  (t.name || '').toLowerCase().includes(q) ||
  (t.problem?.title || '').toLowerCase().includes(q) ||
  (t.members || []).some((m) => (m.name || '').toLowerCase().includes(q));

export default function Leaderboard(){
 const [params,setParams]=useSearchParams();
 const q = (params.get('q')||'').toLowerCase().trim();
 const [users,setUsers]=useState([]);
 const [reliability,setReliability]=useState([]);
 const [teams,setTeams]=useState([]);
 const [skills,setSkills]=useState([]);
 const [tab,setTab]=useState('members');
 const [err,setErr]=useState('');

 useEffect(()=>{
  Promise.all([
   userApi.list(),
   userApi.leaderboard('reliability'),
   teamApi.list(),
   statsApi.get(),
  ]).then(([u,r,t,s])=>{
   setUsers([...u].sort((a,b)=>(b.averageRating||0)-(a.averageRating||0)));
   setReliability(r);
   setTeams([...t].sort((a,b)=>(b.matchPercentage||0)-(a.matchPercentage||0)));
   setSkills(s.topSkills||[]);
  }).catch(e=>setErr(errMsg(e)));
 },[]);

 const fUsers = q ? users.filter(u=>matchUser(u,q)) : users;
 const fReliability = q ? reliability.filter(u=>matchUser(u,q)) : reliability;
 const fTeams = q ? teams.filter(t=>matchTeam(t,q)) : teams;
 const fSkills = q ? skills.filter(s=>s.name.toLowerCase().includes(q)) : skills;

 const podium = tab==='teams' ? fTeams.slice(0,3) : tab==='reliability' ? fReliability.slice(0,3) : tab==='skills' ? [] : fUsers.slice(0,3);

 return (
 <div className="space-y-6">
 <div className="flex flex-wrap items-end justify-between gap-4">
 <div><h1 className="text-[24px] font-extrabold flex items-center gap-2"><Trophy className="w-6 h-6 text-amber-500"/> Leaderboard</h1><p className="text-[13px] text-[var(--text-secondary)]">Top members • Top teams • Top skill scores • Top reliability</p></div>
 <div className="flex gap-2">{['members','teams','skills','reliability'].map(t=> <button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 rounded-full text-[13px] font-semibold capitalize border ${tab===t?'bg-[var(--text-primary)] text-[var(--background)] border-zinc-900':'bg-[var(--card)] border-[var(--border)]'}`}>{t}</button>)}</div>
 </div>

 {err && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600">{err}</div>}

 {q && <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[12px]"><Search className="w-3.5 h-3.5 text-[var(--text-secondary)]"/><span>Showing results for <b>“{params.get('q')}”</b> — {fUsers.length + fTeams.length + fSkills.length} matches</span><button onClick={()=>setParams({})} className="ml-auto flex items-center gap-1 font-semibold text-[var(--accent)]"><X className="w-3.5 h-3.5"/> Clear</button></div>}

 {tab!=='skills' && (
 <div className="grid lg:grid-cols-3 gap-4">
 {podium.map((u,i)=>(
 <Card key={u._id} className={`p-6 text-center relative overflow-hidden ${i===0?'ring-2 ring-amber-400':''}`}>
 {i===0 && <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center"><Crown className="w-4 h-4 text-[var(--background)]"/></div>}
 <img src={tab==='teams' ? u.leader?.avatar : u.avatar} className="w-16 h-16 rounded-full mx-auto object-cover" alt=""/>
 <div className="mt-3 font-bold">{tab==='teams' ? u.name : u.name}</div>
 <div className="text-[11px] text-[var(--text-secondary)] capitalize">{tab==='teams' ? (u.problem?.title||'team') : u.role}</div>
 <div className="mt-3 flex justify-center gap-1">{Array.from({length:5}).map((_,k)=><Star key={k} className={`w-3 h-3 ${k<4?'fill-amber-400 text-amber-400':'text-zinc-300'}`}/>)}</div>
 <div className="mt-2 text-[12px] font-semibold">{tab==='teams' ? `Match ${u.matchPercentage||0}% • Coverage ${u.coverage||0}%` : `Reliability ${u.reliabilityScore} • Rating ${u.averageRating||'—'}`}</div>
 <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--text-primary)] text-[var(--background)] text-[11px] font-bold"><Medal className="w-3 h-3"/> Rank #{i+1}</div>
 </Card>
 ))}
 </div>
 )}

 {tab==='skills' && (
 <Card className="p-6">
 <h3 className="font-bold flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-500"/> Top Skills</h3>
 <div className="mt-4 space-y-3">
 {fSkills.length? fSkills.map((s,i)=><div key={s.name} className="flex items-center gap-3"><span className="w-6 font-bold text-[13px]">#{i+1}</span><span className="w-[140px] text-[13px] font-semibold capitalize">{s.name}</span><div className="flex-1 h-2.5 bg-[var(--surface)] rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#6C63FF] to-[#60A5FA]" style={{width:`${Math.min(100,s.count*12)}%`}}/></div><span className="text-[12px] font-bold">{s.count} users</span></div>)
 : <div className="p-6 text-center text-[var(--text-secondary)]">No skill data yet.</div>}
 </div>
 </Card>
 )}

 {tab==='teams' ? (
 <Card className="p-6">
 <h3 className="font-bold">Ranking Table — teams</h3>
 <div className="mt-4 overflow-x-auto">
 <table className="w-full text-[13px]">
 <thead className="text-[11px] tracking-widest uppercase text-[var(--text-secondary)]"><tr><th className="text-left py-2">Rank</th><th className="text-left">Team</th><th>Problem</th><th>Members</th><th>Match</th><th>Coverage</th></tr></thead>
 <tbody>
 {fTeams.map((t,i)=> <tr key={t._id} className="border-t border-[var(--border)]"><td className="py-3 font-bold">#{i+1}</td><td className="py-3 font-semibold">{t.name}</td><td className="text-center text-[12px]">{t.problem?.title||'—'}</td><td className="text-center">{t.members?.length||0}</td><td className="text-center font-bold">{t.matchPercentage||0}%</td><td className="text-center"><span className="px-2 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-bold">{t.coverage||0}%</span></td></tr>)}
 </tbody>
 </table>
 </div>
 </Card>
 ) : tab!=='skills' && (
 <Card className="p-6">
 <h3 className="font-bold flex items-center gap-2"><UsersRound className="w-4 h-4"/> Ranking Table — {tab}</h3>
 <div className="mt-4 overflow-x-auto">
 <table className="w-full text-[13px]">
 <thead className="text-[11px] tracking-widest uppercase text-[var(--text-secondary)]"><tr><th className="text-left py-2">Rank</th><th className="text-left">User</th><th>Role</th><th>Skills</th><th>Reliability</th><th>Rating</th></tr></thead>
 <tbody>
 {(tab==='reliability'?fReliability:fUsers).map((u,i)=> <tr key={u._id} className="border-t border-[var(--border)]"><td className="py-3 font-bold">#{i+1}</td><td className="py-3"><div className="flex items-center gap-2"><img src={u.avatar} className="w-8 h-8 rounded-full object-cover" alt=""/><span className="font-semibold">{u.name}</span></div></td><td className="text-center capitalize">{u.role}</td><td className="text-center text-[12px] text-[var(--text-secondary)]">{u.skills?.slice(0,3).map(s=>s.name).join(', ')||'—'}</td><td className="text-center"><span className="px-2 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-bold">{u.reliabilityScore}</span></td><td className="text-center"><span className="inline-flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400"/> {u.averageRating||'—'}</span></td></tr>)}
 </tbody>
 </table>
 </div>
 </Card>
 )}
 </div>
 );
}
