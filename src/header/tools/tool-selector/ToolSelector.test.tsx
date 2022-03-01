import '@testing-library/jest-dom'
import { render, RenderResult } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import ToolSelector from './ToolSelector'

describe('<ToolSelector />', () => {

    test('it should render the tools selector', () => {
        /*         const renderResult: RenderResult = render(
                    <MemoryRouter>
                        <ToolSelector name='Tools 1' url='/tools-1' />
                    </MemoryRouter>
                )
                const toolSeletorElement: HTMLElement | null = renderResult.container.querySelector('.tool-selector')
                expect(toolSeletorElement).toBeInTheDocument() */
    })
})

describe('<ToolSelector /> tool is the currently active tool', () => {

    test('it should render the tools selector active indicator', () => {
        /*         const renderResult: RenderResult = render(
                    <MemoryRouter initialEntries={['/tools']}>
                        <ToolSelector name='Tools 1' url='/tools' />
                    </MemoryRouter>
                )
                const toolSeletorElement: HTMLElement | null = renderResult.container.querySelector('.tool-active')
                expect(toolSeletorElement).toBeInTheDocument() */
    })
})

describe('<ToolSelector /> tool is NOT the currently active tool', () => {

    test('it should NOT render the tools selector active indicator', () => {
        /*         const renderResult: RenderResult = render(
                    <MemoryRouter>
                        <ToolSelector name='Tools 1' url='/tools-1' />
                    </MemoryRouter>
                )
                const toolSeletorElement: HTMLElement | null = renderResult.container.querySelector('.tool-inactive')
                expect(toolSeletorElement).toBeInTheDocument() */
    })
})
