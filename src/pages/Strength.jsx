import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { teamApi, errMsg } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from 'recharts';
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Users,
  Compass,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Layers,
  Brain,
  Info,
} from 'lucide-react';

export default function Strength() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState('');
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    teamApi
      .mine()
      .then((list) => {
        setTeams(list || []);
        if (list && list[0]) setTeamId(list[0]._id);
      })
      .catch((e) => setErr(errMsg(e)));
  }, []);

  const load = async (id = teamId) => {
    if (!id) return;
    setLoading(true);
    setErr('');
    try {
      const res = await teamApi.analyze(id);
      setData(res);
    } catch (e) {
      setErr(errMsg(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teamId) load(teamId);
  }, [teamId]); // eslint-disable-line

  const problem = data?.problem;
  const team = data?.team;
  const members = team?.members || [];

  const coverage =
    problem?.requiredSkills?.map((ps) => {
      const levels = members.map(
        (m) =>
          (m.skills || []).find((s) => s.name.toLowerCase() === ps.name.toLowerCase())?.level || 0
      );
      const best = Math.max(0, ...levels);
      return {
        name: ps.name,
        pct: Math.min(100, Math.round((best / (ps.level || 5)) * 100)),
        bestLevel: best,
        requiredLevel: ps.level || 5,
      };
    }) || [];

  const radar = coverage.map((c) => ({ skill: c.name, A: c.pct }));

  const archetypes = data?.archetypeDistribution || {};
  const duplicateSkills = data?.duplicateSkills || [];
  const recommendedArchetypes = data?.recommendedArchetypes || [];
  const missingSkills = data?.missingSkills || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-extrabold flex items-center gap-2">
            <Compass className="w-6 h-6 text-[#6C63FF]" /> Team Strength & Synergy Analyzer
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
            Coverage analytics • Working-style distribution • Skill redundancy & gaps • Strategic team balancing
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {teams.length > 0 && (
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="px-4 py-2.5 rounded-full border border-[var(--border)] bg-[var(--card)] text-[13px] font-medium outline-none focus:border-[#6C63FF]"
            >
              {teams.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.members?.length || 1} members)
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => load()}
            disabled={loading}
            className="flex items-center gap-2 text-[12px] font-semibold px-4 py-2.5 rounded-full bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--surface)] transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#6C63FF]' : ''}`} />
            {loading ? 'Analyzing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {err && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-[13px] text-red-600 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{err}</span>
        </div>
      )}

      {!teams.length && !loading ? (
        <Card className="p-12 text-center text-[13px] text-[var(--text-secondary)] border-dashed">
          <Users className="w-10 h-10 mx-auto text-[var(--text-secondary)]/50 mb-3" />
          <div className="text-[15px] font-bold text-[var(--text-primary)]">No Active Teams Found</div>
          <p className="mt-1 max-w-sm mx-auto">
            You are not part of any team yet. Create or join a team to run comprehensive strength and synergy analysis.
          </p>
        </Card>
      ) : data ? (
        <>
          {/* Top 3 Metric Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 text-center">
              <div className="text-[11px] font-bold tracking-widest uppercase text-[var(--text-secondary)]">
                Project Skill Coverage
              </div>
              <div className="text-[34px] font-extrabold text-[#6C63FF] mt-1">{data.coverage}%</div>
              <div className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                {members.length} members • {problem?.title || 'Active Project'}
              </div>
              <div className="mt-4 h-2 bg-[var(--surface)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#6C63FF] to-[#60A5FA] rounded-full transition-all duration-500"
                  style={{ width: `${data.coverage}%` }}
                />
              </div>
            </Card>

            <Card className="p-6 text-center">
              <div className="text-[11px] font-bold tracking-widest uppercase text-[var(--text-secondary)]">
                Synergy & Balance Score
              </div>
              <div className="text-[34px] font-extrabold mt-1 text-[var(--text-primary)]">
                {data.balance}
                <span className="text-[18px] text-[var(--text-secondary)] font-normal">/10</span>
              </div>
              <div className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                Multi-dimensional rating across {members.length} teammates
              </div>
              <div className="mt-4 flex justify-center gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((step) => (
                  <div
                    key={step}
                    className={`h-2 w-4 rounded-sm transition-all ${
                      step <= data.balance ? 'bg-[#6C63FF]' : 'bg-[var(--surface)]'
                    }`}
                  />
                ))}
              </div>
            </Card>

            <Card className="p-6 text-center">
              <div className="text-[11px] font-bold tracking-widest uppercase text-[var(--text-secondary)]">
                Uncovered Skill Gaps
              </div>
              {missingSkills.length > 0 ? (
                <>
                  <div className="mt-2 text-[15px] font-extrabold text-red-600 capitalize">
                    {missingSkills.join(', ')}
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)] mt-1">
                    {missingSkills.length} critical requirement{missingSkills.length > 1 ? 's' : ''} missing
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-2 text-[16px] font-extrabold text-emerald-600 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Complete Coverage!
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)] mt-1">All required project skills covered</div>
                </>
              )}
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard/matching')}
                  className="w-full text-[12px] py-1.5 flex items-center justify-center gap-1 text-[#6C63FF]"
                >
                  Find Matching Specialists <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Working-Style Chemistry & Duplicate Detection Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Archetype Distribution & Chemistry */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-[14px] flex items-center gap-2">
                  <Brain className="w-4 h-4 text-[#6C63FF]" /> Working-Style Chemistry & Archetypes
                </h3>
                <span className="text-[11px] text-[var(--text-secondary)] font-medium">
                  {members.length} Assessed Members
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(archetypes).length > 0 ? (
                  Object.entries(archetypes).map(([arch, count]) => (
                    <div
                      key={arch}
                      className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between"
                    >
                      <div className="text-[11px] font-semibold text-[var(--text-secondary)] truncate">
                        {arch.replace('The ', '')}
                      </div>
                      <div className="text-[20px] font-extrabold text-[#6C63FF] mt-1">{count}x</div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-[12px] text-[var(--text-secondary)]">
                    No members have taken the Working-Style assessment yet.
                  </div>
                )}
              </div>

              {/* Recommended Next Archetypes */}
              {recommendedArchetypes.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[#6C63FF]/5 border border-[#6C63FF]/20 text-[12px]">
                  <div className="font-bold text-[#6C63FF] flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-4 h-4 text-[#6C63FF]" />
                    Recommended Synergy Complement:
                  </div>
                  <p className="text-[var(--text-secondary)]">
                    To maximize delivery velocity and stability, consider recruiting a{' '}
                    <strong className="text-[var(--text-primary)]">
                      {recommendedArchetypes.join(' or ')}
                    </strong>
                    .
                  </p>
                </div>
              )}
            </Card>

            {/* Duplicate Skill Concentration Alert & Recommendations */}
            <Card className="p-6 space-y-4">
              <h3 className="font-extrabold text-[14px] flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" /> Skill Overlap & Concentration
              </h3>

              {duplicateSkills.length > 0 ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[12px] text-amber-900 space-y-2">
                  <div className="font-bold flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    Duplicate Skill Concentration Detected
                  </div>
                  <p className="text-amber-800 leading-relaxed">
                    Multiple teammates share high proficiency in the same skill:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {duplicateSkills.map((d) => (
                      <span
                        key={d.skill}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-900 font-bold text-[11px]"
                      >
                        {d.skill} ({d.count} teammates)
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-amber-700 pt-1">
                    {missingSkills.length > 0
                      ? 'Recommendation: Prioritize cross-functional specialists who cover your missing project requirements instead of adding more of the same skills.'
                      : 'Skill overlap provides good redundancy for high-load components.'}
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[12px] text-emerald-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Balanced Skill Diversification</div>
                    <p className="text-emerald-700 mt-0.5">
                      No redundant skill clustering found. Every member brings distinct capabilities to the roster.
                    </p>
                  </div>
                </div>
              )}

              {/* Missing Roles Advice */}
              {data.missingRoles?.length > 0 && (
                <div className="pt-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                    Key Roles Recommended for This Team:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.missingRoles.map((role) => (
                      <span
                        key={role}
                        className="px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[11px] font-medium text-[var(--text-primary)]"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Visual Charts: Skill Distribution & Radar Balance */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-extrabold text-[14px]">Required Skills Proficiency Breakdown</h3>
              <p className="text-[12px] text-[var(--text-secondary)] mt-0.5 mb-4">
                Peak proficiency across all active team members compared against requirement
              </p>
              <div className="space-y-3.5">
                {coverage.map((c) => (
                  <div key={c.name} className="space-y-1">
                    <div className="flex justify-between items-center text-[12px]">
                      <span className="font-semibold capitalize">{c.name}</span>
                      <span className="font-bold text-[var(--text-secondary)]">
                        {c.bestLevel}/{c.requiredLevel} ({c.pct}%)
                      </span>
                    </div>
                    <div className="h-2 bg-[var(--surface)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${c.pct}%`,
                          background: c.pct < 50 ? '#ef4444' : c.pct < 80 ? '#f59e0b' : '#6C63FF',
                        }}
                      />
                    </div>
                  </div>
                ))}
                {!coverage.length && (
                  <div className="text-[13px] text-[var(--text-secondary)] py-4 text-center">
                    No required skills defined for this project.
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-extrabold text-[14px]">Radar — 360° Team Skill Balance</h3>
              <p className="text-[12px] text-[var(--text-secondary)] mt-0.5 mb-2">
                Multi-axis representation of team competency distribution
              </p>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radar}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="skill" fontSize={11} stroke="var(--text-secondary)" />
                    <Radar dataKey="A" stroke="#6C63FF" fill="#6C63FF" fillOpacity={0.28} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Detailed Bar Chart */}
          <Card className="p-6">
            <h3 className="font-extrabold text-[14px]">Coverage Comparison Chart</h3>
            <p className="text-[12px] text-[var(--text-secondary)] mt-0.5 mb-4">
              Normalized percentage against maximum required competence
            </p>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coverage}>
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
                  <Bar dataKey="pct" fill="#6C63FF" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
