import { useState, useEffect, useRef } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { assessmentApi, errMsg } from '../../services/api';
import {
  Brain,
  Target,
  Sparkles,
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Flag,
  RotateCcw,
  Check,
  Eye,
  ShieldCheck,
  History,
  Layers,
  ChevronRight,
  Code,
  Terminal,
  Server,
  Cpu,
  Palette,
  Cloud,
  Binary,
  Shield,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

const SKILL_ICONS = {
  react: Code,
  python: Terminal,
  node: Server,
  ml: Cpu,
  ui_ux: Palette,
  devops: Cloud,
  dsa: Binary,
  cybersecurity: Shield,
};

const badgeClass = (b) => {
  switch (b) {
    case 'Platinum':
      return 'bg-gradient-to-r from-zinc-900 to-zinc-700 text-white shadow-sm';
    case 'Gold':
      return 'bg-amber-500 text-white';
    case 'Silver':
      return 'bg-slate-400 text-white';
    case 'Certified':
      return 'bg-indigo-600 text-white';
    case 'Self-Reported':
      return 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300';
    default:
      return 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400';
  }
};

export default function AssessmentCenter() {
  const { user, refresh } = useAuth();
  const [activeTab, setActiveTab] = useState('technical');
  const [overview, setOverview] = useState(null);
  const [technicalSkills, setTechnicalSkills] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  // Active Test State
  const [activeTest, setActiveTest] = useState(null); // { type, title, skill, questions, timeLimitSeconds }
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [questionId]: selectedOptionIndex }
  const [flagged, setFlagged] = useState({}); // { [questionId]: boolean }
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Result Modal
  const [testResult, setTestResult] = useState(null);
  const [reviewResult, setReviewResult] = useState(null);

  const timerRef = useRef(null);

  const loadData = async () => {
    setLoading(true);
    setErr('');
    try {
      const [ov, skills, hist] = await Promise.all([
        assessmentApi.overview(),
        assessmentApi.technicalSkills(),
        assessmentApi.myHistory(),
      ]);
      setOverview(ov);
      setTechnicalSkills(skills);
      setHistory(hist);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Timer countdown hook
  useEffect(() => {
    if (!activeTest || !activeTest.timeLimitSeconds) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [activeTest]); // eslint-disable-line

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Launch Technical Assessment
  const startTechnicalTest = async (skill) => {
    setErr('');
    try {
      const data = await assessmentApi.technicalQuestions(skill);
      setActiveTest({
        type: 'technical',
        title: `${skill.toUpperCase()} Skill Assessment`,
        skill,
        questions: data.questions,
        timeLimitSeconds: data.timeLimitSeconds || 300,
        totalQuestions: data.totalQuestions,
      });
      setTimeLeft(data.timeLimitSeconds || 300);
      setCurrentIdx(0);
      setUserAnswers({});
      setFlagged({});
      setTestResult(null);
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  // Launch Aptitude Assessment
  const startAptitudeTest = async () => {
    setErr('');
    try {
      const data = await assessmentApi.aptitudeQuestions();
      setActiveTest({
        type: 'aptitude',
        title: 'Aptitude & Logical Reasoning Assessment',
        questions: data.questions,
        timeLimitSeconds: data.timeLimitSeconds || 600,
        totalQuestions: data.totalQuestions,
      });
      setTimeLeft(data.timeLimitSeconds || 600);
      setCurrentIdx(0);
      setUserAnswers({});
      setFlagged({});
      setTestResult(null);
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  // Launch Personality Assessment
  const startPersonalityTest = async () => {
    setErr('');
    try {
      const data = await assessmentApi.personalityQuestions();
      setActiveTest({
        type: 'personality',
        title: 'Working-Style & Collaboration Assessment',
        questions: data.questions,
        timeLimitSeconds: 0, // Untimed reflective assessment
        totalQuestions: data.totalQuestions,
      });
      setTimeLeft(0);
      setCurrentIdx(0);
      setUserAnswers({});
      setFlagged({});
      setTestResult(null);
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  // Select Option
  const handleSelectOption = (questionId, optionIdx) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  // Toggle Flag
  const toggleFlag = (questionId) => {
    setFlagged((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  // Auto-submit on timer expiry
  const handleAutoSubmit = () => {
    submitActiveTest(true);
  };

  // Submit Active Test
  const submitActiveTest = async (isTimeout = false) => {
    if (!activeTest) return;
    setSubmitting(true);
    setErr('');

    const formattedAnswers = Object.entries(userAnswers).map(([qId, optIdx]) => ({
      questionId: qId,
      selectedOption: optIdx,
    }));

    try {
      let res;
      if (activeTest.type === 'aptitude') {
        res = await assessmentApi.submitAptitude({
          answers: formattedAnswers,
          timeSpentSeconds: activeTest.timeLimitSeconds - timeLeft,
        });
      } else if (activeTest.type === 'personality') {
        res = await assessmentApi.submitPersonality({
          answers: formattedAnswers,
        });
      } else if (activeTest.type === 'technical') {
        res = await assessmentApi.submitTechnical({
          skill: activeTest.skill,
          answers: formattedAnswers,
          timeSpentSeconds: activeTest.timeLimitSeconds - timeLeft,
        });
      }

      setTestResult({ ...res, assessmentType: activeTest.type });
      setActiveTest(null);
      await refresh();
      await loadData();
      if (isTimeout) {
        setMsg('Time expired! Your assessment was submitted automatically.');
      }
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setSubmitting(false);
    }
  };

  const currentQ = activeTest?.questions[currentIdx];
  const answeredCount = Object.keys(userAnswers).length;
  const isAnswered = (qId) => userAnswers[qId] !== undefined;

  // Filtered History
  const filteredHistory = history.filter((h) => {
    if (historyFilter === 'all') return true;
    return h.assessmentType === historyFilter;
  });

  return (
    <div className="space-y-6">
      {/* Platform Assessment Intelligence Header */}
      {!activeTest && (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-[24px] font-extrabold flex items-center gap-2">
                <Brain className="w-6 h-6 text-indigo-500" />
                Assessment Intelligence & Verification Hub
              </h1>
              <p className="text-[13px] text-[var(--text-secondary)]">
                Objective skill evaluations, timed aptitude testing, and multi-dimensional working-style profiling.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={loadData}>
                <RotateCcw className="w-4 h-4" /> Refresh
              </Button>
            </div>
          </div>

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

          {/* Student Status Summary Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[18px] font-extrabold truncate">
                  {overview?.summary?.verifiedSkillsCount || 0} Skills
                </div>
                <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Verified Skills
                </div>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[18px] font-extrabold truncate">
                  {overview?.summary?.bestAptitudeScore ? `${overview.summary.bestAptitudeScore}%` : 'Not Tested'}
                </div>
                <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Aptitude Score ({overview?.summary?.aptitudeBadge || 'None'})
                </div>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-extrabold truncate">
                  {overview?.summary?.personalityArchetype || 'Not Assessed'}
                </div>
                <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Working-Style Archetype
                </div>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[18px] font-extrabold">
                  {overview?.summary?.reliabilityScore || user?.reliabilityScore || 75}/100
                </div>
                <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Reliability Index
                </div>
              </div>
            </Card>
          </div>

          {/* Module Selector Navigation Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-3">
            {[
              { key: 'technical', label: 'Technical & Domain Skills', icon: Brain },
              { key: 'aptitude', label: 'Aptitude & Logic Reasoning', icon: Target },
              { key: 'personality', label: 'Personality & Working-Style', icon: Sparkles },
              { key: 'history', label: 'My Assessment History', icon: History },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 rounded-xl text-[13px] font-semibold transition flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'bg-[var(--text-primary)] text-[var(--background)] shadow-sm'
                    : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ACTIVE TEST TAKING INTERFACE */}
      {activeTest && (
        <Card className="p-6 border-2 border-indigo-500/40 shadow-xl space-y-6">
          {/* Active Test Top Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 uppercase tracking-wider">
                  {activeTest.type} assessment
                </span>
                {activeTest.timeLimitSeconds > 0 && (
                  <span className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Timed Evaluation
                  </span>
                )}
              </div>
              <h2 className="text-[20px] font-extrabold mt-1">{activeTest.title}</h2>
            </div>

            <div className="flex items-center gap-3">
              {activeTest.timeLimitSeconds > 0 && (
                <div
                  className={`px-4 py-2 rounded-xl font-mono text-[16px] font-extrabold border flex items-center gap-2 ${
                    timeLeft < 120
                      ? 'bg-red-500/10 border-red-500/40 text-red-600 animate-pulse'
                      : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)]'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  {formatTimer(timeLeft)}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (window.confirm('Are you sure you want to exit? Your progress will not be saved.')) {
                    setActiveTest(null);
                  }
                }}
                className="text-[12px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                Exit Test
              </Button>
            </div>
          </div>

          {/* Progress Bar & Question Navigator */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[12px] text-[var(--text-secondary)]">
              <span>
                Question <strong>{currentIdx + 1}</strong> of <strong>{activeTest.totalQuestions}</strong>
              </span>
              <span>
                Answered: <strong>{answeredCount}</strong> / {activeTest.totalQuestions}
              </span>
            </div>
            <div className="h-2 w-full bg-[var(--surface)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / activeTest.totalQuestions) * 100}%` }}
              />
            </div>

            {/* Question bubbles */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {activeTest.questions.map((q, idx) => {
                const ans = isAnswered(q.id);
                const isFlag = flagged[q.id];
                const isCurrent = currentIdx === idx;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-8 h-8 rounded-lg text-[12px] font-bold transition flex items-center justify-center relative ${
                      isCurrent
                        ? 'ring-2 ring-indigo-500 bg-[var(--text-primary)] text-[var(--background)]'
                        : ans
                        ? 'bg-indigo-600 text-white'
                        : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
                    }`}
                  >
                    {idx + 1}
                    {isFlag && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 absolute -top-1 -right-1 ring-1 ring-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Question Box */}
          {currentQ && (
            <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  {currentQ.category?.replace('_', ' ') || currentQ.scenario || `Question ${currentIdx + 1}`}
                  {currentQ.level ? ` • Level ${currentQ.level}` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => toggleFlag(currentQ.id)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition ${
                    flagged[currentQ.id]
                      ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--card)]'
                  }`}
                >
                  <Flag className="w-3 h-3" />
                  {flagged[currentQ.id] ? 'Flagged for Review' : 'Flag Question'}
                </button>
              </div>

              <h3 className="text-[17px] font-bold text-[var(--text-primary)] leading-relaxed">
                {currentQ.q}
              </h3>

              {/* Options */}
              <div className="space-y-2.5 pt-2">
                {currentQ.options.map((opt, optIdx) => {
                  const optText = typeof opt === 'string' ? opt : opt.text;
                  const isSelected = userAnswers[currentQ.id] === optIdx;

                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleSelectOption(currentQ.id, optIdx)}
                      className={`p-4 rounded-xl border-2 transition cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/30 text-[var(--text-primary)] font-semibold'
                          : 'border-[var(--border)] hover:border-indigo-400 bg-[var(--card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-[var(--border)]'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </div>
                      <span className="text-[13px] leading-snug">{optText}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Action Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button
              variant="ghost"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              className="flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </Button>

            <div className="flex items-center gap-2">
              {currentIdx < activeTest.totalQuestions - 1 ? (
                <Button
                  variant="gradient"
                  onClick={() => setCurrentIdx((i) => Math.min(activeTest.totalQuestions - 1, i + 1))}
                  className="flex items-center gap-1.5"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="gradient"
                  onClick={() => submitActiveTest(false)}
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {submitting ? 'Evaluating...' : 'Submit Assessment'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* TAB 1: TECHNICAL & DOMAIN SKILLS */}
      {!activeTest && activeTab === 'technical' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-extrabold text-[16px] flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-500" />
              Technical Skill Quizzes
            </h3>
            <p className="text-[12px] text-[var(--text-secondary)] mt-1">
              Select a domain to verify your technical proficiency. Scores $\ge 60\%$ award skill verification badges and boost your reliability rating.
            </p>

            <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {technicalSkills.map((sk) => {
                const IconComponent = SKILL_ICONS[sk.skill] || Brain;
                return (
                  <div
                    key={sk.skill}
                    className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-indigo-500/50 transition flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-[var(--surface)] text-[var(--text-primary)] flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-indigo-500" />
                        </div>
                        {sk.isVerified ? (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeClass(sk.userBadge)}`}>
                            {sk.userBadge}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-[var(--text-secondary)] px-2 py-0.5 rounded-full bg-[var(--surface)]">
                            Unverified
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-[15px]">{sk.name}</h4>
                        <span className="text-[11px] text-[var(--text-secondary)]">{sk.category}</span>
                      </div>

                      <p className="text-[12px] text-[var(--text-secondary)] line-clamp-2">
                        {sk.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
                      <span className="text-[11px] text-[var(--text-secondary)]">
                        {sk.totalQuestions} Questions
                      </span>
                      <Button
                        size="sm"
                        variant={sk.isVerified ? 'ghost' : 'gradient'}
                        onClick={() => startTechnicalTest(sk.skill)}
                        className="text-[12px]"
                      >
                        {sk.isVerified ? 'Retake' : 'Start Quiz'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: APTITUDE & LOGICAL REASONING */}
      {!activeTest && activeTab === 'aptitude' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-[16px] flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-500" />
                  Aptitude & Logical Reasoning Assessment
                </h3>
                <p className="text-[12px] text-[var(--text-secondary)] mt-1">
                  Timed objective assessment evaluating problem-solving acumen, quantitative logic, deduction, and pattern reasoning.
                </p>
              </div>
              <Button
                variant="gradient"
                onClick={startAptitudeTest}
                className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2"
              >
                <Clock className="w-4 h-4" /> Start 10-Min Aptitude Test
              </Button>
            </div>

            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Deductive Logic', desc: 'Syllogisms, contraposition, and strict conditional reasoning.' },
                { title: 'Numerical Logic', desc: 'Quantitative problem solving, rate calculations, and ratios.' },
                { title: 'Pattern Recognition', desc: 'Algorithmic number sequences and letter transformations.' },
                { title: 'Analytical Thinking', desc: 'Resource constraints, work distribution, and sequencing.' },
              ].map((c) => (
                <div key={c.title} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                  <div className="font-bold text-[13px]">{c.title}</div>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-1">{c.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[12px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                <strong>Test Rules:</strong> 10 questions, 10 minutes total. Questions and answer keys are evaluated on the secure server. Passing with 60%+ boosts your platform Reliability Score.
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: PERSONALITY & WORKING STYLE */}
      {!activeTest && activeTab === 'personality' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 uppercase tracking-widest">
                    Self-Reported Preference Profile
                  </span>
                </div>
                <h3 className="font-extrabold text-[18px] flex items-center gap-2 mt-1">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  Working-Style & Collaboration Assessment
                </h3>
                <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                  Evaluates 5 dimensions of real-world collaboration under sprint deadlines rather than assigning simplistic labels.
                </p>
              </div>
              <Button
                variant="gradient"
                onClick={startPersonalityTest}
                className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {overview?.summary?.personalityArchetype !== 'Not Assessed'
                  ? 'Retake Working-Style Assessment'
                  : 'Take Assessment (10 Scenarios)'}
              </Button>
            </div>

            {/* Current Archetype Profile if taken */}
            {overview?.summary?.personalityArchetype &&
              overview.summary.personalityArchetype !== 'Not Assessed' && (
                <div className="mt-6 grid lg:grid-cols-2 gap-6 pt-6 border-t border-[var(--border)]">
                  {/* Archetype Card */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 via-transparent to-indigo-500/10 border border-purple-500/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-purple-600 text-white uppercase tracking-wider">
                        Primary Archetype
                      </span>
                      <span className="text-[11px] text-[var(--text-secondary)]">
                        Self-Reported
                      </span>
                    </div>

                    <div>
                      <h4 className="text-[22px] font-extrabold text-[var(--text-primary)]">
                        {overview.summary.personalityArchetype}
                      </h4>
                      <p className="text-[13px] text-[var(--text-secondary)] mt-1">
                        {overview.summary.personalitySummary}
                      </p>
                    </div>

                    {overview.summary.personalityIdealComplement && (
                      <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[12px]">
                        <span className="font-bold text-[var(--text-primary)]">
                          Ideal Teammate Matches:
                        </span>{' '}
                        <span className="text-purple-600 dark:text-purple-400 font-semibold">
                          {overview.summary.personalityIdealComplement}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 5-Dimension Radar Chart */}
                  {overview.summary.personalityDimensions && (
                    <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-[13px]">Collaboration Dimensions (0-100%)</h4>
                        <p className="text-[11px] text-[var(--text-secondary)]">
                          Multi-axis assessment of work habits under pressure
                        </p>
                      </div>
                      <div className="h-[220px] mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart
                            data={Object.entries(overview.summary.personalityDimensions).map(
                              ([key, val]) => ({
                                dimension: key.replace('_', ' ').toUpperCase(),
                                score: val,
                              })
                            )}
                          >
                            <PolarGrid />
                            <PolarAngleAxis dataKey="dimension" fontSize={10} />
                            <PolarRadiusAxis fontSize={10} domain={[0, 100]} />
                            <Radar
                              dataKey="score"
                              stroke="#8B5CF6"
                              fill="#8B5CF6"
                              fillOpacity={0.35}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              )}
          </Card>
        </div>
      )}

      {/* TAB 4: ASSESSMENT HISTORY */}
      {!activeTest && activeTab === 'history' && (
        <Card className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="font-extrabold text-[16px] flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-500" />
              Complete Assessment Attempt History
              <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                ({filteredHistory.length})
              </span>
            </h3>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1.5 text-[12px]">
              {['all', 'technical', 'aptitude', 'personality'].map((f) => (
                <button
                  key={f}
                  onClick={() => setHistoryFilter(f)}
                  className={`px-3 py-1 rounded-lg capitalize font-semibold transition ${
                    historyFilter === f
                      ? 'bg-[var(--text-primary)] text-[var(--background)]'
                      : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredHistory.map((item) => (
              <div
                key={item._id}
                className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--text-secondary)]/30 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center font-bold text-[12px] shrink-0">
                    {item.assessmentType === 'aptitude' ? (
                      <Target className="w-5 h-5 text-amber-500" />
                    ) : item.assessmentType === 'personality' ? (
                      <Sparkles className="w-5 h-5 text-purple-500" />
                    ) : (
                      <Brain className="w-5 h-5 text-indigo-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-[14px] flex items-center gap-2">
                      <span className="capitalize">
                        {item.archetype || item.skillOrDomain?.replace('_', ' ') || item.assessmentType}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeClass(item.badge)}`}>
                        {item.badge}
                      </span>
                      {item.details?.isSelfReported && (
                        <span className="text-[10px] font-semibold text-purple-600">
                          (Self-Reported)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      Taken on {new Date(item.takenAt).toLocaleString()}
                      {item.score !== undefined && item.assessmentType !== 'personality' && ` • Score: ${item.score}%`}
                    </div>
                  </div>
                </div>

                {item.details?.questionReviews && item.details.questionReviews.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReviewResult(item)}
                    className="text-[12px] flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-500" /> Review Test
                  </Button>
                )}
              </div>
            ))}

            {!filteredHistory.length && (
              <div className="py-10 text-center text-[13px] text-[var(--text-secondary)] border border-dashed border-[var(--border)] rounded-2xl">
                No assessment attempts recorded for this filter.
              </div>
            )}
          </div>
        </Card>
      )}

      {/* POST-TEST RESULTS MODAL */}
      {testResult && (
        <Modal
          open={Boolean(testResult)}
          onClose={() => setTestResult(null)}
          title="Assessment Results"
          subtitle="Server-side evaluation completed and recorded."
          wide={true}
        >
          <div className="space-y-6">
            {/* Score reveal card */}
            <div className="text-center py-6 p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 border border-indigo-500/30 space-y-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center mx-auto shadow-md">
                <Trophy className="w-7 h-7" />
              </div>

              {testResult.assessmentType === 'personality' ? (
                <>
                  <h3 className="text-[24px] font-extrabold">{testResult.archetype}</h3>
                  <p className="text-[13px] text-[var(--text-secondary)] max-w-md mx-auto">
                    {testResult.tagline}
                  </p>
                  <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300">
                    Self-Reported Working-Style Preference
                  </span>
                </>
              ) : (
                <>
                  <h3 className="text-[28px] font-extrabold">Score: {testResult.score}%</h3>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[12px] font-bold ${badgeClass(testResult.badge)}`}>
                      {testResult.badge} Badge
                    </span>
                    <span className="text-[12px] font-semibold text-[var(--text-secondary)]">
                      {testResult.correctCount} / {testResult.totalQuestions} Correct
                    </span>
                  </div>
                  <p className="text-[12px] text-emerald-600 font-semibold pt-1">
                    {testResult.message}
                  </p>
                </>
              )}
            </div>

            {/* Question by Question Review Accordion */}
            {testResult.questionReviews && testResult.questionReviews.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-bold text-[14px]">Detailed Question Review & Explanations</h4>
                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                  {testResult.questionReviews.map((rev, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border text-[13px] space-y-2 ${
                        rev.isCorrect
                          ? 'border-emerald-200 bg-emerald-50/20 dark:bg-emerald-950/10'
                          : 'border-red-200 bg-red-50/20 dark:bg-red-950/10'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {rev.isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <span className="font-bold">
                          Q{i + 1}: {rev.q}
                        </span>
                      </div>
                      <div className="text-[12px] pl-6 space-y-1">
                        <div>
                          Your answer:{' '}
                          <strong>
                            {rev.selectedOption !== undefined
                              ? rev.options[rev.selectedOption]
                              : 'Not answered'}
                          </strong>
                        </div>
                        {!rev.isCorrect && (
                          <div className="text-emerald-700 dark:text-emerald-400">
                            Correct answer: <strong>{rev.options[rev.correctAnswer]}</strong>
                          </div>
                        )}
                        <div className="text-[11px] text-[var(--text-secondary)] pt-1 italic">
                          {rev.explanation}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <Button variant="gradient" onClick={() => setTestResult(null)}>
                Done & Return to Hub
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* HISTORICAL TEST REVIEW MODAL */}
      {reviewResult && (
        <Modal
          open={Boolean(reviewResult)}
          onClose={() => setReviewResult(null)}
          title={`Test Review: ${reviewResult.skillOrDomain || reviewResult.assessmentType}`}
          subtitle={`Score: ${reviewResult.score}% • Taken on ${new Date(reviewResult.takenAt).toLocaleString()}`}
          wide={true}
        >
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {(reviewResult.details?.questionReviews || []).map((rev, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border text-[13px] space-y-2 ${
                  rev.isCorrect
                    ? 'border-emerald-200 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : 'border-red-200 bg-red-50/20 dark:bg-red-950/10'
                }`}
              >
                <div className="flex items-start gap-2">
                  {rev.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <span className="font-bold">
                    Q{i + 1}: {rev.q}
                  </span>
                </div>
                <div className="text-[12px] pl-6 space-y-1">
                  <div>
                    Your answer:{' '}
                    <strong>
                      {rev.selectedOption !== undefined
                        ? rev.options[rev.selectedOption]
                        : 'Not answered'}
                    </strong>
                  </div>
                  {!rev.isCorrect && (
                    <div className="text-emerald-700 dark:text-emerald-400">
                      Correct answer: <strong>{rev.options[rev.correctAnswer]}</strong>
                    </div>
                  )}
                  <div className="text-[11px] text-[var(--text-secondary)] pt-1 italic">
                    {rev.explanation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

