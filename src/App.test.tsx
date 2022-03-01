import { render, RenderResult } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import App from './App'

test('renders the body of the application', () => {
    const result: RenderResult = render(
        <MemoryRouter>
            <App />
        </MemoryRouter>
    )
    const bodyElement: HTMLBodyElement | null = result.container.querySelector('body')
    expect(bodyElement).toBeDefined()
})
