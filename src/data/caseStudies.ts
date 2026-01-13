export interface CaseStudy {
  slug: string;
  title: string;
  category: string;
  summary: string;
  challenge: string;
  solution: string;
  results: string[];
  technologies: string[];
  metrics?: { label: string; value: string }[];
}

export const caseStudies: CaseStudy[] = [
  {
    slug: 'compliantphotos',
    title: 'CompliantPhotos.com',
    category: 'Full Stack AI System',
    summary: 'End-to-end vision AI system for passport photo regulatory compliance.',
    challenge: '[PLACEHOLDER: Describe the client challenge]',
    solution: '[PLACEHOLDER: Describe technical approach and architecture]',
    results: [
      'Automated 90% of manual quality control',
      'Sub-second latency for compliance checks',
      '[PLACEHOLDER: Additional metric]'
    ],
    technologies: ['Python', 'OpenCV', 'Google Gemini', 'FastAPI', 'React'],
    metrics: [
      { label: 'Automation Rate', value: '90%' },
      { label: 'Latency', value: '<1s' }
    ]
  },
  {
    slug: 'agent-orchestration',
    title: 'Agent Orchestration',
    category: 'Infrastructure & Scale',
    summary: 'High-concurrency autonomous agent platform at Meta.',
    challenge: '[PLACEHOLDER: Describe the engineering challenge]',
    solution: '[PLACEHOLDER: Describe technical approach]',
    results: [
      'Thousands of concurrent dynamic tool-use workflows',
      'Guaranteed state consistency',
      '[PLACEHOLDER: Additional metric]'
    ],
    technologies: ['Python', 'Distributed Systems', 'State Machines'],
    metrics: [
      { label: 'Concurrency', value: '1000s' },
      { label: 'Consistency', value: '100%' }
    ]
  }
];
