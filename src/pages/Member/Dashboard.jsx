import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal, Field, inputCls } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { userApi, teamApi, errMsg, resolveFileUrl } from '../../services/api';
import {
  Award,
  Star,
  FileText,
  TrendingUp,
  UploadCloud,
  RefreshCw,
  Pencil,
  ExternalLink,
  BadgeCheck,
  Clock,
  X,
  Trash2,
  Eye,
  Check,
  AlertTriangle,
  Calendar,
  Building,
  Key,
  Users,
  FileUp,
  Target,
  Sparkles,
  Brain,
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const certStatusBadge = (s) => {
  switch (s) {
    case 'verified':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30';
    case 'under_review':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30';
    default:
      return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30';
  }
};

export default function MemberDashboard() {
  const { user, refresh } = useAuth();
  const [profile, setProfile] = useState(null);
  const [teams, setTeams] = useState([]);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  // Modals
  const [editOpen, setEditOpen] = useState(false);
  const [certOpen, setCertOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [previewCert, setPreviewCert] = useState(null);

  // Forms
  const [pForm, setPForm] = useState({
    name: '',
    bio: '',
    about: '',
    github: '',
    linkedin: '',
    portfolio: '',
    website: '',
    resumeUrl: '',
    phone: '',
    college: '',
    year: '',
    branch: '',
    location: '',
    profilePicture: '',
    avatar: '',
    skills: '',
  });

  const [cForm, setCForm] = useState({
    title: '',
    issuer: '',
    issueDate: '',
    credentialId: '',
    verificationUrl: '',
    skill: '',
    file: null,
  });

  const [resumeFile, setResumeFile] = useState(null);
  const [dragActiveCert, setDragActiveCert] = useState(false);
  const [dragActiveResume, setDragActiveResume] = useState(false);
  const [busy, setBusy] = useState(false);

  const certFileInputRef = useRef(null);
  const resumeFileInputRef = useRef(null);

  const load = async () => {
    try {
      const [p, t] = await Promise.all([userApi.get(user._id), teamApi.mine()]);
      setProfile(p);
      setTeams(t);
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  useEffect(() => {
    if (user?._id) load();
  }, [user?._id]); // eslint-disable-line

  const skills = profile?.skills || user?.skills || [];
  const radarData = skills.length
    ? skills.map((s) => ({ skill: s.name, A: s.level }))
    : [{ skill: 'No skills yet', A: 0 }];
  const quizAvg = profile?.quizScores?.length
    ? Math.round(profile.quizScores.reduce((s, q) => s + q.score, 0) / profile.quizScores.length)
    : 0;
  const certificates = profile?.certificates || [];

  // Pending invitations for this user
  const incomingInvites = teams
    .filter((t) => (t.invites || []).some((inv) => String(inv.user?._id || inv.user) === user?._id && inv.status === 'pending'))
    .map((t) => ({
      team: t,
      invite: (t.invites || []).find((inv) => String(inv.user?._id || inv.user) === user?._id),
    }));

  const openEdit = () => {
    setPForm({
      name: profile?.name || user?.name || '',
      bio: profile?.bio || '',
      about: profile?.about || '',
      github: profile?.github || '',
      linkedin: profile?.linkedin || '',
      portfolio: profile?.portfolio || '',
      website: profile?.website || '',
      resumeUrl: profile?.resumeUrl || '',
      phone: profile?.phone || '',
      college: profile?.college || '',
      year: profile?.year || '',
      branch: profile?.branch || '',
      location: profile?.location || '',
      profilePicture: profile?.profilePicture || profile?.avatar || '',
      avatar: profile?.avatar || '',
      skills: skills.map((s) => s.name).join(', '),
    });
    setErr('');
    setEditOpen(true);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const names = pForm.skills
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      const nextSkills = names.map((name) => {
        const existing = skills.find((s) => s.name.toLowerCase() === name);
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
        skills: nextSkills,
      });
      setProfile((p) => ({ ...p, ...updated }));
      await refresh();
      setMsg('Profile updated successfully.');
      setEditOpen(false);
      setTimeout(() => setMsg(''), 3000);
    } catch (e2) {
      setErr(errMsg(e2));
    } finally {
      setBusy(false);
    }
  };

  // Certificate Submission
  const handleCertFileSelect = (file) => {
    if (!file) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setErr('Unsupported file type. Please upload a PDF, PNG, JPG or WEBP certificate.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErr('File is too large. Maximum file size is 10 MB.');
      return;
    }
    setErr('');
    setCForm((prev) => ({
      ...prev,
      file,
      title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
    }));
  };

  const saveCert = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      if (cForm.file) {
        const formData = new FormData();
        formData.append('file', cForm.file);
        formData.append('title', cForm.title);
        if (cForm.issuer) formData.append('issuer', cForm.issuer);
        if (cForm.issueDate) formData.append('issueDate', cForm.issueDate);
        if (cForm.credentialId) formData.append('credentialId', cForm.credentialId);
        if (cForm.verificationUrl) formData.append('verificationUrl', cForm.verificationUrl);
        if (cForm.skill) formData.append('skill', cForm.skill);

        const res = await userApi.uploadCertificate(formData);
        setProfile((p) => ({
          ...p,
          certificates: [res.certificate, ...(p?.certificates || [])],
        }));
      } else {
        const res = await userApi.addCertificate({
          title: cForm.title,
          issuer: cForm.issuer,
          issueDate: cForm.issueDate,
          credentialId: cForm.credentialId,
          verificationUrl: cForm.verificationUrl,
          url: cForm.verificationUrl,
          skill: cForm.skill,
        });
        setProfile((p) => ({
          ...p,
          certificates: [res.certificate, ...(p?.certificates || [])],
        }));
      }

      setCForm({ title: '', issuer: '', issueDate: '', credentialId: '', verificationUrl: '', skill: '', file: null });
      setMsg('Certificate uploaded and queued for admin verification.');
      setCertOpen(false);
      setTimeout(() => setMsg(''), 3000);
    } catch (e2) {
      setErr(errMsg(e2));
    } finally {
      setBusy(false);
    }
  };

  const removeCert = async (certId) => {
    if (!window.confirm('Are you sure you want to remove this certificate?')) return;
    try {
      await userApi.deleteCertificate(certId);
      setProfile((p) => ({
        ...p,
        certificates: (p?.certificates || []).filter((c) => c._id !== certId),
      }));
      setMsg('Certificate removed successfully.');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  // Resume Submission
  const handleResumeFileSelect = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setErr('Please select a valid PDF file for your resume.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErr('Resume file is too large. Maximum size is 10 MB.');
      return;
    }
    setErr('');
    setResumeFile(file);
  };

  const uploadResume = async (e) => {
    e.preventDefault();
    if (!resumeFile) return;
    setBusy(true);
    setErr('');
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      const res = await userApi.uploadResume(formData);
      setProfile((p) => ({ ...p, ...res.user }));
      await refresh();
      setMsg('Resume uploaded successfully.');
      setResumeOpen(false);
      setResumeFile(null);
      setTimeout(() => setMsg(''), 3000);
    } catch (e2) {
      setErr(errMsg(e2));
    } finally {
      setBusy(false);
    }
  };

  const deleteResume = async () => {
    if (!window.confirm('Are you sure you want to delete your uploaded resume?')) return;
    setBusy(true);
    try {
      const res = await userApi.deleteResume();
      setProfile((p) => ({ ...p, ...res.user }));
      await refresh();
      setMsg('Resume deleted successfully.');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  // Respond to Team Invitation
  const respondInvite = async (teamId, action) => {
    try {
      await teamApi.respond(teamId, user._id, action);
      await load();
      setMsg(action === 'accept' ? 'Team invitation accepted! You are now a team member.' : 'Invitation declined.');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  const resumeUrl = profile?.resumeUrl || user?.resumeUrl;
  const resumeFileName = profile?.resumeOriginalName || profile?.resumeFileName || 'Resume.pdf';
  const resumeSize = profile?.resumeFileSize ? formatBytes(profile.resumeFileSize) : null;
  const resumeUploadedAt = profile?.resumeUploadedAt ? new Date(profile.resumeUploadedAt).toLocaleDateString() : null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-extrabold">Welcome back, {user?.name}</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Student Discovery Hub • Build your credibility with verified skills and certificates.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={load}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button variant="gradient" onClick={openEdit}>
            <Pencil className="w-4 h-4" /> Edit Profile
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {msg && (
        <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-200 text-[12px] text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300">
          {msg}
        </div>
      )}
      {err && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600 dark:text-red-400">
          {err}
        </div>
      )}

      {/* Incoming Team Invitations Banner */}
      {incomingInvites.length > 0 && (
        <Card className="p-5 border-2 border-indigo-500/30 bg-gradient-to-r from-indigo-50/50 via-transparent to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
          <h3 className="font-bold text-[14px] flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            Incoming Team Invitations ({incomingInvites.length})
          </h3>
          <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
            Team leaders have invited you to join their project team.
          </p>
          <div className="mt-3 space-y-2">
            {incomingInvites.map(({ team }) => (
              <div
                key={team._id}
                className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]"
              >
                <div>
                  <div className="font-bold text-[13px]">{team.name}</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    Problem: {team.problem?.title || 'Custom Problem'} • Leader: {team.leader?.name || 'Leader'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="gradient"
                    size="sm"
                    onClick={() => respondInvite(team._id, 'accept')}
                    className="text-[12px] bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Accept
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => respondInvite(team._id, 'decline')}
                    className="text-[12px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Main Profile & Skills Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h3 className="font-bold flex items-center gap-2">
            <FileText className="w-4 h-4" /> Profile Overview
          </h3>
          <div className="mt-4 grid md:grid-cols-2 gap-4 text-[13px]">
            <div className="space-y-2">
              <div>
                <span className="text-[var(--text-secondary)]">Email:</span> <b>{user?.email}</b>
              </div>
              <div>
                <span className="text-[var(--text-secondary)]">Role:</span> <b className="capitalize">{user?.role}</b>
              </div>
              {(profile?.name || user?.name) && (
                <div>
                  <span className="text-[var(--text-secondary)]">Name:</span> <b>{profile?.name || user?.name}</b>
                </div>
              )}
              {profile?.phone && (
                <div>
                  <span className="text-[var(--text-secondary)]">Phone:</span> <span>{profile.phone}</span>
                </div>
              )}
              {(profile?.college || profile?.year || profile?.branch) && (
                <div>
                  <span className="text-[var(--text-secondary)]">Education:</span>{' '}
                  <span>{[profile?.college, profile?.year, profile?.branch].filter(Boolean).join(' • ')}</span>
                </div>
              )}
              {profile?.location && (
                <div>
                  <span className="text-[var(--text-secondary)]">Location:</span> <span>{profile.location}</span>
                </div>
              )}
              <div>
                <span className="text-[var(--text-secondary)]">GitHub:</span>{' '}
                {profile?.github ? (
                  <a href={profile.github} target="_blank" rel="noreferrer" className="text-[#6C63FF] underline">
                    {profile.github}
                  </a>
                ) : (
                  <span className="text-[var(--text-secondary)]">Not linked</span>
                )}
              </div>
              <div>
                <span className="text-[var(--text-secondary)]">LinkedIn:</span>{' '}
                {profile?.linkedin ? (
                  <a href={profile.linkedin} target="_blank" rel="noreferrer" className="text-[#6C63FF] underline">
                    {profile.linkedin}
                  </a>
                ) : (
                  <span className="text-[var(--text-secondary)]">Not linked</span>
                )}
              </div>
              <div>
                <span className="text-[var(--text-secondary)]">Bio:</span>{' '}
                <span>{profile?.bio || profile?.about || '—'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" /> Reliability Score
                <span className="ml-auto font-bold px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[12px]">
                  {profile?.reliabilityScore ?? user?.reliabilityScore ?? 75}/100
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" /> Avg Rating {profile?.averageRating || 0} (
                {profile?.totalReviews || 0} reviews)
              </div>
              <div className="pt-2">
                <div className="text-[11px] font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
                  My Skills
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((s) => (
                    <span
                      key={s.name}
                      className="px-2.5 py-1 rounded-full bg-[var(--text-primary)] text-[var(--background)] text-[11px] font-medium capitalize flex items-center gap-1"
                    >
                      {s.badge === 'Certified' && <BadgeCheck className="w-3 h-3 text-amber-400" />}
                      {s.name} L{s.level}
                    </span>
                  ))}
                  {!skills.length && (
                    <span className="text-[12px] text-[var(--text-secondary)]">No skills added yet</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3 pt-4 border-t border-[var(--border)]">
            <Link
              to="/dashboard/member/quizzes"
              className="flex-1 min-w-[160px] py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Brain className="w-4 h-4" /> Skills & Assessments
            </Link>
            <button
              onClick={() => {
                setErr('');
                setCertOpen(true);
              }}
              className="flex-1 min-w-[160px] py-2.5 px-4 rounded-xl bg-[var(--text-primary)] text-[var(--background)] text-[13px] font-semibold flex items-center justify-center gap-2 hover:opacity-90"
            >
              <UploadCloud className="w-4 h-4" /> Upload Certificate
            </button>
            <button
              onClick={() => {
                setErr('');
                setResumeOpen(true);
              }}
              className="flex-1 min-w-[160px] py-2.5 px-4 rounded-xl border border-[var(--border)] text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-[var(--surface)]"
            >
              <FileUp className="w-4 h-4 text-indigo-500" /> Manage Resume
            </button>
            <button
              onClick={openEdit}
              className="flex-1 min-w-[160px] py-2.5 px-4 rounded-xl border border-[var(--border)] text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-[var(--surface)]"
            >
              <Pencil className="w-4 h-4" /> Edit Profile
            </button>
          </div>
        </Card>

        {/* Skill Radar Chart */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-[13px]">Skill Distribution</h3>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Assessed via quizzes & certificates</p>
          </div>
          <div className="h-[200px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="skill" fontSize={10} />
                <PolarRadiusAxis fontSize={10} domain={[0, 10]} />
                <Radar dataKey="A" stroke="#6C63FF" fill="#6C63FF" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] text-center">
            {skills.filter((s) => s.badge === 'Certified').length} certified badge(s)
          </div>
        </Card>
      </div>

      {/* Metric Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            k: 'Verified Skills',
            v: `${skills.filter((s) => s.verifiedScore >= 60 || s.badge === 'Certified').length} / ${skills.length}`,
            sub: `${skills.filter((s) => s.badge === 'Certified').length} Certified badges`,
            icon: Award,
          },
          {
            k: 'Aptitude Evaluation',
            v: profile?.aptitudeScore || user?.aptitudeScore ? `${profile?.aptitudeScore || user?.aptitudeScore}%` : 'Not Assessed',
            sub: profile?.aptitudeBadge || user?.aptitudeBadge ? `${profile?.aptitudeBadge || user?.aptitudeBadge} Badge` : 'Take timed test',
            icon: Target,
          },
          {
            k: 'Working-Style Profile',
            v: profile?.personality?.archetype || user?.personality?.archetype || 'Not Assessed',
            sub: profile?.personality?.archetype || user?.personality?.archetype ? 'Self-Reported Profile' : 'Discover Archetype',
            icon: Sparkles,
          },
          {
            k: 'Teams Joined',
            v: teams.length,
            sub: `${teams.filter((t) => t.status === 'forming').length} currently active`,
            icon: TrendingUp,
          },
        ].map((it) => (
          <Card key={it.k} className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--text-primary)] text-[var(--background)] flex items-center justify-center shrink-0">
              <it.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[15px] font-bold truncate">{it.v}</div>
              <div className="text-[11px] tracking-widest uppercase font-semibold text-[var(--text-secondary)] truncate">
                {it.k}
              </div>
              <div className="text-[11px] text-emerald-600 truncate">{it.sub}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Resume Management Section */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-[16px] flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              Resume Document
            </h3>
            <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
              Keep your professional PDF resume updated for team leaders and hackathon organizers.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setResumeOpen(true)} className="text-[12px]">
            <FileUp className="w-3.5 h-3.5" />
            {resumeUrl ? 'Replace Resume' : 'Upload Resume'}
          </Button>
        </div>

        <div className="mt-4">
          {resumeUrl ? (
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-center justify-center text-red-600 font-extrabold text-[12px]">
                  PDF
                </div>
                <div>
                  <div className="font-bold text-[14px] flex items-center gap-2">
                    {resumeFileName}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                      Active
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-2 mt-0.5">
                    {resumeSize && <span>Size: {resumeSize}</span>}
                    {resumeUploadedAt && <span>• Uploaded on {resumeUploadedAt}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={resolveFileUrl(resumeUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-[var(--text-primary)] text-[var(--background)] text-[12px] font-semibold flex items-center gap-1.5 hover:opacity-90"
                >
                  <Eye className="w-3.5 h-3.5" /> View / Download
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deleteResume}
                  disabled={busy}
                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 text-[12px]"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setResumeOpen(true)}
              className="cursor-pointer border-2 border-dashed border-[var(--border)] rounded-2xl p-6 text-center hover:border-indigo-500 transition"
            >
              <FileUp className="w-8 h-8 mx-auto text-[var(--text-secondary)]" />
              <div className="mt-2 text-[13px] font-bold">No resume uploaded yet</div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                Upload your PDF resume to let team leaders review your experience and projects.
              </p>
              <button className="mt-3 px-4 py-1.5 rounded-xl bg-[var(--text-primary)] text-[var(--background)] text-[12px] font-semibold inline-flex items-center gap-1.5">
                <UploadCloud className="w-3.5 h-3.5" /> Upload Resume PDF
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Certificates Section */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-[16px] flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              My Certificates
              <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                ({certificates.length})
              </span>
            </h3>
            <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
              Verified certificates award the &ldquo;Certified&rdquo; badge on your profile and boost your Reliability Score by +3 points.
            </p>
          </div>
          <Button
            variant="gradient"
            size="sm"
            onClick={() => {
              setErr('');
              setCertOpen(true);
            }}
            className="text-[12px] flex items-center gap-1.5"
          >
            <UploadCloud className="w-3.5 h-3.5" /> Upload Certificate
          </Button>
        </div>

        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          {certificates.length ? (
            certificates.map((c) => {
              const docUrl = resolveFileUrl(c.fileUrl || c.url);
              return (
                <div
                  key={c._id}
                  className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--text-secondary)]/30 transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center shrink-0">
                        {c.status === 'verified' ? (
                          <BadgeCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : c.status === 'under_review' ? (
                          <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        ) : c.status === 'rejected' ? (
                          <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-[13px] truncate">{c.title}</div>
                        <div className="text-[11px] text-[var(--text-secondary)] truncate">
                          {c.issuer || 'Self-uploaded'}
                          {c.skill ? ` • ${c.skill}` : ''}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize shrink-0 ${certStatusBadge(
                        c.status
                      )}`}
                    >
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Metadata */}
                  <div className="text-[11px] text-[var(--text-secondary)] space-y-0.5 pt-1 border-t border-[var(--border)]">
                    {c.issueDate && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" /> Issued: {new Date(c.issueDate).toLocaleDateString()}
                      </div>
                    )}
                    {c.credentialId && (
                      <div className="flex items-center gap-1.5">
                        <Key className="w-3 h-3" /> Credential ID: {c.credentialId}
                      </div>
                    )}
                    {c.submittedAt && (
                      <div>Submitted: {new Date(c.submittedAt).toLocaleDateString()}</div>
                    )}
                  </div>

                  {/* Rejection Note */}
                  {c.status === 'rejected' && c.rejectionReason && (
                    <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-[11px] text-red-700 dark:text-red-300">
                      <strong>Rejection Reason:</strong> {c.rejectionReason}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      {docUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewCert(c)}
                          className="text-[11px] font-semibold text-[var(--accent)] hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View Doc
                        </button>
                      )}
                      {c.verificationUrl && (
                        <a
                          href={c.verificationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-semibold text-[var(--text-secondary)] hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> Verify URL
                        </a>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCert(c._id)}
                      className="text-[11px] text-red-500 hover:text-red-700 p-1"
                      title="Delete Certificate"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="sm:col-span-2 p-8 text-center text-[12px] text-[var(--text-secondary)] border border-dashed border-[var(--border)] rounded-2xl">
              No certificates uploaded yet. Click &ldquo;Upload Certificate&rdquo; above to submit your credentials.
            </div>
          )}
        </div>
      </Card>

      {/* Edit Profile Modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Profile"
        subtitle="Add more details and your own profile photo. Leave blank if you don't want a photo."
      >
        <form onSubmit={saveProfile} className="space-y-4 max-h-[70vh] overflow-auto pr-1">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Full Name">
              <input
                value={pForm.name}
                onChange={(e) => setPForm({ ...pForm, name: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Phone">
              <input
                value={pForm.phone}
                onChange={(e) => setPForm({ ...pForm, phone: e.target.value })}
                className={inputCls}
                placeholder="e.g. +91..."
              />
            </Field>
          </div>
          <Field
            label="Profile Photo URL"
            hint="Paste image URL from your own source. Leave blank to have no photo."
          >
            <input
              value={pForm.profilePicture}
              onChange={(e) => setPForm({ ...pForm, profilePicture: e.target.value })}
              className={inputCls}
              placeholder="https://..."
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="College/University">
              <input
                value={pForm.college}
                onChange={(e) => setPForm({ ...pForm, college: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Year">
              <input
                value={pForm.year}
                onChange={(e) => setPForm({ ...pForm, year: e.target.value })}
                className={inputCls}
                placeholder="e.g. 3rd Year"
              />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Branch/Stream">
              <input
                value={pForm.branch}
                onChange={(e) => setPForm({ ...pForm, branch: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Location">
              <input
                value={pForm.location}
                onChange={(e) => setPForm({ ...pForm, location: e.target.value })}
                className={inputCls}
                placeholder="City, State"
              />
            </Field>
          </div>
          <Field label="Bio">
            <textarea
              value={pForm.bio}
              onChange={(e) => setPForm({ ...pForm, bio: e.target.value })}
              rows={2}
              className={inputCls}
              placeholder="Short intro for teams..."
            />
          </Field>
          <Field label="About">
            <textarea
              value={pForm.about}
              onChange={(e) => setPForm({ ...pForm, about: e.target.value })}
              rows={3}
              className={inputCls}
              placeholder="More details about you..."
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="GitHub URL">
              <input
                value={pForm.github}
                onChange={(e) => setPForm({ ...pForm, github: e.target.value })}
                className={inputCls}
                placeholder="https://github.com/..."
              />
            </Field>
            <Field label="LinkedIn URL">
              <input
                value={pForm.linkedin}
                onChange={(e) => setPForm({ ...pForm, linkedin: e.target.value })}
                className={inputCls}
                placeholder="https://linkedin.com/in/..."
              />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Portfolio URL">
              <input
                value={pForm.portfolio}
                onChange={(e) => setPForm({ ...pForm, portfolio: e.target.value })}
                className={inputCls}
                placeholder="https://..."
              />
            </Field>
            <Field label="Website URL">
              <input
                value={pForm.website}
                onChange={(e) => setPForm({ ...pForm, website: e.target.value })}
                className={inputCls}
                placeholder="https://..."
              />
            </Field>
          </div>
          <Field label="Skills" hint="Comma separated, e.g. react, node, python">
            <input
              value={pForm.skills}
              onChange={(e) => setPForm({ ...pForm, skills: e.target.value })}
              className={inputCls}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={busy}>
              {busy ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Upload Certificate Modal */}
      <Modal
        open={certOpen}
        onClose={() => setCertOpen(false)}
        title="Submit Certificate for Verification"
        subtitle="Upload your document (PDF, PNG, JPG, or WEBP) and enter credential details. Admin will review and award your verified badge."
      >
        <form onSubmit={saveCert} className="space-y-4">
          {/* Drag & drop file area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActiveCert(true);
            }}
            onDragLeave={() => setDragActiveCert(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActiveCert(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleCertFileSelect(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => certFileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-2xl p-5 text-center transition ${
              dragActiveCert
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                : cForm.file
                ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                : 'border-[var(--border)] hover:border-indigo-500'
            }`}
          >
            <input
              ref={certFileInputRef}
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleCertFileSelect(e.target.files[0]);
                }
              }}
            />
            {cForm.file ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-[13px] font-bold text-[var(--text-primary)]">{cForm.file.name}</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">{formatBytes(cForm.file.size)} • Click to change file</div>
                </div>
              </div>
            ) : (
              <div>
                <UploadCloud className="w-8 h-8 mx-auto text-indigo-500" />
                <div className="mt-2 text-[13px] font-bold">Drag and drop certificate file here</div>
                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Supports PDF, PNG, JPG or WEBP (Max 10 MB)
                </div>
                <span className="mt-2 inline-block text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  Or click to browse files
                </span>
              </div>
            )}
          </div>

          <Field label="Certificate Title *">
            <input
              value={cForm.title}
              onChange={(e) => setCForm({ ...cForm, title: e.target.value })}
              className={inputCls}
              placeholder="e.g. AWS Certified Solutions Architect"
              required
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Issuing Organization">
              <input
                value={cForm.issuer}
                onChange={(e) => setCForm({ ...cForm, issuer: e.target.value })}
                className={inputCls}
                placeholder="e.g. Amazon Web Services, Coursera"
              />
            </Field>
            <Field label="Related Skill">
              <input
                value={cForm.skill}
                onChange={(e) => setCForm({ ...cForm, skill: e.target.value })}
                className={inputCls}
                placeholder="e.g. aws, react, python"
              />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Issue Date">
              <input
                type="date"
                value={cForm.issueDate}
                onChange={(e) => setCForm({ ...cForm, issueDate: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Credential ID">
              <input
                value={cForm.credentialId}
                onChange={(e) => setCForm({ ...cForm, credentialId: e.target.value })}
                className={inputCls}
                placeholder="e.g. AWS-987654321"
              />
            </Field>
          </div>

          <Field label="Online Verification URL (Optional)">
            <input
              value={cForm.verificationUrl}
              onChange={(e) => setCForm({ ...cForm, verificationUrl: e.target.value })}
              className={inputCls}
              placeholder="https://verify.organization.com/..."
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCertOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={busy}>
              {busy ? 'Uploading...' : 'Submit for Verification'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Upload / Replace Resume Modal */}
      <Modal
        open={resumeOpen}
        onClose={() => setResumeOpen(false)}
        title="Upload Professional Resume"
        subtitle="Upload your resume in PDF format (maximum 10 MB). This document will be accessible to project team leaders."
      >
        <form onSubmit={uploadResume} className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActiveResume(true);
            }}
            onDragLeave={() => setDragActiveResume(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActiveResume(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleResumeFileSelect(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => resumeFileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-2xl p-6 text-center transition ${
              dragActiveResume
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                : resumeFile
                ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                : 'border-[var(--border)] hover:border-indigo-500'
            }`}
          >
            <input
              ref={resumeFileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleResumeFileSelect(e.target.files[0]);
                }
              }}
            />
            {resumeFile ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-[13px] font-bold text-[var(--text-primary)]">{resumeFile.name}</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">{formatBytes(resumeFile.size)} • Click to choose another file</div>
                </div>
              </div>
            ) : (
              <div>
                <FileUp className="w-8 h-8 mx-auto text-indigo-500" />
                <div className="mt-2 text-[13px] font-bold">Drag and drop your PDF resume here</div>
                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Only PDF format supported (Max 10 MB)
                </div>
                <span className="mt-2 inline-block text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  Or click to choose a PDF from your computer
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setResumeOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={busy || !resumeFile}>
              {busy ? 'Uploading...' : 'Save & Upload Resume'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Student Document Preview Modal */}
      {previewCert && (
        <Modal
          open={Boolean(previewCert)}
          onClose={() => setPreviewCert(null)}
          title={`Certificate: ${previewCert.title}`}
          subtitle={`Issued by ${previewCert.issuer || 'Self-uploaded'}`}
          wide={true}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[12px] text-[var(--text-secondary)]">
              <span>Status: <strong className="capitalize">{previewCert.status.replace('_', ' ')}</strong></span>
              <a
                href={resolveFileUrl(previewCert.fileUrl || previewCert.url)}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--accent)] underline font-semibold flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
              </a>
            </div>

            <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-black/5 dark:bg-black/40 flex items-center justify-center min-h-[350px]">
              {previewCert.fileName &&
              (previewCert.fileName.toLowerCase().endsWith('.jpg') ||
                previewCert.fileName.toLowerCase().endsWith('.jpeg') ||
                previewCert.fileName.toLowerCase().endsWith('.png') ||
                previewCert.fileName.toLowerCase().endsWith('.webp')) ? (
                <img
                  src={resolveFileUrl(previewCert.fileUrl || previewCert.url)}
                  alt="Certificate Document"
                  className="max-h-[500px] w-auto object-contain mx-auto"
                />
              ) : (
                <iframe
                  src={resolveFileUrl(previewCert.fileUrl || previewCert.url)}
                  title="Certificate Document Preview"
                  className="w-full h-[500px]"
                />
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setPreviewCert(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}