'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { joinEvent } from '@/lib/actions/events'
import { StampButton } from '@/components/folio/primitives'

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
      router.push(`/photos/events/${result.eventId}`)
      return
    }

    // Newly joined or already joined — go to enrollment
    router.push(`/join/${code}/enroll?event=${result.eventId}`)
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="border border-primary px-3 py-2 text-center font-mono text-[11px] uppercase tracking-[0.06em] text-primary">
          {error}
        </p>
      ) : null}
      <StampButton
        tone="primary"
        onClick={handleJoin}
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Joining…' : 'Join event →'}
      </StampButton>
    </div>
  )
}
