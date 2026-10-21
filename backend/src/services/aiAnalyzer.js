const SKILL_DB = {
  python: { role: 'AI/ML Engineer', weight: 9 },
  tensorflow: { role: 'AI/ML Engineer', weight: 9 },
  pytorch: { role: 'AI/ML Engineer', weight: 8 },
  'machine learning': { role: 'AI/ML Engineer', weight: 9 },
  nlp: { role: 'AI/ML Engineer', weight: 7 },
  transformers: { role: 'AI/ML Engineer', weight: 7 },
  cv: { role: 'AI/ML Engineer', weight: 8 },
  'computer vision': { role: 'AI/ML Engineer', weight: 8 },
  mediapipe: { role: 'AI/ML Engineer', weight: 7 },
  react: { role: 'Frontend Developer', weight: 8 },
  vue: { role: 'Frontend Developer', weight: 7 },
  next: { role: 'Frontend Developer', weight: 7 },
  html: { role: 'Frontend Developer', weight: 5 },
  css: { role: 'Frontend Developer', weight: 5 },
  tailwind: { role: 'Frontend Developer', weight: 5 },
  typescript: { role: 'Frontend Developer', weight: 7 },
  node: { role: 'Backend Developer', weight: 8 },
  express: { role: 'Backend Developer', weight: 7 },
  django: { role: 'Backend Developer', weight: 7 },
  flask: { role: 'Backend Developer', weight: 7 },
  go: { role: 'Backend Developer', weight: 8 },
  rust: { role: 'Backend Developer', weight: 8 },
  java: { role: 'Backend Developer', weight: 7 },
  spring: { role: 'Backend Developer', weight: 7 },
  graphql: { role: 'Backend Developer', weight: 6 },
  postgres: { role: 'Backend Developer', weight: 7 },
  mongodb: { role: 'Backend Developer', weight: 6 },
  mysql: { role: 'Backend Developer', weight: 6 },
  solidity: { role: 'Blockchain Dev', weight: 9 },
  web3: { role: 'Blockchain Dev', weight: 8 },
  ethereum: { role: 'Blockchain Dev', weight: 8 },
  ipfs: { role: 'Blockchain Dev', weight: 6 },
  figma: { role: 'UI/UX Designer', weight: 7 },
  'ui/ux': { role: 'UI/UX Designer', weight: 7 },
  design: { role: 'UI/UX Designer', weight: 6 },
  flutter: { role: 'Mobile Developer', weight: 7 },
  swift: { role: 'Mobile Developer', weight: 7 },
  kotlin: { role: 'Mobile Developer', weight: 7 },
  reactnative: { role: 'Mobile Developer', weight: 7 },
  android: { role: 'Mobile Developer', weight: 7 },
  ios: { role: 'Mobile Developer', weight: 7 },
  aws: { role: 'DevOps', weight: 8 },
  azure: { role: 'DevOps', weight: 8 },
  gcp: { role: 'DevOps', weight: 8 },
  docker: { role: 'DevOps', weight: 7 },
  kubernetes: { role: 'DevOps', weight: 8 },
  terraform: { role: 'DevOps', weight: 7 },
  ci: { role: 'DevOps', weight: 5 },
  gis: { role: 'Data Engineer', weight: 6 },
  'data engineering': { role: 'Data Engineer', weight: 7 },
  spark: { role: 'Data Engineer', weight: 7 },
  airflow: { role: 'Data Engineer', weight: 6 },
  firebase: { role: 'Backend Developer', weight: 6 },
  arduino: { role: 'IoT Engineer', weight: 6 },
  raspberry: { role: 'IoT Engineer', weight: 6 },
  iot: { role: 'IoT Engineer', weight: 7 },
  sensors: { role: 'IoT Engineer', weight: 5 },
};

function analyzeProblem(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  const found = [];
  const roles = new Set();
  let score = 0;

  Object.entries(SKILL_DB).forEach(([skill, meta]) => {
    if (text.includes(skill)) {
      found.push({ name: skill, weight: meta.weight, level: Math.min(10, 5 + Math.floor(meta.weight / 2)) });
      roles.add(meta.role);
      score += meta.weight;
    }
  });

  const unique = [];
  const seen = new Set();
  found
    .sort((a, b) => b.weight - a.weight)
    .forEach((s) => { if (!seen.has(s.name)) { seen.add(s.name); unique.push(s); } });

  if (unique.length === 0) {
    unique.push({ name: 'javascript', weight: 6, level: 6 }, { name: 'python', weight: 7, level: 6 });
    roles.add('Full Stack Developer');
  }

  const difficulty = score > 32 ? 'Hard' : score > 16 ? 'Medium' : 'Easy';
  const difficultyScore = Math.min(10, Math.max(1, Math.round(score / 5) || 5));
  const teamSize = difficulty === 'Hard' ? { min: 3, max: 5 } : difficulty === 'Medium' ? { min: 3, max: 4 } : { min: 2, max: 3 };

  return {
    requiredSkills: unique.slice(0, 6),
    requiredRoles: Array.from(roles),
    difficulty,
    difficultyScore,
    teamRequirement: teamSize,
    confidence: Math.min(98, 70 + unique.length * 4),
  };
}

module.exports = { analyzeProblem };
