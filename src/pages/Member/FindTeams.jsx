import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { teamApi, errMsg } from '../../services/api';
import {
  Search,
  UsersRound,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Kanban,
  Check,
  X,
  Target,
  ArrowRight,
  Filter,
  RefreshCw,
} from 'lucide-react';

const CATEGORIES = ['All', 'AI/ML', 'Web3', 'FinTech', 'HealthTech', 'EdTech', 'Cloud/DevOps', 'CyberSecurity'];

export default function FindTeams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [availability, setAvailability] = useState('all'); // 'all' | 'open' | 'joined' | 'requested'
  const [selectedSkill, setSelectedSkill] = useState('');

  // Modal
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [submittingTeamId, setSubmittingTeamId] = useState(null);

  const loadTeams = async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await teamApi.list();
      setTeams(data || []);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  // Compute user skills lowercase set for match highlighting
  const userSkillNames = useMemo(() => {
    const list = user?.skills || [];
    return new Set(list.map((s) => (typeof s === 'string' ? s.toLowerCase() : s.name.toLowerCase())));
  }, [user]);

  // Request to join team
  const handleRequestJoin = async (teamId) => {
    setSubmittingTeamId(teamId);
    setErr('');
    setMsg('');
    try {
      await teamApi.requestJoin(teamId);
      setMsg('Join request submitted successfully! The team leader will review your request.');
      await loadTeams();
      if (selectedTeam && selectedTeam._id === teamId) {
        const updated = teams.find((t) => t._id === teamId);
        if (updated) setSelectedTeam(updated);
      }
      setTimeout(() => setMsg(''), 4000);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setSubmittingTeamId(null);
    }
  };

  // Respond to invitation
  const handleRespondInvite = async (teamId, action) => {
    setSubmittingTeamId(teamId);
    setErr('');
    setMsg('');
    try {
      await teamApi.respond(teamId, user._id, action);
      setMsg(action === 'accept' ? 'Team invitation accepted! You are now a team member.' : 'Invitation declined.');
      await loadTeams();
      setTimeout(() => setMsg(''), 4000);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setSubmittingTeamId(null);
    }
  };

  // Determine membership & invite status for this user
  const getUserTeamState = (team) => {
    const userId = String(user?._id);
    const isLeader = String(team.leader?._id || team.leader) === userId;
    const isMember = (team.members || []).some((m) => String(m._id || m) === userId);
    const invite = (team.invites || []).find((i) => String(i.user?._id || i.user) === userId);

    const maxCapacity = team.problem?.teamSize || 4;
    const currentCount = (team.members || []).length;
    const isFull = currentCount >= maxCapacity;

    if (isLeader) return { status: 'leader', label: 'Team Leader', canRequest: false };
    if (isMember) return { status: 'joined', label: 'Joined', canRequest: false };
    if (invite?.status === 'requested') return { status: 'requested', label: 'Request Pending', canRequest: false };
    if (invite?.status === 'pending') return { status: 'invited', label: 'Invited by Leader', canRequest: false };
    if (invite?.status === 'rejected') return { status: 'rejected', label: 'Declined', canRequest: !isFull };
    if (isFull) return { status: 'full', label: 'Team Full', canRequest: false };
    return { status: 'available', label: 'Request to Join', canRequest: true };
  };

  // Filtered teams
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const q = search.trim().toLowerCase();
      const nameMatch = !q || (t.name || '').toLowerCase().includes(q);
      const problemTitleMatch = !q || (t.problem?.title || '').toLowerCase().includes(q);
      const descMatch = !q || (t.problem?.description || '').toLowerCase().includes(q);
      const skillsMatch =
        !q ||
        (t.missingSkills || []).some((s) => s.toLowerCase().includes(q)) ||
        (t.problem?.requiredSkills || []).some((s) => s.name?.toLowerCase().includes(q));

      const matchesSearch = nameMatch || problemTitleMatch || descMatch || skillsMatch;

      // Category
      const category = t.problem?.category || 'General';
      const matchesCategory = selectedCategory === 'All' || category.toLowerCase() === selectedCategory.toLowerCase();

      // Skill filter
      const matchesSkill =
        !selectedSkill ||
        (t.problem?.requiredSkills || []).some((s) => s.name?.toLowerCase() === selectedSkill.toLowerCase()) ||
        (t.missingSkills || []).some((s) => s.toLowerCase() === selectedSkill.toLowerCase());

      // Availability filter
      const userState = getUserTeamState(t);
      let matchesAvail = true;
      if (availability === 'open') {
        matchesAvail = userState.status === 'available' || userState.status === 'invited';
      } else if (availability === 'joined') {
        matchesAvail = userState.status === 'joined' || userState.status === 'leader';
      } else if (availability === 'requested') {
        matchesAvail = userState.status === 'requested';
      }

      return matchesSearch && matchesCategory && matchesSkill && matchesAvail;
    });
  }, [teams, search, selectedCategory, selectedSkill, availability, user]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Team Discovery
          </div>
          <h1 className="text-[26px] font-extrabold tracking-tight">Find & Join Teams</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Explore hackathon projects looking for your skills, send join requests, and collaborate.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={loadTeams} disabled={loading} className="text-[12px]">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Link
            to="/dashboard/member/quizzes"
            className="px-4 py-2 rounded-xl bg-[var(--text-primary)] text-[var(--background)] text-[12px] font-semibold flex items-center gap-1.5 hover:opacity-90"
          >
            <Target className="w-3.5 h-3.5" /> Boost Skill Profile
          </Link>
        </div>
      </div>

      {/* Global Alerts */}
      {msg && (
        <div className="p-4 rounded-xl bg-emerald-100 border border-emerald-200 text-[13px] text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}
      {err && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-[13px] text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{err}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <Card className="p-5 space-y-4">
        <div className="grid md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-secondary)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by team name, problem challenge, or required skill..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Teams</option>
              <option value="open">Open Positions Only</option>
              <option value="joined">My Joined Teams</option>
              <option value="requested">Pending Requests</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <input
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              placeholder="Filter by skill (e.g. React)..."
              className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[12px]">
          <span className="text-[var(--text-secondary)] font-semibold flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Domain:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full font-medium transition shrink-0 ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
              }`}
            >
              {cat}
            </button>
          ))}
          {(selectedCategory !== 'All' || selectedSkill || search || availability !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('All');
                setAvailability('all');
                setSelectedSkill('');
              }}
              className="text-xs text-indigo-500 hover:underline shrink-0 ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </Card>

      {/* Teams Grid */}
      {loading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-3 border-[var(--border)] border-t-indigo-600 animate-spin" />
          <span className="text-[12px] text-[var(--text-secondary)] font-medium">Discovering active teams...</span>
        </div>
      ) : filteredTeams.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <UsersRound className="w-12 h-12 mx-auto text-[var(--text-secondary)] opacity-50" />
          <h3 className="font-bold text-[16px] mt-3">No teams found matching your filters</h3>
          <p className="text-[12px] text-[var(--text-secondary)] mt-1 max-w-md mx-auto">
            Try adjusting your search query, choosing a different domain category, or clearing the availability filter.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              setSelectedCategory('All');
              setAvailability('all');
              setSelectedSkill('');
            }}
            className="mt-4 text-[12px]"
          >
            Clear All Filters
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTeams.map((t) => {
            const userState = getUserTeamState(t);
            const maxCap = t.problem?.teamSize || 4;
            const currentSize = (t.members || []).length;
            const openSlots = Math.max(0, maxCap - currentSize);
            const isSubmitting = submittingTeamId === t._id;

            return (
              <Card
                key={t._id}
                className="p-5 flex flex-col justify-between hover:border-indigo-500/50 transition-all shadow-xs"
              >
                <div className="space-y-4">
                  {/* Top Bar: Category & Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
                      {t.problem?.category || 'General'}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        userState.status === 'joined'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : userState.status === 'requested'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/10 dark:text-amber-400'
                          : userState.status === 'invited'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-500/10 dark:text-blue-400'
                          : openSlots > 0
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {userState.status === 'joined'
                        ? 'Member'
                        : userState.status === 'requested'
                        ? 'Requested'
                        : userState.status === 'invited'
                        ? 'Invited'
                        : openSlots > 0
                        ? `${openSlots} Slot${openSlots > 1 ? 's' : ''} Open`
                        : 'Full'}
                    </span>
                  </div>

                  {/* Team Name & Challenge Title */}
                  <div>
                    <h3 className="font-extrabold text-[16px] text-[var(--text-primary)] hover:text-indigo-600 transition cursor-pointer" onClick={() => setSelectedTeam(t)}>
                      {t.name}
                    </h3>
                    <div className="text-[12px] text-[var(--text-secondary)] font-medium mt-1 line-clamp-1">
                      {t.problem?.title || 'Open Innovation Project'}
                    </div>
                  </div>

                  {/* Leader Info */}
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                    <Avatar user={t.leader} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-bold truncate">
                        {t.leader?.name || t.leaderName || 'Team Leader'}
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)]">Team Leader</div>
                    </div>
                    {t.leader?.reliabilityScore && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                        {t.leader.reliabilityScore}% Rel.
                      </span>
                    )}
                  </div>

                  {/* Roster & Capacity bar */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] mb-1.5">
                      <span>Team Capacity</span>
                      <span className="font-bold">
                        {currentSize} / {maxCap} Members
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[var(--surface)] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          currentSize >= maxCap ? 'bg-amber-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${Math.min(100, (currentSize / maxCap) * 100)}%` }}
                      />
                    </div>
                    {/* Avatars */}
                    <div className="flex -space-x-1.5 mt-2">
                      {(t.members || []).map((m) => (
                        <Avatar
                          key={m._id || m}
                          user={m}
                          size="xs"
                          className="ring-2 ring-[var(--card)]"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Required & Missing Skills */}
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                      Looking For Skills:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {t.missingSkills && t.missingSkills.length > 0 ? (
                        t.missingSkills.slice(0, 4).map((s) => {
                          const userHas = userSkillNames.has(s.toLowerCase());
                          return (
                            <span
                              key={s}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-medium capitalize flex items-center gap-1 ${
                                userHas
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                  : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)]'
                              }`}
                            >
                              {userHas && <Check className="w-3 h-3 text-emerald-600" />}
                              {s}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[11px] text-[var(--text-secondary)]">All skills covered</span>
                      )}
                      {(t.missingSkills?.length || 0) > 4 && (
                        <span className="text-[10px] text-[var(--text-secondary)] self-center">
                          +{t.missingSkills.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-4 border-t border-[var(--border)] flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTeam(t)}
                    className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    View Details
                  </Button>

                  {userState.status === 'joined' || userState.status === 'leader' ? (
                    <Link
                      to={`/dashboard/teams/${t._id}/workspace`}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold flex items-center gap-1.5 transition"
                    >
                      <Kanban className="w-3.5 h-3.5" /> Workspace
                    </Link>
                  ) : userState.status === 'invited' ? (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="gradient"
                        size="sm"
                        disabled={isSubmitting}
                        onClick={() => handleRespondInvite(t._id, 'accept')}
                        className="text-[11px] px-2.5 py-1"
                      >
                        Accept
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isSubmitting}
                        onClick={() => handleRespondInvite(t._id, 'decline')}
                        className="text-[11px] px-2 text-red-500 hover:bg-red-500/10"
                      >
                        Decline
                      </Button>
                    </div>
                  ) : userState.status === 'requested' ? (
                    <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 text-[11px] font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Request Pending
                    </span>
                  ) : userState.status === 'full' ? (
                    <span className="px-3 py-1.5 rounded-xl bg-[var(--surface)] text-[var(--text-secondary)] text-[11px] font-semibold">
                      Team Full
                    </span>
                  ) : (
                    <Button
                      variant="gradient"
                      size="sm"
                      disabled={isSubmitting}
                      onClick={() => handleRequestJoin(t._id)}
                      className="text-[12px] flex items-center gap-1.5"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5" />
                      )}
                      Request to Join
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Team Details Modal */}
      {selectedTeam && (
        <Modal
          open={Boolean(selectedTeam)}
          onClose={() => setSelectedTeam(null)}
          title={selectedTeam.name}
          subtitle={selectedTeam.problem?.title || 'Team Challenge Details'}
          wide={true}
        >
          <div className="space-y-5 text-[13px]">
            {/* Domain & Difficulty Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 font-bold text-[11px]">
                Domain: {selectedTeam.problem?.category || 'General'}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] font-bold text-[11px]">
                Difficulty: {selectedTeam.problem?.difficulty || 'Medium'}
              </span>
              {selectedTeam.problem?.deadline && (
                <span className="px-2.5 py-1 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] text-[11px]">
                  Submission Deadline: {new Date(selectedTeam.problem.deadline).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Problem Description */}
            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
              <h4 className="font-bold text-[14px] text-[var(--text-primary)] mb-1">Project Challenge</h4>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                {selectedTeam.problem?.description ||
                  'This team is building an innovative solution for the hackathon challenge. Review the required skills below to see if your capabilities complement the roster.'}
              </p>
            </div>

            {/* Team Leader & Team Roster */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-[var(--border)] space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Team Leader
                </div>
                <div className="flex items-center gap-3">
                  <Avatar user={selectedTeam.leader} size="lg" />
                  <div>
                    <div className="font-bold text-[14px]">{selectedTeam.leader?.name || selectedTeam.leaderName}</div>
                    <div className="text-[11px] text-[var(--text-secondary)]">
                      Reliability Score:{' '}
                      <b className="text-emerald-600">
                        {selectedTeam.leader?.reliabilityScore || 80}/100
                      </b>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-[var(--border)] space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  <span>Current Roster ({(selectedTeam.members || []).length} / {selectedTeam.problem?.teamSize || 4})</span>
                </div>
                <div className="space-y-2 max-h-[140px] overflow-y-auto">
                  {(selectedTeam.members || []).map((m) => {
                    const isLeader = String(m._id || m) === String(selectedTeam.leader?._id || selectedTeam.leader);
                    return (
                      <div key={m._id || m} className="flex items-center gap-2 text-[12px]">
                        <Avatar user={m} size="xs" />
                        <span className="font-semibold truncate">{m.name || m._id || m}</span>
                        {isLeader && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                            Leader
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Required and Missing Skills */}
            <div className="p-4 rounded-2xl border border-[var(--border)] space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Required Project Skills
              </div>
              <div className="flex flex-wrap gap-2">
                {(selectedTeam.problem?.requiredSkills || []).map((s) => {
                  const userHas = userSkillNames.has(s.name?.toLowerCase());
                  return (
                    <span
                      key={s.name}
                      className={`px-3 py-1 rounded-full text-[12px] font-medium capitalize flex items-center gap-1.5 ${
                        userHas
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-300'
                          : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)]'
                      }`}
                    >
                      {userHas ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : null}
                      {s.name} (L{s.level || 5})
                      {userHas && <span className="text-[10px] font-bold text-emerald-600">(You have this)</span>}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
              <Button variant="ghost" onClick={() => setSelectedTeam(null)}>
                Close
              </Button>

              {(() => {
                const userState = getUserTeamState(selectedTeam);
                if (userState.status === 'joined' || userState.status === 'leader') {
                  return (
                    <Link
                      to={`/dashboard/teams/${selectedTeam._id}/workspace`}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[13px] flex items-center gap-2"
                    >
                      <Kanban className="w-4 h-4" /> Open Team Workspace
                    </Link>
                  );
                }
                if (userState.status === 'requested') {
                  return (
                    <span className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-600 font-bold flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Request Already Pending
                    </span>
                  );
                }
                if (userState.status === 'invited') {
                  return (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="gradient"
                        onClick={() => {
                          handleRespondInvite(selectedTeam._id, 'accept');
                          setSelectedTeam(null);
                        }}
                      >
                        Accept Invitation
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          handleRespondInvite(selectedTeam._id, 'decline');
                          setSelectedTeam(null);
                        }}
                        className="text-red-500"
                      >
                        Decline
                      </Button>
                    </div>
                  );
                }
                if (userState.status === 'full') {
                  return <span className="text-[var(--text-secondary)] font-semibold">Team at Full Capacity</span>;
                }
                return (
                  <Button
                    variant="gradient"
                    disabled={submittingTeamId === selectedTeam._id}
                    onClick={() => handleRequestJoin(selectedTeam._id)}
                    className="flex items-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4" /> Send Join Request
                  </Button>
                );
              })()}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
