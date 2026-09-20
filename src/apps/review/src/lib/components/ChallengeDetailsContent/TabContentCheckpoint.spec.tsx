/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { render } from '@testing-library/react'

import { ChallengeDetailContext } from '../../contexts'
import type {
    ChallengeDetailContextModel,
    ChallengeInfo,
    Screening,
} from '../../models'

import { TabContentCheckpoint } from './TabContentCheckpoint'

const mockUseRole = jest.fn()
const mockUseSubmissionDownloadAccess = jest.fn()
const mockTableCheckpointSubmissions = jest.fn()

jest.mock('~/libs/core', () => ({
    getRatingColor: () => '#2a2a2a',
}), { virtual: true })

jest.mock('../../contexts', () => {
    const React: typeof import('react') = jest.requireActual('react')

    return {
        ChallengeDetailContext: React.createContext({}),
    }
})

jest.mock('../../hooks', () => ({
    useRole: () => mockUseRole(),
}))

jest.mock('../../hooks/useSubmissionDownloadAccess', () => ({
    useSubmissionDownloadAccess: () => mockUseSubmissionDownloadAccess(),
}))

jest.mock('~/apps/admin/src/lib', () => ({
    TableLoading: () => <div>Loading</div>,
}), { virtual: true })

jest.mock('../TableCheckpointSubmissions/TableCheckpointSubmissions', () => ({
    __esModule: true,
    default: (props: { datas: Screening[] }) => {
        mockTableCheckpointSubmissions(props)
        return <div data-testid='checkpoint-rows'>{props.datas.length}</div>
    },
}))

const ownCheckpoint = {
    challengeId: 'challenge-id',
    createdAt: '2026-09-15T03:52:00.000Z',
    memberId: 'member-current',
    result: 'PASS',
    score: '100',
    submissionId: 'submission-own',
} as unknown as Screening

const foreignCheckpoint = {
    ...ownCheckpoint,
    memberId: 'member-other',
    submissionId: 'submission-other',
} as unknown as Screening

const activeChallengeInfo = { status: 'Active' } as ChallengeInfo

const emptyRoles = {
    checkpointReviewerResourceIds: new Set<string>(),
    checkpointScreenerResourceIds: new Set<string>(),
    hasCheckpointReviewerRole: false,
    hasCheckpointScreenerRole: false,
    isPrivilegedRole: false,
}

function renderTab(
    context: Partial<ChallengeDetailContextModel>,
    mode: 'submission' | 'screening' | 'review' = 'screening',
): void {
    render(
        <ChallengeDetailContext.Provider value={context as ChallengeDetailContextModel}>
            <TabContentCheckpoint
                checkpoint={[ownCheckpoint, foreignCheckpoint]}
                checkpointReview={[ownCheckpoint, foreignCheckpoint]}
                downloadSubmission={jest.fn()}
                isDownloading={{}}
                isLoading={false}
                mode={mode}
            />
        </ChallengeDetailContext.Provider>,
    )
}

describe('TabContentCheckpoint', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockUseRole.mockReturnValue(emptyRoles)
        mockUseSubmissionDownloadAccess.mockReturnValue({ currentMemberId: 'member-current' })
    })

    it('shows a submitter their own checkpoint rows when the resource list is unavailable', () => {
        renderTab({
            challengeInfo: activeChallengeInfo,
            myResources: [],
        })

        const rows = mockTableCheckpointSubmissions.mock.calls[0][0].datas as Screening[]
        expect(rows.map(row => row.submissionId))
            .toEqual(['submission-own'])
    })

    it('still hides other members checkpoint rows from a submitter', () => {
        renderTab({
            challengeInfo: activeChallengeInfo,
            myResources: [{ memberId: 'member-current', roleName: 'Submitter' }],
        } as Partial<ChallengeDetailContextModel>)

        const rows = mockTableCheckpointSubmissions.mock.calls[0][0].datas as Screening[]
        expect(rows.map(row => row.submissionId))
            .toEqual(['submission-own'])
    })

    it('keeps every row for a privileged viewer', () => {
        mockUseRole.mockReturnValue({ ...emptyRoles, isPrivilegedRole: true })

        renderTab({
            challengeInfo: activeChallengeInfo,
            myResources: [],
        })

        const rows = mockTableCheckpointSubmissions.mock.calls[0][0].datas as Screening[]
        expect(rows.map(row => row.submissionId))
            .toEqual(['submission-own', 'submission-other'])
    })

    it('shows the submitter their own checkpoint review row', () => {
        renderTab({
            challengeInfo: activeChallengeInfo,
            myResources: [],
        }, 'review')

        const rows = mockTableCheckpointSubmissions.mock.calls[0][0].datas as Screening[]
        expect(rows.map(row => row.submissionId))
            .toEqual(['submission-own'])
    })
})
