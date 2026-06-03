'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NewEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const event_date = formData.get('date') as string
    const location = formData.get('location') as string

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in to create an event')
      setLoading(false)
      return
    }

    const { data, error: insertError } = await supabase
      .from('events')
      .insert({
        host_id: user.id,
        title,
        description: description || null,
        event_date: event_date || null,
        settings: location ? { location } : {},
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push(`/dashboard/events/${data.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      {/* Breadcrumb */}
      <div className="mb-12">
        <Link href="/dashboard/events" className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground hover:text-foreground transition-all">
          ← Back to Events
        </Link>
      </div>

      <div className="mb-16">
        <h1 className="font-serif text-5xl text-foreground mb-4">Create Collection</h1>
        <p className="text-muted-foreground text-lg font-light leading-relaxed">
          Start a new visual narrative for your special occasion.
        </p>
      </div>

      {error && (
        <div className="mb-8 p-6 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-12 bg-card p-10 border border-border">
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-3">
              Event Title *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              className="w-full px-0 py-3 bg-transparent border-b border-border text-2xl font-serif text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary transition-colors"
              placeholder="Summer in Tuscany"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-3">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              className="w-full px-0 py-3 bg-transparent border-b border-border text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary transition-colors resize-none"
              placeholder="Capturing the golden hours..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <label htmlFor="date" className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-3">
                Date
              </label>
              <input
                id="date"
                name="date"
                type="date"
                className="w-full px-0 py-3 bg-transparent border-b border-border text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-3">
                Location
              </label>
              <input
                id="location"
                name="location"
                type="text"
                className="w-full px-0 py-3 bg-transparent border-b border-border text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary transition-colors"
                placeholder="Italy"
              />
            </div>
          </div>
        </div>

        <div className="pt-8">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-5 text-xs font-bold uppercase tracking-[0.3em] hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Initialize Event'}
          </button>
        </div>
      </form>
    </div>
  )
}
