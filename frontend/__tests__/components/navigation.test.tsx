import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Navigation } from '../../components/landing/navigation'

describe('Navigation Component', () => {
  it('renders brand name and main navigation links', () => {
    render(<Navigation />)
    
    // Brand name
    expect(screen.getByText('Folio')).toBeInTheDocument()

    // Nav links (desktop + mobile drawer)
    expect(screen.getAllByText('How it works')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Products')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Pricing')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Join')[0]).toBeInTheDocument()

    // Action buttons
    expect(screen.getAllByText('Sign in')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Get started')[0]).toBeInTheDocument()
  })
})
