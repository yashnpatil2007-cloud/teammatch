/**
 * Smart Teammate Matching & Compatibility Scoring Engine 2.0
 * Multi-dimensional algorithmic evaluation combining:
 * 1. Technical Skill Coverage & Verification Weights (30%)
 * 2. Team Gap Coverage & Complementarity (20%)
 * 3. Working-Style Archetype & Team Chemistry (20%)
 * 4. Aptitude & Analytical Problem Solving Acumen (15%)
 * 5. Platform Reliability & Peer Reviews (10%)
 * 6. Availability & Team Load (5%)
 */

// Complementarity matrix defining which archetypes synergize best in software/hackathon teams
const ARCHETYPE_SYNERGY = {
  'The Systems Architect': {
    idealComplements: ['The Fast Prototyper', 'The Team Catalyst', 'The Reliable Anchor'],
    synergyScore: {
      'The Fast Prototyper': 96, // Architect designs, Prototyper ships MVP
      'The Team Catalyst': 92,   // Catalyst aligns team & pitches, Architect ensures technical depth
      'The Reliable Anchor': 88, // Anchor ensures tests & deployment, Architect ensures clean modularity
      'The Strategic Harmonizer': 82,
      'The Systems Architect': 70, // Multiple architects may debate structure
    },
    collaborationAdvice: 'Pairs best with rapid implementers who translate deep architectures into working code.',
  },
  'The Fast Prototyper': {
    idealComplements: ['The Systems Architect', 'The Reliable Anchor', 'The Team Catalyst'],
    synergyScore: {
      'The Systems Architect': 96,
      'The Reliable Anchor': 94, // Prototyper builds fast, Anchor catches edge cases & tests
      'The Team Catalyst': 88,
      'The Strategic Harmonizer': 82,
      'The Fast Prototyper': 75,
    },
    collaborationAdvice: 'Pairs best with detail-oriented anchors to ensure prototypes are hardened before presentation.',
  },
  'The Reliable Anchor': {
    idealComplements: ['The Fast Prototyper', 'The Team Catalyst', 'The Systems Architect'],
    synergyScore: {
      'The Fast Prototyper': 94,
      'The Team Catalyst': 90,
      'The Systems Architect': 88,
      'The Strategic Harmonizer': 85,
      'The Reliable Anchor': 74,
    },
    collaborationAdvice: 'Brings stability and deadline discipline; thrives when paired with high-innovation teammates.',
  },
  'The Team Catalyst': {
    idealComplements: ['The Systems Architect', 'The Reliable Anchor', 'The Fast Prototyper'],
    synergyScore: {
      'The Systems Architect': 92,
      'The Reliable Anchor': 90,
      'The Fast Prototyper': 88,
      'The Strategic Harmonizer': 85,
      'The Team Catalyst': 68,
    },
    collaborationAdvice: 'Energizes alignment, pitches, and coordination; thrives with autonomous executors.',
  },
  'The Strategic Harmonizer': {
    idealComplements: ['The Fast Prototyper', 'The Systems Architect', 'The Team Catalyst'],
    synergyScore: {
      'The Fast Prototyper': 90,
      'The Systems Architect': 86,
      'The Reliable Anchor': 85,
      'The Team Catalyst': 84,
      'The Strategic Harmonizer': 76,
    },
    collaborationAdvice: 'Bridges user UX empathy and cross-functional team consensus.',
  },
};

// Default weight configuration (normalized to 100%)
const DEFAULT_WEIGHTS = {
  technical: 0.30,      // Relevance to project required skills
  gapCoverage: 0.20,    // Specific contribution to missing team skills
  workingStyle: 0.20,   // Archetype chemistry & dimensional diversity
  aptitude: 0.15,       // Analytical problem-solving ability
  reliability: 0.10,    // Reliability rating & peer review sentiment
  availability: 0.05,   // Active team load and bandwidth
};

/**
 * Basic skill match calculator (Maintained for backward compatibility)
 */
