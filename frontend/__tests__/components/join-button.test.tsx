import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { JoinEventButton } from '../../app/join/[code]/join-button'
import * as eventActions from '../../lib/actions/events'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock event actions
vi.mock('../../lib/actions/events', () => ({
  joinEvent: vi.fn(),
}))

describe('JoinEventButton Component', () => {
  it('renders Join Event button initially', () => {
    render(<JoinEventButton code="SUMMER2026" eventId="ev-123" />)
    expect(screen.getByText('Join Event →')).toBeInTheDocument()
  })

  it('shows error message when joinEvent returns an error', async () => {
    vi.spyOn(eventActions, 'joinEvent').mockResolvedValueOnce({
      error: 'Invalid or expired invite code',
    })

    render(<JoinEventButton code="INVALID" eventId="ev-999" />)
    
    const button = screen.getByRole('button', { name: /join event/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Invalid or expired invite code')).toBeInTheDocument()
    })
  })
})
