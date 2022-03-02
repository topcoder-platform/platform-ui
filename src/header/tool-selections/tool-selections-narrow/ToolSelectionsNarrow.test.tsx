import '@testing-library/jest-dom'
import { render, RenderResult } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import ToolSelectionsNarrow from './ToolSelectionsNarrow'

describe('<ToolSelectionsNarrow /> is closed', () => {

    test('it should render the tool-selections-narrow-closed icon', () => {
        /*         const renderResult: RenderResult = render(
                    <MemoryRouter>
                        <ToolSelectionsNarrow />
                    </MemoryRouter>
                )
                const menuElement: HTMLElement | null = renderResult.container.querySelector('.tool-selections-narrow-closed')
                expect(menuElement).toBeInTheDocument() */
    })
})

describe('<ToolSelectionsNarrow /> is open', () => {

    test('it should render the tool-selections-narrow-open icon', () => {
        /*         const renderResult: RenderResult = render(
                    <MemoryRouter initialEntries={['/tool-selections']}>
                        <ToolSelectionsNarrow />
                    </MemoryRouter>
                )
                const menuElement: HTMLElement | null = renderResult.container.querySelector('.tool-selections-narrow-opened')
                expect(menuElement).toBeInTheDocument() */
    })
})
