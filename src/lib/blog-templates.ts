export interface BlogTemplate {
  name: string
  category: string
  subcategory: string
  description: string
  template_structure: string
  example_post: string
  variables: string[]
}

export const blogTemplates: BlogTemplate[] = [
  {
    name: 'How-To Guide',
    category: 'tutorial',
    subcategory: 'how-to',
    description: 'Step-by-step instructional blog post that solves a specific problem',
    template_structure: `# [Title: How to X in Y Steps]

## Introduction (2-3 paragraphs)
- Hook: State the problem
- Why it matters
- What the reader will learn

## Prerequisites / What You Need
- Brief setup or requirements

## Step 1: [Action]
Detailed explanation with examples.

## Step 2: [Action]
Detailed explanation with examples.

## Step 3: [Action]
Detailed explanation with examples.

## Step 4: [Action]
Detailed explanation with examples.

## Common Mistakes to Avoid
- Mistake 1 and how to fix it
- Mistake 2 and how to fix it

## Conclusion
Summary + CTA (related articles, newsletter, etc.)`,
    example_post: 'How to Fine-Tune a Language Model for Your Business in 5 Steps',
    variables: ['problem', 'steps', 'prerequisites', 'mistakes', 'cta'],
  },
  {
    name: 'Listicle',
    category: 'listicle',
    subcategory: 'numbered-list',
    description: 'Numbered list article covering multiple items in a category',
    template_structure: `# [Number] Best/Top [Things] for [Audience/Purpose] in [Year]

## Introduction
- Why this list matters
- How items were selected

## 1. [Item Name]
Description, pros, cons, use case.

## 2. [Item Name]
Description, pros, cons, use case.

(Repeat for all items)

## How to Choose the Right [Thing]
Decision framework or comparison table.

## Conclusion
Top pick recommendation + CTA`,
    example_post: '10 Best AI Video Generators for Content Creators in 2026',
    variables: ['number', 'things', 'audience', 'items', 'decision_framework'],
  },
  {
    name: 'Comparison Post',
    category: 'comparison',
    subcategory: 'versus',
    description: 'Head-to-head comparison of two or more options',
    template_structure: `# [Option A] vs [Option B]: Which Is Better for [Use Case]?

## Introduction
- The dilemma
- Who this comparison is for

## Quick Comparison Table
| Feature | Option A | Option B |
|---------|----------|----------|

## [Option A] Overview
Strengths, weaknesses, pricing, best for.

## [Option B] Overview
Strengths, weaknesses, pricing, best for.

## Key Differences
Deep dive into 3-5 distinguishing factors.

## Which Should You Choose?
Recommendation by use case.

## Conclusion`,
    example_post: 'Runway vs Pika: Which AI Video Generator Wins in 2026?',
    variables: ['option_a', 'option_b', 'use_case', 'features', 'verdict'],
  },
  {
    name: 'Deep Dive Analysis',
    category: 'analysis',
    subcategory: 'deep-dive',
    description: 'In-depth analysis of a trend, technology, or industry shift',
    template_structure: `# [Topic]: A Deep Dive into [What's Changing]

## Introduction
- The shift happening
- Why it matters now

## Background / History
Brief context on how we got here.

## The Current State
What's happening right now with data and examples.

## Key Drivers
3-4 forces driving this change.

## Implications
What this means for different stakeholders.

## What's Next
Predictions backed by evidence.

## Conclusion
Key takeaways + what to watch.`,
    example_post: 'The Rise of AI-Generated Short-Form Content: A Deep Dive',
    variables: ['topic', 'background', 'current_state', 'drivers', 'implications', 'predictions'],
  },
  {
    name: "Beginner's Guide",
    category: 'educational',
    subcategory: 'beginner',
    description: 'Comprehensive introduction to a topic for newcomers',
    template_structure: `# The Complete Beginner's Guide to [Topic]

## Introduction
- What is [topic]?
- Why should you care?

## Key Concepts
3-5 fundamental concepts explained simply.

## How [Topic] Works
Clear explanation with analogies.

## Getting Started
First steps for a beginner.

## Tools and Resources
Recommended tools, courses, communities.

## FAQ
5-7 common questions answered.

## Next Steps
What to learn next + related articles.`,
    example_post: "The Complete Beginner's Guide to AI-Powered Content Creation",
    variables: ['topic', 'concepts', 'how_it_works', 'tools', 'faq'],
  },
  {
    name: 'Case Study',
    category: 'story',
    subcategory: 'case-study',
    description: 'Real-world example showing how a challenge was solved',
    template_structure: `# How [Company/Person] [Achieved Result] with [Method]

## The Challenge
What problem needed solving and why.

## The Approach
What strategy was chosen and why.

## Implementation
Step-by-step what was done.

## Results
Quantifiable outcomes with data.

## Key Lessons
3-5 takeaways others can apply.

## Conclusion
What this means for the industry.`,
    example_post: 'How a Solo Creator Generated 1M Views Using AI Video Tools',
    variables: ['subject', 'challenge', 'approach', 'results', 'lessons'],
  },
  {
    name: 'Trend Analysis',
    category: 'insight',
    subcategory: 'trend',
    description: 'Analysis of an emerging trend with evidence and predictions',
    template_structure: `# [Trend]: Why [Industry] Is [Changing] in [Year]

## Introduction
- The trend in one sentence
- Scale and speed of adoption

## Evidence
Data points, statistics, market reports.

## Who's Leading
Key players and examples.

## Impact on [Stakeholders]
How different groups are affected.

## Opportunities
Where the opportunities lie.

## Risks and Challenges
What could go wrong.

## Predictions
3-5 specific predictions with timelines.

## Conclusion`,
    example_post: 'Why AI-Generated Content Will Dominate SEO in 2026',
    variables: ['trend', 'industry', 'evidence', 'leaders', 'opportunities', 'risks', 'predictions'],
  },
  {
    name: 'FAQ Article',
    category: 'faq',
    subcategory: 'questions',
    description: 'Question-and-answer format optimized for featured snippets and FAQ schema',
    template_structure: `# [Topic]: Frequently Asked Questions

## Introduction
Brief overview of the topic.

## What is [Topic]?
Clear, concise answer.

## How does [Topic] work?
Step-by-step explanation.

## Why is [Topic] important?
Benefits and relevance.

## Who should use [Topic]?
Target audience description.

## How much does [Topic] cost?
Pricing breakdown.

## What are the alternatives to [Topic]?
Brief comparison.

## Is [Topic] worth it?
Honest assessment.

## Conclusion
Summary + CTA`,
    example_post: 'AI Content Generation: Everything You Need to Know (FAQ)',
    variables: ['topic', 'questions', 'answers'],
  },
  {
    name: 'Ultimate Guide',
    category: 'pillar',
    subcategory: 'comprehensive',
    description: 'Long-form pillar content covering a topic end-to-end with table of contents',
    template_structure: `# The Ultimate Guide to [Topic] in [Year]

## Table of Contents
(Auto-generated from H2 headings)

## Introduction
- What this guide covers
- Who it's for

## Chapter 1: [Fundamentals]
Everything you need to know to get started.

## Chapter 2: [Core Concepts]
The main principles and frameworks.

## Chapter 3: [Advanced Techniques]
Taking it to the next level.

## Chapter 4: [Tools and Resources]
Everything you need.

## Chapter 5: [Common Mistakes]
What to avoid.

## Chapter 6: [Future Outlook]
Where things are heading.

## Conclusion
Summary of key points + next steps.`,
    example_post: 'The Ultimate Guide to AI Video Production in 2026',
    variables: ['topic', 'chapters', 'tools', 'mistakes', 'outlook'],
  },
  {
    name: 'News Commentary',
    category: 'opinion',
    subcategory: 'news',
    description: 'Expert commentary on a recent event or announcement',
    template_structure: `# [Event/Announcement]: What It Means for [Industry/Audience]

## What Happened
Objective summary of the news.

## Context
Why this matters — historical context and significance.

## Analysis
Expert interpretation of what this means.

## Impact
How this affects different stakeholders.

## What to Do Now
Actionable advice for the reader.

## Looking Ahead
What to expect next.

## Conclusion`,
    example_post: "Google's New AI Video API: What It Means for Content Creators",
    variables: ['event', 'context', 'analysis', 'impact', 'advice'],
  },
]
