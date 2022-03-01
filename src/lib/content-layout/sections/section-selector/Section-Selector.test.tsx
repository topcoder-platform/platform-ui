import '@testing-library/jest-dom'
import { render, RenderResult } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import SectionSelector from './Section-Selector'

describe('<SectionSelector />', () => {

    test('it should render the section selector', () => {
        const renderResult: RenderResult = render(
            <MemoryRouter>
                <SectionSelector icon={''} route={''} title={''} />
            </MemoryRouter>
        )
        const sectionSelectorElement: HTMLElement = renderResult.container.querySelector('.section-selector')
        expect(sectionSelectorElement).toBeInTheDocument()
    })
})
