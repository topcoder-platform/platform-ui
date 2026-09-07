/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { act } from 'react'
import type { PropsWithChildren } from 'react'
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'

import { useWindowSize } from '~/libs/shared'
import type { TableColumn } from '~/libs/ui'

import type {
    BackendSubmission,
    ChallengeDetailContextModel,
    ChallengeInfo,
    ReviewAppContextModel,
} from '../../models'
import {
    ChallengeDetailContext,
    ReviewAppContext,
} from '../../contexts'
import { reprocessTopgearSubmission } from '../../services'

import { TabContentSubmissions } from './TabContentSubmissions'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        REVIEW: {
            PROFILE_PAGE_URL: 'https://profiles.example.com',
        },
    },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    getRatingColor: jest.fn()
        .mockReturnValue('#000000'),
    UserRole: {
        administrator: 'administrator',
        projectManager: 'projectManager',
    },
    xhrGetAsync: jest.fn(),
}), { virtual: true })

jest.mock('../../contexts', () => {
    const React: typeof import('react') = jest.requireActual('react')

    return {
        ChallengeDetailContext: React.createContext({}),
        ReviewAppContext: React.createContext({}),
    }
})

jest.mock('react-toastify', () => ({
    toast: {
        error: jest.fn(),
        success: jest.fn(),
    },
}))

jest.mock('~/apps/admin/src/lib', () => ({
    TableLoading: () => <div>Loading</div>,
}), { virtual: true })

jest.mock('~/apps/admin/src/lib/components/common/TableMobile', () => ({
    TableMobile: (props: {
        columns: TableColumn<BackendSubmission>[][]
        data: BackendSubmission[]
    }) => {
        const { Table }: typeof import('~/libs/ui') = jest.requireMock('~/libs/ui')

        return <Table columns={props.columns.map(columns => columns[1])} data={props.data} />
    },
}), { virtual: true })

jest.mock('~/apps/admin/src/lib/utils', () => ({
    handleError: jest.fn(),
}), { virtual: true })

