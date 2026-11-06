import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal, Field, inputCls } from '../../components/ui/Modal';
import { userApi, errMsg, resolveFileUrl } from '../../services/api';
import {
  Award,
  Check,
  X,
  ExternalLink,
  Eye,
  Clock,
  AlertTriangle,
  Search,
  CheckCircle2,
  FileText,
  Building,
  Calendar,
  Key,
} from 'lucide-react';

const STATUS_CONFIG = {
  pending: {
    label: 'Pending Review',
    badge: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
    icon: Clock,
  },
  under_review: {
    label: 'Under Review',
    badge: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30',
    icon: AlertTriangle,
  },
  verified: {
    label: 'Verified',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    badge: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30',
    icon: X,
  },
};

const REJECTION_PRESETS = [
  'Document is blurry, illegible, or incomplete',
  'Name on certificate does not match user profile',
  'Credential ID or verification URL is invalid/unverifiable',
  'Certificate is expired or not from an accredited source',
  'Certificate skill does not align with the course content',
];

export default function CertificatesPanel({ certs = [], reload }) {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  // Modals state
  const [previewCert, setPreviewCert] = useState(null);
  const [rejectCert, setRejectCert] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const counts = {
    all: certs.length,
    pending: certs.filter((c) => c.status === 'pending').length,
    under_review: certs.filter((c) => c.status === 'under_review').length,
    verified: certs.filter((c) => c.status === 'verified').length,
    rejected: certs.filter((c) => c.status === 'rejected').length,
  };

  const filteredCerts = certs.filter((c) => {
    const matchesFilter = filter === 'all' || c.status === filter;
    if (!matchesFilter) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.issuer && c.issuer.toLowerCase().includes(q)) ||
      (c.skill && c.skill.toLowerCase().includes(q)) ||
      (c.user?.name && c.user.name.toLowerCase().includes(q)) ||
      (c.user?.email && c.user.email.toLowerCase().includes(q))
    );
  });

  const review = async (certId, action, reason = '') => {
    setErr('');
    setBusy(certId);
    try {
      await userApi.verifyCertificate(certId, action, reason);
      await reload();
      setMsg(
        action === 'verify'
          ? 'Certificate verified and badge awarded!'
          : action === 'under_review'
          ? 'Certificate marked as Under Review.'
          : 'Certificate rejected.'
      );
      setTimeout(() => setMsg(''), 3000);
      if (rejectCert) {
        setRejectCert(null);
        setRejectReason('');
      }
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy('');
    }
  };

  const openReject = (cert) => {
    setRejectCert(cert);
    setRejectReason(REJECTION_PRESETS[0]);
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!rejectCert) return;
    review(rejectCert._id, 'reject', rejectReason);
  };

  return (
    <div className="space-y-6">
      {/* Header card with statistics */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-[18px] flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-500" />
              Certificate Verification Management
            </h3>
            <p className="text-[12px] text-[var(--text-secondary)] mt-1">
              Review student-submitted credentials, inspect attached documents, and assign verified skill badges.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-[var(--text-secondary)]">
              {counts.pending} pending action
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-[var(--border)] pb-3">
          {[
            { key: 'all', label: 'All Submissions', count: counts.all },
            { key: 'pending', label: 'Pending', count: counts.pending },
            { key: 'under_review', label: 'Under Review', count: counts.under_review },
            { key: 'verified', label: 'Verified', count: counts.verified },
            { key: 'rejected', label: 'Rejected', count: counts.rejected },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all flex items-center gap-1.5 ${
                filter === tab.key
                  ? 'bg-[var(--text-primary)] text-[var(--background)] shadow-sm'
                  : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  filter === tab.key ? 'bg-white/20 text-white' : 'bg-[var(--border)]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--text-secondary)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by student name, email, certificate title, issuer or skill..."
            className={`${inputCls} pl-9 text-[12px]`}
          />
        </div>
      </Card>

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

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredCerts.map((c) => {
          const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
          const StatusIcon = cfg.icon;
          const docUrl = resolveFileUrl(c.fileUrl || c.url);
          const isPdf = (c.fileName && c.fileName.toLowerCase().endsWith('.pdf')) || (c.fileMimeType && c.fileMimeType.includes('pdf')) || (c.url && c.url.toLowerCase().endsWith('.pdf'));

          return (
            <Card key={c._id} className="p-5 border border-[var(--border)] transition hover:border-[var(--text-secondary)]/40">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* User & Cert Details */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <img
                    src={c.user?.avatar || 'https://i.pravatar.cc/100?img=12'}
                    alt=""
                    className="w-12 h-12 rounded-2xl object-cover border border-[var(--border)] shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-[15px] truncate">{c.title}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${cfg.badge}`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                      {c.skill && (
                        <span className="px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[11px] font-semibold text-[var(--accent)] capitalize">
                          Skill: {c.skill}
                        </span>
                      )}
                    </div>

                    <div className="text-[12px] text-[var(--text-secondary)] flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>Submitted by: <strong className="text-[var(--text-primary)]">{c.user?.name || 'Unknown'}</strong> ({c.user?.email})</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Building className="w-3 h-3" /> {c.issuer || 'Self-uploaded'}</span>
                      {c.issueDate && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(c.issueDate).toLocaleDateString()}</span>
                        </>
                      )}
                      {c.credentialId && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Key className="w-3 h-3" /> ID: {c.credentialId}</span>
                        </>
                      )}
                    </div>

                    {/* Metadata & Rejection notes */}
                    <div className="pt-1 flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-secondary)]">
                      {c.submittedAt && (
                        <span>Submitted on {new Date(c.submittedAt).toLocaleString()}</span>
                      )}
                      {c.reviewedAt && (
                        <span>• Reviewed on {new Date(c.reviewedAt).toLocaleString()}</span>
                      )}
                      {c.rejectionReason && (
                        <span className="text-red-500 font-medium">
                          Reason: &ldquo;{c.rejectionReason}&rdquo;
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* Document preview button */}
                  {docUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewCert(c)}
                      className="text-[12px] flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-500" />
                      Preview Doc
                    </Button>
                  )}

                  {/* External verification URL link if provided */}
                  {c.verificationUrl && (
                    <a
                      href={c.verificationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl border border-[var(--border)] text-[12px] font-semibold text-[var(--accent)] hover:bg-[var(--surface)] flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Verify Link
                    </a>
                  )}

                  {/* Actions for Pending & Under Review */}
                  {c.status !== 'verified' && (
                    <Button
                      variant="gradient"
                      size="sm"
                      onClick={() => review(c._id, 'verify')}
                      disabled={busy === c._id}
                      className="text-[12px] bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {busy === c._id ? 'Verifying...' : 'Approve'}
                    </Button>
                  )}

                  {c.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => review(c._id, 'under_review')}
                      disabled={busy === c._id}
                      className="text-[12px] text-blue-600 border border-blue-200 dark:border-blue-900 flex items-center gap-1"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Under Review
                    </Button>
                  )}

                  {c.status !== 'rejected' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openReject(c)}
                      disabled={busy === c._id}
                      className="text-[12px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

        {!filteredCerts.length && (
          <div className="py-12 text-center text-[13px] text-[var(--text-secondary)] border border-dashed border-[var(--border)] rounded-2xl">
            No certificates match the selected filter or query.
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {previewCert && (
        <Modal
          open={Boolean(previewCert)}
          onClose={() => setPreviewCert(null)}
          title={`Document Preview: ${previewCert.title}`}
          subtitle={`Submitted by ${previewCert.user?.name} (${previewCert.issuer || 'Self-uploaded'})`}
          wide={true}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[12px] text-[var(--text-secondary)]">
              <span>{previewCert.fileName || 'Online document / URL'}</span>
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
                  alt="Certificate Preview"
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

      {/* Rejection Modal */}
      {rejectCert && (
        <Modal
          open={Boolean(rejectCert)}
          onClose={() => setRejectCert(null)}
          title={`Reject Certificate: ${rejectCert.title}`}
          subtitle={`Student: ${rejectCert.user?.name}. Please specify a clear reason so the student can rectify their submission.`}
        >
          <form onSubmit={handleRejectSubmit} className="space-y-4">
            <Field label="Preset Rejection Reasons">
              <div className="space-y-1.5 mt-1">
                {REJECTION_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setRejectReason(p)}
                    className={`w-full text-left p-2.5 rounded-xl border text-[12px] transition ${
                      rejectReason === p
                        ? 'border-[var(--accent)] bg-[var(--accent)]/10 font-semibold'
                        : 'border-[var(--border)] hover:bg-[var(--surface)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Custom Rejection Reason / Note to Student">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                required
                className={inputCls}
                placeholder="Explain why this certificate is being rejected..."
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setRejectCert(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gradient"
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={busy === rejectCert._id}
              >
                {busy === rejectCert._id ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}