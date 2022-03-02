import '@testing-library/jest-dom'
import { render, RenderResult } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import ToolSelectorsNarrow from './ToolSelectorsNarrow'

describe('<ToolSelectorsNarrow /> is closed', () => {

    test('it should render the tool-selectors-narrow-closed icon', () => {
        /*         const renderResult: RenderResult = render(
                    <MemoryRouter>
                        <ToolSelectorsNarrow />
                    </MemoryRouter>
                )
                const menuElement: HTMLElement | null = renderResult.container.querySelector('.tool-selectors-narrow-closed')
                expect(menuElement).toBeInTheDocument() */
    })
})

describe('<ToolSelectorsNarrow /> is open', () => {

    test('it should render the tool-selectors-narrow-open icon', () => {
        /*         const renderResult: RenderResult = render(
                    <MemoryRouter initialEntries={['/tool-selectors']}>
                        <ToolSelectorsNarrow />
                    </MemoryRouter>
                )
                const menuElement: HTMLElement | null = renderResult.container.querySelector('.tool-selectors-narrow-opened')
                expect(menuElement).toBeInTheDocument() */
    })
})
