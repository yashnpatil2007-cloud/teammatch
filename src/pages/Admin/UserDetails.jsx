import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Modal, Field, inputCls } from '../../components/ui/Modal';
import { userApi, errMsg, resolveFileUrl } from '../../services/api';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  BookOpen,
  Calendar,
  Briefcase,
  Globe,
  Award,
  FileText,
  Download,
  Eye,
  Check,
  X,
  Clock,
  AlertTriangle,
  Brain,
  Code2,
  Sparkles,
  Users,
  FolderGit2,
  ExternalLink,
  Star,
  ShieldCheck,
  ShieldAlert,
  History,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

const CERT_BADGES = {
  pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  under_review: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  verified: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
};

const ACCOUNT_BADGES = {
  active: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  suspended: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  deactivated: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
};

const REJECTION_PRESETS = [
  'Document is blurry, illegible, or incomplete',
  'Name on certificate does not match user profile',
  'Credential ID or verification URL is invalid/unverifiable',
  'Certificate is expired or not from an accredited source',
  'Certificate skill does not align with course content',
];

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString();
};

export default function AdminUserDetails() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');

  // Preview Modal (Certificates or Resume)
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // Reject Certificate Modal
  const [rejectCert, setRejectCert] = useState(null);
  const [rejectReason, setRejectReason] = useState(REJECTION_PRESETS[0]);

  // Account Status Modal
  const [statusOpen, setStatusOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState('active');
  const [statusReason, setStatusReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await userApi.adminGetDetails(userId);
      setDetails(data);
      setNextStatus(data.accountInfo?.accountStatus || 'active');
      setStatusReason(data.accountInfo?.statusReason || '');
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const notify = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3500);
  };

  const openDocumentPreview = async (doc) => {
    const rawUrl = doc.fileUrl || doc.url;
    setPreviewDoc(doc);
    setPreviewUrl('');
    if (!rawUrl) return;
    setPreviewLoading(true);
    try {
      const secureUrl = await userApi.fetchSecureDocumentUrl(rawUrl);
      setPreviewUrl(secureUrl);
    } catch {
      setPreviewUrl(resolveFileUrl(rawUrl));
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    setPreviewDoc(null);
  };

  const handleDownloadResume = async (resume) => {
    if (!resume?.url) return;
    setErr('');
    try {
      const blobUrl = await userApi.fetchSecureDocumentUrl(resume.url);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = resume.originalName || resume.fileName || 'resume.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => {
        if (blobUrl.startsWith('blob:')) URL.revokeObjectURL(blobUrl);
      }, 3000);
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  const handleCertAction = async (certId, action, reason = '') => {
    setErr('');
    setBusy(certId);
    try {
      await userApi.verifyCertificate(certId, action, reason);
      await load();
      setRejectCert(null);
      notify(`Certificate ${action === 'verify' ? 'verified' : action === 'under_review' ? 'marked under review' : 'rejected'}.`);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy('');
    }
  };

  const handleRoleChange = async (newRole) => {
    setErr('');
    setBusy('role');
    try {
      await userApi.update(userId, { role: newRole });
      await load();
      notify(`User role updated to ${newRole}.`);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy('');
    }
  };

  const handleVerifyToggle = async () => {
    if (!details?.accountInfo) return;
    setErr('');
    setBusy('verify');
    try {
      const next = !details.accountInfo.isVerified;
      await userApi.update(userId, { isVerified: next });
      await load();
      notify(`User profile ${next ? 'verified' : 'unverified'}.`);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy('');
    }
  };

  const handleStatusSave = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy('status');
    try {
      await userApi.adminUpdateStatus(userId, {
        accountStatus: nextStatus,
        reason: statusReason,
      });
      setStatusOpen(false);
      await load();
      notify(`Account status updated to ${nextStatus}.`);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy('');
    }
  };

  const handleDeleteUser = async () => {
    if (!details?.personalInfo) return;
    if (!window.confirm(`Permanently delete "${details.personalInfo.name}"? This action cannot be undone.`)) return;
    setBusy('delete');
    try {
      await userApi.remove(userId);
      navigate('/dashboard/admin/users');
    } catch (e) {
      setErr(errMsg(e));
      setBusy('');
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-[13px] text-[var(--text-secondary)]">
        Loading complete user record...
      </div>
    );
  }

  if (!details) {
    return (
      <div className="space-y-4">
        <Link to="/dashboard/admin/users" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6C63FF] hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to User Management
        </Link>
        <Card className="p-8 text-center">
          <div className="text-[15px] font-bold text-red-500">{err || 'User record not found'}</div>
        </Card>
      </div>
    );
  }

  const {
    user,
    personalInfo,
    skillsAndExperience,
    certificates = [],
    resume = {},
    assessments = {},
    teamHistory = [],
    projects = {},
    accountInfo = {},
    auditLogs = [],
  } = details;

  const currentTeams = teamHistory.filter((t) => t.isCurrent);
  const pastOrPendingTeams = teamHistory.filter((t) => !t.isCurrent);
  const personalityDims = assessments.personality?.dimensions
    ? Object.entries(assessments.personality.dimensions)
    : [];

  return (
    <div className="space-y-6">
      {/* Top Navigation & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/admin/users"
            className="p-2 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface)] transition"
            title="Back to User Management"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight flex items-center gap-2">
              {personalInfo.name}
              {accountInfo.isVerified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              )}
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize ${
                  ACCOUNT_BADGES[accountInfo.accountStatus || 'active']
                }`}
              >
                {accountInfo.accountStatus || 'active'}
              </span>
            </h1>
            <p className="text-[12px] text-[var(--text-secondary)]">
              User ID: <code className="font-mono">{personalInfo._id}</code> • Role:{' '}
              <strong className="capitalize">{accountInfo.role}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setStatusOpen(true)} className="text-[12px]">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Manage Status
          </Button>
          <Button variant="ghost" size="sm" onClick={handleVerifyToggle} disabled={busy === 'verify'} className="text-[12px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            {accountInfo.isVerified ? 'Unverify Profile' : 'Verify Profile'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteUser}
            disabled={busy === 'delete'}
            className="text-[12px] text-red-500 hover:bg-red-500/10"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete User
          </Button>
        </div>
      </div>

      {err && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600 dark:text-red-400">
          {err}
        </div>
      )}
      {msg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[12px] text-emerald-700 dark:text-emerald-400">
          {msg}
        </div>
      )}

      {/* SECTION 1: Personal Information */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h2 className="font-extrabold text-[15px]">1. Personal Information</h2>
          <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
            Reliability Score: <strong className="text-[#6C63FF]">{accountInfo.reliabilityScore ?? 70}%</strong>
          </span>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center md:items-start gap-2 shrink-0">
            <Avatar user={user} size="xl" />
            <div className="text-[11px] text-[var(--text-secondary)] text-center md:text-left">
              Rating: <strong>{accountInfo.averageRating || 0}</strong> ({accountInfo.totalReviews || 0} reviews)
            </div>
          </div>

          <div className="flex-1 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-[13px]">
            <div>
              <div className="text-[11px] font-bold uppercase text-[var(--text-secondary)]">Full Name</div>
              <div className="font-semibold mt-0.5">{personalInfo.name || '—'}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase text-[var(--text-secondary)] flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email
              </div>
              <div className="font-semibold mt-0.5 break-all">{personalInfo.email || '—'}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase text-[var(--text-secondary)] flex items-center gap-1">
                <Phone className="w-3 h-3" /> Phone
              </div>
              <div className="font-semibold mt-0.5">{personalInfo.phone || 'Not provided'}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase text-[var(--text-secondary)] flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Location
              </div>
              <div className="font-semibold mt-0.5">{personalInfo.location || 'Not provided'}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase text-[var(--text-secondary)] flex items-center gap-1">
                <GraduationCap className="w-3 h-3" /> College / Institution
              </div>
              <div className="font-semibold mt-0.5">{personalInfo.college || 'Not provided'}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase text-[var(--text-secondary)] flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> Course / Branch / Year
              </div>
              <div className="font-semibold mt-0.5">
                {[personalInfo.course, personalInfo.branch, personalInfo.year].filter(Boolean).join(' • ') || 'Not provided'}
              </div>
            </div>
          </div>
        </div>

        {(personalInfo.bio || personalInfo.about) && (
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[13px]">
            <div className="text-[11px] font-bold uppercase text-[var(--text-secondary)] mb-1">Bio / About</div>
            <p className="leading-relaxed whitespace-pre-line">{personalInfo.bio || personalInfo.about}</p>
          </div>
        )}

        {(personalInfo.github || personalInfo.linkedin || personalInfo.portfolio || personalInfo.website) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {personalInfo.github && (
              <a
                href={personalInfo.github}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl border border-[var(--border)] text-[12px] font-semibold hover:bg-[var(--surface)] inline-flex items-center gap-1.5"
              >
                <Code2 className="w-3.5 h-3.5" /> GitHub
              </a>
            )}
            {personalInfo.linkedin && (
              <a
                href={personalInfo.linkedin}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl border border-[var(--border)] text-[12px] font-semibold hover:bg-[var(--surface)] inline-flex items-center gap-1.5"
              >
                <Briefcase className="w-3.5 h-3.5" /> LinkedIn
              </a>
            )}
            {(personalInfo.portfolio || personalInfo.website) && (
              <a
                href={personalInfo.portfolio || personalInfo.website}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl border border-[var(--border)] text-[12px] font-semibold hover:bg-[var(--surface)] inline-flex items-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5" /> Portfolio
              </a>
            )}
          </div>
        )}
      </Card>

      {/* SECTION 2: Skills & Experience */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h2 className="font-extrabold text-[15px] flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#6C63FF]" /> 2. Skills & Experience
          </h2>
          {skillsAndExperience.availability && (
            <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold">
              Availability: {skillsAndExperience.availability}
            </span>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-2">
            <div className="text-[11px] font-bold uppercase text-[var(--text-secondary)]">
              Technical Skills ({(skillsAndExperience.skills || []).length})
            </div>
            {(skillsAndExperience.skills || []).length ? (
              <div className="grid sm:grid-cols-2 gap-2.5">
                {skillsAndExperience.skills.map((sk, idx) => (
                  <div
                    key={`${sk.name}-${idx}`}
                    className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-[13px] capitalize">{sk.name}</div>
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        Proficiency: <strong>{sk.level || 1}/10</strong>
                        {sk.verifiedScore > 0 && ` • Verified: ${sk.verifiedScore}%`}
                      </div>
                    </div>
                    {sk.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#6C63FF]/10 text-[#6C63FF]">
                        {sk.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[12px] text-[var(--text-secondary)]">No technical skills added yet.</div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-[11px] font-bold uppercase text-[var(--text-secondary)] mb-1.5">Domain Interests</div>
              {(skillsAndExperience.interests || []).length ? (
                <div className="flex flex-wrap gap-1.5">
                  {skillsAndExperience.interests.map((item, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[12px] font-semibold"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-[12px] text-[var(--text-secondary)]">No domain interests specified.</div>
              )}
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase text-[var(--text-secondary)] mb-1">Availability</div>
              <div className="text-[13px] font-semibold">
                {skillsAndExperience.availability || 'Not specified'}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* SECTION 3 & 4: Certificates + Resume */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h2 className="font-extrabold text-[15px] flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" /> 3. Certificates ({certificates.length})
            </h2>
          </div>

          {certificates.length ? (
            <div className="space-y-3">
              {certificates.map((c) => {
                const hasDoc = Boolean(c.fileUrl || c.url);
                return (
                  <div
                    key={c._id}
                    className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-[14px]">{c.title}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                              CERT_BADGES[c.status] || CERT_BADGES.pending
                            }`}
                          >
                            {(c.status || 'pending').replace('_', ' ')}
                          </span>
                          {c.skill && (
                            <span className="px-2 py-0.5 rounded-md bg-[var(--card)] border border-[var(--border)] text-[10px] font-semibold capitalize">
                              {c.skill}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                          Issuer: <strong>{c.issuer || 'Self-uploaded'}</strong>
                          {c.credentialId && ` • ID: ${c.credentialId}`}
                          {c.submittedAt && ` • Uploaded: ${new Date(c.submittedAt).toLocaleDateString()}`}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {hasDoc && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDocumentPreview({ ...c, kind: 'certificate' })}
                            className="text-[11px]"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-500" /> Preview
                          </Button>
                        )}
                        {c.status !== 'verified' && (
                          <Button
                            variant="gradient"
                            size="sm"
                            disabled={busy === c._id}
                            onClick={() => handleCertAction(c._id, 'verify')}
                            className="text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </Button>
                        )}
                        {c.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busy === c._id}
                            onClick={() => handleCertAction(c._id, 'under_review')}
                            className="text-[11px] text-blue-600"
                          >
                            <Clock className="w-3.5 h-3.5" /> Review
                          </Button>
                        )}
                        {c.status !== 'rejected' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busy === c._id}
                            onClick={() => {
                              setRejectCert(c);
                              setRejectReason(REJECTION_PRESETS[0]);
                            }}
                            className="text-[11px] text-red-500 hover:bg-red-500/10"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </Button>
                        )}
                      </div>
                    </div>

                    {c.rejectionReason && (
                      <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[11px] text-red-600 dark:text-red-300">
                        <strong>Rejection Reason:</strong> {c.rejectionReason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-[12px] text-[var(--text-secondary)]">
              No certificates uploaded by this user.
            </div>
          )}
        </Card>

        {/* SECTION 4: Resume */}
        <Card className="p-6 space-y-4">
          <div className="border-b border-[var(--border)] pb-3">
            <h2 className="font-extrabold text-[15px] flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" /> 4. Resume
            </h2>
          </div>

          {resume?.url ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-1.5">
                <div className="font-bold text-[13px] break-all">
                  {resume.originalName || resume.fileName || 'Uploaded Resume.pdf'}
                </div>
                <div className="text-[11px] text-[var(--text-secondary)]">
                  Size: {formatBytes(resume.fileSize)}
                </div>
                {resume.uploadedAt && (
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    Uploaded: {formatDate(resume.uploadedAt)}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() =>
                    openDocumentPreview({
                      title: 'User Resume',
                      fileName: resume.originalName || resume.fileName || 'resume.pdf',
                      fileUrl: resume.url,
                      kind: 'resume',
                    })
                  }
                  className="w-full justify-center text-[12px]"
                >
                  <Eye className="w-3.5 h-3.5" /> View Resume
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownloadResume(resume)}
                  className="w-full justify-center text-[12px]"
                >
                  <Download className="w-3.5 h-3.5" /> Download Resume
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-[12px] text-[var(--text-secondary)]">
              No resume has been uploaded by this user.
            </div>
          )}
        </Card>
      </div>

      {/* SECTION 5: Assessments */}
      <Card className="p-6 space-y-5">
        <div className="border-b border-[var(--border)] pb-3">
          <h2 className="font-extrabold text-[15px] flex items-center gap-2">
            <Brain className="w-4 h-4 text-emerald-500" /> 5. Assessments & Working Style
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Aptitude */}
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 space-y-2">
            <div className="text-[11px] font-bold uppercase text-[var(--text-secondary)]">Aptitude Evaluation</div>
            <div className="text-[24px] font-extrabold text-[#6C63FF]">
              {assessments.aptitude?.score || 0}%
            </div>
            <div className="text-[12px] font-semibold">
              Level: {assessments.aptitude?.level || 'Not taken'}{' '}
              {assessments.aptitude?.badge && `• ${assessments.aptitude.badge}`}
            </div>
            {assessments.aptitude?.takenAt && (
              <div className="text-[11px] text-[var(--text-secondary)]">
                Latest: {new Date(assessments.aptitude.takenAt).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Technical */}
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 space-y-2">
            <div className="text-[11px] font-bold uppercase text-[var(--text-secondary)]">Technical Quizzes</div>
            <div className="text-[24px] font-extrabold text-emerald-600 dark:text-emerald-400">
              {(assessments.technical || []).length} Attempts
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(assessments.technical || []).slice(0, 4).map((q, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-[var(--card)] border border-[var(--border)] text-[11px] font-semibold capitalize"
                >
                  {q.skill}: {q.score}%
                </span>
              ))}
              {!(assessments.technical || []).length && (
                <span className="text-[12px] text-[var(--text-secondary)]">No technical quizzes recorded</span>
              )}
            </div>
          </div>

          {/* Personality / Working Style */}
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 space-y-2">
            <div className="text-[11px] font-bold uppercase text-[var(--text-secondary)] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" /> Working Style & Personality
            </div>
            <div className="text-[16px] font-extrabold text-purple-600 dark:text-purple-400">
              {assessments.personality?.archetype || 'Not assessed'}
            </div>
            {assessments.personality?.summary && (
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                {assessments.personality.summary}
              </p>
            )}
            {personalityDims.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {personalityDims.map(([k, v]) => (
                  <span key={k} className="px-2 py-0.5 rounded-md bg-[var(--card)] border border-[var(--border)] text-[10px] font-bold capitalize">
                    {k}: {v}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Assessment Attempt History */}
        <div>
          <div className="text-[12px] font-bold mb-2">Assessment Attempt History ({(assessments.history || []).length})</div>
          {(assessments.history || []).length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-[11px] uppercase text-[var(--text-secondary)]">
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Assessment / Skill</th>
                    <th className="py-2 pr-3">Score / Archetype</th>
                    <th className="py-2 pr-3">Badge / Level</th>
                    <th className="py-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {assessments.history.map((h) => (
                    <tr key={h._id}>
                      <td className="py-2 pr-3 capitalize font-semibold">{h.assessmentType}</td>
                      <td className="py-2 pr-3 capitalize">{h.title}</td>
                      <td className="py-2 pr-3 font-bold text-[#6C63FF]">
                        {h.score !== null && h.score !== undefined ? `${h.score}%` : h.archetype || 'Completed'}
                      </td>
                      <td className="py-2 pr-3">{[h.level, h.badge].filter(Boolean).join(' • ') || '—'}</td>
                      <td className="py-2 text-[var(--text-secondary)]">{h.takenAt ? formatDate(h.takenAt) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-[12px] text-[var(--text-secondary)]">No assessment history available.</div>
          )}
        </div>
      </Card>

      {/* SECTION 6: Team History */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
          <h2 className="font-extrabold text-[15px] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#6C63FF]" /> 6. Team History ({teamHistory.length})
          </h2>
          <div className="text-[11px] text-[var(--text-secondary)]">
            Active Teams: <strong>{currentTeams.length}</strong> • Applications / Invites / Past: <strong>{pastOrPendingTeams.length}</strong>
          </div>
        </div>

        {teamHistory.length ? (
          <div className="grid md:grid-cols-2 gap-3">
            {teamHistory.map((t) => (
              <div
                key={`${t.teamId}-${t.participationRole}`}
                className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 flex items-start justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[14px] truncate">{t.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.isCurrent
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'bg-[var(--card)] text-[var(--text-secondary)] border border-[var(--border)]'
                      }`}
                    >
                      {t.participationRole} ({t.participationStatus})
                    </span>
                  </div>
                  {t.problemTitle && (
                    <div className="text-[12px] text-[var(--text-secondary)] truncate">
                      Problem: {t.problemTitle}
                    </div>
                  )}
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    Team Status: <strong className="capitalize">{t.status}</strong> • Members: {t.memberCount}/{t.maxSize}
                    {t.leaderName && ` • Leader: ${t.leaderName}`}
                  </div>
                </div>
                {(t.participationRole === 'Leader' || t.participationRole === 'Member') && (
                  <Link
                    to={`/dashboard/teams/${t.teamId}/workspace`}
                    className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-[11px] font-semibold hover:bg-[var(--card)] shrink-0"
                  >
                    Workspace
                  </Link>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[12px] text-[var(--text-secondary)]">
            This user has not joined, led, or applied to any teams yet.
          </div>
        )}
      </Card>

      {/* SECTION 7: Projects & Reviews */}
      <Card className="p-6 space-y-5">
        <div className="border-b border-[var(--border)] pb-3">
          <h2 className="font-extrabold text-[15px] flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-purple-500" /> 7. Projects, Submissions & Reviews
          </h2>
        </div>

        {/* Submissions */}
        <div className="space-y-3">
          <div className="text-[12px] font-bold">
            Project Submissions ({(projects.submissions || []).length})
          </div>
          {(projects.submissions || []).length ? (
            <div className="space-y-3">
              {projects.submissions.map((s) => (
                <div
                  key={s._id}
                  className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 space-y-2.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-[14px]">{s.title || 'Untitled Project'}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#6C63FF]/10 text-[#6C63FF] capitalize">
                          {(s.status || 'draft').replace('_', ' ')}
                        </span>
                        {s.score !== undefined && s.score !== null && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                            Score: {s.score}/100
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                        Team: <strong>{s.teamName}</strong>
                        {s.problemTitle && ` • Challenge: ${s.problemTitle}`}
                        {s.submittedAt && ` • Submitted: ${new Date(s.submittedAt).toLocaleDateString()}`}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-[11px]">
                      {s.githubUrl && (
                        <a
                          href={s.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg border border-[var(--border)] font-semibold hover:bg-[var(--card)] inline-flex items-center gap-1"
                        >
                          <Code2 className="w-3 h-3" /> GitHub
                        </a>
                      )}
                      {s.demoUrl && (
                        <a
                          href={s.demoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg border border-[var(--border)] font-semibold hover:bg-[var(--card)] inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> Live Demo
                        </a>
                      )}
                      {s.presentationUrl && (
                        <a
                          href={s.presentationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg border border-[var(--border)] font-semibold hover:bg-[var(--card)] inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> Slides
                        </a>
                      )}
                    </div>
                  </div>

                  {s.description && (
                    <p className="text-[12px] text-[var(--text-secondary)]">{s.description}</p>
                  )}
                  {(s.reviewNotes || s.organizerFeedback) && (
                    <div className="p-2.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[11px]">
                      <strong>Review Feedback:</strong> {s.reviewNotes || s.organizerFeedback}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[12px] text-[var(--text-secondary)]">No project submissions linked to this user.</div>
          )}
        </div>

        {/* Peer & Teammate Reviews */}
        <div className="grid md:grid-cols-2 gap-4 pt-2 border-t border-[var(--border)]">
          <div>
            <div className="text-[12px] font-bold mb-2">
              Reviews Received ({(projects.reviewsReceived || []).length})
            </div>
            {(projects.reviewsReceived || []).length ? (
              <div className="space-y-2">
                {projects.reviewsReceived.map((r) => (
                  <div key={r._id} className="p-3 rounded-xl border border-[var(--border)] text-[12px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">From {r.reviewerName}</span>
                      <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-500" /> {r.rating}/5
                      </span>
                    </div>
                    {r.comment && <p className="text-[var(--text-secondary)]">{r.comment}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[12px] text-[var(--text-secondary)]">No reviews received yet.</div>
            )}
          </div>

          <div>
            <div className="text-[12px] font-bold mb-2">
              Reviews Given ({(projects.reviewsGiven || []).length})
            </div>
            {(projects.reviewsGiven || []).length ? (
              <div className="space-y-2">
                {projects.reviewsGiven.map((r) => (
                  <div key={r._id} className="p-3 rounded-xl border border-[var(--border)] text-[12px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">For {r.revieweeName}</span>
                      <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-500" /> {r.rating}/5
                      </span>
                    </div>
                    {r.comment && <p className="text-[var(--text-secondary)]">{r.comment}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[12px] text-[var(--text-secondary)]">No reviews given yet.</div>
            )}
          </div>
        </div>
      </Card>

      {/* SECTION 8: Account Information & Administrative Audit Log */}
      <Card className="p-6 space-y-5">
        <div className="border-b border-[var(--border)] pb-3">
          <h2 className="font-extrabold text-[15px] flex items-center gap-2">
            <History className="w-4 h-4 text-[#6C63FF]" /> 8. Account Information & Audit Log
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-[13px]">
          <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]/40">
            <div className="text-[11px] font-bold uppercase text-[var(--text-secondary)] mb-1">Assigned Role</div>
            <select
              value={accountInfo.role}
              disabled={busy === 'role'}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[13px] font-bold capitalize"
            >
              <option value="member">member</option>
              <option value="leader">leader</option>
              <option value="organizer">organizer</option>
              <option value="admin">admin</option>
            </select>
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]/40">
            <div className="text-[11px] font-bold uppercase text-[var(--text-secondary)] mb-1">Account Status</div>
            <div className="flex items-center justify-between gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border capitalize ${
                  ACCOUNT_BADGES[accountInfo.accountStatus || 'active']
                }`}
              >
                {accountInfo.accountStatus || 'active'}
              </span>
              <button
                type="button"
                onClick={() => setStatusOpen(true)}
                className="text-[11px] font-semibold text-[#6C63FF] hover:underline"
              >
                Change
              </button>
            </div>
            {accountInfo.statusReason && (
              <div className="text-[11px] text-[var(--text-secondary)] mt-1.5">{accountInfo.statusReason}</div>
            )}
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]/40">
            <div className="text-[11px] font-bold uppercase text-[var(--text-secondary)] flex items-center gap-1 mb-1">
              <Calendar className="w-3 h-3" /> Registration Date
            </div>
            <div className="font-semibold text-[12px]">{formatDate(accountInfo.createdAt)}</div>
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]/40">
            <div className="text-[11px] font-bold uppercase text-[var(--text-secondary)] mb-1">Last Updated</div>
            <div className="font-semibold text-[12px]">{formatDate(accountInfo.updatedAt)}</div>
          </div>
        </div>

        {/* Audit Trail */}
        <div>
          <div className="text-[12px] font-bold mb-2">Administrative Audit Trail ({auditLogs.length})</div>
          {auditLogs.length ? (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div
                  key={log._id}
                  className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px]"
                >
                  <div>
                    <span className="px-2 py-0.5 rounded-md bg-[#6C63FF]/10 text-[#6C63FF] text-[10px] font-bold uppercase mr-2">
                      {log.action}
                    </span>
                    <span className="font-semibold">{log.details}</span>
                    <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      By {log.actorName} ({log.actorRole})
                    </div>
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)] shrink-0">{formatDate(log.createdAt)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[12px] text-[var(--text-secondary)]">
              No administrative actions recorded for this account yet.
            </div>
          )}
        </div>
      </Card>

      {/* Secure Document Preview Modal */}
      {previewDoc && (
        <Modal
          open={Boolean(previewDoc)}
          onClose={closePreview}
          title={previewDoc.title || 'Document Preview'}
          subtitle={previewDoc.fileName || previewDoc.issuer || 'Protected File'}
          wide={true}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[12px] text-[var(--text-secondary)]">
              <span>{previewDoc.fileName || 'Document'}</span>
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#6C63FF] underline font-semibold inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
                </a>
              )}
            </div>

            <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-black/5 dark:bg-black/40 flex items-center justify-center min-h-[380px]">
              {previewLoading ? (
                <div className="text-[12px] text-[var(--text-secondary)]">Loading authenticated document...</div>
              ) : !previewUrl ? (
                <div className="text-[12px] text-red-500">Unable to load document preview.</div>
              ) : previewDoc.fileName && /\.(jpg|jpeg|png|webp)$/i.test(previewDoc.fileName) ? (
                <img src={previewUrl} alt="Document Preview" className="max-h-[520px] w-auto object-contain mx-auto" />
              ) : (
                <iframe src={previewUrl} title="Document Preview" className="w-full h-[520px]" />
              )}
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" onClick={closePreview}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Certificate Modal */}
      {rejectCert && (
        <Modal
          open={Boolean(rejectCert)}
          onClose={() => setRejectCert(null)}
          title={`Reject Certificate: ${rejectCert.title}`}
          subtitle="Provide a clear rejection reason to the student"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCertAction(rejectCert._id, 'reject', rejectReason);
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-[var(--text-secondary)]">Common Reasons</label>
              <div className="flex flex-wrap gap-1.5">
                {REJECTION_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectReason(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] border text-left transition ${
                      rejectReason === preset
                        ? 'border-red-500 bg-red-500/10 text-red-600 font-semibold'
                        : 'border-[var(--border)] hover:bg-[var(--surface)]'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Rejection Reason">
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className={inputCls}
              />
            </Field>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setRejectCert(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" className="bg-red-600 hover:bg-red-700 text-white" disabled={busy === rejectCert._id}>
                {busy === rejectCert._id ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Account Status Modal */}
      {statusOpen && (
        <Modal
          open={statusOpen}
          onClose={() => setStatusOpen(false)}
          title={`Manage Account Status: ${personalInfo.name}`}
          subtitle={personalInfo.email}
        >
          <form onSubmit={handleStatusSave} className="space-y-4">
            <Field label="Account Status">
              <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} className={inputCls}>
                <option value="active">Active (Full Access)</option>
                <option value="suspended">Suspended (Login Blocked)</option>
                <option value="deactivated">Deactivated (Account Disabled)</option>
              </select>
            </Field>
            <Field label="Reason / Administrative Note">
              <textarea
                rows={3}
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Reason for status update (stored in audit log)..."
                className={inputCls}
              />
            </Field>
            {nextStatus !== 'active' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[12px] text-amber-700 dark:text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Suspended or deactivated users cannot sign in or access protected APIs.</span>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setStatusOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={busy === 'status'}>
                {busy === 'status' ? 'Saving...' : 'Save Status'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
