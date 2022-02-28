import '@testing-library/jest-dom'
import { render, RenderResult } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import Tools from './Tools'

describe('<Tools />', () => {

    test('it should render the tools', () => {
        const renderResult: RenderResult = render(
            <MemoryRouter>
                <Tools />
            </MemoryRouter>
        )
        const headerElement: HTMLElement | null = renderResult.container.querySelector('.tools')
        expect(headerElement).toBeInTheDocument()
    })
})
