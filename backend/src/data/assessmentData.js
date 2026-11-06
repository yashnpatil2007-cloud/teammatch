/**
 * Assessment Question Banks & Configurations for TeamMatch
 * Categorized by Assessment Type:
 * 1. Aptitude & Logical Reasoning (Objective, Timed, Dimension breakdown)
 * 2. Personality & Working-Style (Multi-dimensional, Situational Scenarios, Self-Reported)
 * 3. Technical & Domain-Specific Skills (Categorized by skill and difficulty tiers 1-10)
 */

const APTITUDE_QUESTIONS = [
  {
    id: 'apt-01',
    category: 'deductive_logic',
    difficulty: 'medium',
    level: 5,
    q: 'All high-reliability engineers write unit tests. Some high-reliability engineers contribute to open-source software. Therefore:',
    options: [
      'All open-source contributors write unit tests.',
      'Some individuals who contribute to open-source software write unit tests.',
      'No open-source contributors write unit tests.',
      'All unit test writers are high-reliability engineers.',
    ],
    answer: 1,
    explanation:
      'Because all high-reliability engineers write tests, and at least some of those engineers contribute to open-source, those specific open-source contributors must write unit tests.',
  },
  {
    id: 'apt-02',
    category: 'numerical_reasoning',
    difficulty: 'easy',
    level: 4,
    q: 'A cloud service costs $0.05 per CPU hour. A pipeline runs for 8 hours per day on a cluster of 6 virtual CPUs. What is the total cost for a 30-day billing cycle?',
    options: ['$48.00', '$72.00', '$96.00', '$120.00'],
    answer: 1,
    explanation: 'Cost per day = 6 CPUs * 8 hours * $0.05 = $2.40. For 30 days: 30 * $2.40 = $72.00.',
  },
  {
    id: 'apt-03',
    category: 'pattern_recognition',
    difficulty: 'medium',
    level: 6,
    q: 'Find the next number in the algorithmic sequence: 2, 6, 14, 30, 62, ?',
    options: ['124', '126', '128', '132'],
    answer: 1,
    explanation:
      'Each step adds successive powers of 2 multiplied by 2: +4, +8, +16, +32, so the next increment is +64. 62 + 64 = 126 (or 2^(n+1) - 2).',
  },
  {
    id: 'apt-04',
    category: 'analytical_problem_solving',
    difficulty: 'hard',
    level: 8,
    q: 'Four team members (A, B, C, D) must complete a code review. A finishes before B. C finishes after B. D finishes before A. Who finishes the review second?',
    options: ['Member A', 'Member B', 'Member C', 'Member D'],
    answer: 0,
    explanation:
      'Order from first to last: D -> A -> B -> C. Therefore, Member A finishes second.',
  },
  {
    id: 'apt-05',
    category: 'deductive_logic',
    difficulty: 'hard',
    level: 7,
    q: 'If a database query uses an index, its latency is under 15ms. Query Q has a latency of 45ms. Which conclusion is strictly valid?',
    options: [
      'Query Q used an unoptimized index.',
      'Query Q did not use an index.',
      'The database was overloaded by concurrent writes.',
      'Query Q returned too many rows.',
    ],
    answer: 1,
    explanation:
      'By contraposition (Modus Tollens): If Index -> Latency < 15ms. Because Latency is 45ms (Not < 15ms), Query Q cannot have used an index.',
  },
  {
    id: 'apt-06',
    category: 'numerical_reasoning',
    difficulty: 'medium',
    level: 5,
    q: 'A team has 5 developers. If every developer conducts a 1-on-1 code sync with every other developer exactly once, how many total sync sessions take place?',
    options: ['10', '15', '20', '25'],
    answer: 0,
    explanation: 'Using combinations formula: C(5, 2) = (5 * 4) / 2 = 10 sessions.',
  },
  {
    id: 'apt-07',
    category: 'pattern_recognition',
    difficulty: 'easy',
    level: 3,
    q: 'Identify the missing term in the sequence: AZ, CX, EV, GT, ?',
    options: ['HS', 'IR', 'JQ', 'IS'],
    answer: 1,
    explanation:
      'First letter advances by +2: A, C, E, G, I. Second letter regresses by -2: Z, X, V, T, R. Next is IR.',
  },
  {
    id: 'apt-08',
    category: 'analytical_problem_solving',
    difficulty: 'medium',
    level: 6,
    q: 'A task requires 12 developer-hours. Developer X works at 1 task per 12 hours, while Developer Y works at 1 task per 6 hours. Working concurrently without overhead, how long will they take to complete the task?',
    options: ['3 hours', '4 hours', '4.5 hours', '5 hours'],
    answer: 1,
    explanation:
      'Combined rate = (1/12) + (1/6) = 3/12 = 1/4 task per hour. Time needed = 1 / (1/4) = 4 hours.',
  },
  {
    id: 'apt-09',
    category: 'deductive_logic',
    difficulty: 'easy',
    level: 4,
    q: 'No legacy microservices use GraphQL. All newly deployed services use GraphQL. Which statement must be true?',
    options: [
      'Some newly deployed services are legacy microservices.',
      'No legacy microservice is a newly deployed service.',
      'All newly deployed services are fast.',
      'All microservices will soon be deprecated.',
    ],
    answer: 1,
    explanation:
      'Because the sets of legacy services and GraphQL-using services are disjoint, no legacy service can be in the newly deployed group.',
  },
  {
    id: 'apt-10',
    category: 'numerical_reasoning',
    difficulty: 'hard',
    level: 8,
    q: 'A web server can handle 2,000 requests per second. With an active CDN cache hit ratio of 85%, how many total incoming user requests per second can the architecture handle before origin capacity is exhausted?',
    options: ['10,000 req/s', '13,333 req/s', '15,000 req/s', '20,000 req/s'],
    answer: 1,
    explanation:
      'Origin receives 100% - 85% = 15% of incoming traffic. Max total traffic * 0.15 = 2,000. Total = 2,000 / 0.15 = 13,333.3 requests per second.',
  },
];

