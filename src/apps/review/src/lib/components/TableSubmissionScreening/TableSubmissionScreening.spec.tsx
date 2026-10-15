/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type { PropsWithChildren } from 'react'
import { render, screen } from '@testing-library/react'

import {
    ChallengeDetailContext,
    ReviewAppContext,
} from '../../contexts'
import type {
    ChallengeDetailContextModel,
    ChallengeInfo,
    ReviewAppContextModel,
    Screening,
} from '../../models'

import { TableSubmissionScreening } from './TableSubmissionScreening'

interface TestColumn {
    columnId?: string
    renderer?: (row: Screening, rows: Screening[]) => JSX.Element
}

/**
 * Renders only the expandable AI reviews column using the table's real column renderer.
 *
 * @param props - Visible rows and the screening table column definitions.
 * @returns One container per row holding the rendered AI reviews cell.
 * @throws Propagates errors from the production column renderer.
 */
function mockRenderTable(props: { columns: TestColumn[], data: Screening[] }): JSX.Element {
    const aiColumn = props.columns.find(column => column.columnId === 'ai-reviews-table')

    return (
        <div>
            {props.data.map(row => (
                <div key={row.submissionId} data-testid={row.submissionId}>
                    {aiColumn?.renderer?.(row, props.data)}
                </div>
            ))}
        </div>
    )
}

jest.mock('react-router-dom', () => ({
    Link: (props: PropsWithChildren<{ className?: string, to: string }>) => (
        <a className={props.className} href={props.to}>{props.children}</a>
    ),
}))

jest.mock('react-toastify', () => ({
    toast: {
        success: jest.fn(),
    },
}))

jest.mock('~/libs/core', () => ({
    UserRole: {
        administrator: 'administrator',
    },
}), { virtual: true })

jest.mock('~/libs/shared', () => ({
    copyTextToClipboard: () => Promise.resolve(),
    useWindowSize: () => ({
        height: 800,
        width: 1200,
    }),
}), { virtual: true })

jest.mock('~/apps/admin/src/lib/components/common/TableMobile', () => ({
    TableMobile: () => <div />,
}), { virtual: true })

jest.mock('~/apps/admin/src/lib/utils', () => ({
    handleError: jest.fn(),
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    IconOutline: {
        CheckCircleIcon: () => <span />,
        DocumentDuplicateIcon: () => <span />,
    },
    Table: (props: { columns: TestColumn[], data: Screening[] }) => mockRenderTable(props),
    Tooltip: (props: PropsWithChildren<unknown>) => <span>{props.children}</span>,
}), { virtual: true })

jest.mock('../../contexts', () => {
    const React: typeof import('react') = jest.requireActual('react')

    return {
        ChallengeDetailContext: React.createContext({}),
        ReviewAppContext: React.createContext({}),
    }
})

jest.mock('../../hooks', () => ({
    useRole: () => ({
        hasReviewerRole: false,
    }),
    useRolePermissions: () => ({
        canViewAllSubmissions: true,
    }),
    useSubmissionDownloadAccess: () => ({
        currentMemberId: undefined,
        getRestrictionMessageForMember: () => undefined,
        isSubmissionDownloadRestrictedForMember: () => false,
        restrictionMessage: undefined,
    }),
}))

jest.mock('../../services', () => ({
    updateReview: jest.fn(),
}))

jest.mock('../../utils', () => ({
    getChallengeSubmissionSelectionLimit: jest.requireActual('../../utils/challenge')
        .getChallengeSubmissionSelectionLimit,
    getHandleUrl: () => 'https://profiles.example.com',
    getSubmissionHistoryKey: jest.requireActual('../../utils/submissionHistory').getSubmissionHistoryKey,
    isReviewPhaseCurrentlyOpen: () => false,
    partitionSubmissionHistory: jest.requireActual('../../utils/submissionHistory').partitionSubmissionHistory,
    refreshChallengeReviewData: jest.fn(),
    REOPEN_MESSAGE_OTHER: 'Reopen another review?',
    REOPEN_MESSAGE_SELF: 'Reopen your review?',
    selectVisibleScreeningRows: jest.requireActual('../../utils/screeningRows').selectVisibleScreeningRows,
}))

jest.mock('../CollapsibleAiReviewsRow', () => ({
    CollapsibleAiReviewsRow: (props: {
        aiReviewers: { aiWorkflowId: string }[]
        submission: { id: string }
    }) => (
        <div data-testid='ai-reviews-row'>
            {`${props.aiReviewers.length} challenge AI reviewers for ${props.submission.id}`}
        </div>
    ),
}))

jest.mock('../SubmissionDuplicates/SubmissionDuplicatesBadge', () => ({
    SubmissionDuplicatesBadge: () => <span />,
}))

jest.mock('../SubmissionHistoryModal', () => ({
    SubmissionHistoryModal: () => <div />,
}))

jest.mock('../ConfirmModal', () => ({
    ConfirmModal: () => <div />,
}))

jest.mock('../TableWrapper', () => ({
    TableWrapper: (props: PropsWithChildren<{ className?: string }>) => (
        <div className={props.className}>{props.children}</div>
    ),
}))

const designChallengeInfo = {
    id: 'design-challenge',
    metadata: [],
    status: 'COMPLETED',
    submissions: [],
    track: {
        name: 'Design',
    },
} as unknown as ChallengeInfo

const screeningRow = {
    challengeId: 'design-challenge',
    createdAt: '2026-08-27T08:46:29.297Z',
    memberId: '100000218',
    result: 'PASS',
    score: '100.00',
    submissionId: 'design-submission',
    type: 'CONTEST_SUBMISSION',
    virusScan: true,
} as Screening

/**
 * Renders the screening table for a completed Design challenge as a manager.
 *
 * @param aiReviewers - Challenge AI reviewers passed down by the challenge details page.
 * @returns Nothing; the rendered output is queried through `screen`.
 */
function renderDesignScreening(aiReviewers?: { aiWorkflowId: string }[]): void {
    const challengeDetailContext = {
        challengeInfo: designChallengeInfo,
        myResources: [],
        myRoles: ['Manager'],
    } as unknown as ChallengeDetailContextModel
    const reviewAppContext = {
        loginUserInfo: {
            roles: [],
        },
    } as unknown as ReviewAppContextModel

    render(
        <ReviewAppContext.Provider value={reviewAppContext}>
            <ChallengeDetailContext.Provider value={challengeDetailContext}>
                <TableSubmissionScreening
                    screenings={[screeningRow]}
                    isDownloading={{}}
                    downloadSubmission={jest.fn()}
                    aiReviewers={aiReviewers}
                />
            </ChallengeDetailContext.Provider>
        </ReviewAppContext.Provider>,
    )
}

describe('TableSubmissionScreening AI reviews row', () => {
    it('renders the AI reviews row when the Design challenge has no challenge AI reviewers', () => {
        renderDesignScreening([])

        expect(screen.getByTestId('ai-reviews-row').textContent)
            .toBe('0 challenge AI reviewers for design-submission')
    })

    it('renders the AI reviews row when no AI reviewers are passed at all', () => {
        renderDesignScreening(undefined)

        expect(screen.getByTestId('ai-reviews-row').textContent)
            .toBe('0 challenge AI reviewers for design-submission')
    })

    it('passes configured challenge AI reviewers through to the AI reviews row', () => {
        renderDesignScreening([{ aiWorkflowId: 'workflow-1' }])

        expect(screen.getByTestId('ai-reviews-row').textContent)
            .toBe('1 challenge AI reviewers for design-submission')
    })
})
