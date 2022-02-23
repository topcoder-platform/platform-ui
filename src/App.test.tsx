import { render, RenderResult } from '@testing-library/react'

import App from './App'

test('renders the body of the application', () => {
    const result: RenderResult = render(<App />)
    const bodyElement: HTMLBodyElement | null = result.container.querySelector('body')
    expect(bodyElement).toBeDefined()
})
