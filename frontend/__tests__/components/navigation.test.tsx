import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { LandingNav } from '../../components/landing/nav'

describe('LandingNav', () => {
  it('renders the wordmark and the three rooms', () => {
    render(<LandingNav />)

    expect(screen.getAllByLabelText('Folio home')[0]).toBeInTheDocument()

    // The three tabs are the app's whole structure, so the nav must name them.
    // Each appears twice — desktop row and mobile sheet.
    for (const room of ['Photos', 'Create', 'Profile']) {
      expect(screen.getAllByText(room).length).toBeGreaterThan(0)
    }
  })

  it('offers both a sign-up and an invite-code path', () => {
    render(<LandingNav />)

    expect(screen.getAllByText('Start free')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Sign in')[0]).toBeInTheDocument()
    expect(screen.getAllByText('I have an invite code')[0]).toBeInTheDocument()
  })
})
