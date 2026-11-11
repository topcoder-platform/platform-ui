/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, react/jsx-no-bind */
import '@testing-library/jest-dom'
import {
    fireEvent,
    render,
    screen,
    within,
} from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'

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
        .getAllByRole('heading')
        .map(card => card.textContent)
}

describe('GigsPage listing presentation', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockUseSWR.mockReturnValue({ data: [], error: undefined, mutate: jest.fn() })
    })

    it('labels the legacy search and dropdown controls accessibly', () => {
        render(
            <MemoryRouter>
                <GigsPage />
            </MemoryRouter>,
        )

        expect(screen.getByRole('searchbox', { name: 'Search Gig Listings by Name or Skill' }))
            .toHaveClass('control')
        expect(screen.getByRole('combobox', { name: 'Location' }))
            .toHaveClass('control')
        expect(screen.getByRole('combobox', { name: 'Sort by' }))
            .toHaveClass('control')
    })

    it('opens the Gig Work resources in a separate tab without an opener', () => {
        render(
            <MemoryRouter>
                <GigsPage />
            </MemoryRouter>,
        )

        expect(screen.getByRole('link', { name: 'Read our Gig Work resources' }))
            .toHaveAttribute('href', 'https://www.topcoder.example/lp/gig-resources')
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

/** Makes URL preservation visible to the listing interaction tests. */
const LocationProbe = (): JSX.Element => <output data-testid='url'>{useLocation().search}</output>

describe('GigsPage interactions', () => {
    const jobs: Gig[] = Array.from({ length: 12 }, (_, index) => ({
        ...gigs[0],
        country: index === 11 ? 'Australia' : 'United States',
        custom_fields: [
            {
                field_id: 1,
                field_name: 'Technologies Required',
                value: index === 11 ? 'TypeScript, React, Node.js' : 'Java',
            },
            { field_id: 2, field_name: 'Duration', value: '12' },
        ],
        name: `Gig ${index + 1}`,
        slug: `gig-${index + 1}`,
    }))

    beforeEach(() => {
        mockUseSWR.mockReturnValue({ data: jobs, error: undefined, mutate: jest.fn() })
        window.scrollTo = jest.fn()
    })

    it('paginates ten jobs and resets the page when searching skills, preserving attribution', () => {
        render(
            <MemoryRouter initialEntries={['/gigs?ref=campaign']}>
                <GigsPage />
                <LocationProbe />
            </MemoryRouter>,
        )
        expect(screen.getAllByRole('article'))
            .toHaveLength(10)
        fireEvent.click(screen.getByRole('button', { name: 'Next' }))
        expect(screen.getAllByRole('article'))
            .toHaveLength(2)
        expect(screen.getByTestId('url'))
            .toHaveTextContent('ref=campaign&page=2')
        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'TypeScript' } })
        expect(screen.getAllByRole('article'))
            .toHaveLength(1)
        expect(screen.getByRole('link', { name: 'Gig 12' }))
            .toHaveAttribute('href', '/gigs/gig-12')
        expect(screen.getByTestId('url'))
            .toHaveTextContent('ref=campaign&search=TypeScript')
        expect(screen.getByTestId('url')).not.toHaveTextContent('page=')
        expect(screen.getByText('TypeScript, React,…'))
            .toHaveAttribute('title', 'TypeScript, React, Node.js')
        expect(screen.getByText('12 Weeks'))
            .toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
        expect(screen.getAllByRole('article'))
            .toHaveLength(10)
        expect(screen.getByTestId('url'))
            .toHaveTextContent('?ref=campaign')
    })

    it('filters by location and handles an empty search', () => {
        render(<MemoryRouter><GigsPage /></MemoryRouter>)
        fireEvent.change(screen.getByRole('combobox', { name: 'Location' }), { target: { value: 'Australia' } })
        expect(screen.getAllByRole('article'))
            .toHaveLength(1)
        expect(screen.getByRole('link', { name: 'View details for Gig 12' }))
            .toHaveAttribute('href', '/gigs/gig-12')
        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'no matching gig' } })
        expect(screen.getByText('No Results'))
            .toBeInTheDocument()
        expect(screen.queryAllByRole('article'))
            .toHaveLength(0)
    })

    it('places hotlist tiles after up to two featured listings', () => {
        mockUseSWR.mockReturnValue({
            data: [
                ...gigs.map(job => ({
                    ...job,
                    custom_fields: [...(job.custom_fields || []), { field_id: 3, field_name: 'Featured', value: true }],
                })),
                jobs[0],
            ],
        })
        render(<MemoryRouter><GigsPage /></MemoryRouter>)
        const hotlist = screen.getByRole('region', { name: 'Hotlist gigs' })
        expect(hotlist.previousElementSibling)
            .toHaveTextContent('Recently updated')
        expect(hotlist.nextElementSibling)
            .toHaveTextContent('Gig 1')
    })
})
