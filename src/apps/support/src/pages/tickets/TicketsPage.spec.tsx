/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { render } from '@testing-library/react'

import { OpenTicketsPage } from './TicketsPage'

const mockUseSWR = jest.fn()

jest.mock('swr', () => ({
    __esModule: true,
    default: (...args: unknown[]) => mockUseSWR(...args),
}))

jest.mock('react-router-dom', () => ({
    useNavigate: () => jest.fn(),
    useSearchParams: () => [new URLSearchParams(), jest.fn()],
}))

jest.mock('~/config', () => ({
    EnvironmentConfig: { API: { V6: 'https://api.example.test/v6' } },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    useProfileContext: () => ({
        profile: { roles: ['Topcoder User'], userId: 12345 },
    }),
    UserRole: { topcoderSupportTeam: 'Topcoder Support Team' },
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    Button: () => <></>,
}), { virtual: true })

jest.mock('../../config/routes.config', () => ({
    buildSupportPath: (...segments: string[]) => `/support/${segments.join('/')}`,
}))

jest.mock('../../lib/components', () => ({
    MemberHandleAutocomplete: () => <></>,
    OpenSupportRequestModal: () => <></>,
    SupportEmpty: () => <></>,
    SupportError: () => <></>,
    SupportLoading: () => <></>,
    SupportTabs: () => <></>,
    TicketsTable: () => <></>,
}))

jest.mock('../../lib/services', () => ({
    assignSupportTicketToMe: jest.fn(),
    buildTicketListUrl: () => 'support-tickets',
    getSupportTickets: jest.fn(),
}))

describe('TicketsPage cache freshness', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockUseSWR.mockReturnValue({
            data: undefined,
            error: undefined,
            isValidating: true,
            mutate: jest.fn(),
        })
    })

    it('refreshes ticket assignments when the requester returns to the page', () => {
        render(<OpenTicketsPage />)

        expect(mockUseSWR.mock.calls[0][2])
            .toEqual({ revalidateOnFocus: true, shouldRetryOnError: false })
    })
})
