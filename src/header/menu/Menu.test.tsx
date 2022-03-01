import '@testing-library/jest-dom'
import { render, RenderResult } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import Menu from './Menu'

describe('<Menu /> is closed', () => {

    test('it should render the menu-closed icon', () => {
        /*         const renderResult: RenderResult = render(
                    <MemoryRouter>
                        <Menu />
                    </MemoryRouter>
                )
                const menuElement: HTMLElement | null = renderResult.container.querySelector('.menu-closed')
                expect(menuElement).toBeInTheDocument() */
    })
})

describe('<Menu /> is open', () => {

    test('it should render the menu-open icon', () => {
        /*         const renderResult: RenderResult = render(
                    <MemoryRouter initialEntries={['/menu']}>
                        <Menu />
                    </MemoryRouter>
                )
                const menuElement: HTMLElement | null = renderResult.container.querySelector('.menu-opened')
                expect(menuElement).toBeInTheDocument() */
    })
})
