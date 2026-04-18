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

    router.push(`/events/${data.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <div className="mb-8">
        <Link href="/events" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to Events
        </Link>
      </div>

      <h1 className="font-serif text-4xl text-foreground mb-2">Create Event</h1>
      <p className="text-muted-foreground mb-10">
        Start a new photo collection for your special occasion.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-terracotta/10 border border-terracotta/30 text-terracotta text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label htmlFor="title" className="block text-sm font-sans uppercase tracking-wider text-muted-foreground mb-2">
            Event Name *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            className="w-full px-4 py-3 bg-surface border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
            placeholder="Sarah & John's Wedding"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-sans uppercase tracking-wider text-muted-foreground mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="w-full px-4 py-3 bg-surface border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors resize-none"
            placeholder="A brief description of your event..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="date" className="block text-sm font-sans uppercase tracking-wider text-muted-foreground mb-2">
              Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              className="w-full px-4 py-3 bg-surface border border-border text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-sans uppercase tracking-wider text-muted-foreground mb-2">
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              className="w-full px-4 py-3 bg-surface border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
              placeholder="The Grand Hotel, New York"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-border">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-4 text-sm font-sans uppercase tracking-[0.2em] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  )
}
