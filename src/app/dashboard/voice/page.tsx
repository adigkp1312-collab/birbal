'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, Trash2, Sparkles, CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface VoiceProfile {
  id: string
  tone: string
  formality_score: number
  emoji_usage: string
  vocabulary_level: string
  storytelling_style: string
  common_phrases: string[]
  sample_count: number
  is_calibrated: boolean
  full_analysis: Record<string, unknown>
  last_updated: string
}

export default function VoiceProfilePage() {
  const [samples, setSamples] = useState<string[]>(['', '', ''])
  const [profile, setProfile] = useState<VoiceProfile | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/voice-profile')
      if (response.ok) {
        const data = await response.json()
        if (data.profile) {
          setProfile(data.profile)
          setSamples(data.profile.writing_samples || ['', '', ''])
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    }
  }

  const addSample = () => {
    if (samples.length < 10) {
      setSamples([...samples, ''])
    }
  }

  const removeSample = (index: number) => {
    if (samples.length > 3) {
      setSamples(samples.filter((_, i) => i !== index))
    }
  }

  const updateSample = (index: number, value: string) => {
    const newSamples = [...samples]
    newSamples[index] = value
    setSamples(newSamples)
  }

  const analyzeVoice = async () => {
    const validSamples = samples.filter(s => s.trim().length > 50)
    if (validSamples.length < 3) {
      alert('Please provide at least 3 writing samples (50+ characters each)')
      return
    }

    setAnalyzing(true)
    try {
      const response = await fetch('/api/voice-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ samples: validSamples }),
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to analyze voice')
      }
    } catch (error) {
      console.error('Analysis error:', error)
      alert('Failed to analyze voice profile')
    } finally {
      setAnalyzing(false)
    }
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
            <span className="text-xl font-bold">Voice Profile</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Existing Profile */}
        {profile?.is_calibrated && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                    Your Voice is Calibrated
                  </CardTitle>
                  <CardDescription>
                    Based on {profile.sample_count} writing samples
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  Last updated: {new Date(profile.last_updated).toLocaleDateString()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tone</p>
                    <p className="text-lg">{profile.tone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Storytelling Style</p>
                    <p>{profile.storytelling_style}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Vocabulary Level</p>
                    <p>{profile.vocabulary_level}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Formality Score</p>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(profile.formality_score || 0.5) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm">{Math.round((profile.formality_score || 0.5) * 100)}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Emoji Usage</p>
                    <p>{profile.emoji_usage}</p>
                  </div>
                  {profile.common_phrases && profile.common_phrases.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Common Phrases</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {profile.common_phrases.map((phrase, i) => (
                          <Badge key={i} variant="secondary">{phrase}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sample Input */}
        <Card>
          <CardHeader>
            <CardTitle>
              {profile?.is_calibrated ? 'Update Your Voice' : 'Create Your Voice Profile'}
            </CardTitle>
            <CardDescription>
              Provide 3-10 samples of your writing (LinkedIn posts, emails, articles). 
              We&apos;ll analyze your unique voice to generate posts that sound like you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {samples.map((sample, index) => (
              <div key={index} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <Label>Sample {index + 1}</Label>
                  {samples.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSample(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
                <Textarea
                  value={sample}
                  onChange={(e) => updateSample(index, e.target.value)}
                  placeholder="Paste a LinkedIn post, email, or article you've written..."
                  className="min-h-[150px]"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {sample.length} characters
                </p>
              </div>
            ))}

            {samples.length < 10 && (
              <Button
                variant="outline"
                onClick={addSample}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Sample
              </Button>
            )}

            <Button
              onClick={analyzeVoice}
              disabled={analyzing}
              className="w-full"
              size="lg"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing your voice...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {profile?.is_calibrated ? 'Update Voice Profile' : 'Analyze My Voice'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
