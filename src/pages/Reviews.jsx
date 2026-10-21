import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { reviewApi, userApi, errMsg } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Star, Send, CheckCircle2 } from 'lucide-react';

export default function Reviews(){
 const { user } = useAuth();
 const [users,setUsers]=useState([]);
 const [reviewee,setReviewee]=useState('');
 const [reviews,setReviews]=useState([]);
 const [form,setForm]=useState({rating:5,comment:'',type:'peer'});
 const [msg,setMsg]=useState('');
 const [err,setErr]=useState('');
 const [busy,setBusy]=useState(false);

 useEffect(()=>{
  userApi.list().then(list=>{
   const others = list.filter(u=>u._id!==user?._id && u.role!=='admin');
   setUsers(others);
   if(others[0]) setReviewee(others[0]._id);
  }).catch(e=>setErr(errMsg(e)));
 },[]); // eslint-disable-line

 useEffect(()=>{
  if(!reviewee) return;
  reviewApi.byUser(reviewee).then(setReviews).catch(()=>setReviews([]));
 },[reviewee]);

 const submit = async (e)=>{
  e.preventDefault(); setErr(''); setMsg(''); setBusy(true);
  try{
   const data = await reviewApi.create({ ...form, reviewee });
   setReviews(r=>[data,...r]);
   setMsg('Review submitted! Reliability updated.');
   setForm({...form,comment:''});
   setTimeout(()=>setMsg(''),4000);
  }catch(e){ setErr(errMsg(e)); }
  finally{ setBusy(false); }
 };

 return (
 <div className="max-w-[800px] space-y-6">
 <div><h1 className="text-[24px] font-extrabold">Review System</h1><p className="text-[13px] text-[var(--text-secondary)]">Leader reviews members • Members review leaders • Peer ratings & feedback</p></div>

 {err && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600">{err}</div>}
 {msg && <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[12px] text-emerald-800 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/>{msg}</div>}

 <Card className="p-6">
 <h3 className="font-bold">Leave a Review</h3>
 <form onSubmit={submit} className="mt-4 space-y-3">
 <div className="grid grid-cols-2 gap-3">
 <select value={reviewee} onChange={e=>setReviewee(e.target.value)} className="px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)]">
 {users.map(u=><option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
 </select>
 <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)]">
 <option value="peer">Peer</option><option value="leader_to_member">Leader → Member</option><option value="member_to_leader">Member → Leader</option>
 </select>
 </div>
 <div className="flex gap-2">{[1,2,3,4,5].map(n=> <button key={n} type="button" onClick={()=>setForm({...form,rating:n})} className={`w-10 h-10 rounded-full flex items-center justify-center border ${form.rating>=n?'bg-amber-500 border-amber-500 text-[var(--background)]':'bg-[var(--card)] border-[var(--border)]'}`}><Star className={`w-4 h-4 ${form.rating>=n?'fill-white':''}`}/></button>)}<span className="ml-2 text-[13px] font-bold self-center">{form.rating}/5</span></div>
 <textarea value={form.comment} onChange={e=>setForm({...form,comment:e.target.value})} placeholder="Write feedback..." rows={3} className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] outline-none" required />
 <button type="submit" disabled={busy} className="w-full py-3 rounded-full bg-[var(--text-primary)] text-[var(--background)] font-semibold flex items-center justify-center gap-2 disabled:opacity-60"><Send className="w-4 h-4"/> {busy?'Submitting...':'Submit Review'}</button>
 </form>
 </Card>

 <div className="space-y-3">
 {reviews.map(r=>(
 <Card key={r._id} className="p-5 flex gap-4">
 <img src={r.reviewer?.avatar||`https://i.pravatar.cc/100?img=12`} className="w-10 h-10 rounded-full object-cover" alt=""/>
 <div className="flex-1"><div className="flex items-center gap-2"><span className="font-bold text-[13px]">{r.reviewer?.name||'Reviewer'}</span><span className="flex gap-0.5">{Array.from({length:5}).map((_,i)=><Star key={i} className={`w-3 h-3 ${i<r.rating?'fill-amber-400 text-amber-400':'text-zinc-300'}`}/>)}</span><span className="text-[11px] text-[var(--text-secondary)]">{new Date(r.createdAt).toLocaleDateString()}</span></div><p className="mt-1 text-[13px] text-[var(--text-secondary)]">{r.comment}</p></div>
 </Card>
 ))}
 {!reviews.length && <div className="p-6 text-center text-[13px] text-[var(--text-secondary)] border border-dashed rounded-2xl">No reviews for this user yet.</div>}
 </div>
 </div>
 );
}
