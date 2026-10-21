const bcrypt = require('bcryptjs');

const pass = bcrypt.hashSync('demo123', 10);

const skills = (list) => list.map(([name, level, badge]) => ({ name, level, verifiedScore: level * 10, badge: badge || (level >= 9 ? 'Platinum' : level >= 7 ? 'Gold' : level >= 5 ? 'Silver' : 'Bronze') }));

const seedUsers = [
  { _id: 'u-admin', name: 'Demo Admin', email: 'admin@demo.com', password: pass, role: 'admin', avatar: 'https://i.pravatar.cc/100?img=68', bio: 'Platform administrator.', skills: [], reliabilityScore: 99, totalReviews: 12, averageRating: 5, isVerified: true, github: 'https://github.com/teammatch' },
  { _id: 'u-organizer', name: 'Demo Organizer', email: 'organizer@demo.com', password: pass, role: 'organizer', avatar: 'https://i.pravatar.cc/100?img=33', bio: 'Runs university hackathons.', skills: [], reliabilityScore: 97, totalReviews: 20, averageRating: 4.9, isVerified: true },
  { _id: 'u-leader', name: 'Demo Leader', email: 'leader@demo.com', password: pass, role: 'leader', avatar: 'https://i.pravatar.cc/100?img=12', bio: 'Full-stack lead. Building teams that ship.', github: 'https://github.com/demoleader', skills: skills([['react', 9], ['node', 8], ['typescript', 8]]), reliabilityScore: 95, totalReviews: 18, averageRating: 4.8, isVerified: true },
  { _id: 'u-member', name: 'Demo Member', email: 'member@demo.com', password: pass, role: 'member', avatar: 'https://i.pravatar.cc/100?img=5', bio: 'AI/ML enthusiast.', github: 'https://github.com/demomember', skills: skills([['python', 8], ['tensorflow', 7], ['react', 6]]), reliabilityScore: 88, totalReviews: 9, averageRating: 4.8, isVerified: true },

  { _id: 'u1', name: 'Aarav Sharma', email: 'aarav@teammatch.ai', password: pass, role: 'leader', avatar: 'https://i.pravatar.cc/100?img=12', bio: 'Full-stack engineer who loves clean architecture.', github: 'https://github.com/aarav', linkedin: 'https://linkedin.com/in/aarav', skills: skills([['react', 9], ['node', 8], ['typescript', 8], ['mongodb', 7]]), reliabilityScore: 96, totalReviews: 24, averageRating: 4.8, isVerified: true },
  { _id: 'u2', name: 'Priya Patel', email: 'priya@teammatch.ai', password: pass, role: 'member', avatar: 'https://i.pravatar.cc/100?img=26', bio: 'AI/ML engineer specialising in deep learning.', github: 'https://github.com/priya', skills: skills([['python', 9], ['tensorflow', 8], ['pytorch', 7], ['nlp', 7]]), reliabilityScore: 94, totalReviews: 31, averageRating: 4.9, isVerified: true },
  { _id: 'u3', name: 'Kabir Das', email: 'kabir@teammatch.ai', password: pass, role: 'member', avatar: 'https://i.pravatar.cc/100?img=15', bio: 'Product designer focused on delightful UX.', skills: skills([['figma', 9], ['react', 7], ['html', 8], ['css', 8]]), reliabilityScore: 92, totalReviews: 19, averageRating: 4.7, isVerified: true },
  { _id: 'u4', name: 'Sneha Rao', email: 'sneha@teammatch.ai', password: pass, role: 'member', avatar: 'https://i.pravatar.cc/100?img=11', bio: 'Cloud & DevOps. Automating everything.', skills: skills([['aws', 9], ['docker', 8], ['kubernetes', 8], ['terraform', 7]]), reliabilityScore: 97, totalReviews: 27, averageRating: 4.9, isVerified: true },
  { _id: 'u5', name: 'Rohan Mehta', email: 'rohan@teammatch.ai', password: pass, role: 'leader', avatar: 'https://i.pravatar.cc/100?img=8', bio: 'Web3 builder and smart-contract auditor.', skills: skills([['solidity', 8], ['react', 7], ['node', 7], ['ipfs', 6]]), reliabilityScore: 88, totalReviews: 15, averageRating: 4.6, isVerified: true },
  { _id: 'u6', name: 'Ananya Roy', email: 'ananya@teammatch.ai', password: pass, role: 'member', avatar: 'https://i.pravatar.cc/100?img=32', bio: 'Backend engineer. Distributed systems nerd.', skills: skills([['go', 8], ['kubernetes', 7], ['postgres', 8], ['node', 7]]), reliabilityScore: 91, totalReviews: 22, averageRating: 4.7, isVerified: true },
  { _id: 'u7', name: 'Ishaan Verma', email: 'ishaan@teammatch.ai', password: pass, role: 'member', avatar: 'https://i.pravatar.cc/100?img=51', bio: 'Mobile developer, Flutter & Firebase.', skills: skills([['flutter', 8], ['dart', 7], ['firebase', 7], ['figma', 6]]), reliabilityScore: 85, totalReviews: 11, averageRating: 4.5, isVerified: true },
  { _id: 'u8', name: 'Meera Nair', email: 'meera@teammatch.ai', password: pass, role: 'member', avatar: 'https://i.pravatar.cc/100?img=47', bio: 'Computer vision researcher.', skills: skills([['cv', 8], ['pytorch', 8], ['mediapipe', 7], ['python', 9]]), reliabilityScore: 90, totalReviews: 17, averageRating: 4.8, isVerified: true },
  { _id: 'u9', name: 'Arjun Kapoor', email: 'arjun@teammatch.ai', password: pass, role: 'member', avatar: 'https://i.pravatar.cc/100?img=14', bio: 'Java & Spring microservices.', skills: skills([['java', 8], ['spring', 7], ['aws', 7], ['postgres', 7]]), reliabilityScore: 87, totalReviews: 13, averageRating: 4.6, isVerified: true },
  { _id: 'u10', name: 'Diya Sharma', email: 'diya@teammatch.ai', password: pass, role: 'member', avatar: 'https://i.pravatar.cc/100?img=45', bio: 'UI/UX & design systems.', skills: skills([['figma', 9], ['html', 8], ['css', 8], ['react', 6]]), reliabilityScore: 89, totalReviews: 16, averageRating: 4.7, isVerified: true },
  { _id: 'u11', name: 'Vivaan Joshi', email: 'vivaan@teammatch.ai', password: pass, role: 'member', avatar: 'https://i.pravatar.cc/100?img=59', bio: 'NLP & transformers.', skills: skills([['python', 9], ['nlp', 8], ['transformers', 8], ['tensorflow', 7]]), reliabilityScore: 93, totalReviews: 20, averageRating: 4.8, isVerified: true },
];