function calculateMatch(problemSkills = [], userSkills = []) {
  if (!problemSkills.length) return { pct: 0, missing: [] };
  let totalWeight = 0;
  let matchedWeight = 0;
  const missing = [];
  const userMap = new Map(userSkills.map((s) => [s.name.toLowerCase(), s.level || s.verifiedScore || 5]));

  problemSkills.forEach((ps) => {
    const weight = Number(ps.weight) || 1;
    totalWeight += weight;
    const userLevel = userMap.get(ps.name.toLowerCase());
    if (userLevel) {
      const factor = Math.min(1, userLevel / (ps.level || 5));
      matchedWeight += weight * factor;
    } else {
      missing.push(ps.name);
    }
  });

  const pct = totalWeight ? Math.round((matchedWeight / totalWeight) * 100) : 0;
  return { pct: Math.max(0, Math.min(100, pct)), missing };
}

/**
 * Multi-Factor Compatibility Matching Algorithm 2.0
 * Calculates explainable compatibility between a candidate and a project / team.
 */
function calculateComprehensiveMatch(problem, candidate, teamContext = null, customWeights = null) {
  const weights = { ...DEFAULT_WEIGHTS, ...(customWeights || {}) };
  const reqSkills = problem?.requiredSkills || [];
  const candidateSkills = candidate?.skills || [];
  const userSkillMap = new Map();

  candidateSkills.forEach((s) => {
    userSkillMap.set(s.name.toLowerCase(), {
      name: s.name,
      level: Number(s.level) || 5,
      verifiedScore: Number(s.verifiedScore) || 0,
      badge: s.badge || 'Bronze',
      isCertified: s.badge === 'Certified' || Number(s.verifiedScore) >= 60,
    });
  });

  // Track Incomplete Assessments
  const missingAssessments = [];
  const hasAptitude = Number(candidate?.aptitudeScore) > 0;
  const hasPersonality = Boolean(candidate?.personality?.archetype && candidate.personality.archetype !== 'Unclassified');
  const hasVerifiedSkills = candidateSkills.some((s) => s.isCertified || s.verifiedScore >= 60 || s.badge === 'Certified');

  if (!hasAptitude) missingAssessments.push('Aptitude Assessment');
  if (!hasPersonality) missingAssessments.push('Working-Style Profile');
  if (!hasVerifiedSkills && candidateSkills.length > 0) missingAssessments.push('Skill Verification Badges');

  const isProvisional = missingAssessments.length > 0;
  const recommendationConfidence = missingAssessments.length === 0
    ? 'High Confidence'
    : missingAssessments.length === 1
    ? 'Moderate Confidence'
    : 'Provisional';

  // 1. Technical Skill Compatibility (Normalized 0-100)
  let totalTechWeight = 0;
  let earnedTechWeight = 0;
  const matchedSkills = [];
  const missingSkills = [];

  reqSkills.forEach((ps) => {
    const weight = Number(ps.weight) || 1;
    totalTechWeight += weight;
    const userSkill = userSkillMap.get(ps.name.toLowerCase());

    if (userSkill) {
      let levelRatio = Math.min(1.2, userSkill.level / (ps.level || 5));
      if (userSkill.isCertified) {
        levelRatio = Math.min(1.25, levelRatio * 1.15); // Bonus for verified badge
      }
      earnedTechWeight += weight * levelRatio;
      matchedSkills.push({
        name: ps.name,
        level: userSkill.level,
        requiredLevel: ps.level,
        badge: userSkill.badge,
        isCertified: userSkill.isCertified,
      });
    } else {
      missingSkills.push(ps.name);
    }
  });

  const technicalScore = totalTechWeight
    ? Math.max(0, Math.min(100, Math.round((earnedTechWeight / totalTechWeight) * 100)))
    : 50;

  // 2. Team Gap Coverage & Complementary Contribution (Normalized 0-100)
  let gapCoverageScore = 70;
  const gapsClosed = [];
  const duplicateSkills = [];

  if (teamContext) {
    let currentGaps = teamContext.missingSkills;
    if (!Array.isArray(currentGaps) && Array.isArray(teamContext.members)) {
      const cov = teamCoverage(reqSkills, teamContext.members);
      currentGaps = cov.missingSkills;
    }
    currentGaps = Array.isArray(currentGaps) ? currentGaps : [];

    if (currentGaps.length > 0) {
      currentGaps.forEach((gap) => {
        if (userSkillMap.has(gap.toLowerCase())) {
          gapsClosed.push(gap);
        }
      });
      // Percentage of current team gaps that this candidate can close
      gapCoverageScore = Math.min(100, Math.round((gapsClosed.length / currentGaps.length) * 100) + (gapsClosed.length > 0 ? 25 : 0));
    } else {
      gapCoverageScore = 85; // Team already has full coverage
    }

    // Check duplicate skill concentration
    const teamSkills = new Set();
    (teamContext.members || []).forEach((m) => {
      (m.skills || []).forEach((s) => teamSkills.add(s.name.toLowerCase()));
    });
    candidateSkills.forEach((s) => {
      if (teamSkills.has(s.name.toLowerCase())) {
        duplicateSkills.push(s.name);
      }
    });
  } else {
    // If evaluating for an unformed team, score based on primary skills covered
    gapCoverageScore = Math.min(100, matchedSkills.length * 25);
  }

  // 3. Working-Style & Personality Complementarity (Normalized 0-100)
  const candidateArchetype = candidate?.personality?.archetype || 'Unclassified';
  let workingStyleScore = 65; // Baseline neutral when not yet assessed
  let workingStyleExplanation = 'Standard generalist collaboration approach.';
  let potentialFrictions = [];

  if (hasPersonality && candidateArchetype !== 'Unclassified') {
    if (teamContext) {
      const allExisting = [teamContext.leader, ...(teamContext.members || [])].filter(Boolean);
      const existingArchetypes = allExisting
        .map((m) => m?.personality?.archetype)
        .filter((a) => a && a !== 'Unclassified');

      const archetypeRules = ARCHETYPE_SYNERGY[candidateArchetype];
      if (existingArchetypes.length > 0 && archetypeRules) {
        const synergyScores = existingArchetypes.map((arch) => archetypeRules.synergyScore[arch] || 75);
        workingStyleScore = Math.round(synergyScores.reduce((s, v) => s + v, 0) / synergyScores.length);

        const primaryComplement = existingArchetypes.find((a) => archetypeRules.idealComplements.includes(a));
        if (primaryComplement) {
          workingStyleExplanation = `High synergy: ${candidateArchetype} directly complements your team's ${primaryComplement}.`;
        } else {
          workingStyleExplanation = `Brings distinct perspective as ${candidateArchetype} to balance the team.`;
        }

        // Potential collaboration notes (constructive, non-diagnostic)
        if (existingArchetypes.filter((a) => a === candidateArchetype).length >= 2) {
          potentialFrictions.push(`Multiple ${candidateArchetype}s: ensure clear sub-task ownership so work is divided cleanly.`);
        }
      } else {
        workingStyleScore = 80;
        workingStyleExplanation = `Brings a defined working style profile as ${candidateArchetype}.`;
      }
    } else {
      workingStyleScore = 80;
      workingStyleExplanation = `Candidate has completed working-style profile as ${candidateArchetype}.`;
    }
  } else {
    workingStyleExplanation = 'Working-style assessment not yet taken (scored on neutral baseline).';
  }

  // 4. Aptitude & Problem Solving Acumen (Normalized 0-100)
  let aptitudeScore = 60; // Neutral baseline when not taken
  let aptitudeExplanation = 'Aptitude test not yet completed (neutral baseline).';

  if (hasAptitude) {
    aptitudeScore = Number(candidate.aptitudeScore);
    aptitudeExplanation = `Demonstrated analytical reasoning: ${aptitudeScore}% in objective evaluation.`;
  }

  // 5. Reliability & Peer Track Record (Normalized 0-100)
  const rawReliability = Number(candidate?.reliabilityScore) || 75;
  const avgRating = Number(candidate?.averageRating) || 0;
  const ratingBonus = avgRating >= 4.5 ? 5 : avgRating >= 4.0 ? 2 : 0;
  const reliabilityScore = Math.min(100, rawReliability + ratingBonus);

  // 6. Availability & Team Load (Normalized 0-100)
  const activeTeamsCount = Number(candidate?.activeTeamsCount) || 0;
  const availabilityScore = activeTeamsCount === 0 ? 100 : activeTeamsCount === 1 ? 85 : 60;

  // Composite Weighted Score
  const rawComposite =
    technicalScore * weights.technical +
    gapCoverageScore * weights.gapCoverage +
    workingStyleScore * weights.workingStyle +
    aptitudeScore * weights.aptitude +
    reliabilityScore * weights.reliability +
    availabilityScore * weights.availability;

  const compositeScore = Math.max(10, Math.min(100, Math.round(rawComposite)));

  // Role Fit Detection
  const roleFit = (problem?.requiredRoles || []).filter((role) =>
    candidateSkills.some((s) => role.toLowerCase().includes(s.name.toLowerCase()))
  );

  // Human-Readable AI Explanation
  const reasonPoints = [];
  if (matchedSkills.length > 0) {
    const verifiedHighlights = matchedSkills.filter((s) => s.isCertified).map((s) => s.name);
    reasonPoints.push(
      `Strong technical fit covering ${matchedSkills.map((s) => s.name).join(', ')}${
        verifiedHighlights.length ? ` (Verified credentials: ${verifiedHighlights.join(', ')})` : ''
      }.`
    );
  }
  if (gapsClosed.length > 0) {
    reasonPoints.push(`Fills critical missing team skills: ${gapsClosed.join(', ')}.`);
  }
  if (hasAptitude && aptitudeScore >= 75) {
    reasonPoints.push(`High analytical problem-solving acumen (${aptitudeScore}%).`);
  }
  if (hasPersonality && candidateArchetype !== 'Unclassified') {
    reasonPoints.push(workingStyleExplanation);
  }
  if (reliabilityScore >= 85) {
    reasonPoints.push(`High platform reliability track record (${reliabilityScore}/100).`);
  }
  if (isProvisional) {
    reasonPoints.push(`Provisional rating: ${missingAssessments.join(', ')} pending.`);
  }

  const aiExplanation = reasonPoints.join(' ');

  return {
    compositeScore,
    match: compositeScore, // Backward compatibility alias
    confidence: recommendationConfidence,
    isProvisional,
    missingAssessments,
    breakdown: {
      technical: {
        score: technicalScore,
        weight: `${Math.round(weights.technical * 100)}%`,
        matchedSkills,
        missingSkills,
        matchedCount: matchedSkills.length,
        totalRequired: reqSkills.length,
      },
      gapCoverage: {
        score: gapCoverageScore,
        weight: `${Math.round(weights.gapCoverage * 100)}%`,
        gapsClosed,
        duplicateSkills,
      },
      workingStyle: {
        score: workingStyleScore,
        weight: `${Math.round(weights.workingStyle * 100)}%`,
        archetype: candidateArchetype,
        explanation: workingStyleExplanation,
        potentialFrictions,
      },
      aptitude: {
        score: aptitudeScore,
        weight: `${Math.round(weights.aptitude * 100)}%`,
        badge: candidate?.aptitudeBadge || (hasAptitude ? 'Verified' : 'Unassessed'),
        rawScore: candidate?.aptitudeScore || null,
        isAssessed: hasAptitude,
      },
      reliability: {
        score: reliabilityScore,
        weight: `${Math.round(weights.reliability * 100)}%`,
        reliabilityScore: candidate.reliabilityScore || 75,
        averageRating: candidate.averageRating || 0,
        totalReviews: candidate.totalReviews || 0,
      },
      availability: {
        score: availabilityScore,
        weight: `${Math.round(weights.availability * 100)}%`,
        activeTeamsCount,
      },
    },
    missing: missingSkills,
    gapsClosed,
    duplicateSkills,
    roleFit,
    aiExplanation,
  };
}

