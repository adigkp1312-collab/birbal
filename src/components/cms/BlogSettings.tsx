'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface BlogConfig {
  id: string
  user_id: string
  site_name: string
  site_description: string
  base_url: string
  default_author: string
  niche_keywords: string[]
  publish_schedule: string
  max_articles_per_week: number
  default_word_count: number
  default_tone: string
  categories: string[]
  auto_publish_after_review: boolean
  review_threshold: number
}

interface BlogSettingsProps {
  config: BlogConfig | null
}

export function BlogSettings({ config }: BlogSettingsProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [siteName, setSiteName] = useState(config?.site_name || 'My Blog')
  const [siteDescription, setSiteDescription] = useState(config?.site_description || '')
  const [baseUrl, setBaseUrl] = useState(config?.base_url || '')
  const [defaultAuthor, setDefaultAuthor] = useState(config?.default_author || '')
  const [nicheKeywords, setNicheKeywords] = useState((config?.niche_keywords || []).join(', '))
  const [publishSchedule, setPublishSchedule] = useState(config?.publish_schedule || '0 9 * * 1,3,5')
  const [maxPerWeek, setMaxPerWeek] = useState(config?.max_articles_per_week || 3)
  const [wordCount, setWordCount] = useState(config?.default_word_count || 1200)
  const [tone, setTone] = useState(config?.default_tone || 'professional')
  const [categories, setCategories] = useState((config?.categories || []).join(', '))
  const [autoPublish, setAutoPublish] = useState(config?.auto_publish_after_review !== false)
  const [reviewThreshold, setReviewThreshold] = useState(config?.review_threshold || 0.7)

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createClient()

      const updateData = {
        site_name: siteName,
        site_description: siteDescription,
        base_url: baseUrl,
        default_author: defaultAuthor,
        niche_keywords: nicheKeywords.split(',').map(s => s.trim()).filter(Boolean),
        publish_schedule: publishSchedule,
        max_articles_per_week: maxPerWeek,
        default_word_count: wordCount,
        default_tone: tone,
        categories: categories.split(',').map(s => s.trim()).filter(Boolean),
        auto_publish_after_review: autoPublish,
        review_threshold: reviewThreshold,
      }

      const { error } = await supabase
        .from('blog_config')
        .update(updateData)
        .eq('id', config?.id)

      if (error) throw error

      toast.success('Settings saved')
      router.refresh()
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Site Info */}
      <section className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-bold mb-4">Site Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
            <input
              type="text"
              value={siteName}
              onChange={e => setSiteName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site Description</label>
            <textarea
              value={siteDescription}
              onChange={e => setSiteDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
            <input
              type="url"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              placeholder="https://yourdomain.com"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Author</label>
            <input
              type="text"
              value={defaultAuthor}
              onChange={e => setDefaultAuthor(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </section>

      {/* AI Agent Config */}
      <section className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-bold mb-4">AI Agent Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Niche Keywords
              <span className="text-gray-400 font-normal ml-1">(comma-separated — the agent searches the web for these)</span>
            </label>
            <textarea
              value={nicheKeywords}
              onChange={e => setNicheKeywords(e.target.value)}
              placeholder="AI filmmaking, video production, storytelling"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categories
              <span className="text-gray-400 font-normal ml-1">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={categories}
              onChange={e => setCategories(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
              <select
                value={tone}
                onChange={e => setTone(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="friendly">Friendly</option>
                <option value="luxury">Luxury</option>
                <option value="authoritative">Authoritative</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Word Count</label>
              <input
                type="number"
                value={wordCount}
                onChange={e => setWordCount(parseInt(e.target.value, 10))}
                min={500}
                max={5000}
                step={100}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Automation Config */}
      <section className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-bold mb-4">Automation Pipeline</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Publish Schedule
              <span className="text-gray-400 font-normal ml-1">(cron expression)</span>
            </label>
            <input
              type="text"
              value={publishSchedule}
              onChange={e => setPublishSchedule(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Default: <code>0 9 * * 1,3,5</code> = Mon/Wed/Fri at 9am UTC
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Articles Per Week</label>
            <input
              type="number"
              value={maxPerWeek}
              onChange={e => setMaxPerWeek(parseInt(e.target.value, 10))}
              min={1}
              max={14}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Review Threshold
              <span className="text-gray-400 font-normal ml-1">(0-1, articles scoring above this auto-publish)</span>
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                value={reviewThreshold}
                onChange={e => setReviewThreshold(parseFloat(e.target.value))}
                min={0.3}
                max={0.95}
                step={0.05}
                className="flex-1"
              />
              <span className="text-sm font-mono w-12 text-right">
                {(reviewThreshold * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="autoPublish"
              checked={autoPublish}
              onChange={e => setAutoPublish(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="autoPublish" className="text-sm text-gray-700">
              Auto-publish after passing review (otherwise stays in review for manual approval)
            </label>
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
