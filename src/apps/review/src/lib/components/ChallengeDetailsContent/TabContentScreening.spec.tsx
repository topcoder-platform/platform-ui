/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { render } from '@testing-library/react'

import { ChallengeDetailContext } from '../../contexts'
import type {
    ChallengeDetailContextModel,
    ChallengeInfo,
    Screening,
} from '../../models'

import { TabContentScreening } from './TabContentScreening'

const mockUseRole = jest.fn()
const mockTableSubmissionScreening = jest.fn()

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

jest.mock('~/apps/admin/src/lib', () => ({
    TableLoading: () => <div>Loading</div>,
}), { virtual: true })

jest.mock('../TableNoRecord', () => ({
    TableNoRecord: (props: { message: string }) => <div>{props.message}</div>,
}))

jest.mock('../TableSubmissionScreening', () => ({
    TableSubmissionScreening: (props: { screenings: Screening[] }) => {
        mockTableSubmissionScreening(props)
        return <div>{props.screenings.length}</div>
    },
}))

const ownFailedScreening = {
    challengeId: 'challenge-id',
    createdAt: '2026-07-23T05:41:00.000Z',
    memberId: 'member-current',
    phaseName: 'Screening',
    result: 'NO PASS',
    reviewId: 'review-own',
    score: '46.67',
    submissionId: 'submission-own',
} as Screening

const foreignFailedScreening = {
    ...ownFailedScreening,
    memberId: 'member-other',
    reviewId: 'review-other',
    submissionId: 'submission-other',
} as Screening

const challengeInfo = {
    status: 'Completed',
} as ChallengeInfo

const challengeContext = {
    challengeInfo,
    myResources: [
        {
            memberId: 'member-current',
            roleName: 'Submitter',
        },
    ],
} as ChallengeDetailContextModel

describe('TabContentScreening', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockUseRole.mockReturnValue({
            actionChallengeRole: 'Submitter',
            hasReviewerRole: false,
            isPrivilegedRole: false,
            reviewerResourceIds: new Set<string>(),
            screenerResourceIds: new Set<string>(),
        })
    })

    it('shows a failed submitter their own screening result for a completed challenge', () => {
        render(
            <ChallengeDetailContext.Provider value={challengeContext}>
                <TabContentScreening
                    downloadSubmission={jest.fn()}
                    isActiveChallenge={false}
                    isDownloading={{}}
                    isLoadingScreening={false}
                    screening={[
                        ownFailedScreening,
                        foreignFailedScreening,
                    ]}
                    screeningMinimumPassingScore={50}
                />
            </ChallengeDetailContext.Provider>,
        )

        expect(mockTableSubmissionScreening)
            .toHaveBeenLastCalledWith(expect.objectContaining({
                screenings: [ownFailedScreening],
            }))
    })
})
