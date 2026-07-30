/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type { PropsWithChildren } from 'react'
import { render, screen } from '@testing-library/react'

import { ChallengeDetailContext } from '../../contexts'
import type {
    BackendSubmission,
    ChallengeDetailContextModel,
    ChallengeInfo,
} from '../../models'

import { TabContentAiApproval } from './TabContentAiApproval'

jest.mock('../../contexts', () => {
    const React: typeof import('react') = jest.requireActual('react')

    return {
        ChallengeDetailContext: React.createContext({}),
    }
})

jest.mock('react-router-dom', () => ({
    useNavigate: () => jest.fn(),
}))

jest.mock('~/apps/admin/src/lib', () => ({
    TableLoading: () => <div>Loading</div>,
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    Table: (props: {
        columns: Array<{
            columnId?: string
            renderer?: (row: { submission: BackendSubmission }) => JSX.Element
        }>
        data: Array<{ submission: BackendSubmission }>
    }) => {
        const statusColumn = props.columns.find(column => column.columnId === 'status')

        return (
            <div>
                {props.data.map(row => (
                    <div key={row.submission.id}>
                        {statusColumn?.renderer?.(row)}
                    </div>
                ))}
            </div>
        )
    },
}), { virtual: true })

jest.mock('../../hooks', () => ({
    useRole: () => ({
        isPrivilegedRole: false,
    }),
}))

jest.mock('../../hooks/useRolePermissions', () => ({
    useRolePermissions: () => ({
        ownedMemberIds: new Set<string>(),
    }),
}))

jest.mock('../../hooks/useSubmissionDownloadAccess', () => ({
    useSubmissionDownloadAccess: () => ({
        getRestrictionMessageForMember: () => undefined,
        isSubmissionDownloadRestricted: false,
        isSubmissionDownloadRestrictedForMember: () => false,
        restrictionMessage: '',
        shouldRestrictSubmitterToOwnSubmission: false,
    }),
}))

jest.mock('../CollapsibleAiReviewsRow', () => ({
    CollapsibleAiReviewsRow: () => <div>AI reviews</div>,
}))

jest.mock('../common', () => ({
    renderSubmissionIdCell: () => <div>Submission</div>,
}))

jest.mock('../TableNoRecord', () => ({
    TableNoRecord: (props: { message: string }) => <div>{props.message}</div>,
}))

jest.mock('../TableWrapper', () => ({
    TableWrapper: (props: PropsWithChildren<{ className?: string }>) => (
        <div className={props.className}>{props.children}</div>
    ),
}))

const challengeInfo = {
    phases: [],
    reviewers: [],
} as unknown as ChallengeInfo

const challengeContext = {
    aiReviewDecisionsBySubmissionId: {},
    challengeInfo,
} as unknown as ChallengeDetailContextModel

/**
 * Builds a minimal file-submission fixture for Approval status rendering tests.
 *
 * @param id - Unique submission identifier rendered by the table.
 * @param virusScan - Whether the submission passed its virus scan.
 * @returns A latest contest submission with the requested virus-scan result.
 */
function buildSubmission(id: string, virusScan: boolean): BackendSubmission {
    return {
        createdAt: '2026-07-08T02:45:00.000Z',
        id,
        isFileSubmission: true,
        isLatest: true,
        type: 'CONTEST_SUBMISSION',
        virusScan,
    } as BackendSubmission
}

describe('TabContentAiApproval', () => {
    it('shows an infected submission status instead of pending', () => {
        render(
            <ChallengeDetailContext.Provider value={challengeContext}>
                <TabContentAiApproval
                    downloadSubmission={jest.fn()}
                    isDownloading={{}}
                    isLoading={false}
                    submissions={[
                        buildSubmission('infected-submission', false),
                        buildSubmission('pending-submission', true),
                    ]}
                />
            </ChallengeDetailContext.Provider>,
        )

        expect(screen.getByText('Infected'))
            .toBeTruthy()
        expect(screen.getByText('Pending'))
            .toBeTruthy()
    })
})
