import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LogOut, Sparkles, User, TrendingUp, FileText, Settings, Globe } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Blog stats
  const { count: totalArticles } = await supabase
    .from('blog_articles')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: publishedArticles } = await supabase
    .from('blog_articles')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'published')

  const { count: reviewArticles } = await supabase
    .from('blog_articles')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'review')

  const { count: pendingTopics } = await supabase
    .from('trending_topics')
    .select('*', { count: 'exact', head: true })
    .gt('expires_at', new Date().toISOString())

  // Recent articles
  const { data: recentArticles } = await supabase
    .from('blog_articles')
    .select('id, slug, title, status, published_at, created_at, word_count, review')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const signOut = async () => {
    'use server'
    const supabase = createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    review: 'bg-yellow-100 text-yellow-700',
    published: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">Birbal CMS</span>
          </div>
          <nav className="hidden md:flex items-center space-x-4">
            <Link href="/dashboard" className="text-sm font-medium text-gray-900">Dashboard</Link>
            <Link href="/dashboard/articles" className="text-sm text-gray-600 hover:text-gray-900">Articles</Link>
            <Link href="/dashboard/topics" className="text-sm text-gray-600 hover:text-gray-900">Topics</Link>
            <Link href="/dashboard/generate" className="text-sm text-gray-600 hover:text-gray-900">Generate</Link>
            <Link href="/dashboard/voice" className="text-sm text-gray-600 hover:text-gray-900">Brand Voice</Link>
            <Link href="/dashboard/settings" className="text-sm text-gray-600 hover:text-gray-900">Settings</Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/blog" target="_blank" className="text-sm text-blue-600 hover:underline flex items-center">
              <Globe className="h-3.5 w-3.5 mr-1" />
              View Blog
            </Link>
            <span className="text-sm text-gray-600">{user.email}</span>
            <form action={signOut}>
              <Button variant="outline" size="sm" type="submit">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-blue-600">{totalArticles || 0}</p>
              <p className="text-sm text-gray-500">Total Articles</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-green-600">{publishedArticles || 0}</p>
              <p className="text-sm text-gray-500">Published</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-yellow-600">{reviewArticles || 0}</p>
              <p className="text-sm text-gray-500">In Review</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-purple-600">{pendingTopics || 0}</p>
              <p className="text-sm text-gray-500">Pending Topics</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Welcome + Quick Actions */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Welcome back, {profile?.full_name || 'there'}!</CardTitle>
              <CardDescription>
                Your automated blog pipeline is running. Articles are discovered, generated, reviewed, and published automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Link href="/dashboard/articles">
                  <Button className="w-full" variant="default">
                    <FileText className="h-4 w-4 mr-2" />
                    Articles
                  </Button>
                </Link>
                <Link href="/dashboard/topics">
                  <Button className="w-full" variant="outline">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Topic Queue
                  </Button>
                </Link>
                <Link href="/dashboard/generate">
                  <Button className="w-full" variant="outline">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Post
                  </Button>
                </Link>
                <Link href="/dashboard/voice">
                  <Button className="w-full" variant="outline">
                    <User className="h-4 w-4 mr-2" />
                    Brand Voice
                  </Button>
                </Link>
                <Link href="/dashboard/settings">
                  <Button className="w-full" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </Link>
                <Link href="/blog" target="_blank">
                  <Button className="w-full" variant="outline">
                    <Globe className="h-4 w-4 mr-2" />
                    View Blog
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Pipeline Status */}
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Topic Discovery</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">Daily 6am</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Article Generation</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">MWF 9am</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">AI Review</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">Daily 12pm</span>
              </div>
              <hr className="my-2" />
              <p className="text-xs text-gray-400">
                All times UTC. Configure schedule in Settings.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Articles */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Articles</h2>
            <Link href="/dashboard/articles" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <Card>
            {recentArticles && recentArticles.length > 0 ? (
              <div className="divide-y">
                {recentArticles.map(article => (
                  <div key={article.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="font-medium text-gray-900 truncate">{article.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {article.word_count?.toLocaleString()} words &middot;{' '}
                        {new Date(article.published_at || article.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      {article.review?.overall_score != null && (
                        <span className="text-xs font-mono text-gray-400">
                          {(article.review.overall_score * 100).toFixed(0)}%
                        </span>
                      )}
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[article.status] || ''}`}>
                        {article.status}
                      </span>
                      <Link
                        href={`/dashboard/articles/${article.id}`}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <CardContent className="p-8 text-center text-gray-500">
                <p>No articles generated yet. The pipeline will create your first one soon.</p>
              </CardContent>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
