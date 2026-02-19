import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { blogTemplates } from '../lib/blog-templates'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openaiApiKey = process.env.OPENAI_API_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const openai = new OpenAI({ apiKey: openaiApiKey })

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return response.data[0].embedding
}

async function seedBlogTemplates() {
  console.log('Seeding blog article templates...\n')

  for (const template of blogTemplates) {
    console.log(`Processing: ${template.name}`)

    const embeddingText = `${template.name}. ${template.description}. ${template.category}. ${template.template_structure}. ${template.example_post}`
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
      console.error(`  Error inserting ${template.name}:`, error.message)
    } else {
      console.log(`  Inserted: ${template.name}`)
    }
  }

  console.log('\nSeeding complete!')
}

seedBlogTemplates().catch(console.error)