jest.mock('~/libs/shared', () => ({
    copyTextToClipboard: () => Promise.resolve(),
    useWindowSize: jest.fn(),
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    IconOutline: {
        DocumentDuplicateIcon: () => <span />,
        RefreshIcon: () => <span />,
    },
    Table: (props: {
        columns: Array<{
            propertyName?: string
            renderer?: (row: BackendSubmission, rows: BackendSubmission[]) => JSX.Element
        }>
        data: BackendSubmission[]
    }) => (
        <table>
            <tbody>
                {props.data.map(row => (
                    <tr key={row.id}>
                        {props.columns.map((column, index) => (
                            <td key={column.propertyName ?? index}>
                                {column.renderer
                                    ? column.renderer(row, props.data)
                                    : row[column.propertyName as keyof BackendSubmission] as string}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    ),
    Tooltip: (props: PropsWithChildren) => <>{props.children}</>,
}), { virtual: true })

jest.mock('../../hooks', () => ({
    useRolePermissions: () => ({
        actionChallengeRole: undefined,
        canManageCompletedReviews: true,
        canViewAllSubmissions: true,
        hasCopilotRole: false,
        hasReviewerRole: false,
        hasSubmitterRole: false,
        isAdmin: true,
        isCopilotWithReviewerAssignments: false,
        isProjectManager: false,
        ownedMemberIds: new Set<string>(),
    }),
}))

jest.mock('../../hooks/useSubmissionDownloadAccess', () => ({
    useSubmissionDownloadAccess: () => ({
        currentMemberId: 'admin-user',
        getRestrictionMessageForMember: () => undefined,
        isSubmissionDownloadRestricted: false,
        isSubmissionDownloadRestrictedForMember: () => false,
        isSubmissionPhaseOpen: false,
        restrictionMessage: '',
        shouldRestrictSubmitterToOwnSubmission: false,
    }),
}))

jest.mock('../../services', () => ({
    canReprocessTopgearSubmission: () => true,
    reprocessTopgearSubmission: jest.fn(),
}))

jest.mock('../CollapsibleAiReviewsRow', () => ({
    CollapsibleAiReviewsRow: () => <div>AI reviews</div>,
}))

jest.mock('../ConfirmModal', () => ({
    ConfirmModal: (props: PropsWithChildren<{
        action?: string
        cancelText?: string
        onClose: () => void
        onConfirm: () => void
        open: boolean
        title: string
    }>) => (
        props.open ? (
            <div aria-label={props.title} role='dialog'>
                {props.children}
                <button onClick={props.onClose} type='button'>
                    {props.cancelText ?? 'Cancel'}
                </button>
                <button onClick={props.onConfirm} type='button'>
                    {props.action ?? 'Confirm'}
                </button>
            </div>
        ) : undefined
    ),
}))

jest.mock('../SubmissionHistoryModal', () => ({
    SubmissionHistoryModal: () => undefined,
}))

jest.mock('../TableNoRecord', () => ({
    TableNoRecord: (props: { message?: string }) => <div>{props.message}</div>,
}))

jest.mock('../TableWrapper', () => ({
    TableWrapper: (props: PropsWithChildren<{ className?: string }>) => (
        <div className={props.className}>{props.children}</div>
    ),
}))

const mockedReprocessTopgearSubmission = reprocessTopgearSubmission as jest.Mock
const mockedUseWindowSize = useWindowSize as jest.Mock

const submission = {
    challengeId: 'challenge-1',
    id: 'submission-1',
    isFileSubmission: false,
    memberId: 'member-1',
    review: [],
    reviewSummation: [],
    submittedDate: '2026-05-01T00:00:00.000Z',
    url: 'https://example.com/submission',
} as unknown as BackendSubmission

const challengeInfo = {
    id: 'challenge-1',
    metadata: [],
    phases: [],
    status: 'Completed',
    submissions: [],
    track: {
        id: 'track-1',
        name: 'Development',
    },
    type: {
        id: 'type-1',
        name: 'Topgear Task',
    },
} as unknown as ChallengeInfo

const challengeDetailContextValue = {
    aiReviewDecisionsBySubmissionId: {},
    challengeId: 'challenge-1',
    challengeInfo,
    challengeSubmissions: [submission],
    duplicatesBySubmissionId: {},
    hasChallengeScopedFetchError: false,
    isLoadingAiReviewConfig: false,
    isLoadingAiReviewDecisions: false,
    isLoadingChallengeInfo: false,
    isLoadingChallengeResources: false,
    isLoadingChallengeSubmissions: false,
    isLoadingSubmissionDuplicates: false,
    myResources: [],
    myRoles: [],
    registrants: [],
    resourceMemberIdMapping: {},
    resources: [],
    retryChallengeScopedFetches: jest.fn(),
    reviewers: [],
} as ChallengeDetailContextModel

const reviewAppContextValue = {
    cancelLoadChallengeRelativeInfos: jest.fn(),
    challengeRelativeInfosMapping: {},
    loadChallengeRelativeInfos: jest.fn(),
    loginUserInfo: {
        roles: ['administrator'],
        userId: 123,
    },
} as ReviewAppContextModel

/**
 * Render the submissions tab with optional challenge settings and submission history.
 *
 * @param challengeOverrides - Challenge fields to override for a visibility scenario.
 * @param submissions - Backend rows supplied to the tab and challenge context.
 * @returns Testing Library's render result for assertions and interactions.
 * @throws Propagates rendering errors from the component under test.
 */
function renderSubmissions(
    challengeOverrides: Partial<ChallengeInfo> = {},
    submissions: BackendSubmission[] = [submission],
): ReturnType<typeof render> {
    return render(
        <ReviewAppContext.Provider value={reviewAppContextValue}>
            <ChallengeDetailContext.Provider value={{
                ...challengeDetailContextValue,
                challengeInfo: { ...challengeInfo, ...challengeOverrides },
                challengeSubmissions: submissions,
            }}
            >
                <TabContentSubmissions
                    downloadSubmission={jest.fn()}
                    isDownloading={{}}
                    isLoading={false}
                    submissions={submissions}
                />
            </ChallengeDetailContext.Provider>
        </ReviewAppContext.Provider>,
    )
}

describe('TabContentSubmissions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedReprocessTopgearSubmission.mockResolvedValue('ok')
        mockedUseWindowSize.mockReturnValue({ height: 800, width: 1200 })
    })

    it('confirms before reprocessing a Topgear submission', async () => {
        renderSubmissions()

        fireEvent.click(screen.getByRole('button', { name: 'Reprocess Topgear submission' }))

        expect(screen.getByRole('dialog', { name: 'Reprocess Topgear Submission' }))
            .toBeTruthy()
        expect(screen.getByText('Are you sure you want to reprocess this Topgear submission?'))
            .toBeTruthy()
        expect(mockedReprocessTopgearSubmission)
            .not
            .toHaveBeenCalled()

        fireEvent.click(screen.getByRole('button', { name: 'No' }))

        expect(screen.queryByRole('dialog', { name: 'Reprocess Topgear Submission' }))
            .toBeNull()
        expect(mockedReprocessTopgearSubmission)
            .not
            .toHaveBeenCalled()

        fireEvent.click(screen.getByRole('button', { name: 'Reprocess Topgear submission' }))
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Yes' }))
        })

        await waitFor(() => {
            expect(mockedReprocessTopgearSubmission)
                .toHaveBeenCalledWith({
                    submission,
                    submissionInfo: expect.objectContaining({
                        id: 'submission-1',
                    }),
                })
        })
    })

    describe.each([1200, 768])('submission history at viewport width %i', width => {
        const unlimited = JSON.stringify({ count: '', limit: 'false', unlimited: 'true' })
        const limited = JSON.stringify({ count: '2', limit: 'true', unlimited: 'false' })
        const submissionsWithHistory = [
            {
                ...submission,
                isLatest: true,
                type: 'CONTEST_SUBMISSION',
            },
            {
                ...submission,
                id: 'older-submission',
                isLatest: false,
                submittedDate: '2026-04-30T00:00:00.000Z',
                type: 'CONTEST_SUBMISSION',
            },
        ]

        beforeEach(() => {
            mockedUseWindowSize.mockReturnValue({ height: 800, width })
        })

        it.each([unlimited, undefined])('shows all unlimited Design rows without history for %s', value => {
            renderSubmissions({
                metadata: value ? [{ name: 'submissionLimit', value }] : [],
                track: { id: 'design-track', name: 'Design' },
                type: { id: 'challenge-type', name: 'Challenge' },
            }, submissionsWithHistory)

            expect(screen.queryAllByRole('button', { name: 'View Submission History' }))
                .toHaveLength(0)
            for (const entry of submissionsWithHistory) {
                expect(screen.getByText(entry.id))
                    .toBeTruthy()
            }
        })

        it.each([
            ['Design', 'Challenge', limited],
            ['Development', 'Challenge', unlimited],
            ['Development', 'First2Finish', unlimited],
            ['Data Science', 'Marathon Match', unlimited],
            ['Quality Assurance', 'Challenge', unlimited],
        ])('preserves history for %s / %s', (track, type, value) => {
            renderSubmissions({
                metadata: [{ name: 'submissionLimit', value }],
                track: { id: 'track-1', name: track },
                type: { id: 'type-1', name: type },
            }, submissionsWithHistory)

            expect(screen.getAllByRole('button', { name: 'View Submission History' }).length)
                .toBeGreaterThan(0)
        })
    })
})
