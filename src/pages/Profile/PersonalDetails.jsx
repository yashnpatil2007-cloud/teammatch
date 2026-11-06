import { useState, useEffect, useRef } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, inputCls } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { userApi, errMsg } from '../../services/api';
import { Save, X, Camera, Trash2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PersonalDetails() {
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    profilePicture: '',
    avatar: '',
    bio: '',
    about: '',
    college: '',
    course: '',
    branch: '',
    year: '',
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
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoProgress, setPhotoProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    const u = user || {};
    setForm({
      name: u.name || '',
      profilePicture: u.profilePicture || u.avatar || '',
      avatar: u.avatar || u.profilePicture || '',
      bio: u.bio || '',
      about: u.about || '',
      college: u.college || '',
      course: u.course || u.branch || '',
      branch: u.branch || u.course || '',
      year: u.year || '',
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

  // Handle Photo File Selection & Immediate Authenticated Upload
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be re-selected if desired
    e.target.value = '';

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErr('Invalid file format. Please select a JPG, JPEG, PNG, or WEBP image.');
      return;
    }

    // Validate size (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErr(`Photo file size (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds 5 MB limit. Please select a smaller image.`);
      return;
    }

    // Show temporary local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setErr('');
    setPhotoUploading(true);
    setPhotoProgress(10);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await userApi.uploadProfilePhoto(formData, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setPhotoProgress(Math.min(95, percent));
        }
      });

      setPhotoProgress(100);
      setForm((prev) => ({
        ...prev,
        profilePicture: res.photoUrl,
        avatar: res.photoUrl,
      }));
      setPreviewUrl('');
      await refresh();
      setMsg('Profile photo updated successfully!');
      setTimeout(() => setMsg(''), 3000);
    } catch (ex) {
      setPreviewUrl('');
      setErr(errMsg(ex));
    } finally {
      setPhotoUploading(false);
      setPhotoProgress(0);
    }
  };

  // Handle Photo Removal
  const handleRemovePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;
    setPhotoUploading(true);
    setErr('');
    try {
      await userApi.deleteProfilePhoto();
      setPreviewUrl('');
      setForm((prev) => ({
        ...prev,
        profilePicture: '',
        avatar: '',
      }));
      await refresh();
      setMsg('Profile photo removed successfully.');
      setTimeout(() => setMsg(''), 3000);
    } catch (ex) {
      setErr(errMsg(ex));
    } finally {
      setPhotoUploading(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    setMsg('');
    try {
      const existingSkills = Array.isArray(user?.skills) ? user.skills : [];
      const skillsArr = form.skills
        ? String(form.skills)
            .split(',')
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean)
            .map((name) => {
              const existing = existingSkills.find((s) => s.name.toLowerCase() === name);
              return existing || { name, level: 5, badge: 'Bronze' };
            })
        : [];
      const payload = {
        name: form.name,
        profilePicture: form.profilePicture,
        avatar: form.avatar || form.profilePicture,
        bio: form.bio,
        about: form.about,
        college: form.college,
        course: form.course,
        branch: form.branch || form.course,
        year: form.year,
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
      setMsg('Profile details saved successfully.');
      setTimeout(() => setMsg(''), 2500);
    } catch (ex) {
      setErr(errMsg(ex));
    } finally {
      setBusy(false);
    }
  };

  const activePhoto = previewUrl || form.profilePicture || form.avatar;
  const hasPhoto = Boolean(form.profilePicture || form.avatar);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-extrabold">Personal Details</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">Manage your profile photo, skills, and personal information.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => nav(-1)}>
            <X className="w-4 h-4" /> Cancel
          </Button>
        </div>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-200 text-[12px] text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}
      {err && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600 dark:text-red-400">{err}</div>}

      <Card className="p-6">
        <form onSubmit={save} className="space-y-6">
          {/* Enhanced Profile Photo Section */}
          <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 space-y-3">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Photo Preview with Avatar fallback */}
              <div className="relative group shrink-0">
                <Avatar
                  user={{
                    ...user,
                    profilePicture: activePhoto,
                    avatar: activePhoto,
                    name: form.name,
                  }}
                  size="2xl"
                  className="shadow-sm"
                />
                {photoUploading && (
                  <div className="absolute inset-0 rounded-full bg-black/50 backdrop-blur-xs flex items-center justify-center text-white">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                )}
              </div>

              {/* Upload & Action Controls */}
              <div className="flex-1 text-center sm:text-left space-y-2">
                <div>
                  <h3 className="font-bold text-[14px]">Profile Photo</h3>
                  <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                    Upload a high-quality photo to represent yourself in teammate discovery, workspaces, and team submissions.
                  </p>
                </div>

                {/* Progress bar during upload */}
                {photoUploading && (
                  <div className="w-full max-w-xs space-y-1 py-1">
                    <div className="flex justify-between text-[11px] font-semibold text-[var(--text-secondary)]">
                      <span>Uploading photo...</span>
                      <span>{photoProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#6C63FF] to-[#60A5FA] rounded-full transition-all duration-300"
                        style={{ width: `${photoProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="gradient"
                    disabled={photoUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[12px] py-2 px-4 flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {hasPhoto ? 'Change Photo' : 'Upload Photo'}
                  </Button>

                  {hasPhoto && (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={photoUploading}
                      onClick={handleRemovePhoto}
                      className="text-[12px] py-2 px-3 text-red-600 hover:bg-red-500/10 flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </Button>
                  )}
                </div>

                <div className="text-[11px] text-[var(--text-secondary)] pt-0.5">
                  Supported formats: <strong>JPG, JPEG, PNG, WEBP</strong> • Maximum size: <strong>5 MB</strong>
                </div>
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

          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="College / University">
              <input value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Course / Branch">
              <input value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value, branch: e.target.value })} className={inputCls} placeholder="B.Tech, CSE, etc." />
            </Field>
            <Field label="Year">
              <input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className={inputCls} placeholder="e.g. 3rd Year" />
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
