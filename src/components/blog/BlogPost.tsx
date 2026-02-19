'use client'

interface Section {
  heading: string
  content: string
}

interface BlogPostProps {
  article: {
    introduction: string
    sections: Section[]
    conclusion: string
  }
}

export function BlogPost({ article }: BlogPostProps) {
  return (
    <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900">
      {/* Introduction */}
      <div
        className="mb-8 text-lg leading-relaxed"
        dangerouslySetInnerHTML={{ __html: formatContent(article.introduction) }}
      />

      {/* Sections */}
      {article.sections.map((section, index) => (
        <section key={index} className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-10">
            {section.heading}
          </h2>
          <div
            className="leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatContent(section.content) }}
          />
        </section>
      ))}

      {/* Conclusion */}
      <section className="mb-8 mt-10 p-6 bg-gray-50 rounded-xl border-l-4 border-blue-500">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Conclusion</h2>
        <div
          className="leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatContent(article.conclusion) }}
        />
      </section>
    </div>
  )
}

/**
 * Convert markdown-style links and formatting to HTML.
 * Handles: [text](url), **bold**, *italic*, \n to <br/>
 */
function formatContent(text: string): string {
  if (!text) return ''

  return text
    // Convert markdown links to HTML
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>'
    )
    // Convert **bold** to <strong>
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Convert *italic* to <em>
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Convert double newlines to paragraphs
    .replace(/\n\n/g, '</p><p class="mb-4">')
    // Convert single newlines to <br/>
    .replace(/\n/g, '<br/>')
    // Wrap in paragraph if not already
    .replace(/^(.+)$/, '<p class="mb-4">$1</p>')
}