const PERSONALITY_QUESTIONS = [
  {
    id: 'pers-01',
    scenario: 'Hackathon Kickoff: First 2 Hours',
    q: 'When your team is formed and the problem statement is released, what is your immediate instinct?',
    options: [
      {
        text: 'Immediately start drafting architectural diagrams, database schemas, and API contracts.',
        weights: { detail_orientation: 3, innovation: 2, execution: 1 },
      },
      {
        text: 'Rapidly spin up a starter repo, build a quick walking skeleton, and verify an end-to-end MVP.',
        weights: { execution: 3, innovation: 2 },
      },
      {
        text: 'Conduct a structured brainstorm to ensure everyone understands user pain points and agree on scope.',
        weights: { collaboration: 3, leadership: 2 },
      },
      {
        text: 'Organize task boards, assign role milestones, set check-in intervals, and manage time budget.',
        weights: { leadership: 3, execution: 2 },
      },
    ],
  },
  {
    id: 'pers-02',
    scenario: 'Technical Trade-off under Pressure',
    q: 'Your team is 4 hours away from presentation and discovers an unhandled edge case that causes intermittent errors under specific conditions. You:',
    options: [
      {
        text: 'Isolate the root cause, write a clean patch with test cases, even if it delays other minor polish.',
        weights: { detail_orientation: 3, execution: 2 },
      },
      {
        text: 'Create a pragmatic fallback or circuit-breaker so user experience fails gracefully and keep momentum.',
        weights: { innovation: 3, execution: 2 },
      },
      {
        text: 'Call a 3-minute huddle, explain the trade-offs, and let the team decide collectively whether to fix or bypass.',
        weights: { collaboration: 3, leadership: 2 },
      },
      {
        text: 'Make an executive call: document the known limitation in the pitch deck and focus all energy on core demo flow.',
        weights: { leadership: 3, innovation: 1 },
      },
    ],
  },
  {
    id: 'pers-03',
    scenario: 'Preferred Working Style & Rhythm',
    q: 'Which dynamic allows you to produce your best and most energizing work in a team project?',
    options: [
      {
        text: 'Deep, uninterrupted focus on complex technical logic, algorithms, or infrastructure.',
        weights: { detail_orientation: 3, execution: 2 },
      },
      {
        text: 'Pair-programming, continuous discussion, exchanging ideas, and co-debugging with a peer.',
        weights: { collaboration: 3, innovation: 1 },
      },
      {
        text: 'Rapid iterative sprints with frequent milestone check-ins and tangible demo output every few hours.',
        weights: { execution: 3, innovation: 2 },
      },
      {
        text: 'Synthesizing requirements, coordinating across sub-teams, and pitching our progress to mentors.',
        weights: { leadership: 3, collaboration: 2 },
      },
    ],
  },
  {
    id: 'pers-04',
    scenario: 'Divergent Opinions on Technology Stack',
    q: 'Two teammates strongly disagree on whether to use a familiar framework or a novel, bleeding-edge AI library. You:',
    options: [
      {
        text: 'Propose a time-boxed 30-minute spike to test feasibility before making a data-driven decision.',
        weights: { innovation: 2, detail_orientation: 2, execution: 2 },
      },
      {
        text: 'Evaluate which choice minimizes delivery risk and guarantees shipping a working prototype on time.',
        weights: { execution: 3, leadership: 2 },
      },
      {
        text: 'Facilitate a consensus discussion ensuring both sides feel heard and agree on team objectives.',
        weights: { collaboration: 3, leadership: 1 },
      },
      {
        text: 'Analyze technical tradeoffs, API stability, documentation quality, and benchmark performance metrics.',
        weights: { detail_orientation: 3, innovation: 1 },
      },
    ],
  },
  {
    id: 'pers-05',
    scenario: 'Handling Feedback from Mentors',
    q: 'Midway through the event, an industry mentor suggests pivoting your core value proposition. Your natural reaction:',
    options: [
      {
        text: 'Excited by the challenge—pivot immediately to explore the higher-upside creative solution.',
        weights: { innovation: 3, execution: 1 },
      },
      {
        text: 'Pragmatically assess whether existing backend components can be repurposed to absorb the pivot without starting over.',
        weights: { detail_orientation: 2, execution: 3 },
      },
      {
        text: 'Re-align the team, check team morale, and ensure everyone is comfortable with the revised direction.',
        weights: { collaboration: 3, leadership: 2 },
      },
      {
        text: 'Evaluate if the suggestion truly aligns with judging rubric criteria before committing to change.',
        weights: { leadership: 3, detail_orientation: 2 },
      },
    ],
  },
  {
    id: 'pers-06',
    scenario: 'Code Quality vs Shipping Velocity',
    q: 'When writing software during a fast-paced collaboration, what is your standard for code cleanliness?',
    options: [
      {
        text: 'Consistent naming, modular folder structure, typed interfaces, and clean documentation are non-negotiable.',
        weights: { detail_orientation: 3, execution: 1 },
      },
      {
        text: 'Clean enough to be maintainable, but speed of validation is paramount—refactor only what hurts velocity.',
        weights: { execution: 3, innovation: 2 },
      },
      {
        text: 'Ensure readability for peers through helpful comments, clear PR descriptions, and collaborative review.',
        weights: { collaboration: 3, detail_orientation: 2 },
      },
      {
        text: 'Focus on clear separation of concerns so multiple teammates can push without merge conflicts.',
        weights: { leadership: 2, execution: 2, detail_orientation: 2 },
      },
    ],
  },
  {
    id: 'pers-07',
    scenario: 'Final Sprint: 60 Minutes to Submission',
    q: 'With 1 hour remaining before portal submission closes, where do you focus your attention?',
    options: [
      {
        text: 'Conduct end-to-end smoke tests, verify form validations, verify responsive viewports, and eliminate console warnings.',
        weights: { detail_orientation: 3, execution: 2 },
      },
      {
        text: 'Draft compelling README documentation, capture polished UI screenshots, and verify production URLs.',
        weights: { execution: 3, collaboration: 2 },
      },
      {
        text: 'Rehearse the presentation pitch, polish demo narrative, and ensure the value proposition shines.',
        weights: { leadership: 3, innovation: 2 },
      },
      {
        text: 'Support whichever teammate is currently highest-stress to ensure nobody gets left behind.',
        weights: { collaboration: 3, leadership: 1 },
      },
    ],
  },
  {
    id: 'pers-08',
    scenario: 'Dealing with Ambiguity',
    q: 'When assigned a feature with vague requirements and no wireframe, you typically:',
    options: [
      {
        text: 'Invent a creative design, prototype two alternatives, and surprise the team with options.',
        weights: { innovation: 3, execution: 2 },
      },
      {
        text: 'Formulate specific clarifying questions, write acceptance criteria, and verify before coding.',
        weights: { detail_orientation: 3, leadership: 2 },
      },
      {
        text: 'Jump on a quick huddle with the front-end or back-end peer to co-design the contract.',
        weights: { collaboration: 3, execution: 1 },
      },
      {
        text: 'Build the simplest industry-standard implementation and ship it for early feedback.',
        weights: { execution: 3, innovation: 1 },
      },
    ],
  },
  {
    id: 'pers-09',
    scenario: 'Motivation & Satisfaction',
    q: 'At the end of a project, what gives you the greatest sense of accomplishment?',
    options: [
      {
        text: 'Knowing our architecture was robust, elegant, cleanly decoupled, and built to scale.',
        weights: { detail_orientation: 3, innovation: 2 },
      },
      {
        text: 'Seeing real users interact seamlessly with a live, functional, and intuitive product.',
        weights: { execution: 3, innovation: 2 },
      },
      {
        text: 'Watching our team operate in high sync, support each other, and celebrate together.',
        weights: { collaboration: 3, leadership: 2 },
      },
      {
        text: 'Delivering a winning pitch that clearly demonstrated the business impact and vision.',
        weights: { leadership: 3, innovation: 2 },
      },
    ],
  },
  {
    id: 'pers-10',
    scenario: 'Continuous Learning & Exploration',
    q: 'When your team needs to implement a technology none of you have used before, your approach is:',
    options: [
      {
        text: 'Dive straight into official documentation, specification sheets, and GitHub source code.',
        weights: { detail_orientation: 3, innovation: 1 },
      },
      {
        text: 'Spin up an experimental playground repo and learn through hands-on trial and error.',
        weights: { innovation: 3, execution: 2 },
      },
      {
        text: 'Divide learning topics across teammates and share key findings in a 10-minute knowledge transfer.',
        weights: { collaboration: 3, leadership: 2 },
      },
      {
        text: 'Find a battle-tested reference implementation or boilerplate and adapt it for our use case.',
        weights: { execution: 3, leadership: 1 },
      },
    ],
  },
];

