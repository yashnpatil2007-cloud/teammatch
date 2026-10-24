import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, inputCls } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { userApi, errMsg } from '../../services/api';
import { Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PersonalDetails() {
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: '',
    profilePicture: '',
    avatar: '',
    bio: '',
    about: '',
    college: '',
    course: '',
    phone: '',
    location: '',
    github: '',
    linkedin: '',
    portfolio: '',
    website: '',
    resumeUrl: '',
    skills: '',
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    const u = user || {};
    setForm({
      name: u.name || '',
      profilePicture: u.profilePicture || u.avatar || '',
      avatar: u.avatar || '',
      bio: u.bio || '',
      about: u.about || '',
      college: u.college || '',
      course: u.course || u.branch || '',
      phone: u.phone || '',
      location: u.location || '',
      github: u.github || '',
      linkedin: u.linkedin || '',
      portfolio: u.portfolio || '',
      website: u.website || '',
      resumeUrl: u.resumeUrl || '',
      skills: Array.isArray(u.skills) ? u.skills.map((s) => s.name).join(', ') : '',
    });
  }, [user]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    setMsg('');
    try {
      const skillsArr = form.skills
        ? String(form.skills)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .map((name) => ({ name, level: 1 }))
        : [];
      const payload = {
        name: form.name,
        profilePicture: form.profilePicture,
        avatar: form.avatar || form.profilePicture,
        bio: form.bio,
        about: form.about,
        college: form.college,
        course: form.course,
        branch: form.course,
        phone: form.phone,
        location: form.location,
        github: form.github,
        linkedin: form.linkedin,
        portfolio: form.portfolio,
        website: form.website,
        resumeUrl: form.resumeUrl,
        skills: skillsArr,
      };
      await userApi.updateProfile(payload);
      await refresh();
      setMsg('Profile updated successfully');
      setTimeout(() => setMsg(''), 2500);
    } catch (ex) {
      setErr(errMsg(ex));
    } finally {
      setBusy(false);
    }
  };

  const photo = form.profilePicture || form.avatar;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-extrabold">Personal Details</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">Edit all your profile information. Photo is optional.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => nav(-1)}>
            <X className="w-4 h-4" /> Cancel
          </Button>
        </div>
      </div>

      {msg && <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-200 text-[12px] text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300">{msg}</div>}
      {err && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600 dark:text-red-400">{err}</div>}

      <Card className="p-6">
        <form onSubmit={save} className="space-y-6">
          <div>
            <div className="text-[13px] font-bold">Profile Photo</div>
            <div className="mt-3 flex items-center gap-4">
              {photo ? (
                <img src={photo} alt={form.name || 'User'} className="w-16 h-16 rounded-full object-cover border border-[var(--border)]" />
              ) : (
                <div className="w-16 h-16 rounded-full border border-[var(--border)] bg-transparent" />
              )}
              <div className="flex-1">
                <Field label="Profile Photo URL" hint="Paste your own image URL. Leave blank to keep it empty.">
                  <input value={form.profilePicture} onChange={(e) => setForm({ ...form, profilePicture: e.target.value, avatar: e.target.value })} className={inputCls} placeholder="https://example.com/your-photo.jpg" />
                </Field>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Full Name *">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} required />
            </Field>
            <Field label="Email">
              <input value={user?.email || ''} disabled className={inputCls + ' opacity-70'} />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Phone">
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="+91..." />
            </Field>
            <Field label="Location">
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputCls} placeholder="City, State" />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="College / University">
              <input value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Course / Field of Study">
              <input value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} className={inputCls} placeholder="B.Tech, B.Sc, etc." />
            </Field>
          </div>

          <Field label="Short Bio">
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={2} className={inputCls} placeholder="Tell teams about yourself..." />
          </Field>

          <Field label="About">
            <textarea value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} rows={4} className={inputCls} placeholder="More details about you..." />
          </Field>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="GitHub URL">
              <input value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} className={inputCls} placeholder="https://github.com/..." />
            </Field>
            <Field label="LinkedIn URL">
              <input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} className={inputCls} placeholder="https://linkedin.com/in/..." />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Portfolio URL">
              <input value={form.portfolio} onChange={(e) => setForm({ ...form, portfolio: e.target.value })} className={inputCls} placeholder="https://..." />
            </Field>
            <Field label="Website URL">
              <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className={inputCls} placeholder="https://..." />
            </Field>
          </div>

          <Field label="Resume URL">
            <input value={form.resumeUrl} onChange={(e) => setForm({ ...form, resumeUrl: e.target.value })} className={inputCls} placeholder="Link to your resume" />
          </Field>

          <Field label="Skills" hint="Comma separated, e.g. react, node, python">
            <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} className={inputCls} />
          </Field>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => nav(-1)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={busy}>
              <Save className="w-4 h-4" />
              {busy ? 'Saving...' : 'Save All Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
