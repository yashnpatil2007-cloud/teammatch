export const mockProblems = [
  { _id:'p1', title:'AI-Powered Disaster Response System', category:'AI/ML', difficulty:'Hard', prize:'₹2.5L', teamSize:{min:3,max:5} },
  { _id:'p2', title:'Decentralized Student Credential Vault', category:'Web3', difficulty:'Medium', prize:'₹1.8L', teamSize:{min:2,max:4} },
  { _id:'p3', title:'Real-time Sign Language Translator', category:'HealthTech', difficulty:'Hard', prize:'₹3L', teamSize:{min:3,max:5} },
];

export const mockQuizzes = {
  python: [
    { q:'What is list comprehension?', options:['Loop','Syntax for creating lists','Function','Module'], answer:1, level:3 },
    { q:'What does `yield` do?', options:['Return','Pause & generate','Print','Import'], answer:1, level:6 },
  ],
  react: [
    { q:'What is useEffect for?', options:['State','Side effects','Routing','Styling'], answer:1, level:4 },
    { q:'Key prop is?', options:['CSS','Unique list identity','API key','Token'], answer:1, level:5 },
  ]
};
