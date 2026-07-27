export interface Tip {
  title: string
  description: string
}

export interface CareerPath {
  field: string
  subjects: string[]
  description: string
}

export const revisionTips: Tip[] = [
  {
    title: 'Make a study timetable',
    description: 'Break subjects into daily or weekly blocks so nothing gets left until the last minute.',
  },
  {
    title: 'Practice past papers',
    description: 'Past exam papers (find them in the Exams section) show you exactly how questions are asked.',
  },
  {
    title: 'Use active recall',
    description: 'Test yourself from memory instead of re-reading notes — it exposes gaps far faster.',
  },
  {
    title: 'Study in short bursts',
    description: '25–45 minute focused sessions with short breaks beat marathon cramming every time.',
  },
  {
    title: 'Teach it to someone else',
    description: 'Explaining a topic out loud reveals what you actually understand versus what you’ve just memorized.',
  },
  {
    title: 'Review regularly, not just before exams',
    description: 'Revisiting a topic every few days (spaced repetition) beats one big cram session.',
  },
]

export const healthTips: Tip[] = [
  {
    title: 'Sleep 8 hours',
    description: 'Your brain consolidates memory during sleep — an all-nighter before an exam usually backfires.',
  },
  {
    title: 'Stay hydrated',
    description: 'Even mild dehydration can affect concentration and short-term memory.',
  },
  {
    title: 'Eat balanced meals',
    description: 'Skipping breakfast on exam day can leave you tired and unfocused by mid-morning.',
  },
  {
    title: 'Move your body',
    description: 'A short walk or stretch between study sessions boosts focus and mood.',
  },
  {
    title: 'Take screen breaks',
    description: 'Try the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds.',
  },
  {
    title: 'Manage exam stress',
    description: 'Slow breathing and talking to someone you trust can calm nerves before a big test.',
  },
]

export const whyItMatters: Tip[] = [
  {
    title: 'Opens more choices',
    description: 'Strong grades widen your options for tertiary programs and scholarships, rather than narrowing them.',
  },
  {
    title: 'Builds habits that last',
    description: 'The discipline you build studying now carries straight into tertiary education and the workplace.',
  },
  {
    title: 'Scholarship opportunities',
    description: 'Many bursaries and scholarships set minimum grade requirements to qualify.',
  },
  {
    title: 'Confidence for the future',
    description: 'Doing well builds the self-belief to take on harder challenges later in life.',
  },
]

export const careerPaths: CareerPath[] = [
  {
    field: 'Medicine & Health Sciences',
    subjects: ['Biology', 'Chemistry', 'Physics', 'Mathematics'],
    description: 'Leads to Medicine, Nursing, Pharmacy, and Physiotherapy — typically long programs with strong science requirements.',
  },
  {
    field: 'Engineering',
    subjects: ['Mathematics', 'Physics', 'Additional Mathematics'],
    description: 'Leads to Civil, Electrical, Mechanical, Mining, and Computer Engineering degrees.',
  },
  {
    field: 'Computer Science & IT',
    subjects: ['Mathematics', 'Physics', 'Computer Studies'],
    description: 'Leads to Software Development, Data Science, Information Systems, and Cybersecurity.',
  },
  {
    field: 'Law',
    subjects: ['English', 'History', 'Setswana / Literature'],
    description: 'Leads to LLB and other law degrees — strong reading, writing, and argument skills matter most.',
  },
  {
    field: 'Business & Commerce',
    subjects: ['Mathematics', 'Accounting', 'Economics', 'Business Studies'],
    description: 'Leads to Accounting, Finance, Business Administration, and Economics degrees.',
  },
  {
    field: 'Education (Teaching)',
    subjects: ['English', 'Your specialist subject'],
    description: 'Leads to Primary or Secondary Education degrees — pair English with whatever subject you want to teach.',
  },
  {
    field: 'Agriculture & Environmental Science',
    subjects: ['Biology', 'Chemistry', 'Geography', 'Agriculture'],
    description: 'Leads to Agricultural Science, Environmental Management, and Veterinary Science.',
  },
  {
    field: 'Creative Arts & Media',
    subjects: ['Art', 'English', 'Design & Technology'],
    description: 'Leads to Graphic Design, Media Studies, and Architecture (which also needs Maths and Physics).',
  },
]
