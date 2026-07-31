/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type { PropsWithChildren } from 'react'
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'

import {
    ChallengeDetailContext,
    ReviewAppContext,
} from '../../contexts'
import type {
    ChallengeDetailContextModel,
    ChallengeInfo,
    ProjectResult,
    ReviewAppContextModel,
} from '../../models'

import { TableWinners } from './TableWinners'

const mockIsSubmissionDownloadRestrictedForMember = jest.fn()

jest.mock('../../contexts', () => {
    const React: typeof import('react') = jest.requireActual('react')

    return {
        ChallengeDetailContext: React.createContext({}),
        ReviewAppContext: React.createContext({}),
    }
})

jest.mock('~/libs/shared', () => ({
    useWindowSize: () => ({
        height: 800,
        width: 1200,
    }),
}), { virtual: true })

jest.mock('~/apps/admin/src/lib/components/common/TableMobile', () => ({
    TableMobile: () => <div>Mobile table</div>,
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    Table: (props: {
        columns: Array<{
            propertyName?: string
            renderer?: (row: ProjectResult, rows: ProjectResult[]) => JSX.Element
        }>
        data: ProjectResult[]
    }) => {
        const submissionColumn = props.columns.find(
            column => column.propertyName === 'submissionId',
        )

        return (
            <div>
                {props.data.map(row => (
                    <div key={row.submissionId}>
                        {submissionColumn?.renderer?.(row, props.data)}
                    </div>
                ))}
            </div>
        )
    },
    Tooltip: (props: PropsWithChildren) => <>{props.children}</>,
}), { virtual: true })

jest.mock('../../hooks', () => ({
    useRolePermissions: () => ({
        canViewAllSubmissions: false,
    }),
    useSubmissionDownloadAccess: () => ({
        getRestrictionMessageForMember: () => undefined,
        isSubmissionDownloadRestrictedForMember: mockIsSubmissionDownloadRestrictedForMember,
        restrictionMessage: 'Download restricted',
    }),
}))

jest.mock('../../utils', () => ({
    buildPhaseTabs: () => [],
    getHandleUrl: () => '#',
}))

jest.mock('../../../config/index.config', () => ({
    ORDINAL_SUFFIX: new Map([[1, 'first']]),
}))

jest.mock('../CollapsibleAiReviewsRow', () => ({
    CollapsibleAiReviewsRow: () => <div>AI reviews</div>,
}))

jest.mock('../TableWrapper', () => ({
    TableWrapper: (props: PropsWithChildren) => <div>{props.children}</div>,
}))

const winner = {
    challengeId: 'challenge-id',
    createdAt: '2026-07-01T00:00:00.000Z',
    finalScore: 95,
    initialScore: 90,
    placement: 1,
    reviews: [],
    submissionId: 'winning-submission-id',
    userId: 'winning-member-id',
} as ProjectResult

const challengeInfo = {
    aiReviewDecisionsBySubmissionId: {},
    metadata: [{
        name: 'submissionsViewable',
        value: 'false',
    }],
    phases: [],
    status: 'Completed',
    track: {
        name: 'Design',
    },
    type: {
        name: 'Challenge',
    },
} as unknown as ChallengeInfo

const challengeContext = {
    aiReviewDecisionsBySubmissionId: {},
    challengeInfo,
} as unknown as ChallengeDetailContextModel

const reviewAppContext = {
    loginUserInfo: {
        userId: 'different-member-id',
    },
} as unknown as ReviewAppContextModel

describe('TableWinners download access', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockIsSubmissionDownloadRestrictedForMember.mockReturnValue(false)
    })

    /**
     * Renders the Winners table with a completed Design challenge and one canonical winner.
     *
     * @param downloadSubmission callback used to verify winning-submission download actions.
     * @returns Nothing; the rendered table is queried through Testing Library.
     * @throws Does not throw.
     */
    function renderTable(downloadSubmission: (submissionId: string) => void): void {
        render(
            <MemoryRouter>
                <ReviewAppContext.Provider value={reviewAppContext}>
                    <ChallengeDetailContext.Provider value={challengeContext}>
                        <TableWinners
                            datas={[winner]}
                            downloadSubmission={downloadSubmission}
                            isDownloading={{}}
                        />
                    </ChallengeDetailContext.Provider>
                </ReviewAppContext.Provider>
            </MemoryRouter>,
        )
    }

    it('defers completed winner authorization to the download API when legacy visibility is false', () => {
        const downloadSubmission = jest.fn()
        renderTable(downloadSubmission)

        const downloadButton = screen.getByRole('button', {
            name: winner.submissionId,
        })

        expect(downloadButton)
            .toBeEnabled()

        fireEvent.click(downloadButton)

        expect(downloadSubmission)
            .toHaveBeenCalledWith(winner.submissionId)
    })

    it('keeps the shared submission-download restriction enforced', () => {
        mockIsSubmissionDownloadRestrictedForMember.mockReturnValue(true)
        renderTable(jest.fn())

        expect(screen.getByRole('button', {
            name: winner.submissionId,
        }))
            .toBeDisabled()
    })
})
