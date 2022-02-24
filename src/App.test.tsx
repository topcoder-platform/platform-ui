import { render, screen } from '@testing-library/react'

import App from './App'

test('renders welcome text', () => {
    render(<App />)
    const contentElement: HTMLElement = screen.getByText('Hi! From, Topcoder.')
    expect(contentElement).toBeInTheDocument()
})
