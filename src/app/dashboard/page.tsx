import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LogOut, Sparkles, User, TrendingUp } from 'lucide-react'
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

  const signOut = async () => {
    'use server'
    const supabase = createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">LinkedIn Ghost</span>
          </div>
          <div className="flex items-center space-x-4">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Welcome Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Welcome back, {profile?.full_name || 'there'}!</CardTitle>
              <CardDescription>
                Ready to create some viral LinkedIn content?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {profile?.posts_generated_this_month || 0}
                  </p>
                  <p className="text-sm text-blue-600">Posts this month</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-gray-600">
                    {profile?.posts_limit || 3}
                  </p>
                  <p className="text-sm text-gray-600">Monthly limit</p>
                </div>
                <div className="bg-green-100 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {profile?.subscription_tier === 'pro' ? 'Pro' : 'Free'}
                  </p>
                  <p className="text-sm text-green-600">Plan</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/generate">
                <Button className="w-full" variant="default">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Post
                </Button>
              </Link>
              <Link href="/dashboard/voice">
                <Button className="w-full" variant="outline">
                  <User className="h-4 w-4 mr-2" />
                  Voice Profile
                </Button>
              </Link>
              <Link href="/dashboard/trending">
                <Button className="w-full" variant="outline">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Trending Ideas
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Posts */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Recent Posts</h2>
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <p>No posts generated yet.</p>
              <Link href="/dashboard/generate">
                <Button variant="link">Create your first post</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
