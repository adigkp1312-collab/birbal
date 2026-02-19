'use client'

interface Topic {
  id: string
  topic: string
  category: string
  suggested_angles: string[]
  industries: string[]
  relevance_score: number
  expires_at: string
  created_at: string
}

interface TopicQueueProps {
  topics: Topic[]
}

export function TopicQueue({ topics }: TopicQueueProps) {
  if (topics.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No pending topics. The discovery agent will find new ones soon.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {topics.map((topic, index) => (
        <div
          key={topic.id}
          className="border rounded-xl p-5 hover:shadow-md transition-shadow bg-white"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs font-mono text-gray-400">#{index + 1}</span>
                <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                  {topic.category}
                </span>
                <span className="text-xs text-gray-400">
                  Score: {(topic.relevance_score * 100).toFixed(0)}%
                </span>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{topic.topic}</h3>
              {topic.suggested_angles && topic.suggested_angles.length > 0 && (
                <p className="text-sm text-gray-600 mb-2">{topic.suggested_angles[0]}</p>
              )}
              {topic.industries && topic.industries.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {topic.industries.map(kw => (
                    <span key={kw} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right text-xs text-gray-400 ml-4">
              <p>Discovered</p>
              <p>{new Date(topic.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              <p className="mt-2">Expires</p>
              <p>{new Date(topic.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
