import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal, Field, inputCls } from '../../components/ui/Modal';
import { submissionApi, errMsg, resolveFileUrl } from '../../services/api';
import {
  FileCheck,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Star,
  Code2,
  Globe,
  FileText,
  Filter,
  RefreshCw,
  Award
} from 'lucide-react';

export default function SubmissionsReviewPanel() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Review modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    status: 'approved',
    score: 85,
    feedback: '',
    revisionsRequired: '',
  });
  const [savingReview, setSavingReview] = useState(false);

  const loadSubmissions = async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await submissionApi.list();
      setSubmissions(data || []);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const openReviewModal = (sub) => {
    setSelectedSub(sub);
    setReviewForm({
      status: sub.status === 'draft' || sub.status === 'submitted' ? 'approved' : sub.status,
      score: sub.reviews?.[0]?.score || 85,
      feedback: sub.reviews?.[0]?.feedback || '',
      revisionsRequired: sub.reviews?.[0]?.revisionsRequired?.join(', ') || '',
    });
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedSub) return;
    setSavingReview(true);
    setErr('');
    try {
      const revisionsArray = reviewForm.revisionsRequired
        ? reviewForm.revisionsRequired.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      await submissionApi.review(selectedSub._id, {
        status: reviewForm.status,
        score: Number(reviewForm.score),
        feedback: reviewForm.feedback,
        revisionsRequired: revisionsArray,
      });

      setMsg(`Review for "${selectedSub.title}" submitted successfully!`);
      setReviewModalOpen(false);
      loadSubmissions();
      setTimeout(() => setMsg(''), 4000);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setSavingReview(false);
    }
  };

  const filtered = submissions.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = (s.title || '').toLowerCase().includes(q);
      const matchTeam = (s.teamName || '').toLowerCase().includes(q);
      const matchProblem = (s.problemTitle || '').toLowerCase().includes(q);
      if (!matchTitle && !matchTeam && !matchProblem) return false;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
      case 'revisions_requested':
        return 'bg-red-500/10 text-red-600 border border-red-500/20';
      case 'under_review':
        return 'bg-blue-500/10 text-blue-600 border border-blue-500/20';
      case 'draft':
        return 'bg-zinc-500/10 text-zinc-600 border border-zinc-500/20';
      default:
        return 'bg-amber-500/10 text-amber-600 border border-amber-500/20';
    }
  };

  return (
    <Card className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-[18px] flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-[#6C63FF]" /> Project Submissions Review Queue
          </h3>
          <p className="text-[12px] text-[var(--text-secondary)]">
            Evaluate student team deliveries, grade implementations, request revisions, and issue approvals.
          </p>
        </div>
        <button
          onClick={loadSubmissions}
          className="flex items-center gap-2 text-[12px] font-semibold px-3 py-1.5 rounded-full border border-[var(--border)] hover:bg-[var(--surface)] self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#6C63FF]' : ''}`} />
          Refresh
        </button>
      </div>

      {err && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{err}</span>
        </div>
      )}
      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[12px] text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{msg}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="grid sm:grid-cols-2 gap-3 pt-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search by project, team, or problem..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[12px] outline-none focus:border-[#6C63FF]"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[12px] outline-none focus:border-[#6C63FF]"
          >
            <option value="all">All Submission Statuses</option>
            <option value="submitted">Submitted (Pending Review)</option>
            <option value="under_review">Under Review</option>
            <option value="revisions_requested">Revisions Requested</option>
            <option value="approved">Approved</option>
            <option value="draft">Drafts</option>
          </select>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4 pt-2">
        {filtered.map((sub) => (
          <div
            key={sub._id}
            className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3 hover:border-[#6C63FF]/30 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-extrabold text-[15px]">{sub.title}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getStatusBadge(sub.status)}`}>
                    {sub.status}
                  </span>
                </div>
                <div className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                  Team: <strong>{sub.teamName}</strong> • Problem: <strong>{sub.problemTitle}</strong> ({sub.problemCategory})
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="gradient"
                  onClick={() => openReviewModal(sub)}
                  className="text-[12px] py-1.5 px-4 flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Grade & Review
                </Button>
              </div>
            </div>

            <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">
              {sub.description}
            </p>

            {/* Links and Attachments */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px]">
              {sub.githubUrl && (
                <a
                  href={sub.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[#6C63FF] hover:underline font-semibold"
                >
                  <Code2 className="w-3.5 h-3.5" /> Code Repo
                </a>
              )}
              {sub.demoUrl && (
                <a
                  href={sub.demoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-emerald-600 hover:underline font-semibold"
                >
                  <Globe className="w-3.5 h-3.5" /> Live Demo
                </a>
              )}
              {sub.presentationUrl && (
                <a
                  href={sub.presentationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-purple-600 hover:underline font-semibold"
                >
                  <FileText className="w-3.5 h-3.5" /> Slides
                </a>
              )}
              {(sub.attachments || []).map((file, i) => (
                <a
                  key={i}
                  href={resolveFileUrl(file.url)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline"
                >
                  {file.name}
                </a>
              ))}
            </div>

            {/* Review feedback summary if graded */}
            {sub.reviews?.length > 0 && (
              <div className="p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[11px] flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-[var(--text-primary)]">Score: </span>
                  <span className="font-extrabold text-[#6C63FF]">{sub.reviews[0].score}/100</span>
                  <span className="text-[var(--text-secondary)] ml-2">"{sub.reviews[0].feedback}"</span>
                </div>
                <span className="text-[var(--text-secondary)]">Reviewed by {sub.reviews[0].reviewerName}</span>
              </div>
            )}
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="p-10 text-center text-[13px] text-[var(--text-secondary)] border border-dashed rounded-2xl">
            No submissions found matching criteria.
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedSub && (
        <Modal
          open={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          title="Official Evaluation & Feedback"
          subtitle={`Reviewing ${selectedSub.title} by ${selectedSub.teamName}`}
          wide
        >
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Submission Status Decision">
                <select
                  value={reviewForm.status}
                  onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
                  className={inputCls}
                >
                  <option value="approved">Approved 🎉</option>
                  <option value="revisions_requested">Revisions Requested ⚠️</option>
                  <option value="under_review">Under Review 🔍</option>
                </select>
              </Field>

              <Field label="Score (0 to 100)">
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={reviewForm.score}
                  onChange={(e) => setReviewForm({ ...reviewForm, score: e.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Written Feedback & Evaluation Rationales">
              <textarea
                required
                rows={4}
                value={reviewForm.feedback}
                onChange={(e) => setReviewForm({ ...reviewForm, feedback: e.target.value })}
                placeholder="Detail technical strengths, UI polish, edge-case coverage, and recommendations..."
                className={inputCls}
              />
            </Field>

            <Field label="Required Revisions (Comma separated, optional)">
              <input
                value={reviewForm.revisionsRequired}
                onChange={(e) => setReviewForm({ ...reviewForm, revisionsRequired: e.target.value })}
                placeholder="e.g. Fix mobile viewport overflow, Add test coverage report"
                className={inputCls}
              />
            </Field>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
              <Button type="button" variant="ghost" onClick={() => setReviewModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={savingReview}>
                {savingReview ? 'Recording...' : 'Submit Evaluation'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </Card>
  );
}
