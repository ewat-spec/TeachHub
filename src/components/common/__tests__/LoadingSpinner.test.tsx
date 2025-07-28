import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoadingSpinner, LoadingOverlay, LoadingSkeleton } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />)
    const spinner = screen.getByRole('generic')
    expect(spinner).toBeInTheDocument()
  })

  it('renders with text', () => {
    render(<LoadingSpinner text="Loading data..." />)
    expect(screen.getByText('Loading data...')).toBeInTheDocument()
  })

  it('applies correct size classes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />)
    expect(document.querySelector('.h-4.w-4')).toBeInTheDocument()

    rerender(<LoadingSpinner size="lg" />)
    expect(document.querySelector('.h-8.w-8')).toBeInTheDocument()
  })
})

describe('LoadingOverlay', () => {
  it('shows overlay when loading', () => {
    render(
      <LoadingOverlay isLoading={true} text="Processing...">
        <div>Content</div>
      </LoadingOverlay>
    )
    
    expect(screen.getByText('Processing...')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('hides overlay when not loading', () => {
    render(
      <LoadingOverlay isLoading={false}>
        <div>Content</div>
      </LoadingOverlay>
    )
    
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })
})

describe('LoadingSkeleton', () => {
  it('renders correct number of skeleton items', () => {
    render(<LoadingSkeleton count={3} />)
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons).toHaveLength(3)
  })

  it('renders single skeleton by default', () => {
    render(<LoadingSkeleton />)
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons).toHaveLength(1)
  })
})