const seedProblems = [
  {
    _id: 'p1', title: 'AI-Powered Disaster Response System',
    description: 'Build a real-time disaster mapping and rescue coordination platform using Python, TensorFlow and GIS, with a React dashboard and Node.js backend.',
    category: 'AI/ML', difficulty: 'Hard', difficultyScore: 8, prize: '₹2.5L',
    requiredSkills: [{ name: 'python', weight: 9, level: 8 }, { name: 'tensorflow', weight: 9, level: 8 }, { name: 'gis', weight: 6, level: 6 }, { name: 'react', weight: 7, level: 7 }, { name: 'node', weight: 6, level: 6 }],
    requiredRoles: ['AI/ML Engineer', 'Data Engineer', 'Frontend Developer'], teamSize: { min: 3, max: 5 },
    organizer: 'u-organizer', registeredCount: 42, status: 'published', deadline: '2026-12-15',
  },
  {
    _id: 'p2', title: 'Decentralized Student Credential Vault',
    description: 'A Solidity + IPFS based credential vault with a React frontend and Node.js APIs for verifiable academic records.',
    category: 'Web3', difficulty: 'Medium', difficultyScore: 6, prize: '₹1.8L',
    requiredSkills: [{ name: 'solidity', weight: 9, level: 8 }, { name: 'react', weight: 8, level: 7 }, { name: 'ipfs', weight: 6, level: 6 }, { name: 'node', weight: 7, level: 7 }],
    requiredRoles: ['Blockchain Dev', 'Frontend Developer', 'Backend Developer'], teamSize: { min: 2, max: 4 },
    organizer: 'u-organizer', registeredCount: 31, status: 'published', deadline: '2026-11-30',
  },
  {
    _id: 'p3', title: 'Real-time Sign Language Translator',
    description: 'Computer vision app using MediaPipe and PyTorch to translate sign language to text in real time, packaged as a Flutter mobile app.',
    category: 'HealthTech', difficulty: 'Hard', difficultyScore: 9, prize: '₹3L',
    requiredSkills: [{ name: 'cv', weight: 8, level: 7 }, { name: 'mediapipe', weight: 7, level: 7 }, { name: 'flutter', weight: 7, level: 6 }, { name: 'pytorch', weight: 8, level: 8 }],
    requiredRoles: ['AI/ML Engineer', 'Mobile Developer'], teamSize: { min: 3, max: 5 },
    organizer: 'u-organizer', registeredCount: 58, status: 'published', deadline: '2026-12-20',
  },
  {
    _id: 'p4', title: 'Cloud-Native FinTech Ledger',
    description: 'Scalable double-entry ledger on AWS with Go microservices, Kubernetes and PostgreSQL, plus a React analytics dashboard.',
    category: 'FinTech', difficulty: 'Hard', difficultyScore: 8, prize: '₹2.2L',
    requiredSkills: [{ name: 'go', weight: 8, level: 7 }, { name: 'aws', weight: 8, level: 7 }, { name: 'kubernetes', weight: 7, level: 7 }, { name: 'postgres', weight: 7, level: 7 }, { name: 'react', weight: 6, level: 6 }],
    requiredRoles: ['Backend Developer', 'DevOps', 'Frontend Developer'], teamSize: { min: 3, max: 5 },
    organizer: 'u-organizer', registeredCount: 27, status: 'published', deadline: '2026-12-05',
  },
  {
    _id: 'p5', title: 'Adaptive Learning Platform',
    description: 'An EdTech platform with personalized learning paths using Python and NLP, React frontend and Firebase auth.',
    category: 'EdTech', difficulty: 'Medium', difficultyScore: 5, prize: '₹1.5L',
    requiredSkills: [{ name: 'python', weight: 7, level: 6 }, { name: 'nlp', weight: 6, level: 6 }, { name: 'react', weight: 7, level: 7 }, { name: 'firebase', weight: 6, level: 6 }],
    requiredRoles: ['AI/ML Engineer', 'Frontend Developer'], teamSize: { min: 2, max: 4 },
    organizer: 'u-organizer', registeredCount: 36, status: 'published', deadline: '2026-11-25',
  },
  {
    _id: 'p6', title: 'IoT Smart Campus Monitor',
    description: 'IoT sensors streaming to an AWS backend with Docker deployment and a React real-time dashboard.',
    category: 'IoT', difficulty: 'Medium', difficultyScore: 6, prize: '₹1.6L',
    requiredSkills: [{ name: 'aws', weight: 7, level: 7 }, { name: 'docker', weight: 6, level: 6 }, { name: 'react', weight: 6, level: 6 }, { name: 'node', weight: 7, level: 7 }],
    requiredRoles: ['DevOps', 'Backend Developer', 'Frontend Developer'], teamSize: { min: 3, max: 4 },
    organizer: 'u-organizer', registeredCount: 19, status: 'published', deadline: '2026-12-10',
  },
];

