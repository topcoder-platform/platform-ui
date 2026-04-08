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

    it('includes private engagements for privileged users', async () => {
        mockUseProfileContext.mockReturnValue({
            isLoggedIn: true,
            profile: {
                roles: ['Talent Manager'],
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

    it('keeps private engagements excluded for standard members', async () => {
        mockUseProfileContext.mockReturnValue({
            isLoggedIn: true,
            profile: {
                roles: ['Member'],
            },
        })

        render(<EngagementListPage />)

        await waitFor(() => {
            expect(mockGetEngagements)
                .toHaveBeenCalledWith(expect.not.objectContaining({
                    includePrivate: true,
                }))
        })
    })
})
