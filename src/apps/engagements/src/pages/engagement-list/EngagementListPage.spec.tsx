/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, sort-keys */
import '@testing-library/jest-dom'

import React from 'react'
import { render, waitFor } from '@testing-library/react'

import { getEngagements } from '../../lib/services'

import EngagementListPage from './EngagementListPage'

const mockNavigate = jest.fn()
const mockUseProfileContext = jest.fn()
const mockUseCountryLookup = jest.fn()
const mockGetEngagements = getEngagements as jest.MockedFunction<typeof getEngagements>

jest.mock('react-router-dom', () => ({
    useLocation: () => ({
        pathname: '/engagements',
        state: undefined,
    }),
    useNavigate: () => mockNavigate,
}))

jest.mock('~/libs/core', () => ({
    useCountryLookup: () => mockUseCountryLookup(),
    useProfileContext: () => mockUseProfileContext(),
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    Button: (props: {
        label: string
        onClick?: () => void
    }) => (
        <button type='button' onClick={props.onClick}>
            {props.label}
        </button>
    ),
    ContentLayout: (props: {
        children: React.ReactNode
        title: string
    }) => (
        <div>
            <h1>{props.title}</h1>
            {props.children}
        </div>
    ),
    IconOutline: {
        ExclamationIcon: () => <span />,
        InformationCircleIcon: () => <span />,
        SearchIcon: () => <span />,
    },
    LoadingSpinner: () => <div>loading-spinner</div>,
}), { virtual: true })

jest.mock('~/apps/admin/src/lib/components/common/Pagination', () => ({
    Pagination: () => <div>pagination</div>,
}), { virtual: true })

jest.mock('../../components', () => ({
    EngagementCard: () => <div>engagement-card</div>,
    EngagementFilters: () => <div>engagement-filters</div>,
    EngagementsTabs: () => <div>engagement-tabs</div>,
}))

jest.mock('../../engagements.routes', () => ({
    rootRoute: '/engagements',
}))

jest.mock('../../lib/services', () => ({
    getEngagements: jest.fn(),
}))

describe('EngagementListPage', () => {
    beforeEach(() => {
        mockNavigate.mockReset()
        mockUseCountryLookup.mockReturnValue([])
        mockGetEngagements.mockResolvedValue({
            data: [],
            page: 1,
            perPage: 12,
            total: 0,
            totalPages: 0,
        })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it.each([
        'Administrator',
        'Talent Manager',
        'Topcoder Talent Manager',
        ' ADMINISTRATOR ',
    ])('includes private engagements for the %s role', async role => {
        mockUseProfileContext.mockReturnValue({
            isLoggedIn: true,
            profile: {
                roles: [role],
            },
        })

        render(<EngagementListPage />)

        await waitFor(() => {
            expect(mockGetEngagements)
                .toHaveBeenCalledWith(expect.objectContaining({
                    includePrivate: true,
                }))
        })
    })

    it.each([
        'Member',
        'Project Manager',
        'Topcoder Project Manager',
        'Task Manager',
        'Topcoder Task Manager',
        'Group Administrator',
        'Talent Manager Assistant',
    ])('keeps private engagements excluded for the %s role', async role => {
        mockUseProfileContext.mockReturnValue({
            isLoggedIn: true,
            profile: {
                roles: [role],
            },
        })

        render(<EngagementListPage />)

        await waitFor(() => {
            expect(mockGetEngagements)
                .toHaveBeenCalledWith(expect.objectContaining({
                    includePrivate: false,
                }))
        })
    })

    it('requests public engagements for anonymous visitors', async () => {
        mockUseProfileContext.mockReturnValue({ isLoggedIn: false })

        render(<EngagementListPage />)

        await waitFor(() => {
            expect(mockGetEngagements)
                .toHaveBeenCalledWith(expect.objectContaining({ includePrivate: false }))
        })
    })
})