const ARCHETYPES = [
  {
    key: 'architect',
    title: 'The Systems Architect',
    tagline: 'Deep architectural foresight, structural integrity, and scalable system design.',
    strengths: ['Robust system architecture', 'API design', 'Edge-case anticipation', 'Technical resilience'],
    idealComplements: ['The Fast Prototyper', 'The Team Catalyst'],
    primaryDimensions: ['detail_orientation', 'innovation'],
  },
  {
    key: 'prototyper',
    title: 'The Fast Prototyper',
    tagline: 'High velocity builder who turns ambiguous concepts into living, working MVPs.',
    strengths: ['Rapid delivery', 'Pragmatic feature velocity', 'Agile experimentation', 'MVP execution'],
    idealComplements: ['The Systems Architect', 'The Reliable Anchor'],
    primaryDimensions: ['innovation', 'execution'],
  },
  {
    key: 'anchor',
    title: 'The Reliable Anchor',
    tagline: 'Disciplined executor who ensures deadlines are met, tests pass, and software deploys cleanly.',
    strengths: ['Deadline integrity', 'Thorough test coverage', 'Deployment reliability', 'Unshakable follow-through'],
    idealComplements: ['The Fast Prototyper', 'The Team Catalyst'],
    primaryDimensions: ['execution', 'detail_orientation'],
  },
  {
    key: 'catalyst',
    title: 'The Team Catalyst',
    tagline: 'Energizing leader who fosters alignment, unblocks bottlenecks, and rallies team momentum.',
    strengths: ['Vision alignment', 'Clear communication', 'Stakeholder presentation', 'Team motivation'],
    idealComplements: ['The Systems Architect', 'The Reliable Anchor'],
    primaryDimensions: ['leadership', 'collaboration'],
  },
  {
    key: 'harmonizer',
    title: 'The Strategic Harmonizer',
    tagline: 'Empathetic collaborator who bridges user needs, team communication, and cross-functional sync.',
    strengths: ['Cross-functional empathy', 'Psychological safety', 'Active consensus building', 'User-centric design'],
    idealComplements: ['The Fast Prototyper', 'The Systems Architect'],
    primaryDimensions: ['collaboration', 'detail_orientation'],
  },
];

