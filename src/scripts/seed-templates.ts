import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openaiApiKey = process.env.OPENAI_API_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const openai = new OpenAI({ apiKey: openaiApiKey })

const templates = [
  // HOOK TEMPLATES (5)
  {
    name: 'Vulnerability Hook',
    category: 'hook',
    subcategory: 'vulnerability',
    description: 'Opens with a personal struggle or failure to create immediate connection',
    template_structure: 'I [embarrassing admission/weakness].\n\nMost people think [common misconception].\n\nBut the truth is [revelation].\n\n[3-4 sentences of supporting content]\n\n[Lesson learned]',
    example_post: 'I got rejected from 47 jobs before landing my first role in tech.\n\nMost people think you need a fancy degree or connections to break into this industry.\n\nBut the truth is: persistence beats pedigree every single time.\n\nI spent 6 months applying to everything. I customized each resume. I followed up. I networked awkwardly at meetups.\n\nThen one hiring manager saw something in me that 46 others missed.\n\nYour "no" is just someone else\'s "not yet." Keep going.',
    variables: ['embarrassing_admission', 'misconception', 'revelation', 'supporting_content', 'lesson'],
  },
  {
    name: 'Contrarian Hook',
    category: 'hook',
    subcategory: 'contrarian',
    description: 'Challenges conventional wisdom to grab attention',
    template_structure: '[Popular advice/trend] is destroying your [outcome].\n\nHere\'s what nobody tells you:\n\n[3-4 counterintuitive points]\n\n[Alternative approach]\n\n[Call to action]',
    example_post: 'Hustle culture is destroying your creativity.\n\nHere\'s what nobody tells you:\n\n• Working 80-hour weeks doesn\'t make you more productive—it makes you more replaceable\n• Your best ideas come in the shower, not at 2 AM\n• Rest is not the reward; it\'s part of the process\n• The most successful people I know work 35 hours and think for 20\n\nStop glorifying burnout. Start optimizing for insight.\n\nYour brain will thank you.',
    variables: ['popular_advice', 'outcome', 'counter_points', 'alternative', 'cta'],
  },
  {
    name: 'Number Hook',
    category: 'hook',
    subcategory: 'number',
    description: 'Uses specific numbers to create credibility and curiosity',
    template_structure: '[Number] [things] that [transformed my X/helped me achieve Y]:\n\n1. [Point one]\n2. [Point two]\n3. [Point three]\n4. [Point four]\n5. [Point five]\n\n[Brief elaboration on one point]\n\n[Closing insight/question]',
    example_post: '7 tiny habits that transformed my productivity:\n\n1. 2-minute rule: If it takes <2 min, do it now\n2. Phone in another room during deep work\n3. "Eat the frog"—hardest task first\n4. Time-block your calendar like meetings\n5. Single-tab browsing (game changer)\n6. 52/17 work/break intervals\n7. Prep tomorrow\'s to-do list today\n\nThe 2-minute rule alone saved me 5+ hours per week. No more "I\'ll do it later" mental overhead.\n\nWhich one will you try first?',
    variables: ['number', 'things', 'achievement', 'points', 'elaboration', 'closing'],
  },
  {
    name: 'Story Hook',
    category: 'hook',
    subcategory: 'story',
    description: 'Opens with a narrative moment to draw readers in',
    template_structure: 'It was [time/setting]. I was [situation].\n\n[Build tension with 2-3 sentences]\n\nThen [turning point/climax].\n\n[Resolution and lesson]\n\n[Universal insight]',
    example_post: 'It was 3 AM. I was staring at my laptop in an empty office.\n\nMy startup was 2 weeks from running out of money. My co-founder had just quit. I had $847 in my personal account.\n\nThen my phone buzzed. It was an email: "We\'d like to invest."\n\nThat $500K check didn\'t just save the company—it taught me that persistence looks a lot like delusion until it works.\n\nMost people quit right before the miracle. Don\'t be most people.',
    variables: ['time', 'situation', 'tension', 'turning_point', 'resolution', 'insight'],
  },
  {
    name: 'Question Hook',
    category: 'hook',
    subcategory: 'question',
    description: 'Asks a provocative question to engage the reader',
    template_structure: 'What if [challenging assumption/provocative scenario]?\n\n[Address the obvious objection]\n\n[3-4 supporting arguments]\n\n[Practical application]\n\n[Thought-provoking close]',
    example_post: 'What if everything you believe about networking is wrong?\n\n"But I go to events and collect business cards!"\n\nThat\'s not networking. That\'s collecting paper.\n\nReal networking is:\n• Giving before asking (for 6+ months)\n• Remembering details about people\'s kids/dogs/projects\n• Making introductions without expecting anything back\n• Showing up consistently, not just when you need something\n\nI built my entire career on 3 genuine relationships, not 300 LinkedIn connections.\n\nQuality compounds. Quantity distracts.',
    variables: ['provocative_question', 'objection', 'arguments', 'application', 'close'],
  },

  // STRUCTURE TEMPLATES (5)
  {
    name: 'Before/After Structure',
    category: 'structure',
    subcategory: 'before-after',
    description: 'Contrasts past struggles with current success',
    template_structure: 'Before:\n• [Problem state 1]\n• [Problem state 2]\n• [Problem state 3]\n\nAfter:\n• [Improved state 1]\n• [Improved state 2]\n• [Improved state 3]\n\nThe difference? [Key insight/solution]\n\n[Actionable advice]',
    example_post: 'Before:\n• 60-hour weeks, always behind\n• Saying yes to everything\n• Constantly firefighting\n\nAfter:\n• 40-hour weeks, ahead of schedule\n• Ruthless prioritization\n• Proactive, not reactive\n\nThe difference? I stopped managing time and started managing energy.\n\nYour calendar is a reflection of your values. If it\'s full of other people\'s priorities, you\'re not leading—you\'re following.\n\nAudit your energy, not just your time.',
    variables: ['before_problems', 'after_improvements', 'difference', 'advice'],
  },
  {
    name: 'Framework Structure',
    category: 'structure',
    subcategory: 'framework',
    description: 'Presents a memorable acronym or framework',
    template_structure: 'I\'ve used the [NAME] framework for [time/result]:\n\n[N] - [Explanation]\n[A] - [Explanation]\n[M] - [Explanation]\n[E] - [Explanation]\n\n[Example in action]\n\n[How to get started]',
    example_post: 'I\'ve used the GROW framework for every career decision:\n\nG - Goal: What do I actually want?\nR - Reality: Where am I now?\nO - Options: What paths exist?\nW - Will: What will I actually do?\n\nExample: When I considered leaving my corporate job\n• Goal: Freedom to work on meaningful problems\n• Reality: Golden handcuffs, but savings buffer\n• Options: Quit, negotiate sabbatical, or side-hustle\n• Will: Negotiated 3-month sabbatical to test the waters\n\nBest decision I ever made.\n\nWhat decision are you avoiding? Run it through GROW.',
    variables: ['framework_name', 'time_result', 'components', 'example', 'start_advice'],
  },
  {
    name: 'Myth-Buster Structure',
    category: 'structure',
    subcategory: 'myth-buster',
    description: 'Debunks common misconceptions with evidence',
    template_structure: 'Myth: [Common misconception]\n\nReality: [The truth]\n\nWhy people believe it:\n• [Reason 1]\n• [Reason 2]\n• [Reason 3]\n\nWhat the data actually shows:\n[Evidence/insight]\n\n[Practical takeaway]',
    example_post: 'Myth: You need to be an extrovert to be a great leader.\n\nReality: Introverted leaders often outperform extroverts in complex environments.\n\nWhy people believe it:\n• We confuse charisma with competence\n• Extroverts are more visible (survivorship bias)\n• Hollywood shows leaders as loud and commanding\n\nWhat the research actually shows:\nIntroverted leaders listen more, think deeper, and create space for others\' ideas. In knowledge work, that\'s everything.\n\nStop trying to be the loudest voice. Start being the clearest thinker.',
    variables: ['myth', 'reality', 'reasons', 'evidence', 'takeaway'],
  },
  {
    name: 'How-To Structure',
    category: 'structure',
    subcategory: 'how-to',
    description: 'Step-by-step instructional format',
    template_structure: 'How to [achieve desirable outcome] in [timeframe]:\n\nStep 1: [Action]\n[1-2 sentence explanation]\n\nStep 2: [Action]\n[1-2 sentence explanation]\n\nStep 3: [Action]\n[1-2 sentence explanation]\n\nStep 4: [Action]\n[1-2 sentence explanation]\n\n[Common pitfall to avoid]\n\n[Encouraging close]',
    example_post: 'How to write a LinkedIn post that gets 10K+ views:\n\nStep 1: Write the hook last\nYour first line is everything. Spend 50% of your time here.\n\nStep 2: Use line breaks like punctuation\nWhite space is your friend. Dense paragraphs = death.\n\nStep 3: Tell one story, not three\nFocus beats comprehensiveness every time.\n\nStep 4: End with a question or insight\nGive people something to do or think about.\n\nBiggest mistake? Writing for yourself instead of your reader.\n\nYour expertise isn\'t valuable if nobody reads it.',
    variables: ['outcome', 'timeframe', 'steps', 'pitfall', 'close'],
  },
  {
    name: 'Lessons Learned Structure',
    category: 'structure',
    subcategory: 'lessons',
    description: 'Shares wisdom from experience',
    template_structure: '[Number] lessons from [experience/timeframe]:\n\n[Lesson 1]: [Explanation with personal story]\n\n[Lesson 2]: [Explanation with personal story]\n\n[Lesson 3]: [Explanation with personal story]\n\n[Lesson 4]: [Explanation with personal story]\n\n[Lesson 5]: [Explanation with personal story]\n\n[Overarching insight]',
    example_post: '10 lessons from 10 years in tech:\n\n1. Your network is your net worth (cliché but true)\n\n2. The best opportunities aren\'t posted publicly\n\n3. Skills get you hired; relationships get you promoted\n\n4. Imposter syndrome means you\'re growing\n\n5. The people who advance fastest ask for what they want\n\n6. Your manager\'s success is your success—help them win\n\n7. Document everything. Your memory is worse than you think.\n\n8. The 20% of skills that matter change every 3 years\n\n9. Kindness is a competitive advantage\n\n10. No one remembers your failures as clearly as you do\n\nThe decade flew by. Focus on what (and who) matters.',
    variables: ['number', 'experience', 'lessons', 'insight'],
  },

  // CTA TEMPLATES (5)
  {
    name: 'Engagement CTA',
    category: 'cta',
    subcategory: 'engagement',
    description: 'Prompts comments and discussion',
    template_structure: '[Valuable content body]\n\nWhat\'s your experience with [topic]?\n\nDrop a comment below.\n\nOR\n\nAgree or disagree? Let me know in the comments.',
    example_post: 'Remote work isn\'t the future—it\'s the present.\n\nCompanies still forcing RTO are losing their best people. Not because employees are lazy, but because flexibility has become table stakes.\n\nThe companies winning right now?\n• Trust their teams\n• Measure outcomes, not hours\n• Create intentional in-person moments\n• Hire globally, not locally\n\nWhat\'s your take: fully remote, hybrid, or in-office?\n\nDrop your experience below.',
    variables: ['content', 'topic', 'question'],
  },
  {
    name: 'Value CTA',
    category: 'cta',
    subcategory: 'value',
    description: 'Offers additional resources',
    template_structure: '[Valuable content body]\n\nI put together a [resource] with [specific value proposition].\n\nComment "[keyword]" and I\'ll send it to you.\n\n(Must be following so I can DM)',
    example_post: 'I\'ve reviewed 10,000+ resumes as a hiring manager.\n\nThe difference between "meh" and "must interview"?\n\n• Specific metrics, not vague responsibilities\n• Story arcs, not job descriptions\n• Tailored positioning, not one-size-fits-all\n\nI put together a resume template that got me interviews at Google, Meta, and Stripe.\n\nComment "TEMPLATE" and I\'ll send it to you.\n\n(Must be following so I can DM)',
    variables: ['content', 'resource', 'value_prop', 'keyword'],
  },
  {
    name: 'Soft CTA',
    category: 'cta',
    subcategory: 'soft',
    description: 'Gentle invitation without pressure',
    template_structure: '[Valuable content body]\n\n[Insightful closing thought]\n\n[Optional: Follow for more on this topic]',
    example_post: 'The most underrated career skill?\n\nKnowing when to quit.\n\nNot giving up—strategic quitting.\n\nQuitting the project that\'s going nowhere.\nQuitting the job that\'s making you miserable.\nQuitting the identity that no longer fits.\n\nSunk cost is a trap. The best time to change direction was yesterday. The second best time is now.\n\nFollow for more unpopular career opinions.',
    variables: ['content', 'closing', 'optional_follow'],
  },
  {
    name: 'Poll CTA',
    category: 'cta',
    subcategory: 'poll',
    description: 'Creates engagement through choice',
    template_structure: '[Valuable content body]\n\nWhich resonates more?\n\nA) [Option A]\nB) [Option B]\nC) [Option C]\n\nVote in the comments!',
    example_post: 'There are 3 types of professionals:\n\nBuilders - create from scratch\nOptimizers - improve what exists\nOperators - keep things running\n\nMost teams need all three, but we overvalue builders and undervalue operators.\n\nWhich are you?\n\nA) Builder - I love 0→1\nB) Optimizer - I make good things great\nC) Operator - I\'m the glue that holds it together\n\nVote below! 👇',
    variables: ['content', 'options', 'prompt'],
  },
  {
    name: 'Challenge CTA',
    category: 'cta',
    subcategory: 'challenge',
    description: 'Issues a challenge to the reader',
    template_structure: '[Valuable content body]\n\nHere\'s my challenge to you:\n\n[Specific action] for [timeframe].\n\n[Expected outcome]\n\nWho\'s in?',
    example_post: 'Your calendar is lying to you.\n\n"Busy" doesn\'t mean productive.\n"Full" doesn\'t mean meaningful.\n\nHere\'s my challenge to you:\n\nBlock 2 hours this week with NOTHING scheduled.\nNo meetings. No email. No "quick syncs."\n\nUse that time for the important, not the urgent.\n\nYou\'ll be shocked at what becomes possible when you reclaim your attention.\n\nWho\'s in? Comment "I\'m in" below.',
    variables: ['content', 'challenge', 'timeframe', 'outcome'],
  },

  // FULL POST TEMPLATES (5)
  {
    name: 'Career Story Post',
    category: 'full-post',
    subcategory: 'career-story',
    description: 'Complete career journey narrative',
    template_structure: 'I went from [starting point] to [end point] in [timeframe].\n\nEveryone thinks it was [common assumption].\n\nBut here\'s what actually happened:\n\n[Obstacle 1] → [How I overcame it]\n[Obstacle 2] → [How I overcame it]\n[Obstacle 3] → [How I overcame it]\n\nThe real game-changer? [Key insight]\n\n[Advice for others on similar path]\n\n[Question to audience]',
    example_post: 'I went from $42K to $400K total comp in 7 years.\n\nEveryone thinks it was because I\'m "smart" or got lucky.\n\nBut here\'s what actually happened:\n\nYear 1-2: Learned to code nights and weekends while working retail\nYear 3: First dev job, imposter syndrome daily, absorbed everything\nYear 4: Pivoted to product, took a pay cut for the right experience\nYear 5-6: Built something people wanted, got noticed\nYear 7: Leveraged proof of work for the right role\n\nThe real game-changer? Documenting everything publicly.\n\nYour work can\'t speak for itself if nobody sees it.\n\nWhat\'s holding you back from sharing your journey?',
    variables: ['start', 'end', 'timeframe', 'assumption', 'obstacles', 'insight', 'advice', 'question'],
  },
  {
    name: 'Hot Take Post',
    category: 'full-post',
    subcategory: 'hot-take',
    description: 'Controversial opinion with supporting arguments',
    template_structure: 'Unpopular opinion: [Provocative statement]\n\nBefore you react, hear me out:\n\n[Argument 1 with evidence]\n\n[Argument 2 with evidence]\n\n[Argument 3 with evidence]\n\n[Address the counter-argument]\n\n[Nuanced conclusion]\n\n[Invite discussion]',
    example_post: 'Unpopular opinion: MBAs are becoming a liability in tech.\n\nBefore you react, hear me out:\n\n1. The frameworks taught are 10-20 years behind market reality\n2. The opportunity cost (2 years + $200K) compounds massively\n3. Network effects matter less when talent is global and remote\n\n"But the network!"\n\nBuilding in public creates a better network than any classroom. It\'s global, diverse, and based on demonstrated skill, not shared debt.\n\nI\'m not anti-education. I\'m anti-expensive credentials that don\'t keep pace with change.\n\nWhat\'s a "safe" career investment that might not be?',
    variables: ['opinion', 'arguments', 'counter', 'conclusion', 'discussion'],
  },
  {
    name: 'Tutorial Post',
    category: 'full-post',
    subcategory: 'tutorial',
    description: 'Educational content with clear steps',
    template_structure: 'I\'ve [achieved result] [number] times.\n\nHere\'s the exact process:\n\n[Step 1]\n[Detailed explanation]\n\n[Step 2]\n[Detailed explanation]\n\n[Step 3]\n[Detailed explanation]\n\n[Step 4]\n[Detailed explanation]\n\n[Common mistakes to avoid]\n\n[Resources/tools mentioned]\n\n[Follow-up offer]',
    example_post: 'I\'ve grown 3 LinkedIn accounts to 50K+ followers.\n\nHere\'s the exact process:\n\nPhase 1: Foundation (Weeks 1-4)\nPost daily, even if nobody engages. Algorithm needs data to learn who to show you to.\n\nPhase 2: Double Down (Weeks 5-12)\nFind your top 20% of posts. Make more of those. Kill what\'s not working.\n\nPhase 3: Community (Months 3-6)\nReply to every comment. Engage on others\' posts. Become known for showing up.\n\nPhase 4: Leverage (Month 6+)\nRepurpose top content. Collaborate. Build beyond the platform.\n\nBiggest mistake? Quitting in Phase 1 because "it\'s not working."\n\nI documented the entire system. Comment "SYSTEM" and I\'ll share it.',
    variables: ['result', 'number', 'steps', 'mistakes', 'resources', 'offer'],
  },
  {
    name: 'Announcement Post',
    category: 'full-post',
    subcategory: 'announcement',
    description: 'Shares news with context and gratitude',
    template_structure: 'I\'m [excited/honored/thrilled] to share that [announcement].\n\n[Context: journey to this moment]\n\n[What this means]\n\n[Thank specific people]\n\n[What\'s next]\n\n[Call to action/community invite]',
    example_post: 'I\'m thrilled to share that I\'m joining Acme Corp as VP of Product.\n\n5 years ago, I was a junior PM drowning in imposter syndrome.\n\nToday, I get to lead a team of 50+ brilliant people building the future of [industry].\n\nThank you to:\n• Sarah, who took a chance on me when I had zero experience\n• My team at StartupXYZ who taught me everything\n• The LinkedIn community whose feedback shaped my thinking\n\nWhat\'s next? I\'m hiring. If you\'re passionate about [mission], let\'s talk.\n\nDM me or comment below.',
    variables: ['emotion', 'announcement', 'context', 'meaning', 'thanks', 'next', 'cta'],
  },
  {
    name: 'Industry Insight Post',
    category: 'full-post',
    subcategory: 'insight',
    description: 'Thought leadership on industry trends',
    template_structure: 'I\'ve spent [time] in [industry].\n\nHere\'s what I\'m seeing that most people miss:\n\n[Trend/Observation 1]\n[Why it matters]\n\n[Trend/Observation 2]\n[Why it matters]\n\n[Trend/Observation 3]\n[Why it matters]\n\n[What this means for professionals]\n\n[How to position yourself]\n\n[Question to spark discussion]',
    example_post: 'I\'ve spent 15 years in B2B SaaS.\n\nHere\'s what I\'m seeing that most people miss:\n\n1. PLG (Product-Led Growth) is table stakes\nThe companies winning don\'t have better sales teams—they have better products that sell themselves.\n\n2. AI isn\'t replacing humans; it\'s amplifying the best ones\nThe 10x employee is becoming the 100x employee. Average is officially over.\n\n3. Vertical SaaS is eating horizontal\nGeneric tools can\'t compete with industry-specific solutions.\n\nWhat this means:\nIf you\'re in SaaS, deep domain expertise beats generalist skills.\n\nHow to position yourself:\nBecome the person who understands BOTH the tech AND the industry.\n\nWhat trends are you seeing in your space?',
    variables: ['time', 'industry', 'trends', 'implications', 'positioning', 'question'],
  },
]

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return response.data[0].embedding
}

async function seedTemplates() {
  console.log('Starting to seed templates...')

  for (const template of templates) {
    console.log(`Processing: ${template.name}`)

    const embeddingText = `${template.name}. ${template.description}. ${template.template_structure}. ${template.example_post}`
    const embedding = await generateEmbedding(embeddingText)

    const { error } = await supabase.from('viral_templates').insert({
      name: template.name,
      category: template.category,
      subcategory: template.subcategory,
      description: template.description,
      template_structure: template.template_structure,
      example_post: template.example_post,
      variables: template.variables,
      embedding: JSON.stringify(embedding),
    })

    if (error) {
      console.error(`Error inserting ${template.name}:`, error)
    } else {
      console.log(`✓ Inserted: ${template.name}`)
    }
  }

  console.log('Seeding complete!')
}

seedTemplates().catch(console.error)
