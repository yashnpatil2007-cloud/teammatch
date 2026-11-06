import { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';
import { problemApi, teamApi, errMsg } from '../services/api';
import {
  Brain,
  UserPlus,
  AlertTriangle,
  Star,
  CheckCircle2,
  SlidersHorizontal,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
  Users,
  Compass,
  Layers,
  ChevronRight,
  Info,
  Check,
  Clock,
  Award
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Matching() {
  const [problems, setProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState('');
  const [myTeams, setMyTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [results, setResults] = useState([]);
  const [problemData, setProblemData] = useState(null);
  const [teamAnalysis, setTeamAnalysis] = useState(null);
  const [alternativeCombinations, setAlternativeCombinations] = useState([]);
  const [weightsConfig, setWeightsConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [invitingId, setInvitingId] = useState(null);
  const [invitedMap, setInvitedMap] = useState({});

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [minMatch, setMinMatch] = useState(0);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [archetypeFilter, setArchetypeFilter] = useState('all');

  // Breakdown Modal State
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    problemApi
      .list()
      .then((r) => {
        setProblems(r);
        if (r && r[0]) setSelectedProblem(r[0]._id);
      })
      .catch((e) => setErr(errMsg(e)));

    teamApi
      .mine()
      .then((r) => {
        setMyTeams(r || []);
        if (r && r[0]) setSelectedTeam(r[0]._id);
      })
      .catch(() => {});
  }, []);

  const runMatching = async () => {
    if (!selectedProblem) return;
    setLoading(true);
    setErr('');
    try {
      const data = await teamApi.match({
        problemId: selectedProblem,
        teamId: selectedTeam || undefined,
        minMatch: minMatch > 0 ? minMatch : undefined,
        onlyVerified: onlyVerified ? 'true' : undefined,
      });

      setResults(data.recommendations || []);
      setProblemData(data.problem || null);
      setTeamAnalysis(data.teamAnalysis || null);
      setAlternativeCombinations(data.alternativeCombinations || []);
      setWeightsConfig(data.weightsConfig || null);
    } catch (e) {
      setErr(errMsg(e));
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProblem) {
      runMatching();
    }
  }, [selectedProblem, selectedTeam, minMatch, onlyVerified]);

  const handleInvite = async (candidateUser) => {
    setMsg('');
    setErr('');
    if (!selectedTeam) {
      setErr('Please select a team in the context selector to send invitations.');
      return;
    }
    setInvitingId(candidateUser._id);
    try {
      const data = await teamApi.invite(selectedTeam, candidateUser._id);
      setInvitedMap((prev) => ({ ...prev, [candidateUser._id]: true }));
      setMsg(`Team invitation successfully sent to ${candidateUser.name}!`);
      setTimeout(() => setMsg(''), 4500);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setInvitingId(null);
    }
  };

  const openBreakdown = (candidate) => {
    setSelectedCandidate(candidate);
    setModalOpen(true);
  };

  // Filtered Results
  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const u = r.user;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = u.name.toLowerCase().includes(query);
        const skillMatch = (u.skills || []).some((s) => s.name.toLowerCase().includes(query));
        if (!nameMatch && !skillMatch) return false;
      }
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (
        archetypeFilter !== 'all' &&
        u.personality?.archetype !== archetypeFilter
      ) {
        return false;
      }
      return true;
    });
  }, [results, searchQuery, roleFilter, archetypeFilter]);

  const chartData = filteredResults.slice(0, 6).map((r) => ({
    name: r.user.name.split(' ')[0],
    match: r.compositeScore || r.match,
  }));

  const getConfidenceStyle = (confidence) => {
    if (confidence === 'High Confidence') {
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    }
    if (confidence === 'Moderate Confidence') {
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    }
    return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
  };

  const uniqueArchetypes = useMemo(() => {
    const set = new Set();
    results.forEach((r) => {
      if (r.user.personality?.archetype) set.add(r.user.personality.archetype);
    });
    return Array.from(set);
  }, [results]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-extrabold flex items-center gap-2">
            <Brain className="w-6 h-6 text-[#6C63FF]" />
            AI Compatibility & Teammate Discovery 2.0
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
            Multi-dimensional matching • Technical gaps & synergy • Personality chemistry • Explainable recommendations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="gradient"
            onClick={runMatching}
            disabled={loading}
            className="flex items-center gap-2 shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'Evaluating Compatibility...' : 'Refresh Matches'}
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {err && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-[13px] text-red-600 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{err}</span>
        </div>
      )}
      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[13px] text-emerald-700 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span className="font-medium">{msg}</span>
        </div>
      )}

      {/* Problem & Context Selection Card */}
      <Card className="p-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold tracking-wider uppercase text-[var(--text-secondary)] mb-1.5">
              Target Problem Statement
            </label>
            <select
              value={selectedProblem}
              onChange={(e) => setSelectedProblem(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[13px] font-medium outline-none focus:border-[#6C63FF]"
            >
              {problems.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title} — [{p.category}]
                </option>
              ))}
            </select>
            {problemData && (
              <div className="mt-2 text-[12px] text-[var(--text-secondary)] flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[var(--surface)] text-[11px] font-semibold">
                  Team Size: {problemData.teamSize || 4}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[var(--surface)] text-[11px] font-semibold">
                  Required: {problemData.requiredSkills?.map((s) => s.name).join(', ') || 'None'}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold tracking-wider uppercase text-[var(--text-secondary)] mb-1.5">
              Team Context for Gap Closing (Optional)
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[13px] font-medium outline-none focus:border-[#6C63FF]"
            >
              <option value="">No Team Context (General Candidate Discovery)</option>
              {myTeams.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.members?.length || 1} members)
                </option>
              ))}
            </select>
            <p className="mt-2 text-[11px] text-[var(--text-secondary)]">
              When a team is selected, candidates who satisfy your team's missing skill gaps receive top priority.
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-6 pt-5 border-t border-[var(--border)] grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search by name or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[12px] outline-none focus:border-[#6C63FF]"
            />
          </div>

          <div>
            <select
              value={archetypeFilter}
              onChange={(e) => setArchetypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[12px] outline-none focus:border-[#6C63FF]"
            >
              <option value="all">All Working-Styles / Archetypes</option>
              {uniqueArchetypes.map((arch) => (
                <option key={arch} value={arch}>
                  {arch}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={minMatch}
              onChange={(e) => setMinMatch(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[12px] outline-none focus:border-[#6C63FF]"
            >
              <option value={0}>All Compatibility Levels</option>
              <option value={60}>60%+ Compatibility</option>
              <option value={75}>75%+ Strong Compatibility</option>
              <option value={85}>85%+ Elite Synergy</option>
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)]">
            <input
              type="checkbox"
              id="onlyVerified"
              checked={onlyVerified}
              onChange={(e) => setOnlyVerified(e.target.checked)}
              className="rounded accent-[#6C63FF] w-4 h-4 cursor-pointer"
            />
            <label htmlFor="onlyVerified" className="text-[12px] font-medium cursor-pointer select-none">
              Only Verified Skills
            </label>
          </div>
        </div>
      </Card>

      {/* Main Layout: Results & Insights */}
      <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-6">
        {/* Candidates Recommendations List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-bold text-[var(--text-secondary)]">
              Showing {filteredResults.length} Candidate Recommendations
            </span>
            {weightsConfig && (
              <span className="text-[11px] text-[var(--text-secondary)] hidden sm:inline">
                Weights: Tech (30%) • Gaps (20%) • Style (20%) • Aptitude (15%)
              </span>
            )}
          </div>

          {filteredResults.length === 0 ? (
            <Card className="p-12 text-center text-[var(--text-secondary)] border-dashed">
              <Brain className="w-10 h-10 mx-auto text-[var(--text-secondary)]/50 mb-3" />
              <div className="text-[15px] font-bold text-[var(--text-primary)]">No matching candidates found</div>
              <p className="text-[12px] mt-1 max-w-sm mx-auto">
                Try relaxing your filter threshold or removing specific constraints to see more candidates.
              </p>
            </Card>
          ) : (
            filteredResults.map((r) => {
              const u = r.user;
              const isInvited = invitedMap[u._id];
              const isInviting = invitingId === u._id;
              const composite = r.compositeScore || r.match;

              return (
                <Card
                  key={u._id}
                  className="p-5 hover:shadow-md transition-all duration-200 border border-[var(--border)] hover:border-[#6C63FF]/30 relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* User Identity */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <Avatar user={u} size="lg" className="rounded-2xl" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[15px] font-extrabold truncate">{u.name}</h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getConfidenceStyle(
                              r.confidence
                            )}`}
                          >
                            {r.confidence}
                          </span>
                          {u.personality?.archetype && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]">
                              {u.personality.archetype}
                            </span>
                          )}
                        </div>

                        {/* Skills preview */}
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {(u.skills || []).slice(0, 4).map((s, idx) => (
                            <span
                              key={idx}
                              className={`text-[11px] px-2 py-0.5 rounded-md font-medium flex items-center gap-1 ${
                                s.badge === 'Certified' || s.verifiedScore >= 60
                                  ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                                  : 'bg-[var(--surface)] text-[var(--text-secondary)]'
                              }`}
                            >
                              {s.name}
                              {s.badge === 'Certified' && <ShieldCheck className="w-3 h-3 text-emerald-600" />}
                            </span>
                          ))}
                          {(u.skills || []).length > 4 && (
                            <span className="text-[10px] text-[var(--text-secondary)] self-center">
                              +{(u.skills || []).length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Compatibility Score & Action */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border)]">
                      <div className="text-left sm:text-right">
                        <div className="text-[22px] font-extrabold text-[#6C63FF] leading-none">
                          {composite}%
                        </div>
                        <div className="text-[10px] font-semibold tracking-wider uppercase text-[var(--text-secondary)] mt-0.5">
                          Compatibility
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openBreakdown(r)}
                          className="px-3 py-1.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface)] text-[12px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          Breakdown
                        </button>
                        <button
                          onClick={() => handleInvite(u)}
                          disabled={isInvited || isInviting}
                          className={`px-4 py-1.5 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 transition-all ${
                            isInvited
                              ? 'bg-emerald-500/20 text-emerald-700 cursor-default'
                              : 'bg-[var(--text-primary)] text-[var(--background)] hover:opacity-90 active:scale-95'
                          }`}
                        >
                          {isInvited ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" /> Invited
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5" /> {isInviting ? 'Sending...' : 'Invite'}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Highlights Bar: Gaps Closed & Synergy */}
                  {(r.gapsClosed?.length > 0 || r.duplicateSkills?.length > 0 || r.isProvisional) && (
                    <div className="mt-3 pt-3 border-t border-[var(--border)] flex flex-wrap items-center gap-2 text-[11px]">
                      {r.gapsClosed?.length > 0 && (
                        <div className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          <span>Fills Team Gap: {r.gapsClosed.join(', ')}</span>
                        </div>
                      )}
                      {r.duplicateSkills?.length > 0 && (
                        <div className="text-amber-700 font-medium bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                          Skill Overlap: {r.duplicateSkills.join(', ')}
                        </div>
                      )}
                      {r.isProvisional && (
                        <div className="text-indigo-700 font-medium bg-indigo-500/10 px-2 py-0.5 rounded-md">
                          Provisional: {r.missingAssessments?.join(', ')} pending
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explainable AI Rationale */}
                  {r.aiExplanation && (
                    <div className="mt-3 p-2.5 rounded-xl bg-[var(--surface)] text-[12px] text-[var(--text-secondary)] flex items-start gap-2 border border-[var(--border)]">
                      <Brain className="w-4 h-4 text-[#6C63FF] shrink-0 mt-0.5" />
                      <span className="leading-relaxed">
                        <strong className="text-[var(--text-primary)] font-semibold">AI Match Rationale: </strong>
                        {r.aiExplanation}
                      </span>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>

        {/* Right Sidebar: Analytics & Gap Insights */}
        <div className="space-y-4">
          <Card className="p-5">
            <h4 className="font-extrabold text-[13px] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#6C63FF]" /> Top Matches Comparison
            </h4>
            <div className="h-[180px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} />
                  <YAxis fontSize={11} domain={[0, 100]} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="match" fill="#6C63FF" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Missing Skills Card */}
          <Card className="p-5 border-amber-500/20 bg-amber-500/5">
            <h4 className="font-bold text-[13px] flex items-center gap-2 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Project Requirement Analysis
            </h4>
            <div className="mt-3 text-[12px] text-amber-950 space-y-2">
              <div>
                <span className="font-semibold text-amber-800">Required Skills: </span>
                <span>{problemData?.requiredSkills?.map((s) => s.name).join(', ') || 'None specified'}</span>
              </div>
              {teamAnalysis && (
                <>
                  <div>
                    <span className="font-semibold text-amber-800">Current Team Coverage: </span>
                    <span className="font-bold text-[#6C63FF]">{teamAnalysis.coverage}%</span>
                  </div>
                  {teamAnalysis.missingSkills?.length > 0 ? (
                    <div>
                      <span className="font-semibold text-red-700">Missing from Team: </span>
                      <span className="font-bold text-red-600">{teamAnalysis.missingSkills.join(', ')}</span>
                    </div>
                  ) : (
                    <div className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> All required skills covered!
                    </div>
                  )}
                  {teamAnalysis.duplicateSkills?.length > 0 && (
                    <div className="text-[11px] text-amber-800">
                      High Skill Overlap: {teamAnalysis.duplicateSkills.map((d) => `${d.skill} (${d.count}x)`).join(', ')}
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* Transparent Scoring Rationale Card */}
          <Card className="p-5">
            <h4 className="font-bold text-[13px] flex items-center gap-2 mb-3">
              <Compass className="w-4 h-4 text-[#6C63FF]" /> Scoring Model Weights
            </h4>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)]">Technical Skill Fit</span>
                <span className="font-bold">30%</span>
              </div>
              <div className="w-full bg-[var(--surface)] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#6C63FF] h-full" style={{ width: '30%' }} />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-[var(--text-secondary)]">Team Gap Closing Synergy</span>
                <span className="font-bold">20%</span>
              </div>
              <div className="w-full bg-[var(--surface)] h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: '20%' }} />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-[var(--text-secondary)]">Working-Style & Chemistry</span>
                <span className="font-bold">20%</span>
              </div>
              <div className="w-full bg-[var(--surface)] h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full" style={{ width: '20%' }} />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-[var(--text-secondary)]">Aptitude & Problem Solving</span>
                <span className="font-bold">15%</span>
              </div>
              <div className="w-full bg-[var(--surface)] h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full" style={{ width: '15%' }} />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-[var(--text-secondary)]">Reliability & Availability</span>
                <span className="font-bold">15%</span>
              </div>
              <div className="w-full bg-[var(--surface)] h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: '15%' }} />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Alternative Strategic Team Combinations Section */}
      {alternativeCombinations.length > 0 && (
        <div className="mt-10 space-y-4">
          <div>
            <h2 className="text-[18px] font-extrabold flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#6C63FF]" /> Alternative Strategic Team Formations
            </h2>
            <p className="text-[12px] text-[var(--text-secondary)]">
              AI-generated optimal combinations tailored for different execution strategies.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {alternativeCombinations.map((combo) => (
              <Card
                key={combo.id}
                className="p-5 flex flex-col justify-between border border-[var(--border)] hover:border-[#6C63FF]/40 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-[14px] text-[var(--text-primary)]">{combo.strategyName}</h3>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-1">{combo.tagline}</p>

                  <div className="mt-4 flex items-center gap-4 p-3 rounded-xl bg-[var(--surface)]">
                    <div>
                      <div className="text-[18px] font-extrabold text-[#6C63FF]">{combo.coverage}%</div>
                      <div className="text-[10px] text-[var(--text-secondary)] font-semibold uppercase">Coverage</div>
                    </div>
                    <div className="h-8 w-px bg-[var(--border)]" />
                    <div>
                      <div className="text-[18px] font-extrabold text-[var(--text-primary)]">
                        {combo.balanceScore}
                        <span className="text-[12px] text-[var(--text-secondary)]">/10</span>
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)] font-semibold uppercase">Balance</div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Suggested Roster ({combo.members?.length} members):
                    </div>
                    {combo.members?.map((m) => (
                      <div key={m._id} className="flex items-center gap-2 text-[12px]">
                        <Avatar user={m} size="xs" />
                        <span className="font-medium truncate">{m.name}</span>
                        {m.personality?.archetype && (
                          <span className="text-[10px] text-[var(--text-secondary)] truncate">
                            • {m.personality.archetype.replace('The ', '')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[var(--border)] text-[11px] text-[var(--text-secondary)]">
                  {combo.missingSkills?.length > 0 ? (
                    <span className="text-amber-700">Remaining gaps: {combo.missingSkills.join(', ')}</span>
                  ) : (
                    <span className="text-emerald-700 font-semibold">Complete skill coverage 🎉</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Comprehensive Breakdown Modal */}
      {selectedCandidate && (
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Explainable Compatibility Breakdown"
          subtitle={`Multi-Factor Assessment for ${selectedCandidate.user.name}`}
          wide
        >
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            {/* Candidate Summary Card */}
            <div className="p-4 rounded-2xl bg-[var(--surface)] flex flex-wrap items-center justify-between gap-4 border border-[var(--border)]">
              <div className="flex items-center gap-3">
                <Avatar user={selectedCandidate.user} size="lg" className="rounded-2xl" />
                <div>
                  <h4 className="font-extrabold text-[15px]">{selectedCandidate.user.name}</h4>
                  <div className="text-[12px] text-[var(--text-secondary)]">
                    {selectedCandidate.user.role} • {selectedCandidate.breakdown?.workingStyle?.archetype || 'Unclassified'}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[28px] font-extrabold text-[#6C63FF] leading-none">
                  {selectedCandidate.compositeScore || selectedCandidate.match}%
                </div>
                <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
                  {selectedCandidate.confidence}
                </div>
              </div>
            </div>

            {/* AI Explanation Callout */}
            {selectedCandidate.aiExplanation && (
              <div className="p-3.5 rounded-xl bg-[#6C63FF]/5 border border-[#6C63FF]/20 text-[12px] text-[var(--text-primary)] flex items-start gap-2.5">
                <Brain className="w-4 h-4 text-[#6C63FF] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#6C63FF]">Decision Intelligence Rationale: </span>
                  {selectedCandidate.aiExplanation}
                </div>
              </div>
            )}

            {/* 6 Dimension Breakdown Bars */}
            <div className="space-y-4">
              <h5 className="text-[13px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Compatibility Factor Breakdown
              </h5>

              {/* 1. Technical */}
              <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-2">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="font-bold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                    1. Technical Skill Alignment (Weight: {selectedCandidate.breakdown?.technical?.weight})
                  </span>
                  <span className="font-extrabold text-blue-600">
                    {selectedCandidate.breakdown?.technical?.score}%
                  </span>
                </div>
                <div className="w-full bg-[var(--surface)] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${selectedCandidate.breakdown?.technical?.score}%` }}
                  />
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] flex flex-wrap gap-2 pt-1">
                  <span>Matched: {selectedCandidate.breakdown?.technical?.matchedSkills?.map((s) => s.name).join(', ') || 'None'}</span>
                  {selectedCandidate.breakdown?.technical?.missingSkills?.length > 0 && (
                    <span className="text-red-500">
                      • Missing: {selectedCandidate.breakdown?.technical?.missingSkills?.join(', ')}
                    </span>
                  )}
                </div>
              </div>

              {/* 2. Gap Coverage */}
              <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-2">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    2. Team Gap Closing Synergy (Weight: {selectedCandidate.breakdown?.gapCoverage?.weight})
                  </span>
                  <span className="font-extrabold text-emerald-600">
                    {selectedCandidate.breakdown?.gapCoverage?.score}%
                  </span>
                </div>
                <div className="w-full bg-[var(--surface)] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${selectedCandidate.breakdown?.gapCoverage?.score}%` }}
                  />
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] pt-1">
                  {selectedCandidate.breakdown?.gapCoverage?.gapsClosed?.length > 0 ? (
                    <span className="text-emerald-700 font-semibold">
                      Fills critical missing team skills: {selectedCandidate.breakdown.gapCoverage.gapsClosed.join(', ')}
                    </span>
                  ) : (
                    <span>Candidate adds depth without closing unique missing skills.</span>
                  )}
                </div>
              </div>

              {/* 3. Working Style */}
              <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-2">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="font-bold flex items-center gap-2">
                    <Compass className="w-4 h-4 text-purple-500" />
                    3. Working-Style & Chemistry (Weight: {selectedCandidate.breakdown?.workingStyle?.weight})
                  </span>
                  <span className="font-extrabold text-purple-600">
                    {selectedCandidate.breakdown?.workingStyle?.score}%
                  </span>
                </div>
                <div className="w-full bg-[var(--surface)] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full"
                    style={{ width: `${selectedCandidate.breakdown?.workingStyle?.score}%` }}
                  />
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] pt-1">
                  <strong>Archetype: </strong>
                  {selectedCandidate.breakdown?.workingStyle?.archetype} —{' '}
                  {selectedCandidate.breakdown?.workingStyle?.explanation}
                </div>
              </div>

              {/* 4. Aptitude */}
              <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-2">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="font-bold flex items-center gap-2">
                    <Brain className="w-4 h-4 text-indigo-500" />
                    4. Analytical Aptitude (Weight: {selectedCandidate.breakdown?.aptitude?.weight})
                  </span>
                  <span className="font-extrabold text-indigo-600">
                    {selectedCandidate.breakdown?.aptitude?.score}%
                  </span>
                </div>
                <div className="w-full bg-[var(--surface)] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full"
                    style={{ width: `${selectedCandidate.breakdown?.aptitude?.score}%` }}
                  />
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] pt-1">
                  Status: {selectedCandidate.breakdown?.aptitude?.badge} (Score: {selectedCandidate.breakdown?.aptitude?.score}%)
                </div>
              </div>

              {/* 5. Reliability */}
              <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-2">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="font-bold flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    5. Platform Reliability Track Record (Weight: {selectedCandidate.breakdown?.reliability?.weight})
                  </span>
                  <span className="font-extrabold text-amber-600">
                    {selectedCandidate.breakdown?.reliability?.score}%
                  </span>
                </div>
                <div className="w-full bg-[var(--surface)] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${selectedCandidate.breakdown?.reliability?.score}%` }}
                  />
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] pt-1">
                  Reliability Score: {selectedCandidate.breakdown?.reliability?.reliabilityScore}/100 • Peer Rating: {selectedCandidate.breakdown?.reliability?.averageRating}★ ({selectedCandidate.breakdown?.reliability?.totalReviews} reviews)
                </div>
              </div>
            </div>

            {/* Incomplete Assessment Handling Callout */}
            {selectedCandidate.isProvisional && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[12px] text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-600" />
                  Provisional Compatibility Rating
                </div>
                <p>
                  This candidate has pending assessments: <strong>{selectedCandidate.missingAssessments?.join(', ')}</strong>.
                  Our algorithm applied standard non-penalizing baseline values. Once completed, scores will automatically update.
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
