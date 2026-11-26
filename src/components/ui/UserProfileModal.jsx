import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Avatar } from './Avatar';
import { userApi, errMsg, resolveFileUrl } from '../../services/api';
import {
  GraduationCap,
  Mail,
  Phone,
  Globe,
  Award,
  Brain,
  Star,
  ShieldCheck,
  Calendar,
  Clock,
  Sparkles,
  ExternalLink,
  BookOpen,
  Code2,
  CheckCircle2
} from 'lucide-react';

const GithubIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedinIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function UserProfileModal({ open, onClose, userId, initialUser = null }) {
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!open || !userId) return;
    let isMounted = true;
    setLoading(true);
    setErr('');

    userApi
      .get(userId)
      .then((data) => {
        if (isMounted) setUser(data);
      })
      .catch((e) => {
        if (isMounted) {
          setErr(errMsg(e));
          if (!user && initialUser) setUser(initialUser);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, userId]);

  if (!open) return null;

  const displayUser = user || initialUser;
  const skills = displayUser?.skills || [];
  const reviews = displayUser?.reviews || [];
  const archetype = displayUser?.personality?.archetype;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={displayUser?.name ? `${displayUser.name}'s Profile` : 'Member Profile'}
      subtitle={displayUser?.college || displayUser?.role ? `${displayUser.role?.toUpperCase() || 'MEMBER'} • ${displayUser.college || 'Verified Student'}` : 'Teammate Information'}
      wide={true}
    >
      {loading && !displayUser ? (
        <div className="py-12 text-center text-[13px] text-[var(--text-secondary)]">
          <div className="w-8 h-8 mx-auto mb-2 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          Loading member profile details...
        </div>
      ) : displayUser ? (
        <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
          {/* Header Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar user={displayUser} size="2xl" className="ring-4 ring-[var(--card)] shadow-md" />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[20px] font-extrabold">{displayUser.name}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white">
                    {displayUser.role || 'Member'}
                  </span>
                  {displayUser.isVerified && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-[var(--text-secondary)] flex flex-wrap items-center gap-3">
                  {displayUser.email && (
                    <a href={`mailto:${displayUser.email}`} className="hover:underline flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                      <Mail className="w-3 h-3" /> {displayUser.email}
                    </a>
                  )}
                  {displayUser.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {displayUser.phone}
                    </span>
                  )}
                </div>
                {(displayUser.college || displayUser.branch) && (
                  <div className="text-[12px] text-[var(--text-secondary)] flex items-center gap-1.5 pt-0.5">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>
                      {displayUser.college}
                      {displayUser.course || displayUser.branch ? ` • ${displayUser.course || ''} ${displayUser.branch || ''}` : ''}
                      {displayUser.year ? ` (${displayUser.year})` : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Social / External Links */}
            <div className="flex flex-wrap items-center gap-2">
              {displayUser.github && (
                <a
                  href={displayUser.github.startsWith('http') ? displayUser.github : `https://${displayUser.github}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface)] text-[12px] font-semibold flex items-center gap-1.5 transition"
                >
                  <GithubIcon className="w-3.5 h-3.5" /> GitHub <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}
              {displayUser.linkedin && (
                <a
                  href={displayUser.linkedin.startsWith('http') ? displayUser.linkedin : `https://${displayUser.linkedin}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface)] text-[12px] font-semibold flex items-center gap-1.5 text-blue-600 transition"
                >
                  <LinkedinIcon className="w-3.5 h-3.5" /> LinkedIn <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}
              {displayUser.portfolio && (
                <a
                  href={displayUser.portfolio.startsWith('http') ? displayUser.portfolio : `https://${displayUser.portfolio}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface)] text-[12px] font-semibold flex items-center gap-1.5 transition"
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-600" /> Portfolio <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}
            </div>
          </div>

          {/* Bio / Summary */}
          {(displayUser.bio || displayUser.about) && (
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">About</div>
              <p className="text-[13px] text-[var(--text-primary)] leading-relaxed">
                {displayUser.bio || displayUser.about}
              </p>
            </div>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center">
              <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Platform Reliability</div>
              <div className="text-[18px] font-black text-emerald-600 mt-0.5">
                {displayUser.reliabilityScore || 75}/100
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center">
              <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Peer Rating</div>
              <div className="text-[18px] font-black text-amber-500 mt-0.5 flex items-center justify-center gap-1">
                <Star className="w-4 h-4 fill-amber-500" /> {displayUser.averageRating || 4.8}
              </div>
              <div className="text-[10px] text-[var(--text-secondary)]">{displayUser.totalReviews || reviews.length || 0} reviews</div>
            </div>
            <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center">
              <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Aptitude Acumen</div>
              <div className="text-[18px] font-black text-indigo-600 mt-0.5">
                {displayUser.aptitudeScore ? `${displayUser.aptitudeScore}%` : 'Assessed'}
              </div>
              {displayUser.aptitudeBadge && (
                <div className="text-[10px] font-bold text-[#6C63FF]">{displayUser.aptitudeBadge} Badge</div>
              )}
            </div>
            <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center">
              <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Availability</div>
              <div className="text-[14px] font-bold text-[var(--text-primary)] mt-1 truncate">
                {displayUser.availability || 'Available'}
              </div>
            </div>
          </div>

          {/* Working-Style Personality Archetype */}
          {archetype && archetype !== 'Unclassified' && (
            <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-1.5">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                  Working-Style Archetype
                </span>
              </div>
              <div className="font-extrabold text-[15px] text-purple-900 dark:text-purple-200">{archetype}</div>
              {displayUser.personality?.summary && (
                <p className="text-[12px] text-[var(--text-secondary)]">{displayUser.personality.summary}</p>
              )}
              {displayUser.personality?.idealComplement && (
                <div className="text-[11px] font-medium text-purple-700 dark:text-purple-400 pt-1">
                  Ideal Complement: <strong>{displayUser.personality.idealComplement}</strong>
                </div>
              )}
            </div>
          )}

          {/* Technical Skills & Badges */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-indigo-600" /> Technical Skills & Badges ({skills.length})
            </div>
            {skills.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {skills.map((s, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[12px] capitalize">{s.name}</div>
                      <div className="text-[10px] text-[var(--text-secondary)]">
                        Level: L{s.level || 5} {s.verifiedScore ? `(${s.verifiedScore} pts)` : ''}
                      </div>
                    </div>
                    {s.badge && (
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        s.badge === 'Platinum'
                          ? 'bg-purple-500/10 text-purple-700 border-purple-500/20'
                          : s.badge === 'Gold'
                          ? 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                          : s.badge === 'Silver'
                          ? 'bg-zinc-500/10 text-zinc-700 border-zinc-500/20'
                          : 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                      }`}>
                        {s.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-[var(--border)] text-center text-[12px] text-[var(--text-secondary)]">
                No technical skills listed yet.
              </div>
            )}
          </div>

          {/* Areas of Interest */}
          {displayUser.interests?.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Interests & Focus Areas</div>
              <div className="flex flex-wrap gap-1.5">
                {displayUser.interests.map((int, i) => (
                  <span key={i} className="px-3 py-1 rounded-full text-[11px] font-medium bg-[var(--surface)] border border-[var(--border)]">
                    {int}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Peer Reviews History */}
          {reviews.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Peer Reviews & Feedback ({reviews.length})
              </div>
              <div className="space-y-2">
                {reviews.map((r, i) => (
                  <div key={i} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[12px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-500 flex items-center gap-1">
                        {'★'.repeat(r.rating || 5)} ({r.rating || 5}/5)
                      </span>
                      <span className="text-[10px] text-[var(--text-secondary)] capitalize">{r.type?.replace('_', ' ') || 'Peer'}</span>
                    </div>
                    {r.comment && <p className="text-[var(--text-primary)] italic">"{r.comment}"</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-8 text-center text-red-500 text-[13px]">
          {err || 'User profile not found.'}
        </div>
      )}
    </Modal>
  );
}
