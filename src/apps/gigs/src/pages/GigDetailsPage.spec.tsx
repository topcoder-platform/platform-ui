/* eslint-disable import/no-extraneous-dependencies */
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import useSWR from 'swr'

import { render, screen } from '@testing-library/react'
import { profileContext, ProfileContextData, UserProfile } from '~/libs/core'
import '@testing-library/jest-dom'

import { Gig } from '../models'

import GigDetailsPage from './GigDetailsPage'

jest.mock('swr')
jest.mock('~/config', () => ({
    EnvironmentConfig: {
        TC_DOMAIN: 'topcoder-dev.com',
        URLS: { ACCOUNT_SETTINGS: 'https://accounts.topcoder-dev.com/settings' },
        USER_PROFILE_URL: 'https://profiles.topcoder-dev.com',
    },
}), { virtual: true })
jest.mock('~/libs/core', () => {
    const ReactModule: typeof import('react') = jest.requireActual('react')
    return { profileContext: ReactModule.createContext({}) }
}, { virtual: true })
jest.mock('~/libs/ui', () => ({
    PageTitle: (): JSX.Element => <></>,
}), { virtual: true })
jest.mock('../gigs.service', () => ({
    ...jest.requireActual('../gigs.service'),
    getGig: jest.fn(),
}))
jest.mock('../components/GigShared', () => ({
    GigContent: (props: { text: string }): JSX.Element => <div>{props.text}</div>,
    GigFacts: (): JSX.Element => <></>,
    GigState: (props: { title: string }): JSX.Element => <div>{props.title}</div>,
}))

const job: Gig = {
    enable_job_application_form: 1,
    job_description_text: 'Test job description',
    job_status: { id: 1 },
    name: 'Test gig',
    slug: 'test-gig',
}

/**
 * Renders the gig details route with an optional member handle for navigation regression tests.
 *
 * @param handle Signed-in member handle; omitted to render the anonymous profile destination.
 * @returns Nothing; assertions query the rendered document.
 * @throws Propagates rendering errors so the test fails.
 */
function renderDetails(handle?: string): void {
    render(
        <profileContext.Provider
            value={{ profile: handle ? { handle } as UserProfile : undefined } as ProfileContextData}
        >
            <MemoryRouter initialEntries={['/gigs/test-gig']}>
                <Routes>
                    <Route path='/gigs/:slug' element={<GigDetailsPage />} />
                </Routes>
            </MemoryRouter>
        </profileContext.Provider>,
    )
}

describe('Gig details links', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.mocked(useSWR)
            .mockReturnValue({ data: job, error: undefined, isValidating: false, mutate: jest.fn() })
    })

    it.each([
        ['qa member', 'https://profiles.topcoder-dev.com/qa%20member'],
        [undefined, 'https://accounts.topcoder-dev.com/settings'],
    ])('opens advice links in new tabs for member handle %s', (handle, profileUrl) => {
        renderDetails(handle)

        const links = [
            ['Update your profile', profileUrl],
            ['Visit the Gig Work forum', 'https://vanilla.topcoder-dev.com/categories/gig-work-discusssions'],
            ['Browse opportunities', '/opportunities'],
        ]
        links.forEach(([name, href]) => {
            const link = screen.getByRole('link', { name })
            expect(link)
                .toHaveAttribute('href', href)
            expect(link)
                .toHaveAttribute('target', '_blank')
            expect(link)
                .toHaveAttribute('rel', 'noopener noreferrer')
        })
    })

    it('preserves gig navigation and email destinations', () => {
        renderDetails()

        const links = [
            ['← All gigs', '/gigs'],
            ['Apply to this job', '/gigs/test-gig/apply'],
            ['View other gigs', '/gigs'],
            ['talent.taas@wipro.com', 'mailto:talent.taas@wipro.com'],
            ['Contact the Gig Work team', 'mailto:talent.taas@wipro.com'],
        ]
        links.forEach(([name, href]) => {
            const link = screen.getByRole('link', { name })
            expect(link)
                .toHaveAttribute('href', href)
            expect(link)
                .not.toHaveAttribute('target')
        })
    })
})
