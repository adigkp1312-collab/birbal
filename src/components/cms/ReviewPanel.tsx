'use client'

interface ReviewPanelProps {
  review: {
    overall_score: number
    scores: {
      accuracy: number
      seo: number
      readability: number
      originality: number
      completeness: number
    }
    feedback: string
    issues: string[]
    passed: boolean
  } | null
}

const scoreLabels: Record<string, { label: string; weight: string }> = {
  accuracy: { label: 'Factual Accuracy', weight: '30%' },
  seo: { label: 'SEO Quality', weight: '25%' },
  readability: { label: 'Readability', weight: '20%' },
  originality: { label: 'Originality', weight: '15%' },
  completeness: { label: 'Completeness', weight: '10%' },
}

function getScoreColor(score: number): string {
  if (score >= 0.8) return 'text-green-600 bg-green-50'
  if (score >= 0.6) return 'text-yellow-600 bg-yellow-50'
  return 'text-red-600 bg-red-50'
}

function getBarColor(score: number): string {
  if (score >= 0.8) return 'bg-green-500'
  if (score >= 0.6) return 'bg-yellow-500'
  return 'bg-red-500'
}

export function ReviewPanel({ review }: ReviewPanelProps) {
  if (!review) {
    return (
      <div className="border rounded-xl p-6 text-center text-gray-400 text-sm">
        No review yet. This article hasn't been through the AI review pipeline.
      </div>
    )
  }

  return (
    <div className="border rounded-xl p-6 space-y-6">
      {/* Overall Score */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">AI Review</h3>
        <div className={`px-4 py-2 rounded-full font-bold text-lg ${getScoreColor(review.overall_score)}`}>
          {(review.overall_score * 100).toFixed(0)}%
          <span className="text-xs font-normal ml-2">
            {review.passed ? 'PASSED' : 'FAILED'}
          </span>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-3">
        {Object.entries(review.scores || {}).map(([key, score]) => {
          const meta = scoreLabels[key]
          if (!meta) return null
          return (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">{meta.label}</span>
                <span className="text-gray-400 text-xs">
                  weight: {meta.weight} | {(score * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getBarColor(score)}`}
                  style={{ width: `${score * 100}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Feedback */}
      {review.feedback && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Editorial Feedback</h4>
          <p className="text-sm text-gray-600">{review.feedback}</p>
        </div>
      )}

      {/* Issues */}
      {review.issues && review.issues.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Issues Found</h4>
          <ul className="space-y-1">
            {review.issues.map((issue, i) => (
              <li key={i} className="flex items-start text-sm">
                <span className="text-red-400 mr-2 mt-0.5">*</span>
                <span className="text-gray-600">{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
