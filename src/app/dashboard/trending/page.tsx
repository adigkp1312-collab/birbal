'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, TrendingUp, ArrowLeft, Sparkles, Lightbulb } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

interface TrendingTopic {
  id: string
  topic: string
  category: string
  suggested_angles: string[]
  industries: string[]
  relevance_score: number
  created_at: string
}

export default function TrendingPage() {
  const [topics, setTopics] = useState<TrendingTopic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTopics()
  }, [])

  const fetchTopics = async () => {
    try {
      const response = await fetch('/api/trending-topics')
      if (response.ok) {
        const data = await response.json()
        setTopics(data.topics || [])
      } else {
        toast.error('Failed to fetch trending topics')
      }
    } catch (error) {
      console.error('Failed to fetch topics:', error)
      toast.error('Failed to fetch trending topics')
    } finally {
      setLoading(false)
    }
  }

  const navigateToGenerate = (topicStr: string, angle: string) => {
    const params = new URLSearchParams({
      topic: `${topicStr}: ${angle}`,
    })
    window.location.href = `/dashboard/generate?${params.toString()}`
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <span className="text-xl font-bold">Trending Ideas</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              What&apos;s Trending Now
            </CardTitle>
            <CardDescription>
              Hot topics from the news, curated with suggested angles for your LinkedIn posts.
            </CardDescription>
          </CardHeader>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : topics.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No trending topics available right now.</p>
              <p className="text-sm">Check back later!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {topics.map((topic) => (
              <Card key={topic.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="default">{topic.category}</Badge>
                        <span className="text-xs text-gray-500">
                          Relevance: {Math.round((topic.relevance_score || 0) * 100)}%
                        </span>
                      </div>
                      <CardTitle className="text-lg">{topic.topic}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                        <Lightbulb className="h-4 w-4 mr-1" />
                        Suggested Angles
                      </p>
                      <div className="space-y-2">
                        {topic.suggested_angles.map((angle, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <span className="text-sm">{angle}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigateToGenerate(topic.topic, angle)}
                            >
                              <Sparkles className="h-4 w-4 mr-1" />
                              Use
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                    {topic.industries && topic.industries.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {topic.industries.map((industry, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {industry}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
