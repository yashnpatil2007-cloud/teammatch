import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { quizApi, userApi, errMsg } from '../../services/api';
import { Brain, Trophy, CheckCircle2, XCircle } from 'lucide-react';

const badgeClass = (b) => b==='Platinum' ? 'bg-gradient-to-r from-zinc-900 to-zinc-700 text-[var(--background)]' : b==='Gold' ? 'bg-amber-500 text-white' : b==='Silver' ? 'bg-slate-400 text-white' : 'bg-[var(--surface)]';

export default function Quizzes(){
 const [skills,setSkills]=useState([]);
 const [skill,setSkill]=useState('');
 const [level,setLevel]=useState(5);
 const [quiz,setQuiz]=useState(null);
 const [answers,setAnswers]=useState([]);
 const [idx,setIdx]=useState(0);
 const [result,setResult]=useState(null);
 const [history,setHistory]=useState([]);
 const [err,setErr]=useState('');
 const [busy,setBusy]=useState(false);

 useEffect(()=>{
  quizApi.list().then(list=>{ setSkills(list); if(list[0]) setSkill(list[0].skill); }).catch(e=>setErr(errMsg(e)));
  userApi.quizHistory().then(setHistory).catch(()=>{});
 },[]);

 useEffect(()=>{
  if(!skill) return;
  setBusy(true);
  quizApi.bySkill(skill).then(q=>{ setQuiz(q); setAnswers([]); setIdx(0); setResult(null); })
   .catch(e=>setErr(errMsg(e))).finally(()=>setBusy(false));
 },[skill]);

 const questions = quiz?.questions || [];
 const current = questions[idx];

 const answer = async (choice)=>{
  const next = [...answers, choice];
  if(idx < questions.length-1){ setAnswers(next); setIdx(idx+1); return; }
  setBusy(true); setErr('');
  try{
   const graded = await quizApi.grade(skill, next);
   const saved = await userApi.submitQuiz({ skill, level, score: graded.score });
   setResult({ score: graded.score, badge: saved.badge, verified: saved.verified, correct: graded.correct, total: graded.total });
   setHistory(h=>[{ _id: Date.now().toString(), skill, level, score: graded.score, badge: saved.badge }, ...h]);
  }catch(e){ setErr(errMsg(e)); }
  finally{ setBusy(false); }
 };

 const reset = ()=>{ setAnswers([]); setIdx(0); setResult(null); };

 return (
 <div className="max-w-[800px] space-y-6">
 <div><h1 className="text-[24px] font-extrabold flex items-center gap-2"><Brain className="w-6 h-6 text-[#6C63FF]"/> Skill Verification — MCQ Quiz</h1><p className="text-[13px] text-[var(--text-secondary)]">Levels 1-10 • Score → Badge: Bronze / Silver / Gold / Platinum</p></div>

 {err && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600">{err}</div>}

 <Card className="p-6">
 <div className="flex flex-wrap gap-3">
 {skills.map(s=> <button key={s.skill} onClick={()=>{setSkill(s.skill);reset();}} className={`px-4 py-2 rounded-full text-[13px] font-semibold border capitalize ${skill===s.skill?'bg-[var(--text-primary)] text-[var(--background)] border-zinc-900':'bg-[var(--card)] border-[var(--border)]'}`}>{s.skill}</button>)}
 <select value={level} onChange={e=>setLevel(Number(e.target.value))} className="px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--card)] text-[13px]">
 {Array.from({length:10},(_,i)=>i+1).map(l=> <option key={l} value={l}>Level {l}</option>)}
 </select>
 </div>

 {busy && !questions.length && <div className="mt-6 text-[13px] text-[var(--text-secondary)]">Loading questions...</div>}

 {!result && current && (
 <div className="mt-6">
 <div className="text-[12px] font-semibold tracking-widest uppercase text-[var(--text-secondary)]">Question {idx+1} / {questions.length} • Level {current.level}</div>
 <h3 className="mt-2 text-[18px] font-bold">{current.q}</h3>
 <div className="mt-4 grid gap-2">
 {current.options.map((opt,i)=> <button key={i} disabled={busy} onClick={()=>answer(i)} className="text-left px-4 py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--surface)] text-[13px] font-medium disabled:opacity-60">{String.fromCharCode(65+i)}. {opt}</button>)}
 </div>
 <div className="mt-4 h-2 bg-[var(--surface)] rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#6C63FF] to-[#60A5FA]" style={{width:`${(idx/questions.length)*100}%`}}/></div>
 </div>
 )}

 {result && (
 <div className="mt-6 text-center py-8">
 <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto"><Trophy className="w-8 h-8 text-[var(--background)]"/></div>
 <h3 className="mt-4 text-[22px] font-extrabold">Score: {result.score}%</h3>
 <div className="text-[12px] text-[var(--text-secondary)]">{result.correct}/{result.total} correct</div>
 <div className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--text-primary)] text-[var(--background)] text-[13px] font-bold"><CheckCircle2 className="w-4 h-4"/> Badge: {result.badge}</div>
 <p className="mt-2 text-[13px] text-[var(--text-secondary)]">{result.verified? 'Reliability score updated • Certificate eligible':'Score below 60% — retake to get verified'}</p>
 <Button onClick={reset} className="mt-6">Retake Quiz</Button>
 </div>
 )}
 {!result && !current && !busy && <div className="mt-6 p-8 text-center text-[var(--text-secondary)] border border-dashed rounded-2xl">No quiz available for this skill.</div>}
 </Card>

 <Card className="p-6">
 <h4 className="font-bold text-[13px]">Your Quiz History</h4>
 <div className="mt-3 space-y-2">
 {history.length? history.map(r=> <div key={r._id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] "><span className={`w-8 h-8 rounded-full flex items-center justify-center ${r.score>=60?'bg-emerald-500':'bg-red-500'} text-[var(--background)]`}>{r.score>=60?<CheckCircle2 className="w-4 h-4"/>:<XCircle className="w-4 h-4"/>}</span><span className="font-semibold text-[13px] capitalize">{r.skill} • L{r.level}</span><span className="ml-auto font-bold">{r.score}%</span><span className={`px-2 py-1 rounded-full text-[11px] font-bold ${badgeClass(r.badge)}`}>{r.badge}</span></div>)
 : <div className="p-6 text-center text-[12px] text-[var(--text-secondary)] border border-dashed rounded-xl">No attempts yet.</div>}
 </div>
 </Card>
 </div>
 );
}
