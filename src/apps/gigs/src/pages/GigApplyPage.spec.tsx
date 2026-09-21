/* eslint-disable sort-keys, react/jsx-no-bind, import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SWRConfig } from 'swr'

import { profileContext, tokenGetAsync, UserProfile } from '~/libs/core'

import GigApplyPage from './GigApplyPage'

jest.mock('react-router-dom', () => {
    const util = jest.requireActual('util')
    global.TextEncoder = util.TextEncoder
    return jest.requireActual('react-router-dom')
})
jest.mock('~/config', () => ({
    EnvironmentConfig: {
        COMMUNITY_APP_URL: 'https://www.topcoder-dev.com',
        USER_PROFILE_URL: 'https://profiles.topcoder-dev.com',
        URLS: { ACCOUNT_SETTINGS: '/settings' },
    },
}), { virtual: true })
jest.mock('~/libs/core', () => ({
    profileContext: jest.requireActual('react')
        .createContext({}),
    tokenGetAsync: jest.fn(),
}), { virtual: true })
jest.mock('~/libs/shared', () => ({ autoCompleteSkills: jest.fn()
    .mockResolvedValue([]) }), { virtual: true })
jest.mock('~/libs/ui', () => ({
    Button: (props: any) => (
        <button
            type={props.type === 'submit' ? 'submit' : 'button'}
            disabled={props.disabled}
            onClick={props.onClick}
        >
            {props.children}
        </button>
    ),
    BaseModal: (props: any) => (props.open ? <div role='dialog'>{props.children}</div> : undefined),
    LoadingSpinner: () => <span>Loading</span>,
    PageTitle: () => undefined,
}), { virtual: true })

const profile = {
    userId: 123,
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    handle: 'jane',
    homeCountryCode: 'AUS',
} as UserProfile
const job = {
    name: 'Java engineer',
    slug: 'example-gig',
    job_status: { id: 1 },
    enable_job_application_form: 1,
}
const originalFetch = global.fetch
const fetchMock = jest.fn()

/**
 * Renders the apply route for a signed-in member using the real service and an isolated SWR cache.
 * Takes no parameters and returns nothing; used by the candidate-loading regressions.
 * React rendering errors propagate to the test.
 */
function renderApplyPage(): void {
    render(
        <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
            <profileContext.Provider value={{ profile, initialized: true } as any}>
                <MemoryRouter initialEntries={['/gigs/example-gig/apply']}>
                    <Routes>
                        <Route path='/gigs/:slug/apply' element={<GigApplyPage />} />
                    </Routes>
                </MemoryRouter>
            </profileContext.Provider>
        </SWRConfig>,
    )
}

beforeEach(() => {
    global.fetch = fetchMock
    fetchMock.mockReset();
    (tokenGetAsync as jest.Mock).mockResolvedValue({ token: 'member-token' })
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => job })
})
afterAll(() => {
    global.fetch = originalFetch
})

describe('Gig application candidate loading', () => {
    it('opens the application form when Recruit returns its bare empty no-match array', async () => {
        fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] })
        renderApplyPage()

        expect(await screen.findByRole('button', { name: 'Apply to this job' }))
            .toBeTruthy()
        expect((screen.getByLabelText('First name *') as HTMLInputElement).value)
            .toBe('Jane')
        expect(screen.queryByText('Unable to load your Gig Work profile'))
            .toBeNull()
        expect(fetchMock)
            .toHaveBeenCalledWith(
                'https://www.topcoder-dev.com/api/recruit/candidates/search?email=jane%40example.com',
                expect.objectContaining({ headers: {} }),
            )
    })
    it.each([
        ['envelope', { data: [{ salary_expectation: 500 }] }],
        ['direct array', [{ salary_expectation: 500 }]],
    ])('prefills the application form from an existing candidate search %s', async (_label, response) => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => response,
        })
        renderApplyPage()

        const pay = await screen.findByLabelText('Weekly pay expectation (USD) *') as HTMLInputElement
        expect(pay.value)
            .toBe('500')
        expect(screen.getByText('Review your Gig Work profile and update anything that has changed.'))
            .toBeTruthy()
    })
    it('blocks a failed lookup and opens the form after a successful no-match retry', async () => {
        fetchMock.mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({ error: true }) })
        renderApplyPage()

        expect(await screen.findByText('Unable to load your Gig Work profile'))
            .toBeTruthy()
        expect(screen.queryByRole('button', { name: 'Apply to this job' }))
            .toBeNull()
        fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] })
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
        expect(await screen.findByRole('button', { name: 'Apply to this job' }))
            .toBeTruthy()
        expect(screen.queryByText('Unable to load your Gig Work profile'))
            .toBeNull()
    })
})
