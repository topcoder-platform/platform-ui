/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, react/jsx-no-bind */
import '@testing-library/jest-dom'
import {
    fireEvent,
    render,
    screen,
    within,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { Gig } from '../models'

import GigsPage from './GigsPage'

const mockUseSWR = jest.fn()

jest.mock('swr', () => ({
    __esModule: true,
    default: (...args: unknown[]) => mockUseSWR(...args),
}))

jest.mock('~/config', () => ({
    EnvironmentConfig: { TOPCODER_URL: 'https://www.topcoder.example' },
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    Button: (props: {
        children: JSX.Element | string
        disabled?: boolean
        onClick?: () => void
    }): JSX.Element => (
        <button type='button' disabled={props.disabled} onClick={props.onClick}>{props.children}</button>
    ),
    PageTitle: (props: { children: string }): JSX.Element => <>{props.children}</>,
}), { virtual: true })

jest.mock('../components/GigShared', () => ({
    GigCard: (props: { job: Gig }): JSX.Element => <article data-testid='gig-card'>{props.job.name}</article>,
    GigState: (props: { title: string }): JSX.Element => <div>{props.title}</div>,
}))

jest.mock('../gigs.service', () => ({ getGigs: jest.fn() }))

const hotlistField = { field_id: 14, field_name: 'Show in Hotlist', value: true }
const gigs: Gig[] = [
    {
        created_on: '2026-09-01T00:00:00Z',
        custom_fields: [hotlistField],
        enable_job_application_form: 1,
        job_status: { id: 1 },
        name: 'Recently updated',
        slug: 'recently-updated',
        updated_on: '2026-09-08T00:00:00Z',
    },
    {
        created_on: '2026-09-07T00:00:00Z',
        custom_fields: [hotlistField],
        enable_job_application_form: 1,
        job_status: { id: 1 },
        name: 'Newly added',
        slug: 'newly-added',
        updated_on: '2026-09-07T00:00:00Z',
    },
]

/**
 * Returns the rendered hotlist card names in their visual order.
 *
 * @returns Ordered text content from the hotlist's rendered Gig cards.
 * @throws Testing Library throws when the labelled hotlist or its cards are absent.
 */
function hotlistNames(): Array<string | null> {
    return within(screen.getByRole('region', { name: 'Hotlist gigs' }))
        .getAllByTestId('gig-card')
        .map(card => card.textContent)
}

describe('GigsPage listing presentation', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockUseSWR.mockReturnValue({ data: [], error: undefined, mutate: jest.fn() })
    })

    it('uses the scoped 2026 focus treatment on every Gig listing filter control', () => {
        render(
            <MemoryRouter>
                <GigsPage />
            </MemoryRouter>,
        )

        expect(screen.getByRole('searchbox', { name: 'Search' }))
            .toHaveClass('gigs-filter-control')
        expect(screen.getByRole('combobox', { name: 'Location' }))
            .toHaveClass('gigs-filter-control')
        expect(screen.getByRole('combobox', { name: 'Sort by' }))
            .toHaveClass('gigs-filter-control')
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

describe('GigsPage sorting', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockUseSWR.mockReturnValue({ data: gigs, error: undefined, mutate: jest.fn() })
    })

    it('applies the selected date ordering to the visible hotlist as well as the result list', () => {
        render(
            <MemoryRouter initialEntries={['/gigs']}>
                <GigsPage />
            </MemoryRouter>,
        )

        expect(hotlistNames())
            .toEqual(['Newly added', 'Recently updated'])

        fireEvent.change(screen.getByRole('combobox', { name: 'Sort by' }), {
            target: { value: 'updated_on' },
        })

        expect(hotlistNames())
            .toEqual(['Recently updated', 'Newly added'])
    })
})