/**
 * Enhanced Team Coverage, Diversity & Balance Analyzer
 */
function teamCoverage(problemSkills = [], teamMembers = []) {
  const allSkills = new Map();
  const skillOccurrences = new Map();

  teamMembers.forEach((m) => {
    (m.skills || []).forEach((s) => {
      const key = s.name.toLowerCase();
      const lvl = Number(s.level) || 5;
      if (!allSkills.has(key) || allSkills.get(key) < lvl) {
        allSkills.set(key, lvl);
      }
      skillOccurrences.set(key, (skillOccurrences.get(key) || 0) + 1);
    });
  });

  let total = 0;
  let covered = 0;
  const missingSkills = [];
  const missingRoles = [];
  const duplicateSkills = [];

  problemSkills.forEach((ps) => {
    const weight = Number(ps.weight) || 1;
    total += weight;
    const lvl = allSkills.get(ps.name.toLowerCase());
    if (lvl && lvl >= (ps.level || 5) * 0.7) {
      covered += weight;
    } else {
      missingSkills.push(ps.name);
    }
  });

  // Detect duplicated skills (more than 2 members with the same skill)
  skillOccurrences.forEach((count, skillName) => {
    if (count >= 2) {
      duplicateSkills.push({ skill: skillName, count });
    }
  });

  const coverage = total ? Math.round((covered / total) * 100) : 0;
  const balance = Math.min(10, Math.max(1, Math.round((teamMembers.length / 4) * 6 + (coverage / 100) * 4)));

  // Analyze team archetype distribution
  const archetypes = {};
  teamMembers.forEach((m) => {
    const arch = m?.personality?.archetype || 'Unclassified';
    archetypes[arch] = (archetypes[arch] || 0) + 1;
  });

  // Recommend complementary next archetypes
  const hasArchitect = (archetypes['The Systems Architect'] || 0) > 0;
  const hasPrototyper = (archetypes['The Fast Prototyper'] || 0) > 0;
  const hasAnchor = (archetypes['The Reliable Anchor'] || 0) > 0;
  const hasCatalyst = (archetypes['The Team Catalyst'] || 0) > 0;

  const recommendedArchetypes = [];
  if (!hasAnchor) recommendedArchetypes.push('The Reliable Anchor');
  if (!hasPrototyper) recommendedArchetypes.push('The Fast Prototyper');
  if (!hasArchitect) recommendedArchetypes.push('The Systems Architect');
  if (!hasCatalyst) recommendedArchetypes.push('The Team Catalyst');

  // Role gaps based on missing skills
  if (missingSkills.length > 2) missingRoles.push('Specialist');
  if (missingSkills.some((s) => ['react', 'vue', 'frontend', 'ui_ux'].includes(s.toLowerCase()))) {
    missingRoles.push('Frontend Developer / UI Engineer');
  }
  if (missingSkills.some((s) => ['node', 'python', 'golang', 'backend'].includes(s.toLowerCase()))) {
    missingRoles.push('Backend Engineer / System Architect');
  }
  if (missingSkills.some((s) => ['ml', 'ai', 'data'].includes(s.toLowerCase()))) {
    missingRoles.push('AI / ML Specialist');
  }

  return {
    coverage,
    balance,
    missingSkills,
    duplicateSkills,
    missingRoles: [...new Set(missingRoles)],
    archetypeDistribution: archetypes,
    recommendedArchetypes: recommendedArchetypes.slice(0, 2),
  };
}

