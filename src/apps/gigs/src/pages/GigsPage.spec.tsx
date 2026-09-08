/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import GigsPage from './GigsPage'

jest.mock('swr', () => ({
    __esModule: true,
    default: (): Record<string, unknown> => ({ data: [], mutate: jest.fn() }),
}))

jest.mock('~/config', () => ({
    EnvironmentConfig: { TOPCODER_URL: 'https://www.topcoder.example' },
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    Button: (props: { children: JSX.Element | string }): JSX.Element => <button type='button'>{props.children}</button>,
    PageTitle: (): undefined => undefined,
}), { virtual: true })

jest.mock('../components/GigShared', () => ({
    GigCard: (): undefined => undefined,
    GigState: (props: { title: string }): JSX.Element => <div>{props.title}</div>,
}))

jest.mock('../gigs.service', () => ({ getGigs: jest.fn() }))

describe('GigsPage listing presentation', () => {
    it('uses the scoped 2026 focus treatment on the gig search field', () => {
        render(
            <MemoryRouter>
                <GigsPage />
            </MemoryRouter>,
        )

        expect(screen.getByRole('searchbox', { name: 'Search' }))
            .toHaveClass('gigs-filter-input')
    })

    it('opens the Gig Work resources in a separate tab without an opener', () => {
        render(
            <MemoryRouter>
                <GigsPage />
            </MemoryRouter>,
        )

        expect(screen.getByRole('link', { name: 'Read our Gig Work resources' }))
            .toHaveAttribute('href', 'https://www.topcoder.example/community/gig-resources')
        expect(screen.getByRole('link', { name: 'Read our Gig Work resources' }))
            .toHaveAttribute('target', '_blank')
        expect(screen.getByRole('link', { name: 'Read our Gig Work resources' }))
            .toHaveAttribute('rel', 'noreferrer')
    })
})
