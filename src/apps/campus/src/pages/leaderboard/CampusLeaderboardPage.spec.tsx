/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, react/jsx-no-bind,
   react/no-unused-prop-types, react/no-array-index-key, unicorn/no-null */
import '@testing-library/jest-dom'
import type { ChangeEvent, PropsWithChildren, ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { CampusLeaderboard, CampusLeaderboardMember, CampusParticipation } from '../../lib/models'

import { CampusLeaderboardPage } from './CampusLeaderboardPage'

interface StubColumn<T> {
    columnId?: string
    label?: string
    propertyName?: string
    renderer?: (data: T) => ReactNode
}

interface StubTableProps<T> {
    columns: ReadonlyArray<StubColumn<T>>
    data: ReadonlyArray<T>
    moreToLoad?: boolean
    onLoadMoreClick?: () => void
    onRowClick?: (data: T) => void
}

interface StubSelectProps {
    onChange: (event: ChangeEvent<HTMLInputElement>) => void
    options: ReadonlyArray<{ label?: ReactNode, value: string }>
    value?: string
}

jest.mock('~/config', () => ({
    AppSubdomain: { campus: 'campus' },
    EnvironmentConfig: {
        REPORTS_API: 'https://api.example.com/v6/reports',
        REVIEW: { CHALLENGE_PAGE_URL: 'https://review.example.test' },
        SUBDOMAIN: 'campus',
        URLS: { USER_PROFILE: 'https://profiles.example.test' },
    },
}), { virtual: true })

let mockWindowWidth = 1280

jest.mock('~/libs/shared', () => ({
    textFormatDateLocaleShortString: (date?: Date): string | undefined => date?.toISOString(),
    useWindowSize: () => ({ height: 800, width: mockWindowWidth }),
}), { virtual: true })

jest.mock('~/apps/admin/src/lib/components/common/TableMobile', () => ({
    TableMobile: <T, >(props: {
        columns: ReadonlyArray<StubColumn<T>[]>,
        data: ReadonlyArray<T>,
    }): JSX.Element => (
        <table>
            <tbody>
                {props.data.map((row, rowIndex) => props.columns.map((group, groupIndex) => (
                    <tr key={`${rowIndex}-${groupIndex}`}>
                        {group.map((column, cellIndex) => (
                            <td key={cellIndex}>
                                {column.renderer
                                    ? column.renderer(row)
                                    : String((row as Record<string, unknown>)[column.propertyName ?? ''])}
                            </td>
                        ))}
                    </tr>
                )))}
            </tbody>
        </table>
    ),
}), { virtual: true })

jest.mock('~/libs/ui', () => {
    const Icon = (): JSX.Element => <svg />

    return {
        BaseModal: (props: PropsWithChildren<{ open?: boolean, title?: ReactNode }>): JSX.Element => (
            props.open ? (
                <div>
                    <h2>{props.title}</h2>
                    {props.children}
                </div>
            ) : <></>
        ),
        ContentLayout: (props: PropsWithChildren<{}>): JSX.Element => <div>{props.children}</div>,
        IconOutline: new Proxy({}, { get: () => Icon }),
        InputSelect: (props: StubSelectProps): JSX.Element => (
            <select
                data-testid='challenge-filter'
                onChange={event => props.onChange(event as unknown as ChangeEvent<HTMLInputElement>)}
                value={props.value}
            >
                {props.options.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        ),
        LoadingSpinner: (props: { hide?: boolean }): JSX.Element => (
            props.hide ? <></> : <div>Loading</div>
        ),
        PageTitle: (): JSX.Element => <></>,
        Table: <T, >(props: StubTableProps<T>): JSX.Element => (
            <table>
                <tbody>
                    {props.data.map((row, rowIndex) => (
                        <tr key={rowIndex} onClick={() => props.onRowClick?.(row)}>
                            {props.columns.map(column => (
                                <td key={column.columnId ?? column.propertyName}>
                                    {column.renderer
                                        ? column.renderer(row)
                                        : String((row as Record<string, unknown>)[column.propertyName ?? ''])}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        ),
        Tooltip: (props: PropsWithChildren<{ content?: ReactNode }>): JSX.Element => (
            <>{props.children}</>
        ),
    }
}, { virtual: true })

const mockUseCampusLeaderboard = jest.fn()

jest.mock('../../lib/hooks', () => ({
    useCampusLeaderboard: (...args: unknown[]) => mockUseCampusLeaderboard(...args),
}))

const participation = (overrides: Partial<CampusParticipation> = {}): CampusParticipation => ({
    challengeEndDate: '2026-02-01T00:00:00.000Z',
    challengeId: 'c1',
    challengeName: 'Campus Sprint',
    challengeStatus: 'COMPLETED',
    challengeTrack: 'Development',
    challengeType: 'Challenge',
    isCampusChallenge: true,
    isPublicChallenge: false,
    passedReview: true,
    placement: 1,
    registered: true,
    registeredAt: '2026-01-05T00:00:00.000Z',
    reviewed: true,
    score: 95,
    submitted: true,
    submittedDate: '2026-01-20T00:00:00.000Z',
    won: true,
    ...overrides,
})

const member = (overrides: Partial<CampusLeaderboardMember> = {}): CampusLeaderboardMember => ({
    challenges: [participation()],
    firstName: 'Ada',
    handle: 'testaws1',
    hasActivity: true,
    lastName: 'Lovelace',
    memberSince: '2025-01-01T00:00:00.000Z',
    passingSubmissions: 1,
    photoURL: null,
    rank: 1,
    rating: 1500,
    ratingColor: '#3f3',
    registrations: 1,
    signupDate: '2026-01-01T00:00:00.000Z',
    submissions: 1,
    userId: '1',
    wins: 1,
    ...overrides,
})

const leaderboard = (): CampusLeaderboard => ({
    challengeFilter: 'all',
    group: { id: 'group-1', name: 'MECW', oldId: null, privateGroup: false },
    members: [
        member(),
        member({
            challenges: [],
            handle: 'quiet_member',
            hasActivity: false,
            passingSubmissions: 0,
            rank: 2,
            registrations: 0,
            submissions: 0,
            userId: '2',
            wins: 0,
        }),
    ],
    summary: { membersRegistered: 842, membersSubmitted: 623, totalMembers: 1248 },
})

function renderPage(): void {
    render(
        <MemoryRouter initialEntries={['/mecw']}>
            <Routes>
                <Route element={<CampusLeaderboardPage />} path='/:groupName' />
            </Routes>
        </MemoryRouter>,
    )
}

describe('CampusLeaderboardPage', () => {
    beforeEach(() => {
        mockWindowWidth = 1280
        mockUseCampusLeaderboard.mockReturnValue({ data: leaderboard(), isLoading: false })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('requests the leaderboard for the group in the route', () => {
        renderPage()

        expect(mockUseCampusLeaderboard)
            .toHaveBeenCalledWith('mecw', 'all')
    })

    it('renders the participation summary and every group member', () => {
        renderPage()

        expect(screen.getByText('1,248'))
            .toBeInTheDocument()
        expect(screen.getByText('842'))
            .toBeInTheDocument()
        expect(screen.getByText('623'))
            .toBeInTheDocument()
        expect(screen.getByText('testaws1'))
            .toBeInTheDocument()
        expect(screen.getByText('quiet_member'))
            .toBeInTheDocument()
    })

    it('opens the participation history only when the chevron is clicked for active members', () => {
        renderPage()

        expect(screen.queryByRole('button', {
            name: /View participation history for quiet_member/i,
        })).not.toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', {
            name: /View participation history for testaws1/i,
        }))
        expect(screen.getByText('testaws1 Participation History'))
            .toBeInTheDocument()
        expect(screen.getByText('Campus Sprint'))
            .toBeInTheDocument()
        expect(screen.getByLabelText('1st place'))
            .toBeInTheDocument()
    })

    it('falls back to the placeholder avatar when a member has no photo', () => {
        mockUseCampusLeaderboard.mockReturnValue({
            data: {
                ...leaderboard(),
                members: [
                    member({ handle: 'with_photo', photoURL: 'https://images.example.test/a.png' }),
                    member({ handle: 'without_photo', photoURL: null, userId: '2' }),
                ],
            },
            isLoading: false,
        })
        renderPage()

        const avatars = Array.from(document.querySelectorAll('img'))

        expect(avatars)
            .toHaveLength(2)
        expect(avatars[0].getAttribute('src'))
            .toBe('https://images.example.test/a.png')
        expect(avatars[1].getAttribute('src'))
            .toContain('avatar-placeholder')
    })

    it('swaps in the placeholder avatar when a member photo fails to load', () => {
        mockUseCampusLeaderboard.mockReturnValue({
            data: {
                ...leaderboard(),
                members: [member({ photoURL: 'https://images.example.test/broken.png' })],
            },
            isLoading: false,
        })
        renderPage()

        const avatar = document.querySelector('img') as HTMLImageElement

        expect(avatar.getAttribute('src'))
            .toBe('https://images.example.test/broken.png')

        fireEvent.error(avatar)

        expect(avatar.getAttribute('src'))
            .toContain('avatar-placeholder')
    })

    it('keeps a still running review out of the failed review state', () => {
        mockUseCampusLeaderboard.mockReturnValue({
            data: {
                ...leaderboard(),
                members: [member({
                    challenges: [participation({
                        passedReview: false,
                        placement: null,
                        reviewed: false,
                        won: false,
                    })],
                })],
            },
            isLoading: false,
        })
        renderPage()

        fireEvent.click(screen.getByRole('button', {
            name: /View participation history for testaws1/i,
        }))

        expect(screen.getByText('In Review'))
            .toBeInTheDocument()
        expect(screen.queryByText('Failed Review'))
            .not.toBeInTheDocument()
    })

    it('orders the participation history by submission date, then registration date', () => {
        mockUseCampusLeaderboard.mockReturnValue({
            data: {
                ...leaderboard(),
                members: [member({
                    challenges: [
                        participation({
                            challengeId: 'c1',
                            challengeName: 'Submitted first',
                            submittedDate: '2026-01-10T00:00:00.000Z',
                        }),
                        participation({
                            challengeId: 'c2',
                            challengeName: 'Registered first, never submitted',
                            registeredAt: '2026-01-05T00:00:00.000Z',
                            submittedDate: null,
                        }),
                        participation({
                            challengeId: 'c3',
                            challengeName: 'Submitted last',
                            submittedDate: '2026-02-20T00:00:00.000Z',
                        }),
                        participation({
                            challengeId: 'c4',
                            challengeName: 'Registered last, never submitted',
                            registeredAt: '2026-01-20T00:00:00.000Z',
                            submittedDate: null,
                        }),
                    ],
                })],
            },
            isLoading: false,
        })
        renderPage()

        fireEvent.click(screen.getByRole('button', {
            name: /View participation history for testaws1/i,
        }))

        const expectedChallengeNames = new Set([
            'Submitted last',
            'Submitted first',
            'Registered last, never submitted',
            'Registered first, never submitted',
        ])
        const challengeNames = screen.getAllByRole('link')
            .filter(link => expectedChallengeNames.has(link.textContent ?? ''))
            .map(link => link.textContent)

        expect(challengeNames)
            .toEqual([
                'Submitted last',
                'Submitted first',
                'Registered last, never submitted',
                'Registered first, never submitted',
            ])
    })

    it('stacks the participation history into labelled rows on small screens', () => {
        mockWindowWidth = 375
        renderPage()

        fireEvent.click(screen.getByRole('button', {
            name: /View participation history for testaws1/i,
        }))

        expect(screen.getByText('Registration Date:'))
            .toBeInTheDocument()
        expect(screen.getByText('Campus Sprint'))
            .toBeInTheDocument()
    })

    it('re-requests the leaderboard when the challenge filter changes', () => {
        renderPage()

        fireEvent.change(screen.getByTestId('challenge-filter'), { target: { value: 'campus' } })

        expect(mockUseCampusLeaderboard)
            .toHaveBeenLastCalledWith('mecw', 'campus')
    })
})