const seedTeams = [
  { _id: 't1', name: 'Team Nexus', problem: 'p1', leader: 'u1', members: ['u1', 'u2', 'u3'], invites: [{ user: 'u4', status: 'pending' }], coverage: 84, balanceScore: 8, matchPercentage: 90, missingSkills: ['gis'], missingRoles: ['Data Engineer'], status: 'forming' },
  { _id: 't2', name: 'ByteForge', problem: 'p2', leader: 'u5', members: ['u5', 'u3'], invites: [{ user: 'u6', status: 'pending' }, { user: 'u10', status: 'accepted' }], coverage: 88, balanceScore: 7, matchPercentage: 86, missingSkills: [], missingRoles: [], status: 'complete' },
  { _id: 't3', name: 'Quantum Coders', problem: 'p3', leader: 'u2', members: ['u2', 'u8', 'u7'], invites: [], coverage: 92, balanceScore: 9, matchPercentage: 93, missingSkills: ['flutter'], missingRoles: [], status: 'forming' },
  { _id: 't4', name: 'Ledger Legends', problem: 'p4', leader: 'u6', members: ['u6', 'u4', 'u9'], invites: [{ user: 'u1', status: 'pending' }], coverage: 90, balanceScore: 8, matchPercentage: 88, missingSkills: [], missingRoles: [], status: 'forming' },
];

