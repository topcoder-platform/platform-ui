/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { render } from '@testing-library/react'

import {
    ChallengeDetailContext,
} from '../../contexts'
import type {
    ChallengeDetailContextModel,
    ChallengeInfo,
    SubmissionInfo,
} from '../../models'
import type {
    DownloadButtonConfig,
    SubmissionReviewerRow,
} from '../common/types'

import { TableAppealsForSubmitter } from './TableAppealsForSubmitter'

const mockRenderSubmissionIdCell = jest.fn()

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        REVIEW: {
            PROFILE_PAGE_URL: 'https://profiles.test',
        },
    },
}), { virtual: true })

jest.mock('../../contexts', () => {
    const React: typeof import('react') = jest.requireActual('react')

    return {
        ChallengeDetailContext: React.createContext({}),
    }
})

jest.mock('~/libs/core', () => ({
    getRatingColor: () => '#2a2a2a',
}), { virtual: true })

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
            renderer?: (
                row: SubmissionReviewerRow,
                rows: SubmissionReviewerRow[],
            ) => JSX.Element
        }>
        data: SubmissionReviewerRow[]
    }) => (
        <div>
            {props.data.map(row => (
                <div key={`${row.id}-${row.reviewerIndex}`}>
                    {props.columns[0].renderer?.(row, props.data)}
                </div>
            ))}
        </div>
    ),
}), { virtual: true })

jest.mock('../../hooks', () => ({
    useRolePermissions: () => ({
        ownedMemberIds: new Set(['member-current']),
    }),
    useScoreVisibility: () => ({
        canDisplayScores: () => true,
        isChallengeCompleted: true,
        isPastChallengeStatus: true,
    }),
    useSubmissionDownloadAccess: () => ({
        getRestrictionMessageForMember: () => undefined,
        isSubmissionDownloadRestricted: false,
        isSubmissionDownloadRestrictedForMember: () => false,
        restrictionMessage: undefined,
        shouldRestrictSubmitterToOwnSubmission: false,
    }),
}))

jest.mock('../common/TableColumnRenderers', () => {
    const React = jest.requireActual('react')
    /**
     * Renders an inert cell for columns outside this ownership-boundary test.
     *
     * @returns An empty span element.
     * @throws This test helper does not throw.
     */
    const emptyCell = (): JSX.Element => React.createElement('span')

    return {
        renderAppealsCell: emptyCell,
        renderReviewDateCell: emptyCell,
        renderReviewerCell: emptyCell,
        renderReviewScoreCell: emptyCell,
        renderScoreCell: emptyCell,
        renderSubmissionIdCell: (
            row: SubmissionReviewerRow,
            config: DownloadButtonConfig,
        ) => {
            mockRenderSubmissionIdCell(row, config)
            return React.createElement('span', undefined, row.id)
        },
        renderSubmitterHandleCell: emptyCell,
    }
})

jest.mock('../CollapsibleAiReviewsRow', () => ({
    CollapsibleAiReviewsRow: () => <div>AI reviews</div>,
}))

jest.mock('../TableWrapper', () => ({
    TableWrapper: (props: { children: JSX.Element }) => <div>{props.children}</div>,
}))

const ownSubmission = {
    id: 'own-submission',
    isLatest: true,
    memberId: 'member-current',
    type: 'CONTEST_SUBMISSION',
} as SubmissionInfo
const foreignSubmission = {
    id: 'foreign-submission',
    isLatest: true,
    memberId: 'member-other',
    type: 'CONTEST_SUBMISSION',
} as SubmissionInfo
const challengeInfo = {
    metadata: [],
    phases: [
        {
            isOpen: false,
            name: 'Appeals',
        },
    ],
    status: 'Completed',
    submissions: [
        ownSubmission,
        foreignSubmission,
    ],
    track: {
        name: 'Development',
    },
    type: {
        name: 'Challenge',
    },
} as unknown as ChallengeInfo
const challengeContext = {
    challengeInfo,
    myResources: [
        {
            memberId: 'member-current',
            roleName: 'Submitter',
        },
    ],
    reviewers: [],
} as unknown as ChallengeDetailContextModel

describe('TableAppealsForSubmitter ownership boundary', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('drops foreign rows and always enables the table-level ownership guard', () => {
        render(
            <ChallengeDetailContext.Provider value={challengeContext}>
                <TableAppealsForSubmitter
                    datas={[
                        ownSubmission,
                        foreignSubmission,
                    ]}
                    downloadSubmission={jest.fn()}
                    isDownloading={{}}
                    mappingReviewAppeal={{}}
                />
            </ChallengeDetailContext.Provider>,
        )

        expect(mockRenderSubmissionIdCell)
            .toHaveBeenCalledTimes(1)
        expect(mockRenderSubmissionIdCell)
            .toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'own-submission',
                    memberId: 'member-current',
                }),
                expect.objectContaining({
                    shouldRestrictSubmitterToOwnSubmission: true,
                }),
            )
        expect(mockRenderSubmissionIdCell)
            .not
            .toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'foreign-submission',
                }),
                expect.anything(),
            )
    })
})
