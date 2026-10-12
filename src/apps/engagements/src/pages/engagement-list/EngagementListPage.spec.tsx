/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, sort-keys */
import '@testing-library/jest-dom'

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'

import { EngagementStatus } from '../../lib/models'
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
        ['Administrator'],
        ['Talent Manager'],
        ['Topcoder Talent Manager'],
        ['  TOPCODER TALENT MANAGER  '],
        ['Topcoder Project Manager', 'Talent Manager'],
    ])('includes private engagements for authorized roles: %j', async (...roles) => {
        mockUseProfileContext.mockReturnValue({
            isLoggedIn: true,
            profile: {
                roles,
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
        '  TOPCODER PROJECT MANAGER  ',
        'Connect Admin',
        'Talent Manager Assistant',
    ])('loads public opportunities without requesting private access for %s', async role => {
        mockUseProfileContext.mockReturnValue({
            isLoggedIn: true,
            profile: {
                roles: [role],
            },
        })
        mockGetEngagements.mockImplementation(async params => {
            if (params?.includePrivate) {
                throw new Error('You are not authorized to include private engagements.')
            }

            return {
                data: [{
                    id: 'public-engagement',
                    nanoId: 'public-opportunity',
                    projectId: '123',
                    title: 'Public opportunity',
                    description: 'Open public engagement',
                    duration: {},
                    timeZones: [],
                    countries: [],
                    requiredSkills: [],
                    status: EngagementStatus.OPEN,
                    createdAt: '2026-10-09T00:00:00Z',
                    updatedAt: '2026-10-09T00:00:00Z',
                    createdBy: '123',
                    isPrivate: false,
                }],
                page: 1,
                perPage: 12,
                total: 1,
                totalPages: 1,
            }
        })

        render(<EngagementListPage />)

        expect(await screen.findByText('engagement-card'))
            .toBeInTheDocument()
        expect(screen.queryByText('Unable to load engagement opportunities. Please try again.'))
            .not.toBeInTheDocument()
        expect(mockGetEngagements)
            .toHaveBeenCalledWith(expect.objectContaining({
                includePrivate: false,
                status: EngagementStatus.OPEN,
            }))
    })

    it.each([undefined, {}])('keeps anonymous or missing-role profiles public: %j', async profile => {
        mockUseProfileContext.mockReturnValue({
            isLoggedIn: Boolean(profile),
            profile,
        })

        render(<EngagementListPage />)

        await waitFor(() => {
            expect(mockGetEngagements)
                .toHaveBeenCalledWith(expect.objectContaining({
                    includePrivate: false,
                }))
        })
    })
})