/**
 * Generates Alternative Optimal Team Combinations
 * Suggests 2-3 distinct strategic team formations:
 * 1. "Balanced All-Rounder" (maximizes composite score)
 * 2. "Fast Prototyping Velocity" (prioritizes rapid MVP delivery)
 * 3. "Architectural Depth & Quality" (prioritizes high detail & test coverage)
 */
function generateAlternativeCombinations(problem, candidates = [], existingMembers = [], teamSize = 4) {
  const effectiveCapacity =
    typeof teamSize === 'object' && teamSize !== null
      ? teamSize.max || teamSize.min || 4
      : Number(teamSize) || 4;
  const neededCount = Math.max(1, effectiveCapacity - existingMembers.length);
  if (candidates.length < neededCount) return [];

  // 1. Balanced Lineup (top composite scores)
  const sortedByComposite = [...candidates].sort((a, b) => b.compositeScore - a.compositeScore);
  const balancedSelection = sortedByComposite.slice(0, neededCount);
  const balancedCombined = [...existingMembers, ...balancedSelection.map((c) => c.user)];
  const balancedAnalysis = teamCoverage(problem.requiredSkills, balancedCombined);

  // 2. Velocity Lineup (prioritize candidates with high execution & prototyping)
  const sortedByVelocity = [...candidates].sort((a, b) => {
    const aVel = (a.user?.personality?.dimensions?.execution || 50) + (a.user?.personality?.dimensions?.innovation || 50);
    const bVel = (b.user?.personality?.dimensions?.execution || 50) + (b.user?.personality?.dimensions?.innovation || 50);
    return bVel - aVel;
  });
  const velocitySelection = sortedByVelocity.slice(0, neededCount);
  const velocityCombined = [...existingMembers, ...velocitySelection.map((c) => c.user)];
  const velocityAnalysis = teamCoverage(problem.requiredSkills, velocityCombined);

  // 3. Technical Depth Lineup (prioritize technical match & detail orientation)
  const sortedByDepth = [...candidates].sort((a, b) => {
    const aDepth = (a.breakdown?.technical?.score || 50) + (a.user?.personality?.dimensions?.detail_orientation || 50);
    const bDepth = (b.breakdown?.technical?.score || 50) + (b.user?.personality?.dimensions?.detail_orientation || 50);
    return bDepth - aDepth;
  });
  const depthSelection = sortedByDepth.slice(0, neededCount);
  const depthCombined = [...existingMembers, ...depthSelection.map((c) => c.user)];
  const depthAnalysis = teamCoverage(problem.requiredSkills, depthCombined);

  return [
    {
      id: 'combo-balanced',
      strategyName: 'Balanced All-Rounder Lineup',
      tagline: 'Maximizes overall multi-dimensional compatibility and project coverage.',
      members: balancedSelection.map((c) => c.user),
      coverage: balancedAnalysis.coverage,
      balanceScore: balancedAnalysis.balance,
      missingSkills: balancedAnalysis.missingSkills,
    },
    {
      id: 'combo-velocity',
      strategyName: 'Fast Prototyping Velocity Lineup',
      tagline: 'Optimized for high-velocity MVP implementation and rapid iterative progress.',
      members: velocitySelection.map((c) => c.user),
      coverage: velocityAnalysis.coverage,
      balanceScore: velocityAnalysis.balance,
      missingSkills: velocityAnalysis.missingSkills,
    },
    {
      id: 'combo-depth',
      strategyName: 'Architectural Depth & Resilience Lineup',
      tagline: 'Emphasizes deep technical precision, thorough code quality, and system stability.',
      members: depthSelection.map((c) => c.user),
      coverage: depthAnalysis.coverage,
      balanceScore: depthAnalysis.balance,
      missingSkills: depthAnalysis.missingSkills,
    },
  ];
}

module.exports = {
  calculateMatch,
  calculateComprehensiveMatch,
  teamCoverage,
  generateAlternativeCombinations,
  ARCHETYPE_SYNERGY,
  DEFAULT_WEIGHTS,
};
