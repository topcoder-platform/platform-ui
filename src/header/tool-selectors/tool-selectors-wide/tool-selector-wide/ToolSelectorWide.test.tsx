import '@testing-library/jest-dom'
import { render, RenderResult } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import ToolSelectorWide from './ToolSelectorWide'

describe('<ToolSelectorWide />', () => {

    test('it should render the tools selector in wide format', () => {
        /*         const renderResult: RenderResult = render(
                    <MemoryRouter>
                        <ToolSelectorWide name='Tools 1' url='/tools-1' />
                    </MemoryRouter>
                )
                const toolSeletorElement: HTMLElement | null = renderResult.container.querySelector('.tool-selector')
                expect(toolSeletorElement).toBeInTheDocument() */
    })
})

describe('<ToolSelectorWide /> tool is the currently active tool', () => {

    test('it should render the tools selector active indicator', () => {
        /*         const renderResult: RenderResult = render(
                    <MemoryRouter initialEntries={['/tools']}>
                        <ToolSelectorWide name='Tools 1' url='/tools' />
                    </MemoryRouter>
                )
                const toolSeletorElement: HTMLElement | null = renderResult.container.querySelector('.tool-active')
                expect(toolSeletorElement).toBeInTheDocument() */
    })
})

describe('<ToolSelectorWide /> tool is NOT the currently active tool', () => {

    test('it should NOT render the tools selector active indicator', () => {
        /*         const renderResult: RenderResult = render(
                    <MemoryRouter>
                        <ToolSelectorWide name='Tools 1' url='/tools-1' />
                    </MemoryRouter>
                )
                const toolSeletorElement: HTMLElement | null = renderResult.container.querySelector('.tool-inactive')
                expect(toolSeletorElement).toBeInTheDocument() */
    })
})