const TECHNICAL_QUESTION_BANKS = {
  react: [
    {
      id: 'tech-react-01',
      level: 3,
      q: 'What is the primary purpose of the dependency array in React useEffect?',
      options: [
        'To define which props and state values trigger the effect callback on update',
        'To list child components that should re-render',
        'To prevent memory allocation during render',
        'To inject Redux state slices into the component',
      ],
      answer: 0,
      explanation:
        'The dependency array tells React when to re-execute the effect function. If values in the array change between renders, the cleanup and effect run again.',
    },
    {
      id: 'tech-react-02',
      level: 5,
      q: 'Why should you avoid using array index as the `key` prop when rendering dynamic lists?',
      options: [
        'React will throw a runtime exception if an index is passed as key',
        'Indexes can cause reconciliation bugs and state misalignment when items are reordered, inserted, or removed',
        'Indexes disable React Synthetic Event propagation',
        'Keys must always be cryptographically secure UUID strings',
      ],
      answer: 1,
      explanation:
        'When list items change order, React matches components by key. If keys are indexes, existing component instances retain stale local state for the wrong items.',
    },
    {
      id: 'tech-react-03',
      level: 7,
      q: 'In React 18 Concurrent Mode, what does `useDeferredValue` do?',
      options: [
        'Defers updating a value until after user interactions and high-priority renders have completed',
        'Creates an asynchronous Web Worker to compute values off the main thread',
        'Caches values in localStorage across browser sessions',
        'Delays rendering by a fixed setTimeout millisecond interval',
      ],
      answer: 0,
      explanation:
        '`useDeferredValue` allows React to prioritize urgent updates (like keystrokes) while deferring secondary render computations with stale values until the UI stays responsive.',
    },
    {
      id: 'tech-react-04',
      level: 8,
      q: 'When should you choose `useCallback` over regular inline function definitions?',
      options: [
        'Always, because useCallback makes all component renders faster by default',
        'Only when passing callbacks to memoized child components (`React.memo`) or as dependencies of other hooks',
        'To declare asynchronous server functions',
        'To bind `this` context in functional React components',
      ],
      answer: 1,
      explanation:
        '`useCallback` incurs memory and dependency comparison overhead. It only provides optimization when preventing referential equality invalidation on memoized children or hook dependencies.',
    },
    {
      id: 'tech-react-05',
      level: 6,
      q: 'What is the key difference between `useEffect` and `useLayoutEffect`?',
      options: [
        '`useEffect` runs synchronously before DOM paint; `useLayoutEffect` runs asynchronously after paint',
        '`useLayoutEffect` runs synchronously after DOM mutations but before the browser paints on screen',
        '`useLayoutEffect` only works in React Native',
        '`useEffect` cannot perform cleanup functions',
      ],
      answer: 1,
      explanation:
        '`useLayoutEffect` fires synchronously after all DOM mutations. Use it only when measuring layout (like tooltips or element sizes) to avoid visual flicker before paint.',
    },
  ],
  python: [
    {
      id: 'tech-py-01',
      level: 3,
      q: 'Which built-in Python data structure is immutable and can be safely used as a dictionary key?',
      options: ['list', 'dict', 'set', 'tuple'],
      answer: 3,
      explanation:
        'Tuples containing hashable items are immutable and have a constant hash value, making them valid dictionary keys.',
    },
    {
      id: 'tech-py-02',
      level: 5,
      q: 'What is the function of the `yield` keyword in a Python function?',
      options: [
        'Terminates execution and returns a static tuple',
        'Suspends function execution and returns a generator iterator that produces values on demand',
        'Pauses OS thread execution for garbage collection',
        'Imports modules lazily at runtime',
      ],
      answer: 1,
      explanation:
        'A function containing `yield` becomes a generator function. It preserves state across calls and yields values lazily using the iterator protocol (`next()`).',
    },
    {
      id: 'tech-py-03',
      level: 6,
      q: 'What does the Global Interpreter Lock (GIL) in CPython primarily enforce?',
      options: [
        'Only one thread executes Python bytecode at any given moment, preventing multi-threaded CPU-bound parallelism',
        'It prevents any network I/O from blocking execution',
        'It restricts script execution to the current virtual environment',
        'It automatically encrypts variables in memory',
      ],
      answer: 0,
      explanation:
        'The GIL is a mutex that protects access to Python objects, preventing race conditions in memory management (ref counting), but limiting CPU-bound threads to a single core in standard CPython.',
    },
    {
      id: 'tech-py-04',
      level: 7,
      q: 'What is the output of `[i for i in range(5) if i % 2 == 0]`?',
      options: ['[1, 3]', '[0, 2, 4]', '[2, 4]', '[0, 1, 2, 3, 4]'],
      answer: 1,
      explanation: 'The list comprehension filters numbers from 0 to 4 where `i % 2 == 0`, yielding `[0, 2, 4]`.',
    },
    {
      id: 'tech-py-05',
      level: 8,
      q: 'In Python, what is the purpose of `@functools.wraps(fn)` when authoring custom decorators?',
      options: [
        'It speeds up function invocation through JIT compilation',
        'It preserves the decorated function’s original name, docstring, and annotations',
        'It enforces type checking at runtime',
        'It automatically caches function return values',
      ],
      answer: 1,
      explanation:
        'Without `@wraps`, the wrapper function replaces the original function metadata with wrapper attributes, breaking debugging tools and documentation generators.',
    },
  ],
  node: [
    {
      id: 'tech-node-01',
      level: 4,
      q: 'How does the Node.js event loop handle asynchronous I/O operations without blocking execution?',
      options: [
        'By spawning a separate OS thread for every individual user HTTP connection',
        'By utilizing an event-driven loop backed by libuv to delegate I/O to system kernels and thread pools',
        'By compiling JavaScript directly to C++ bytecode on each request',
        'By pausing execution until disk reads complete',
      ],
      answer: 1,
      explanation:
        'Node.js runs on a single main JavaScript thread, delegating asynchronous system calls to the operating system kernel and libuv worker pool, resuming execution via callback queues.',
    },
    {
      id: 'tech-node-02',
      level: 6,
      q: 'What is the primary benefit of using Node.js Streams (`fs.createReadStream`) over `fs.readFile` for large files?',
      options: [
        'Streams automatically encrypt file content on disk',
        'Streams process data chunk-by-chunk in memory rather than buffering the entire file into RAM',
        'Streams guarantee higher CPU clock speeds',
        'Streams bypass OS file system permissions',
      ],
      answer: 1,
      explanation:
        'Streams read and write data in manageable chunks (buffers), keeping memory consumption low and constant regardless of file size.',
    },
    {
      id: 'tech-node-03',
      level: 7,
      q: 'In Express middleware, what happens if your middleware function does not call `next()` or send a response (`res.json()`)?',
      options: [
        'Express automatically sends a 200 OK after 5 seconds',
        'The client request hangs indefinitely until a server timeout occurs',
        'The route handler is executed automatically in parallel',
        'An unhandled exception crashes the Node process',
      ],
      answer: 1,
      explanation:
        'Express middleware execution is sequential. If you neither forward control via `next()` nor terminate the response, the request pipeline halts and the client connection hangs.',
    },
    {
      id: 'tech-node-04',
      level: 8,
      q: 'Which phase of the Node.js event loop executes `setImmediate()` callbacks?',
      options: ['Timers phase', 'Poll phase', 'Check phase', 'Close callbacks phase'],
      answer: 2,
      explanation:
        '`setImmediate()` callbacks are queued to execute in the Check phase, which runs immediately after the Poll phase completes.',
    },
  ],
  ml: [
    {
      id: 'tech-ml-01',
      level: 4,
      q: 'What does a high training accuracy paired with a significantly lower validation accuracy indicate in machine learning?',
      options: [
        'High bias (underfitting)',
        'High variance (overfitting)',
        'Optimal learning rate',
        'Data leakage in validation split',
      ],
      answer: 1,
      explanation:
        'When a model performs exceptionally well on training data but fails to generalize to unseen validation data, it has learned training noise rather than true underlying patterns (overfitting).',
    },
    {
      id: 'tech-ml-02',
      level: 6,
      q: 'In a medical diagnostics model where missing a cancer diagnosis is critical, which metric should be prioritized?',
      options: ['Specificity', 'Precision', 'Recall (Sensitivity)', 'Accuracy'],
      answer: 2,
      explanation:
        'Recall measures True Positives / (True Positives + False Negatives). High recall minimizes False Negatives, ensuring fewer positive conditions are overlooked.',
    },
    {
      id: 'tech-ml-03',
      level: 7,
      q: 'How does L1 Regularization (Lasso) differ from L2 Regularization (Ridge) in feature selection?',
      options: [
        'L1 adds squared weights and keeps all coefficients non-zero',
        'L1 adds absolute weights and drives irrelevant feature coefficients strictly to zero, performing sparse selection',
        'L2 always produces sparse representations',
        'L1 only applies to unlabelled unsupervised clustering',
      ],
      answer: 1,
      explanation:
        'L1 penalty encourages sparsity by driving coefficients to exact zeros, naturally eliminating non-predictive features from linear models.',
    },
  ],
  ui_ux: [
    {
      id: 'tech-ux-01',
      level: 4,
      q: 'According to WCAG 2.1 AA standards, what is the minimum required contrast ratio for normal body text against its background?',
      options: ['3.0 : 1', '4.5 : 1', '7.0 : 1', '10.0 : 1'],
      answer: 1,
      explanation:
        'WCAG AA compliance mandates a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text (18pt or 14pt bold).',
    },
    {
      id: 'tech-ux-02',
      level: 5,
      q: 'What is Fitts’s Law primarily used for in user interface design?',
      options: [
        'Choosing complementary color palettes',
        'Predicting that the time required to rapidly move to a target area is a function of the target distance and width',
        'Estimating server-side latency for animations',
        'Determining the maximum number of items in a dropdown menu',
      ],
      answer: 1,
      explanation:
        'Fitts’s Law shows that larger and closer interactive targets (like full-width buttons or screen corners) are faster and easier for users to click or tap.',
    },
  ],
  devops: [
    {
      id: 'tech-devops-01',
      level: 5,
      q: 'In Docker, what is the primary benefit of multi-stage builds (`FROM ... AS builder`)?',
      options: [
        'Allows running multiple containers inside one Pod without Docker Compose',
        'Reduces final production image size by separating build dependencies (compilers, npm devDependencies) from runtime binaries',
        'Encrypts container file systems during push to registry',
        'Automatically provisions cloud VPC subnets',
      ],
      answer: 1,
      explanation:
        'Multi-stage builds allow developers to install large build tooling in intermediate stages and copy only final compiled artifacts into minimal runtime images (e.g. alpine or distroless).',
    },
    {
      id: 'tech-devops-02',
      level: 7,
      q: 'What is the core difference between Blue-Green deployment and Canary deployment?',
      options: [
        'Blue-green switches 100% of traffic to a replica environment; Canary routes a small percentage of live traffic to the new version incrementally',
        'Canary requires two separate AWS regions, while Blue-Green runs on local servers',
        'Blue-green only works with static HTML files',
        'Canary deployments do not allow rollbacks',
      ],
      answer: 0,
      explanation:
        'Canary deployments test production readiness by exposing the release to a fraction of users first (e.g. 5%), while Blue-Green keeps an identical idle environment ready for an all-at-once router cutover.',
    },
  ],
  dsa: [
    {
      id: 'tech-dsa-01',
      level: 5,
      q: 'What is the average time complexity of searching for an element in an unsorted array vs a balanced Binary Search Tree (BST)?',
      options: [
        'O(1) vs O(N)',
        'O(N) vs O(log N)',
        'O(log N) vs O(N^2)',
        'O(N log N) vs O(1)',
      ],
      answer: 1,
      explanation:
        'An unsorted array requires linear search O(N) in worst/average case. A balanced BST divides search space in half at each step, yielding O(log N) average time complexity.',
    },
    {
      id: 'tech-dsa-02',
      level: 7,
      q: 'How does Depth-First Search (DFS) differ from Breadth-First Search (BFS) in graph traversal?',
      options: [
        'DFS uses a Queue and explores level-by-level; BFS uses a Stack and explores deepest paths first',
        'DFS explores as deep as possible along each branch before backtracking (using Stack/recursion); BFS explores neighbor nodes level-by-level (using Queue)',
        'BFS only operates on Directed Acyclic Graphs',
        'DFS always finds the shortest path in unweighted graphs',
      ],
      answer: 1,
      explanation:
        'DFS goes deep along edges before backtracking (LIFO/Stack). BFS explores concentric rings from the root node (FIFO/Queue), which guarantees finding the shortest path in unweighted graphs.',
    },
  ],
  cybersecurity: [
    {
      id: 'tech-sec-01',
      level: 6,
      q: 'What is the most effective defense against SQL Injection vulnerabilities in database-driven web applications?',
      options: [
        'Using Client-Side JavaScript regex validations',
        'Using Parameterized Queries (Prepared Statements) or an ORM that separates query code from user data',
        'Encoding database responses in Base64',
        'Restricting web traffic to HTTPS only',
      ],
      answer: 1,
      explanation:
        'Parameterized queries ensure that user-supplied input is always treated as literal data parameters, never interpreted as executable SQL syntax by the database parser.',
    },
    {
      id: 'tech-sec-02',
      level: 7,
      q: 'Why should sensitive JWT authentication tokens be stored in HttpOnly, Secure cookies rather than localStorage?',
      options: [
        'HttpOnly cookies are inaccessible to client-side JavaScript, protecting tokens from Cross-Site Scripting (XSS) extraction',
        'LocalStorage is restricted to 1KB of memory',
        'HttpOnly cookies automatically prevent Cross-Site Request Forgery (CSRF)',
        'JWT tokens cannot be parsed if stored in localStorage',
      ],
      answer: 0,
      explanation:
        'If an application suffers from an XSS vulnerability, malicious scripts can read `localStorage.getItem("token")` and exfiltrate it. `HttpOnly` flags instruct browsers to prevent client JavaScript access.',
    },
  ],
};

module.exports = {
  APTITUDE_QUESTIONS,
  PERSONALITY_QUESTIONS,
  ARCHETYPES,
  TECHNICAL_QUESTION_BANKS,
};

