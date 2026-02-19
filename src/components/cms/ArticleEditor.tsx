'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface Section {
  heading: string
  content: string
}

interface Article {
  id: string
  slug: string
  title: string
  meta_description: string
  h1: string
  introduction: string
  sections: Section[]
  conclusion: string
  keywords: string[]
  category: string
  tags: string[]
  status: string
  author: string
  published_at: string | null
}

interface ArticleEditorProps {
  article: Article | null
}

export function ArticleEditor({ article }: ArticleEditorProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState(article?.title || '')
  const [slug, setSlug] = useState(article?.slug || '')
  const [metaDescription, setMetaDescription] = useState(article?.meta_description || '')
  const [h1, setH1] = useState(article?.h1 || '')
  const [introduction, setIntroduction] = useState(article?.introduction || '')
  const [sections, setSections] = useState<Section[]>(article?.sections || [{ heading: '', content: '' }])
  const [conclusion, setConclusion] = useState(article?.conclusion || '')
  const [keywords, setKeywords] = useState((article?.keywords || []).join(', '))
  const [category, setCategory] = useState(article?.category || '')
  const [status, setStatus] = useState(article?.status || 'draft')

  function updateSection(index: number, field: 'heading' | 'content', value: string) {
    const updated = [...sections]
    updated[index][field] = value
    setSections(updated)
  }

  function addSection() {
    setSections([...sections, { heading: '', content: '' }])
  }

  function removeSection(index: number) {
    setSections(sections.filter((_, i) => i !== index))
  }

  function generateSlug(text: string) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createClient()

      const data = {
        title,
        slug: slug || generateSlug(title),
        meta_description: metaDescription,
        h1: h1 || title,
        introduction,
        sections,
        conclusion,
        keywords: keywords.split(',').map(s => s.trim()).filter(Boolean),
        category,
        tags: keywords.split(',').map(s => s.trim()).filter(Boolean),
        status,
        ...(status === 'published' && !article?.published_at ? { published_at: new Date().toISOString() } : {}),
      }

      if (article) {
        // Update existing
        const { error } = await supabase
          .from('blog_articles')
          .update(data)
          .eq('id', article.id)

        if (error) throw error
        toast.success('Article saved')
      } else {
        // Create new — need to get user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { error } = await supabase
          .from('blog_articles')
          .insert({ ...data, user_id: user.id, word_count: countWords() })

        if (error) throw error
        toast.success('Article created')
      }

      router.refresh()
    } catch (error: any) {
      console.error('Save error:', error)
      toast.error(error.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  function countWords() {
    const text = [introduction, ...sections.map(s => s.content), conclusion].join(' ')
    return text.split(/\s+/).filter(Boolean).length
  }

  return (
    <div className="space-y-6">
      {/* SEO Preview */}
      <div className="border rounded-xl p-4 bg-white">
        <p className="text-xs text-gray-400 mb-2">Google Preview</p>
        <div className="text-blue-800 text-lg font-medium truncate">
          {title || 'Article Title'}
        </div>
        <div className="text-green-700 text-sm truncate">
          yoursite.com/blog/{slug || 'article-slug'}
        </div>
        <div className="text-gray-600 text-sm line-clamp-2">
          {metaDescription || 'Meta description will appear here...'}
        </div>
      </div>

      {/* Title & Slug */}
      <div className="border rounded-xl p-6 bg-white space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-gray-400">({title.length}/60)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => {
              setTitle(e.target.value)
              if (!article) setSlug(generateSlug(e.target.value))
            }}
            maxLength={80}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={e => setSlug(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meta Description <span className="text-gray-400">({metaDescription.length}/160)</span>
          </label>
          <textarea
            value={metaDescription}
            onChange={e => setMetaDescription(e.target.value)}
            maxLength={160}
            rows={2}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keywords (comma-separated)</label>
            <input
              type="text"
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* H1 */}
      <div className="border rounded-xl p-6 bg-white">
        <label className="block text-sm font-medium text-gray-700 mb-1">H1 Heading</label>
        <input
          type="text"
          value={h1}
          onChange={e => setH1(e.target.value)}
          placeholder={title || 'Same as title if left empty'}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Introduction */}
      <div className="border rounded-xl p-6 bg-white">
        <label className="block text-sm font-medium text-gray-700 mb-1">Introduction</label>
        <textarea
          value={introduction}
          onChange={e => setIntroduction(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Sections */}
      {sections.map((section, index) => (
        <div key={index} className="border rounded-xl p-6 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Section {index + 1}</label>
            {sections.length > 1 && (
              <button
                onClick={() => removeSection(index)}
                className="text-xs text-red-500 hover:underline"
              >
                Remove
              </button>
            )}
          </div>
          <input
            type="text"
            value={section.heading}
            onChange={e => updateSection(index, 'heading', e.target.value)}
            placeholder="H2 Heading"
            className="w-full px-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <textarea
            value={section.content}
            onChange={e => updateSection(index, 'content', e.target.value)}
            placeholder="Section content..."
            rows={6}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      ))}

      <button
        onClick={addSection}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        + Add Section
      </button>

      {/* Conclusion */}
      <div className="border rounded-xl p-6 bg-white">
        <label className="block text-sm font-medium text-gray-700 mb-1">Conclusion</label>
        <textarea
          value={conclusion}
          onChange={e => setConclusion(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border rounded-xl p-4 bg-white">
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="review">Send to Review</option>
            <option value="published">Publish Now</option>
          </select>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs text-gray-400">{countWords()} words</span>
          <button
            onClick={handleSave}
            disabled={saving || !title}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
