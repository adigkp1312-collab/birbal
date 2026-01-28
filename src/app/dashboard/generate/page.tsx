'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, Copy, Check, ArrowLeft, Wand2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

interface GeneratedPost {
  conservative: string
  balanced: string
  bold: string
}

interface TemplateUsed {
  name: string
  category: string
}

export default function GeneratePage() {
  const [topic, setTopic] = useState('')
  const [context, setContext] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState<GeneratedPost | null>(null)
  const [templatesUsed, setTemplatesUsed] = useState<TemplateUsed[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  const generatePost = async () => {
    if (!topic.trim() || topic.length < 3) {
      toast.error('Please enter a topic (at least 3 characters)')
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, context }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 403) {
          toast.error(data.error || 'Monthly limit reached')
        } else {
          toast.error(data.error || 'Failed to generate post')
        }
        return
      }

      setGenerated(data.variations)
      setTemplatesUsed(data.templatesUsed || [])
      toast.success('Post generated!')
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Failed to generate post')
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(null), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const PostVariation = ({ content, type, label }: { content: string; type: string; label: string }) => (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <Badge variant={type === 'conservative' ? 'secondary' : type === 'balanced' ? 'default' : 'destructive'}>
          {label}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyToClipboard(content, type)}
        >
          {copied === type ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div className="bg-slate-50 p-4 rounded-lg whitespace-pre-wrap text-sm leading-relaxed">
        {content}
      </div>
    </div>
  )

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
            <span className="text-xl font-bold">Generate Post</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Input Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wand2 className="h-5 w-5 mr-2" />
              What do you want to write about?
            </CardTitle>
            <CardDescription>
              Enter a topic and any additional context. We&apos;ll generate 3 variations for you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Topic *</label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Remote work productivity, Leadership lessons, Career pivot..."
                className="text-lg"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Additional Context (optional)</label>
              <Textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Any specific points you want to include, stories to reference, or angle you want to take..."
                className="min-h-[100px]"
              />
            </div>
            <Button
              onClick={generatePost}
              disabled={generating}
              className="w-full"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Crafting your post...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Post
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {generated && (
          <Card>
            <CardHeader>
              <CardTitle>Your Generated Posts</CardTitle>
              <CardDescription>
                Three variations based on your voice profile and proven templates.
              </CardDescription>
              {templatesUsed.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-sm text-gray-500">Templates used:</span>
                  {templatesUsed.map((t, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {t.name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="balanced" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="conservative">Conservative</TabsTrigger>
                  <TabsTrigger value="balanced">Balanced</TabsTrigger>
                  <TabsTrigger value="bold">Bold</TabsTrigger>
                </TabsList>
                <TabsContent value="conservative" className="mt-4">
                  <PostVariation
                    content={generated.conservative}
                    type="conservative"
                    label="Conservative - Play it safe"
                  />
                </TabsContent>
                <TabsContent value="balanced" className="mt-4">
                  <PostVariation
                    content={generated.balanced}
                    type="balanced"
                    label="Balanced - Middle ground"
                  />
                </TabsContent>
                <TabsContent value="bold" className="mt-4">
                  <PostVariation
                    content={generated.bold}
                    type="bold"
                    label="Bold - Take risks"
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
