'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { joinEvent } from '@/lib/actions/events'

interface JoinEventButtonProps {
  code: string
  eventId: string
}

export function JoinEventButton({ code, eventId }: JoinEventButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleJoin() {
    setLoading(true)
    setError(null)

    const result = await joinEvent(code)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (result.alreadyHost) {
      router.push(`/events/${result.eventId}`)
      return
    }

    // Newly joined or already joined — go to enrollment
    router.push(`/join/${code}/enroll?event=${result.eventId}`)
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-terracotta/10 border border-terracotta/30 text-terracotta text-sm">
          {error}
        </div>
      )}
      <button
        onClick={handleJoin}
        disabled={loading}
        className="w-full bg-primary text-primary-foreground py-4 text-sm font-sans uppercase tracking-[0.2em] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Joining...' : 'Join Event →'}
      </button>
    </div>
  )
}
