/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, react/jsx-no-bind */
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'

import { SupportTicketDetail } from '../../lib/models'
import {
    addSupportResponse,
    markSupportTicketRead,
} from '../../lib/services'

import { TicketDetailPage } from './TicketDetailPage'

const mockMutate = jest.fn()
const mockUseSWR = jest.fn()
let mockProfile: { roles: string[]; userId: number | string }

jest.mock('swr', () => ({
    __esModule: true,
    default: (...args: unknown[]) => mockUseSWR(...args),
}))

jest.mock('react-router-dom', () => ({
    Link: (props: { children: React.ReactNode; to: string }): JSX.Element => (
        <a href={props.to}>{props.children}</a>
    ),
    useParams: () => ({ ticketId: 'ticket-1' }),
}))

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        URLS: { CHALLENGES_PAGE: 'https://www.example.test/challenges' },
    },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    useProfileContext: () => ({ profile: mockProfile }),
    UserRole: { topcoderSupportTeam: 'Topcoder Support Team' },
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    BaseModal: () => <></>,
    Button: (props: {
        disabled?: boolean
        label: string
        onClick?: () => void
    }): JSX.Element => (
        <button disabled={props.disabled} onClick={props.onClick} type='button'>
            {props.label}
        </button>
    ),
}), { virtual: true })

jest.mock('../../config/routes.config', () => ({
    buildSupportPath: (...segments: string[]) => `/support/${segments.join('/')}`,
}))

jest.mock('../../lib/components', () => ({
    MarkdownContent: (props: { markdown: string }): JSX.Element => <div>{props.markdown}</div>,
    MemberHandle: (props: { handle: string }): JSX.Element => <span>{props.handle}</span>,
    SupportError: (props: { message: string }): JSX.Element => <div>{props.message}</div>,
    SupportLoading: (): JSX.Element => <div>Loading</div>,
    SupportMarkdownEditor: (props: {
        disabled?: boolean
        label: string
        onChange: (value: string) => void
        value: string
    }): JSX.Element => (
        <label>
            {props.label}
            <textarea
                disabled={props.disabled}
                onChange={event => props.onChange(event.target.value)}
                value={props.value}
            />
        </label>
    ),
}))

jest.mock('../../lib/services', () => ({
    addSupportResponse: jest.fn(),
    assignSupportTicketToMe: jest.fn(),
    closeSupportTicket: jest.fn(),
    getSupportTicket: jest.fn(),
    markSupportTicketRead: jest.fn(),
    unassignSupportTicketFromMe: jest.fn(),
}))

const mockedAddResponse = addSupportResponse as jest.Mock
const mockedMarkRead = markSupportTicketRead as jest.Mock

const closedTicket: SupportTicketDetail = {
    assignees: [],
    challengeId: 'challenge/id',
    closedAt: '2026-08-07T01:00:00.000Z',
    description: 'Original issue',
    hasUnread: false,
    id: 'ticket-1',
    latestActivityAt: '2026-08-07T01:00:00.000Z',
    memberHandle: 'ticket-owner',
    memberUserId: '12345',
    openedAt: '2026-08-07T00:00:00.000Z',
    readBy: [],
    responseCount: 0,
    responses: [],
    status: 'CLOSED',
    updatedAt: '2026-08-07T01:00:00.000Z',
}

describe('TicketDetailPage closed reply access', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockProfile = {
            roles: ['Topcoder Support Team'],
            userId: 12345,
        }
        mockUseSWR.mockReturnValue({
            data: closedTicket,
            error: undefined,
            isValidating: false,
            mutate: mockMutate,
        })
        mockedMarkRead.mockReturnValue(new Promise(() => {
            // Keep the read request pending so it cannot overwrite the tested mutation.
        }))
        mockedAddResponse.mockResolvedValue({
            ...closedTicket,
            closedAt: undefined,
            status: 'OPEN',
        })
    })

    it(
        'lets the ticket owner reply and shows the reopened state result even when they have the staff role',
        async () => {
            render(<TicketDetailPage />)

            const challengeLink = screen.getByRole('link', { name: 'View challenge' })
            expect(challengeLink.getAttribute('href'))
                .toBe('https://www.example.test/challenges/challenge%2Fid')
            expect(screen.queryByText('challenge/id'))
                .toBeNull()

            fireEvent.change(screen.getByLabelText('Reply'), {
                target: { value: ' Please reopen this ' },
            })
            fireEvent.click(screen.getByRole('button', { name: 'Send reply' }))

            await waitFor(() => {
                expect(mockedAddResponse)
                    .toHaveBeenCalledWith('ticket-1', { markdown: 'Please reopen this' })
                expect(mockMutate)
                    .toHaveBeenCalledWith(expect.objectContaining({ status: 'OPEN' }), false)
                expect(screen.getByText('Your reply was added and the support ticket was reopened.'))
                    .toBeTruthy()
            })
        },
    )

    it('keeps a closed ticket read-only for staff who do not own it', () => {
        mockProfile = {
            roles: ['Topcoder Support Team'],
            userId: 99999,
        }

        render(<TicketDetailPage />)

        expect(screen.queryByLabelText('Reply'))
            .toBeNull()
        expect(screen.getByText('This ticket is closed and cannot receive more replies.'))
            .toBeTruthy()
    })
})
