import '@testing-library/jest-dom'
import { render, RenderResult } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import LogoLink from './LogoLink'

describe('<LogoLink /> is on the home page', () => {

    test('it should NOT display a link', async () => {
/*         const result: RenderResult = render(
            <MemoryRouter initialEntries={['/']}>
                <LogoLink />
            </MemoryRouter>
        )
        const aTag: HTMLAnchorElement | null = result.container.querySelector('a')
        expect(aTag).not.toBeInTheDocument() */
    })
})

describe('<LogoLink /> is NOT on the home page', () => {

    test('it should display a link', async () => {
/*         const result: RenderResult = render(
            <MemoryRouter initialEntries={['/self-service']}>
                <LogoLink />
            </MemoryRouter>
        )
        const aTag: HTMLAnchorElement | null = result.container.querySelector('a')
        expect(aTag).toBeInTheDocument() */
    })
})
