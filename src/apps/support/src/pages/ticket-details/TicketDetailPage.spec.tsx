/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, react/jsx-no-bind */
import { readFileSync } from 'fs'
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
const ticketDetailStyles = readFileSync(`${__dirname}/TicketDetailPage.module.scss`, 'utf8')

interface Deferred<T> {
    promise: Promise<T>
    resolve: (value: T) => void
}

/**
 * Creates a promise whose completion can be controlled by the test.
 *
 * @returns deferred promise and its resolver.
 * @throws Does not throw.
 */
function createDeferred<T>(): Deferred<T> {
    let resolve: (value: T) => void = () => undefined
    const promise = new Promise<T>(promiseResolve => {
        resolve = promiseResolve
    })
    return { promise, resolve }
}

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

describe('TicketDetailPage reply access', () => {
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

            expect(mockUseSWR.mock.calls[0][2])
                .toEqual({ revalidateOnFocus: true, shouldRetryOnError: false })

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

    it('styles the challenge anchor as a visible link', () => {
        const challengeLinkRule = ticketDetailStyles.match(
            /\.challengeLink,\s*\.challengeLink:hover \{[^}]*\}/,
        )?.[0]

        expect(challengeLinkRule)
            .toContain('color: $link-blue-dark;')
        expect(challengeLinkRule)
            .toContain('text-decoration: underline;')
    })

    it('identifies the support staff member who closed the ticket', () => {
        mockUseSWR.mockReturnValue({
            data: {
                ...closedTicket,
                assignees: [{
                    assignedAt: '2026-08-07T00:30:00.000Z',
                    handle: 'support-agent',
                    userId: '99999',
                }],
                closedByUserId: '99999',
            },
            error: undefined,
            isValidating: false,
            mutate: mockMutate,
        })

        render(<TicketDetailPage />)

        expect(screen.getByText((_content, element) => (
            element?.tagName === 'P'
            && element.textContent?.includes('Closed') === true
            && element.textContent?.includes('by support-agent') === true
        )))
            .toBeTruthy()
    })

    it('falls back to the stored closer user ID when no assignee snapshot matches', () => {
        mockUseSWR.mockReturnValue({
            data: {
                ...closedTicket,
                closedByUserId: 'legacy-staff-1',
            },
            error: undefined,
            isValidating: false,
            mutate: mockMutate,
        })

        render(<TicketDetailPage />)

        expect(screen.getByText('legacy-staff-1'))
            .toBeTruthy()
    })

    it('revalidates fresh detail after marking the ticket read', async () => {
        const markReadRequest = createDeferred<void>()
        mockedMarkRead.mockReturnValue(markReadRequest.promise)
        mockUseSWR.mockReturnValue({
            data: { ...closedTicket, hasUnread: true },
            error: undefined,
            isValidating: false,
            mutate: mockMutate,
        })

        render(<TicketDetailPage />)
        markReadRequest.resolve(undefined)

        await waitFor(() => {
            expect(mockMutate)
                .toHaveBeenCalledTimes(1)
        })
        expect(mockMutate.mock.calls[0])
            .toEqual([])
    })

    it('identifies support team replies without labelling the ticket owner', () => {
        mockUseSWR.mockReturnValue({
            data: {
                ...closedTicket,
                responseCount: 2,
                responses: [{
                    createdAt: '2026-08-07T01:30:00.000Z',
                    id: 'response-owner',
                    markdown: 'Member follow-up.',
                    readBy: [],
                    userHandle: 'ticket-owner',
                    userId: '12345',
                }, {
                    createdAt: '2026-08-07T01:45:00.000Z',
                    id: 'response-support',
                    markdown: 'Support follow-up.',
                    readBy: [],
                    userHandle: 'support-agent',
                    userId: '67890',
                }],
            },
            error: undefined,
            isValidating: false,
            mutate: mockMutate,
        })

        render(<TicketDetailPage />)

        const ownerReply = screen.getByText('Member follow-up.')
            .closest('article')
        const supportReply = screen.getByText('Support follow-up.')
            .closest('article')

        expect(ownerReply?.textContent)
            .toContain('ticket-owner')
        expect(ownerReply?.textContent)
            .not.toContain('(Support Team)')
        expect(supportReply?.textContent)
            .toContain('support-agent (Support Team)')
    })

    it('requires non-owner support staff to assign an open ticket before replying or closing it', () => {
        mockProfile = {
            roles: ['Topcoder Support Team'],
            userId: 99999,
        }
        mockUseSWR.mockReturnValue({
            data: {
                ...closedTicket,
                closedAt: undefined,
                status: 'OPEN',
            },
            error: undefined,
            isValidating: false,
            mutate: mockMutate,
        })

        render(<TicketDetailPage />)

        expect(screen.queryByLabelText('Reply'))
            .toBeNull()
        expect(screen.getByText('Assign this ticket to yourself before replying.'))
            .toBeTruthy()
        expect((screen.getByRole('button', {
            name: 'Close support ticket',
        }) as HTMLButtonElement).disabled)
            .toBe(true)
    })

    it('lets assigned support staff reply to and close an open ticket', () => {
        mockProfile = {
            roles: ['Topcoder Support Team'],
            userId: 99999,
        }
        mockUseSWR.mockReturnValue({
            data: {
                ...closedTicket,
                assignees: [{
                    assignedAt: '2026-08-07T00:30:00.000Z',
                    handle: 'support-agent',
                    userId: '99999',
                }],
                closedAt: undefined,
                status: 'OPEN',
            },
            error: undefined,
            isValidating: false,
            mutate: mockMutate,
        })

        render(<TicketDetailPage />)

        expect(screen.getByLabelText('Reply'))
            .toBeTruthy()
        expect(screen.queryByText('Assign this ticket to yourself before replying.'))
            .toBeNull()
        expect((screen.getByRole('button', {
            name: 'Close support ticket',
        }) as HTMLButtonElement).disabled)
            .toBe(false)
    })
})
