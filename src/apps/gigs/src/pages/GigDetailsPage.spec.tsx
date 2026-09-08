/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { Gig } from '../models'

import GigDetailsPage from './GigDetailsPage'

const mockUseSWR = jest.fn()

jest.mock('swr', () => ({
    __esModule: true,
    default: (...args: unknown[]) => mockUseSWR(...args),
}))

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        TC_DOMAIN: 'topcoder-dev.com',
        URLS: { ACCOUNT_SETTINGS: 'https://accounts.topcoder-dev.com/settings' },
        USER_PROFILE_URL: 'https://profiles.topcoder-dev.com',
    },
}), { virtual: true })

jest.mock('~/libs/core', () => {
    const ReactModule: typeof import('react') = jest.requireActual('react')
    return {
        profileContext: ReactModule.createContext({
            initialized: true,
            profile: { handle: 'qa member' },
        }),
    }
}, { virtual: true })

jest.mock('~/libs/ui', () => ({
    PageTitle: (props: { children: string }): JSX.Element => <>{props.children}</>,
}), { virtual: true })

jest.mock('../components/GigShared', () => ({
    GigContent: (props: { text: string }): JSX.Element => <div>{props.text}</div>,
    GigFacts: (): JSX.Element => <div>Gig facts</div>,
    GigState: (props: { title: string }): JSX.Element => <div>{props.title}</div>,
}))

const openGig: Gig = {
    enable_job_application_form: 1,
    job_description_text: 'Build useful things.',
    job_status: { id: 1 },
    name: 'QA engineer',
    slug: 'qa-engineer',
}

/**
 * Renders the open Gig detail route using the supplied Recruit fixture.
 *
 * @param job Recruit Gig returned by the mocked detail request.
 * @returns Nothing; tests query the rendered document.
 * @throws Does not throw.
 */
function renderDetails(job: Gig): void {
    mockUseSWR.mockReturnValue({ data: job, error: undefined, mutate: jest.fn() })
    render(
        <MemoryRouter initialEntries={['/gigs/qa-engineer']}>
            <Routes>
                <Route path='/gigs/:slug' element={<GigDetailsPage />} />
            </Routes>
        </MemoryRouter>,
    )
}

describe('GigDetailsPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders N/A when Recruit does not provide any required skills', () => {
        renderDetails(openGig)

        expect(screen.getByRole('heading', { name: 'Required skills' }))
            .toBeInTheDocument()
        expect(screen.getByText('N/A'))
            .toBeInTheDocument()
    })

    it('opens external advice links safely without changing internal or email navigation', () => {
        renderDetails(openGig)

        expect(screen.getByRole('link', { name: 'Update your profile' }))
            .toHaveAttribute('href', 'https://profiles.topcoder-dev.com/qa%20member')
        expect(screen.getByRole('link', { name: 'Update your profile' }))
            .toHaveAttribute('target', '_blank')
        expect(screen.getByRole('link', { name: 'Update your profile' }))
            .toHaveAttribute('rel', 'noopener noreferrer')

        expect(screen.getByRole('link', { name: 'Visit the Gig Work forum' }))
            .toHaveAttribute(
                'href',
                'https://vanilla.topcoder-dev.com/categories/gig-work-discussions',
            )
        expect(screen.getByRole('link', { name: 'Visit the Gig Work forum' }))
            .toHaveAttribute('target', '_blank')
        expect(screen.getByRole('link', { name: 'Visit the Gig Work forum' }))
            .toHaveAttribute('rel', 'noopener noreferrer')

        expect(screen.getByRole('link', { name: 'Browse opportunities' }))
            .not.toHaveAttribute('target')
        screen.getAllByRole('link', { name: /Gig Work team|talent\.taas@wipro\.com/ })
            .forEach(link => expect(link)
                .not.toHaveAttribute('target'))
    })
})
