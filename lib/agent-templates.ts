/**
 * Curated starter Agents. Shown on the agent creation form so a recruiter
 * can clone a sensible default and tweak instead of writing from scratch.
 */

export interface AgentTemplate {
  id: string;
  name: string;
  targetRole: string;
  level: string;
  voiceProfile: DeepgramVoice;
  persona: string;
  techstack: string[];
  questionBank: string[];
  summary: string;
}

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: "senior-fe",
    name: "Senior Frontend Engineer Screen",
    targetRole: "Frontend Engineer",
    level: "Senior",
    voiceProfile: "aura-2-odysseus-en",
    persona:
      "You are a senior frontend engineer running a 30-minute technical screen. Warm but rigorous. Probe depth on React internals and real production experience.",
    techstack: ["React", "TypeScript", "Next.js", "CSS"],
    summary:
      "30-min React + Next.js depth screen with system design lean.",
    questionBank: [
      "Tell me about yourself and the most interesting frontend project you've worked on.",
      "Walk me through React's reconciliation — what happens between commit and render?",
      "How would you architect a virtualised infinite list for 100k rows?",
      "Describe a tricky CSS or layout bug you fixed in production and how you debugged it.",
      "When would you reach for a state machine vs Redux vs React Query?",
      "Walk me through how you'd implement optimistic updates safely.",
      "What's the difference between SSR, SSG, and ISR — and when do you pick each?",
      "Tell me about a time you had to argue against a design decision the team made.",
    ],
  },
  {
    id: "staff-backend",
    name: "Staff Backend Engineer (Systems)",
    targetRole: "Backend Engineer",
    level: "Staff",
    voiceProfile: "aura-2-zeus-en",
    persona:
      "You are a staff backend engineer evaluating system-design depth. Push on trade-offs, scale, failure modes. Be skeptical of pat answers.",
    techstack: ["Go", "Postgres", "Kafka", "Redis", "Kubernetes"],
    summary:
      "Distributed systems + scale + on-call pragmatism.",
    questionBank: [
      "Walk me through a system you designed end-to-end that handles real production scale.",
      "Design a URL shortener that serves 1B requests/day. Walk through the storage, caching, and rate limiting.",
      "How would you make a write-heavy Postgres table not buckle under load?",
      "Describe a production incident you led — what was the root cause and what changed afterward?",
      "When does Kafka become the wrong choice?",
      "How do you reason about eventual consistency in a payment flow?",
      "What's your approach to debugging a slow query you've never seen before?",
      "Tell me about a time you cut scope to ship — what did you drop?",
    ],
  },
  {
    id: "pm-behavioral",
    name: "Product Manager Behavioral",
    targetRole: "Product Manager",
    level: "Senior",
    voiceProfile: "aura-2-thalia-en",
    persona:
      "You are a senior PM running a behavioural round. Conversational and curious. Probe specifics — what they did, not what 'the team' did.",
    techstack: ["product", "growth", "B2B SaaS"],
    summary: "STAR-format behavioural + product sense.",
    questionBank: [
      "Tell me about yourself and what drew you to product management.",
      "Walk me through a product launch you owned end-to-end. What went well, what didn't?",
      "Tell me about a time you disagreed with engineering about scope. How did you resolve it?",
      "How do you prioritise when everything feels urgent?",
      "Describe a feature you killed. What signal made you pull the trigger?",
      "Talk me through how you'd measure success for a new onboarding flow.",
      "Tell me about a stakeholder you couldn't win over — what did you learn?",
      "What's a product decision you regret and would do differently today?",
    ],
  },
  {
    id: "ml-mid",
    name: "ML Engineer Mid-level",
    targetRole: "Machine Learning Engineer",
    level: "Mid",
    voiceProfile: "aura-2-helena-en",
    persona:
      "You are an ML engineer running a mid-level screen. Balance applied skills and fundamentals. Avoid pure leetcode.",
    techstack: ["Python", "PyTorch", "MLOps", "SQL"],
    summary: "Applied ML, fundamentals, and a pinch of MLOps.",
    questionBank: [
      "Tell me about an ML model you shipped to production. What broke?",
      "Walk through how you'd diagnose a model whose accuracy is dropping in prod week-over-week.",
      "Explain bias-variance tradeoff with an example from your work.",
      "When would you pick a tree-based model over a neural net?",
      "How do you decide on a train/val/test split for time-series data?",
      "Describe your approach to feature stores — have you used one?",
      "How would you A/B test a new ranking model safely?",
      "What's the most expensive mistake you've seen in an ML pipeline?",
    ],
  },
  {
    id: "data-scientist",
    name: "Data Scientist Screen",
    targetRole: "Data Scientist",
    level: "Senior",
    voiceProfile: "aura-2-andromeda-en",
    persona:
      "You are a senior data scientist screening for analytical depth and business judgement. Calm, precise, push for clear reasoning.",
    techstack: ["Python", "SQL", "statistics", "experimentation"],
    summary: "Stats fundamentals + experimentation + storytelling.",
    questionBank: [
      "Tell me about an analysis that changed a business decision.",
      "Walk me through how you'd design an A/B test for a paywall change.",
      "What's the difference between a Type I and Type II error in business terms?",
      "Describe a dashboard you built that didn't get used. What went wrong?",
      "How do you handle a metric that's gaming itself?",
      "Walk me through a SQL query you're proud of — what made it tricky?",
      "How do you talk to non-technical stakeholders about uncertainty?",
      "What's an insight you found that the team initially rejected?",
    ],
  },
  {
    id: "junior-fullstack",
    name: "Junior Full-Stack Intro",
    targetRole: "Full-Stack Engineer",
    level: "Junior",
    voiceProfile: "aura-2-asteria-en",
    persona:
      "You are a friendly engineering manager running a junior-level intro chat. Lower the temperature. Look for curiosity and learning velocity, not deep expertise.",
    techstack: ["JavaScript", "Node.js", "React", "Git"],
    summary: "Warm intro — curiosity, recent projects, fundamentals.",
    questionBank: [
      "Tell me about yourself and what got you into engineering.",
      "What's the most interesting thing you've built recently?",
      "Walk me through what happens when I type a URL and hit enter.",
      "What's the difference between var, let, and const in JavaScript?",
      "Describe a bug that took you longer than expected to find.",
      "How do you usually approach a problem you've never seen before?",
      "What did you learn from the last code review you received?",
      "Where do you want to be in 18 months and what are you doing to get there?",
    ],
  },
  {
    id: "devops-sre",
    name: "DevOps / SRE Screen",
    targetRole: "Site Reliability Engineer",
    level: "Senior",
    voiceProfile: "aura-2-orion-en",
    persona:
      "You are a senior SRE running a screen. Hunt for production scar tissue. Avoid trivia, focus on real incidents and remediation patterns.",
    techstack: ["Linux", "Kubernetes", "Terraform", "AWS", "Observability"],
    summary: "Real incidents, ops maturity, infra-as-code.",
    questionBank: [
      "Tell me about the worst production incident you've been on call for.",
      "How do you set SLOs that the engineering team actually respects?",
      "Walk me through how you'd debug a service that's silently dropping 1% of requests.",
      "When do you reach for Kubernetes vs sticking with a simpler runtime?",
      "Describe your approach to infrastructure-as-code — what trips teams up?",
      "How do you run a blameless postmortem that actually changes behaviour?",
      "What's your strategy for keeping dependencies safely up-to-date in a fleet?",
      "Tell me about an automation you built that paid for itself in a month.",
    ],
  },
];
