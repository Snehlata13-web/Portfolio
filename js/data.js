// ─────────────────────────────────────────────────────────────
//  EDIT THIS FILE — every piece of text on the site lives here.
// ─────────────────────────────────────────────────────────────

export const profile = {
  firstName: 'Snehlata',
  lastName: 'Sharma',
  initials: 'SS',
  role: 'Software Development Engineer',
  roles: ['Backend Engineer', 'Full-Stack Developer', 'Cloud Builder', 'DSA Problem Solver', 'Software Engineer'],
  location: 'Greater Noida, India',
  timezone: 'Asia/Kolkata',
  email: 'snehlatasharma1308@gmail.com',
  resume: 'assets/Snehlata_Sharma_Resume.pdf',
  available: true,
  availabilityText: 'Open to SDE roles & internships',

  // hero images (background already removed)
  photo: 'assets/hero.png',
  polaroids: [
    { src: 'assets/polaroid-1.jpg', caption: 'chai > bugs ☕' },
    { src: 'assets/polaroid-2.jpg', caption: 'mid-debug face 🐛' },
  ],

  tagline:
    'I build backends that scale and products that feel effortless — serverless pipelines, REST APIs and the occasional AI that doesn’t hallucinate.',

  about:
    'I’m a Computer Science & Data Science undergrad at GL Bajaj who loves turning messy real-world problems into clean systems. From automating waste recovery with AWS queues to answering timetable queries with RAG, I care about reliability, performance and shipping things people actually use.',

  stickers: {
    work: 'SDE Intern @ R2C.AI',
    dsa: '400+ DSA solved',
    cgpa: 'CGPA 8.32',
    code: 'await ship(ideas)',
  },

  stats: [
    { value: 400, suffix: '+', label: 'DSA problems solved across LeetCode, GFG, Codeforces & more' },
    { value: 65, suffix: '+', label: 'REST APIs designed & shipped' },
    { value: 99.9, suffix: '%', decimals: 1, label: 'Fault tolerance on KaaGazz dispatch queues' },
    { value: 8.32, suffix: '', decimals: 2, label: 'CGPA · B.Tech CS & Data Science' },
  ],

  // Physics skill playground: each category gets its own colour.
  // `big: true` makes a pill larger.
  skills: [
    { title: 'Languages', color: 'acid', items: [['C++', true], ['Java'], ['Python'], ['JavaScript', true], ['SQL'], ['C']] },
    { title: 'Frameworks', color: 'pink', items: [['Node.js', true], ['React.js', true], ['Express.js'], ['FastAPI'], ['Tailwind CSS']] },
    { title: 'Databases', color: 'ember', items: [['PostgreSQL', true], ['MySQL'], ['MongoDB'], ['DynamoDB'], ['Redis']] },
    { title: 'Cloud & Tools', color: 'white', items: [['AWS', true], ['Lambda'], ['SQS'], ['API Gateway'], ['Docker'], ['Linux'], ['Git'], ['GitHub Actions'], ['Postman']] },
    { title: 'AI & CS', color: 'lilac', items: [['RAG'], ['Vector DB'], ['Gemini'], ['DSA', true], ['OOP'], ['DBMS'], ['OS'], ['CN']] },
  ],

  experience: [
    {
      period: 'Mar 2026 — Jun 2026',
      company: 'R2C.AI',
      role: 'Software Development Engineer Intern · Remote',
      points: [
        'Architected a researcher blogging module — from requirements to system architecture, features and integration.',
        'Developed 25+ RESTful APIs with Node.js & Express for blogs, media uploads, comments, sharing and followers.',
        'Automated 7+ notification scenarios with Nodemailer (meetings, approvals, payment confirmations).',
        'Wrote and executed 40+ test cases across features, APIs and notification workflows.',
        'Evaluated AWS, Azure and Oracle Cloud, identifying a potential 20% cost reduction.',
      ],
      stack: ['Node.js', 'Express.js', 'React.js', 'MongoDB', 'Git'],
    },
    {
      period: '2024 — 2028',
      company: 'GL Bajaj Institute of Technology & Management',
      role: 'B.Tech, Computer Science & Data Science · CGPA 8.32',
      points: ['Coursework: Data Structures & Algorithms, OOP, DBMS, Operating Systems, Computer Networks.'],
      stack: ['DSA', 'OOP', 'DBMS', 'OS', 'CN'],
    },
    {
      period: 'Achievements',
      company: 'Competitive Programming',
      role: 'Problem solver at heart',
      points: [
        'Solved 400+ DSA problems across LeetCode, GeeksforGeeks, Codeforces, CodeChef and CSES.',
        'Qualified for Google Code Challenge Round 1 (Top 15,000).',
        'Top 5 in HackBuzz 2.0 DSA Round 1 (100+ participants).',
        'HackerRank Problem Solving (Intermediate) certified.',
      ],
      stack: ['C++', 'Algorithms', 'Problem Solving'],
    },
    {
      period: '2020 — 2023',
      company: 'Prakash Punj Public School, Patna',
      role: 'Class XII (PCM) 88% · Class X 97.3%',
      points: ['Where the curiosity for maths and logic started.'],
      stack: ['PCM'],
    },
  ],

  projects: [
    {
      title: 'KaaGazz',
      kind: 'Serverless · Circular economy',
      year: '2026',
      description:
        'Serverless backend automating manual waste recovery for India’s 10M-tonne crisis. SQS + DLQ queues for 99.9% fault tolerance, a Lambda allocation engine across 4 roles and 40% faster reads.',
      stack: ['Node.js', 'AWS Lambda', 'DynamoDB', 'SQS', 'API Gateway'],
      color: '#d7ff3a',
      code: 'sqs.send(pickupJob)',
      live: '#',
      github: '#',
    },
    {
      title: 'Yatra',
      kind: 'Full-Stack · Campus system',
      year: '2026',
      description:
        'Smart hostel pass management for 2,000 college users — Supabase Postgres, 40+ REST endpoints with JWT, RBAC, rate limiting, 90% test coverage, Docker and CI/CD.',
      stack: ['Node.js', 'Express.js', 'React.js', 'PostgreSQL', 'Docker'],
      color: '#ff2e88',
      code: 'pass.approve(jwt)',
      live: '#',
      github: '#',
    },
    {
      title: 'FindMyProf',
      kind: 'AI · RAG search',
      year: '2026',
      description:
        'Natural-language timetable search for 9 sections — 95% faster lookups, a custom parsing pipeline (+85% extraction accuracy) and hierarchical embeddings with 99% retrieval accuracy.',
      stack: ['RAG', 'Vector DB', 'Gemini Embeddings', 'Node.js'],
      color: '#ff6a1f',
      code: 'rag.ask("where is Prof. X?")',
      live: '#',
      github: '#',
    },
  ],

  socials: [
    { label: 'LinkedIn', url: 'https://www.linkedin.com/' },
    { label: 'GitHub', url: 'https://github.com/' },
    { label: 'LeetCode', url: 'https://leetcode.com/' },
    { label: 'Email', url: 'mailto:snehlatasharma1308@gmail.com' },
  ],
};
