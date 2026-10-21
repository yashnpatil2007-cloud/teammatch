function calculateMatch(problemSkills, userSkills) {
  if (!problemSkills.length) return 0;
  let totalWeight = 0, matchedWeight = 0;
  let missing = [];
  const userMap = new Map(userSkills.map(s => [s.name.toLowerCase(), s.level || s.verifiedScore || 5]));
  problemSkills.forEach(ps => {
    totalWeight += ps.weight;
    const userLevel = userMap.get(ps.name.toLowerCase());
    if (userLevel) {
      const factor = Math.min(1, userLevel / ps.level);
      matchedWeight += ps.weight * factor;
    } else {
      missing.push(ps.name);
    }
  });
  const pct = Math.round((matchedWeight / totalWeight) * 100);
  return { pct: Math.max(0, Math.min(100, pct)), missing };
}

function teamCoverage(problemSkills, teamMembers) {
  // teamMembers: array of {skills: [{name, level}]}
  const allSkills = new Map();
  teamMembers.forEach(m => {
    (m.skills||[]).forEach(s => {
      const key = s.name.toLowerCase();
      const lvl = s.level || 5;
      if (!allSkills.has(key) || allSkills.get(key) < lvl) allSkills.set(key, lvl);
    });
  });
  let total = 0, covered = 0;
  let missingSkills = [], missingRoles = [];
  problemSkills.forEach(ps => {
    total += ps.weight;
    const lvl = allSkills.get(ps.name.toLowerCase());
    if (lvl && lvl >= ps.level*0.7) covered += ps.weight;
    else missingSkills.push(ps.name);
  });
  const coverage = total ? Math.round((covered/total)*100) : 0;
  const balance = Math.min(10, Math.round( (teamMembers.length/4)*6 + (coverage/100)*4 ));
  // role gaps heuristic
  if (missingSkills.length > 2) missingRoles.push('Specialist');
  return { coverage, balance, missingSkills, missingRoles };
}

module.exports = { calculateMatch, teamCoverage };
