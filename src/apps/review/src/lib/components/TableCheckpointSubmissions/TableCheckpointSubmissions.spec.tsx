/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type { PropsWithChildren, ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'

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

import { TableCheckpointSubmissions } from './TableCheckpointSubmissions'

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
    TableMobile: () => <div>Mobile table</div>,
}), { virtual: true })

jest.mock('~/apps/admin/src/lib/utils', () => ({
    handleError: jest.fn(),
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    IconOutline: {
        CheckIcon: () => <span />,
        DocumentDuplicateIcon: () => <span />,
    },
    IconSolid: {
        StarIcon: () => <span data-testid='checkpoint-winner-star' />,
    },
    Table: (props: {
        columns: Array<{
            label?: ReactNode
            renderer?: (row: Screening, rows: Screening[]) => JSX.Element
        }>
        data: Screening[]
    }) => {
        const scoreColumn = props.columns.find(column => column.label === 'Review Score')

        return (
            <div>
                {props.data.map(row => (
                    <div key={row.submissionId}>
                        {scoreColumn?.renderer?.(row, props.data)}
                    </div>
                ))}
            </div>
        )
    },
    Tooltip: (props: PropsWithChildren<{
        content?: ReactNode
        triggerOn?: string
    }>) => (
        <span
            data-testid='checkpoint-winner-tooltip'
            data-trigger-on={props.triggerOn}
        >
            {props.children}
            <span>{props.content}</span>
        </span>
    ),
}), { virtual: true })

jest.mock('../../contexts', () => {
    const React: typeof import('react') = jest.requireActual('react')

    return {
        ChallengeDetailContext: React.createContext({}),
        ReviewAppContext: React.createContext({}),
    }
})

jest.mock('../../hooks', () => ({
    useRolePermissions: () => ({
        canViewAllSubmissions: true,
    }),
    useSubmissionDownloadAccess: () => ({
        getRestrictionMessageForMember: () => undefined,
        isSubmissionDownloadRestrictedForMember: () => false,
        restrictionMessage: undefined,
    }),
}))

jest.mock('../../services', () => ({
    updateReview: jest.fn(),
}))

jest.mock('../../utils', () => ({
    getHandleUrl: () => 'https://profiles.example.com',
    isReviewPhaseCurrentlyOpen: () => false,
    refreshChallengeReviewData: jest.fn(),
    REOPEN_MESSAGE_OTHER: 'Reopen another review?',
    REOPEN_MESSAGE_SELF: 'Reopen your review?',
}))

jest.mock('../CollapsibleAiReviewsRow', () => ({
    CollapsibleAiReviewsRow: () => <div>AI reviews</div>,
}))

jest.mock('../ConfirmModal', () => ({
    ConfirmModal: () => undefined,
}))

jest.mock('../TableWrapper', () => ({
    TableWrapper: (props: PropsWithChildren<{ className?: string }>) => (
        <div className={props.className}>{props.children}</div>
    ),
}))

const winnerRow = {
    challengeId: 'challenge-id',
    createdAt: '2026-07-29T04:17:00.000Z',
    memberId: '5678',
    result: 'PASS',
    score: '100.00',
    submissionId: 'winner-submission',
} as Screening

const nonWinnerRow = {
    ...winnerRow,
    memberId: '9999',
    reviewId: 'non-winner-review',
    score: '88.89',
    submissionId: 'non-winner-submission',
} as Screening

const secondWinnerRow = {
    ...winnerRow,
    reviewId: 'second-winner-review',
    score: '77.78',
    submissionId: 'second-winner-submission',
} as Screening

const failedWinnerRow = {
    ...winnerRow,
    result: 'NO PASS',
    reviewId: 'failed-winner-review',
    score: '0.00',
    submissionId: 'failed-winner-submission',
} as Screening

const challengeInfo = {
    checkpointWinners: [{
        handle: 'checkpointWinner',
        placement: 1,
        userId: 5678,
    }],
    currentPhase: 'Checkpoint Review',
    currentPhaseEndDate: '2026-07-29T05:00:00.000Z',
    id: 'challenge-id',
    metadata: [],
    name: 'Checkpoint Challenge',
    phases: [],
    status: 'Completed',
    submissions: [],
    track: {
        id: 'track-id',
        name: 'Design',
    },
    type: {
        id: 'type-id',
        name: 'Challenge',
    },
    typeId: 'type-id',
} as ChallengeInfo

const challengeContext = {
    challengeInfo,
    myResources: [],
    myRoles: [],
} as unknown as ChallengeDetailContextModel

const reviewAppContext = {
    cancelLoadChallengeRelativeInfos: jest.fn(),
    challengeRelativeInfosMapping: {},
    loadChallengeRelativeInfos: jest.fn(),
    loginUserInfo: {
        roles: [],
        userId: 5678,
    },
} as ReviewAppContextModel

/**
 * Renders the desktop checkpoint review table with passing, failing, and non-winner rows.
 *
 * @returns The Testing Library render result for the checkpoint table.
 * @throws This test helper does not throw.
 */
function renderCheckpointTable(): ReturnType<typeof render> {
    return render(
        <ReviewAppContext.Provider value={reviewAppContext}>
            <ChallengeDetailContext.Provider value={challengeContext}>
                <TableCheckpointSubmissions
                    datas={[winnerRow, secondWinnerRow, failedWinnerRow, nonWinnerRow]}
                    downloadSubmission={jest.fn()}
                    isDownloading={{}}
                    mode='review'
                />
            </ChallengeDetailContext.Provider>
        </ReviewAppContext.Provider>,
    )
}

describe('TableCheckpointSubmissions checkpoint winner indicator', () => {
    it('marks only passing rows whose member id matches a checkpoint winner', () => {
        renderCheckpointTable()

        expect(screen.getAllByRole('button', { name: 'Checkpoint winner details' }))
            .toHaveLength(2)
        expect(screen.getAllByTestId('checkpoint-winner-star'))
            .toHaveLength(2)
        screen.getAllByTestId('checkpoint-winner-tooltip')
            .forEach(tooltip => {
                expect(tooltip.getAttribute('data-trigger-on'))
                    .toBe('click-hover')
            })
        expect(screen.getAllByText(
            'Checkpoint winner. This member is eligible for the checkpoint prize associated with this challenge.',
        ))
            .toHaveLength(2)
        expect(screen.getByText('100.00'))
            .toBeTruthy()
        const failedScoreCell = screen.getByRole('link', { name: '0.00' }).parentElement
        expect(failedScoreCell)
            .toBeTruthy()
        expect(within(failedScoreCell as HTMLElement)
            .queryByRole('button', { name: 'Checkpoint winner details' }))
            .toBeNull()
        expect(screen.getByRole('link', { name: '88.89' })
            .getAttribute('href'))
            .toBe('./../reviews/non-winner-submission?reviewId=non-winner-review')
    })
})