const seedReviews = [
  { _id: 'r1', reviewer: 'u1', reviewee: 'u2', team: 't1', rating: 5, comment: 'Amazing collaborator, shipped the ML pipeline ahead of schedule!', type: 'leader_to_member' },
  { _id: 'r2', reviewer: 'u2', reviewee: 'u1', team: 't1', rating: 5, comment: 'Great leadership, kept the team unblocked and focused.', type: 'member_to_leader' },
  { _id: 'r3', reviewer: 'u3', reviewee: 'u2', team: 't1', rating: 4, comment: 'Solid AI knowledge and a great team player.', type: 'peer' },
  { _id: 'r4', reviewer: 'u4', reviewee: 'u6', team: 't4', rating: 5, comment: 'Excellent backend design and review culture.', type: 'peer' },
  { _id: 'r5', reviewer: 'u8', reviewee: 'u2', team: 't3', rating: 5, comment: 'Deep CV expertise and very reliable.', type: 'peer' },
];

const seedQuizzes = [
  {
    _id: 'q1', skill: 'python', level: 5, badge: 'Gold',
    questions: [
      { q: 'What is list comprehension?', options: ['A loop', 'Syntax for creating lists', 'A function', 'A module'], answer: 1, level: 3 },
      { q: 'What does `yield` do?', options: ['Returns a value', 'Pauses and generates values', 'Prints output', 'Imports a module'], answer: 1, level: 6 },
      { q: 'What is a decorator?', options: ['A function that wraps a function', 'A class', 'A loop', 'A variable'], answer: 0, level: 5 },
      { q: 'Which is immutable?', options: ['list', 'dict', 'set', 'tuple'], answer: 3, level: 4 },
    ],
  },
  {
    _id: 'q2', skill: 'react', level: 5, badge: 'Gold',
    questions: [
      { q: 'What is useEffect used for?', options: ['State', 'Side effects', 'Routing', 'Styling'], answer: 1, level: 4 },
      { q: 'Why use the key prop?', options: ['CSS', 'Unique list identity', 'API key', 'Token'], answer: 1, level: 5 },
      { q: 'What does useState return?', options: ['A value', 'A value and a setter', 'A ref', 'A context'], answer: 1, level: 3 },
    ],
  },
  {
    _id: 'q3', skill: 'figma', level: 4, badge: 'Silver',
    questions: [
      { q: 'Auto-layout is?', options: ['A responsive container', 'An image', 'A font', 'A color'], answer: 0, level: 4 },
      { q: 'Components are used for?', options: ['Reusable UI', 'Exporting', 'Animations', 'Fonts'], answer: 0, level: 3 },
    ],
  },
  {
    _id: 'q4', skill: 'node', level: 6, badge: 'Platinum',
    questions: [
      { q: 'Node.js is?', options: ['A browser API', 'A JS runtime', 'A database', 'A framework'], answer: 1, level: 4 },
      { q: 'Middleware functions?', options: ['Handle requests in a chain', 'Store data', 'Render HTML', 'Compile code'], answer: 0, level: 6 },
    ],
  },
];

module.exports = { seedUsers, seedProblems, seedTeams, seedReviews, seedQuizzes };
