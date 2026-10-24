import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal, Field, inputCls } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { userApi, teamApi, errMsg } from '../../services/api';
import { Award, Star, FileText, TrendingUp, UploadCloud, RefreshCw, Pencil, ExternalLink, BadgeCheck, Clock, X } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

const certStatus = (s) => (s === 'verified' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : s === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200');

export default function MemberDashboard(){
 const { user, refresh } = useAuth();
 const [profile,setProfile]=useState(null);
 const [teams,setTeams]=useState([]);
 const [err,setErr]=useState('');
 const [msg,setMsg]=useState('');
 const [editOpen,setEditOpen]=useState(false);
 const [certOpen,setCertOpen]=useState(false);
 const [pForm,setPForm]=useState({name:'',bio:'',about:'',github:'',linkedin:'',portfolio:'',website:'',resumeUrl:'',phone:'',college:'',year:'',branch:'',location:'',profilePicture:'',avatar:'',skills:''});
 const [cForm,setCForm]=useState({title:'',issuer:'',url:'',skill:''});
 const [busy,setBusy]=useState(false);

 const load = async ()=>{
  try{
   const [p, t] = await Promise.all([userApi.get(user._id), teamApi.mine()]);
   setProfile(p); setTeams(t);
  }catch(e){ setErr(errMsg(e)); }
 };

 useEffect(()=>{ if(user?._id) load(); },[user?._id]); // eslint-disable-line

 const skills = profile?.skills || user?.skills || [];
 const radarData = skills.length ? skills.map(s=>({ skill: s.name, A: s.level })) : [{skill:'No skills yet',A:0}];
 const quizAvg = profile?.quizScores?.length ? Math.round(profile.quizScores.reduce((s,q)=>s+q.score,0)/profile.quizScores.length) : 0;
 const certificates = profile?.certificates || [];

 const openEdit = ()=>{
  setPForm({
    name: profile?.name||user?.name||'',
    bio: profile?.bio||'',
    about: profile?.about||'',
    github: profile?.github||'',
    linkedin: profile?.linkedin||'',
    portfolio: profile?.portfolio||'',
    website: profile?.website||'',
    resumeUrl: profile?.resumeUrl||'',
    phone: profile?.phone||'',
    college: profile?.college||'',
    year: profile?.year||'',
    branch: profile?.branch||'',
    location: profile?.location||'',
    profilePicture: profile?.profilePicture||profile?.avatar||'',
    avatar: profile?.avatar||'',
    skills: skills.map(s=>s.name).join(', ')
  });
  setErr(''); setEditOpen(true);
 };

 const saveProfile = async (e)=>{
  e.preventDefault(); setBusy(true); setErr('');
  try{
   const names = pForm.skills.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
   const nextSkills = names.map((name)=>{
    const existing = skills.find(s=>s.name.toLowerCase()===name);
    return existing || { name, level: 5, badge: 'Bronze' };
   });
    const updated = await userApi.updateProfile({
      name: pForm.name,
      bio: pForm.bio,
      about: pForm.about,
      github: pForm.github,
      linkedin: pForm.linkedin,
      portfolio: pForm.portfolio,
      website: pForm.website,
      resumeUrl: pForm.resumeUrl,
      phone: pForm.phone,
      college: pForm.college,
      year: pForm.year,
      branch: pForm.branch,
      location: pForm.location,
      profilePicture: pForm.profilePicture,
      avatar: pForm.avatar,
      skills: nextSkills
    });
   setProfile(p=>({ ...p, ...updated }));
   await refresh();
   setMsg('Profile updated.');
   setEditOpen(false);
   setTimeout(()=>setMsg(''),3000);
  }catch(e2){ setErr(errMsg(e2)); }
  finally{ setBusy(false); }
 };

 const saveCert = async (e)=>{
  e.preventDefault(); setBusy(true); setErr('');
  try{
   const res = await userApi.addCertificate(cForm);
   setProfile(p=>({ ...p, certificates:[res.certificate, ...(p?.certificates||[])] }));
   setCForm({title:'',issuer:'',url:'',skill:''});
   setMsg('Certificate submitted for verification.');
   setCertOpen(false);
   setTimeout(()=>setMsg(''),3000);
  }catch(e2){ setErr(errMsg(e2)); }
  finally{ setBusy(false); }
 };

 return (
 <div className="space-y-6">
 <div className="flex flex-wrap items-end justify-between gap-4">
  <div><h1 className="text-[24px] font-extrabold">Welcome, {user?.name}</h1><p className="text-[13px] text-[var(--text-secondary)]">Your profile • Reliability Score strengthens with quizzes & reviews.</p></div>
  <div className="flex gap-2"><Button variant="ghost" onClick={load}><RefreshCw className="w-4 h-4"/> Refresh</Button><Button variant="gradient" onClick={openEdit}><Pencil className="w-4 h-4"/> Edit Profile</Button></div>
 </div>

  {msg && <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-200 text-[12px] text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300">{msg}</div>}
  {err && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600 dark:text-red-400">{err}</div>}

 <div className="grid lg:grid-cols-3 gap-6">
  <Card className="p-6 lg:col-span-2">
  <h3 className="font-bold flex items-center gap-2"><FileText className="w-4 h-4"/> Profile Overview</h3>
  <div className="mt-4 grid md:grid-cols-2 gap-4 text-[13px]">
  <div className="space-y-2">
    <div><span className="text-[var(--text-secondary)]">Email:</span> <b>{user?.email}</b></div>
    <div><span className="text-[var(--text-secondary)]">Role:</span> <b className="capitalize">{user?.role}</b></div>
    {(profile?.name||user?.name) && <div><span className="text-[var(--text-secondary)]">Name:</span> <b>{profile?.name||user?.name}</b></div>}
    {profile?.phone && <div><span className="text-[var(--text-secondary)]">Phone:</span> <span>{profile.phone}</span></div>}
    {(profile?.college || profile?.year || profile?.branch) && <div><span className="text-[var(--text-secondary)]">Education:</span> <span>{[profile?.college, profile?.year, profile?.branch].filter(Boolean).join(' • ')}</span></div>}
    {profile?.location && <div><span className="text-[var(--text-secondary)]">Location:</span> <span>{profile.location}</span></div>}
    <div><span className="text-[var(--text-secondary)]">GitHub:</span> {profile?.github? <a href={profile.github} target="_blank" rel="noreferrer" className="text-[#6C63FF] underline">{profile.github}</a> : <span className="text-[var(--text-secondary)]">Not linked</span>}</div>
    <div><span className="text-[var(--text-secondary)]">LinkedIn:</span> {profile?.linkedin? <a href={profile.linkedin} target="_blank" rel="noreferrer" className="text-[#6C63FF] underline">{profile.linkedin}</a> : <span className="text-[var(--text-secondary)]">Not linked</span>}</div>
    <div><span className="text-[var(--text-secondary)]">Portfolio:</span> {profile?.portfolio? <a href={profile.portfolio} target="_blank" rel="noreferrer" className="text-[#6C63FF] underline">Link</a> : <span className="text-[var(--text-secondary)]">Not linked</span>}</div>
    <div><span className="text-[var(--text-secondary)]">Website:</span> {profile?.website? <a href={profile.website} target="_blank" rel="noreferrer" className="text-[#6C63FF] underline">Link</a> : <span className="text-[var(--text-secondary)]">Not linked</span>}</div>
    <div><span className="text-[var(--text-secondary)]">Resume:</span> {profile?.resumeUrl? <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="text-[#6C63FF] underline">View</a> : <span className="text-[var(--text-secondary)]">Not uploaded</span>}</div>
    <div><span className="text-[var(--text-secondary)]">Bio:</span> <span>{profile?.bio||profile?.about||'—'}</span></div>
    {profile?.about && profile?.bio && profile.about !== profile.bio && <div><span className="text-[var(--text-secondary)]">About:</span> <span>{profile.about}</span></div>}
  </div>
  <div className="space-y-2">
  <div className="flex items-center gap-2"><Award className="w-4 h-4 text-amber-500"/> Reliability Score <span className="ml-auto font-bold px-2 py-1 rounded-full bg-emerald-500 text-white text-[12px]">{profile?.reliabilityScore ?? user?.reliabilityScore ?? 75}/100</span></div>
  <div className="flex items-center gap-2"><Star className="w-4 h-4 text-amber-400"/> Avg Rating {profile?.averageRating||0} ({profile?.totalReviews||0} reviews)</div>
  <div className="flex flex-wrap gap-2 mt-2">{skills.map(s=> <span key={s.name} className="px-2 py-1 rounded-full bg-[var(--text-primary)] text-[var(--background)] text-[11px] capitalize">{s.name} L{s.level}</span>)}</div>
  </div>
  </div>
  <div className="mt-4 flex gap-2">
  <button onClick={()=>{setErr('');setCertOpen(true);}} className="flex-1 py-3 rounded-full bg-[var(--text-primary)] text-[var(--background)] text-[13px] font-semibold flex items-center justify-center gap-2"><UploadCloud className="w-4 h-4"/> Upload Certificate</button>
  <button onClick={openEdit} className="flex-1 py-3 rounded-full border border-[var(--border)] text-[13px] font-semibold flex items-center justify-center gap-2"><Pencil className="w-4 h-4"/> Edit More Details</button>
  </div>
  </Card>

 <Card className="p-6">
 <h3 className="font-bold text-[13px]">Skill Distribution</h3>
 <div className="h-[200px] mt-2">
 <ResponsiveContainer width="100%" height="100%"><RadarChart data={radarData}><PolarGrid/><PolarAngleAxis dataKey="skill" fontSize={10}/><PolarRadiusAxis fontSize={10} domain={[0,10]}/><Radar dataKey="A" stroke="#6C63FF" fill="#6C63FF" fillOpacity={0.3}/></RadarChart></ResponsiveContainer>
 </div>
 <div className="mt-2 text-[11px] text-[var(--text-secondary)] text-center">Verified via quizzes & certificates</div>
 </Card>
 </div>

 <div className="grid md:grid-cols-3 gap-4">
 {[
 {k:'Quiz Average',v: quizAvg? quizAvg+'%':'—',sub: profile?.quizScores?.length? `${profile.quizScores.length} attempts`:'Take a quiz',icon: Star},
 {k:'Skills Verified',v: skills.length,sub:'via quizzes',icon: Award},
 {k:'Teams Joined',v: teams.length,sub: teams.filter(t=>t.status==='forming').length+' active now',icon: TrendingUp},
 ].map(it=> <Card key={it.k} className="p-5 flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-[var(--text-primary)] text-[var(--background)] flex items-center justify-center"><it.icon className="w-5 h-5"/></div><div><div className="text-[16px] font-bold">{it.v}</div><div className="text-[11px] tracking-widest uppercase font-semibold text-[var(--text-secondary)]">{it.k}</div><div className="text-[11px] text-emerald-600">{it.sub}</div></div></Card>)}
 </div>

 <Card className="p-6">
 <h3 className="font-bold flex items-center gap-2"><Award className="w-4 h-4"/> My Certificates <span className="text-[11px] font-semibold text-[var(--text-secondary)]">({certificates.length})</span></h3>
 <div className="mt-4 grid sm:grid-cols-2 gap-3">
 {certificates.length? certificates.map(c=> <div key={c._id} className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--border)]">
  <span className="w-9 h-9 rounded-full bg-[var(--surface)] flex items-center justify-center">{c.status==='verified'? <BadgeCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400"/> : c.status==='rejected'? <X className="w-4 h-4 text-red-600 dark:text-red-400"/> : <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400"/>}</span>
 <div className="min-w-0 flex-1"><div className="font-semibold text-[13px] truncate">{c.title}</div><div className="text-[11px] text-[var(--text-secondary)] truncate">{c.issuer}{c.skill?` • ${c.skill}`:''}</div></div>
 {c.url && <a href={c.url} target="_blank" rel="noreferrer" className="text-[var(--accent)]"><ExternalLink className="w-4 h-4"/></a>}
 <span className={`px-2 py-1 rounded-full text-[10px] font-bold border capitalize ${certStatus(c.status)}`}>{c.status}</span>
 </div>) : <div className="sm:col-span-2 p-6 text-center text-[12px] text-[var(--text-secondary)] border border-dashed rounded-xl">No certificates yet. Upload one to get verified.</div>}
 </div>
 </Card>

  <Modal open={editOpen} onClose={()=>setEditOpen(false)} title="Edit Profile" subtitle="Add more details and your own profile photo. Leave blank if you don't want a photo.">
  <form onSubmit={saveProfile} className="space-y-4 max-h-[70vh] overflow-auto pr-1">
  <div className="grid sm:grid-cols-2 gap-3">
    <Field label="Full Name"><input value={pForm.name} onChange={e=>setPForm({...pForm,name:e.target.value})} className={inputCls} /></Field>
    <Field label="Phone"><input value={pForm.phone} onChange={e=>setPForm({...pForm,phone:e.target.value})} className={inputCls} placeholder="e.g. +91..." /></Field>
  </div>
  <Field label="Profile Photo URL" hint="Paste image URL from your own source. Leave blank to have no photo."><input value={pForm.profilePicture} onChange={e=>setPForm({...pForm,profilePicture:e.target.value})} className={inputCls} placeholder="https://..." /></Field>
  <div className="grid sm:grid-cols-2 gap-3">
    <Field label="College/University"><input value={pForm.college} onChange={e=>setPForm({...pForm,college:e.target.value})} className={inputCls} /></Field>
    <Field label="Year"><input value={pForm.year} onChange={e=>setPForm({...pForm,year:e.target.value})} className={inputCls} placeholder="e.g. 3rd Year" /></Field>
  </div>
  <div className="grid sm:grid-cols-2 gap-3">
    <Field label="Branch/Stream"><input value={pForm.branch} onChange={e=>setPForm({...pForm,branch:e.target.value})} className={inputCls} /></Field>
    <Field label="Location"><input value={pForm.location} onChange={e=>setPForm({...pForm,location:e.target.value})} className={inputCls} placeholder="City, State" /></Field>
  </div>
  <Field label="Bio"><textarea value={pForm.bio} onChange={e=>setPForm({...pForm,bio:e.target.value})} rows={2} className={inputCls} placeholder="Short intro for teams..." /></Field>
  <Field label="About"><textarea value={pForm.about} onChange={e=>setPForm({...pForm,about:e.target.value})} rows={3} className={inputCls} placeholder="More details about you..." /></Field>
  <div className="grid sm:grid-cols-2 gap-3">
    <Field label="GitHub URL"><input value={pForm.github} onChange={e=>setPForm({...pForm,github:e.target.value})} className={inputCls} placeholder="https://github.com/..." /></Field>
    <Field label="LinkedIn URL"><input value={pForm.linkedin} onChange={e=>setPForm({...pForm,linkedin:e.target.value})} className={inputCls} placeholder="https://linkedin.com/in/..." /></Field>
  </div>
  <div className="grid sm:grid-cols-2 gap-3">
    <Field label="Portfolio URL"><input value={pForm.portfolio} onChange={e=>setPForm({...pForm,portfolio:e.target.value})} className={inputCls} placeholder="https://..." /></Field>
    <Field label="Website URL"><input value={pForm.website} onChange={e=>setPForm({...pForm,website:e.target.value})} className={inputCls} placeholder="https://..." /></Field>
  </div>
  <Field label="Resume URL"><input value={pForm.resumeUrl} onChange={e=>setPForm({...pForm,resumeUrl:e.target.value})} className={inputCls} placeholder="Link to your resume" /></Field>
  <Field label="Skills" hint="Comma separated, e.g. react, node, python"><input value={pForm.skills} onChange={e=>setPForm({...pForm,skills:e.target.value})} className={inputCls} /></Field>
  <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={()=>setEditOpen(false)}>Cancel</Button><Button type="submit" variant="gradient" disabled={busy}>{busy?'Saving...':'Save Profile'}</Button></div>
  </form>
  </Modal>

 <Modal open={certOpen} onClose={()=>setCertOpen(false)} title="Upload Certificate" subtitle="Admin will verify it and update your badge.">
 <form onSubmit={saveCert} className="space-y-4">
 <Field label="Certificate title"><input value={cForm.title} onChange={e=>setCForm({...cForm,title:e.target.value})} className={inputCls} placeholder="e.g. AWS Cloud Practitioner" required /></Field>
 <div className="grid sm:grid-cols-2 gap-3">
 <Field label="Issuer"><input value={cForm.issuer} onChange={e=>setCForm({...cForm,issuer:e.target.value})} className={inputCls} placeholder="e.g. Amazon" /></Field>
 <Field label="Skill"><input value={cForm.skill} onChange={e=>setCForm({...cForm,skill:e.target.value})} className={inputCls} placeholder="e.g. aws" /></Field>
 </div>
 <Field label="Certificate URL"><input value={cForm.url} onChange={e=>setCForm({...cForm,url:e.target.value})} className={inputCls} placeholder="https://..." /></Field>
 <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={()=>setCertOpen(false)}>Cancel</Button><Button type="submit" variant="gradient" disabled={busy}>{busy?'Submitting...':'Submit Certificate'}</Button></div>
 </form>
 </Modal>
 </div>
 );
}
