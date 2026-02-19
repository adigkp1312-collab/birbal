import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BlogSettings } from '@/components/cms/BlogSettings'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get or create blog config
  let { data: config } = await supabase
    .from('blog_config')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!config) {
    // Create default config
    const { data: newConfig } = await supabase
      .from('blog_config')
      .insert({
        user_id: user.id,
        site_name: 'My Blog',
        site_description: 'AI-powered blog',
        niche_keywords: ['technology', 'AI'],
        categories: ['Technology', 'AI', 'Tutorials', 'Industry Trends'],
      })
      .select()
      .single()

    config = newConfig
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Blog Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure your automated blog pipeline.
        </p>
      </div>

      <BlogSettings config={config} />
    </div>
  )
}
