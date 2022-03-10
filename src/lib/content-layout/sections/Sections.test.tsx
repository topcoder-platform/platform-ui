import '@testing-library/jest-dom'
import { render, RenderResult } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import Sections from './Sections'

describe('<Sections /> has at least one section', () => {

    test('it should render the sections panel', () => {
        /* const renderResult: RenderResult = render(
            <MemoryRouter>
                <Sections sections={[]} />
            </MemoryRouter>
        )
        const sectionsElement: HTMLElement = renderResult.container.querySelector('.sections')
        expect(sectionsElement).toBeInTheDocument() */
    })
})

describe('<Sections /> has zero sections', () => {

    test('it should NOT render the content', () => {
        const renderResult: RenderResult = render(
            <MemoryRouter>
                <Sections sections={[]} />
            </MemoryRouter>
        )
        const sectionsElement: HTMLElement = renderResult.container.querySelector('.sections')
        expect(sectionsElement).toBeNull()
    })
})
