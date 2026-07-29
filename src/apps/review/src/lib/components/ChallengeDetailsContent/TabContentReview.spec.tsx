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

import { TabContentReview } from './TabContentReview'

const mockUseRole = jest.fn()
const mockTableAppealsForSubmitter = jest.fn()
const mockTableAppealsResponse = jest.fn()
const mockTableReviewForSubmitter = jest.fn()

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        REVIEW: {
            PROFILE_PAGE_URL: 'https://profiles.test',
        },
    },
}), { virtual: true })

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

jest.mock('../TableAppeals', () => ({
    TableAppeals: () => <div>Reviewer appeals</div>,
}))

jest.mock('../TableAppealsForSubmitter', () => ({
    TableAppealsForSubmitter: (props: { datas: SubmissionInfo[] }) => {
        mockTableAppealsForSubmitter(props)
        return (
            <div>
                {props.datas.map(submission => submission.id)
                    .join(',')}
            </div>
        )
    },
}))

jest.mock('../TableAppealsResponse', () => ({
    TableAppealsResponse: (props: { datas: SubmissionInfo[] }) => {
        mockTableAppealsResponse(props)
        return (
            <div>
                {props.datas.map(submission => submission.id)
                    .join(',')}
            </div>
        )
    },
}))

jest.mock('../TableNoRecord', () => ({
    TableNoRecord: (props: { message: string }) => <div>{props.message}</div>,
}))

jest.mock('../TableReview', () => ({
    TableReview: () => <div>Reviewer reviews</div>,
}))

jest.mock('../TableReviewForSubmitter', () => ({
    TableReviewForSubmitter: (props: { datas: SubmissionInfo[] }) => {
        mockTableReviewForSubmitter(props)
        return (
            <div>
                {props.datas.map(submission => submission.id)
                    .join(',')}
            </div>
        )
    },
}))

const ownSubmission = {
    id: 'own-submission',
    isLatest: true,
    memberId: 'member-current',
} as SubmissionInfo
const foreignSubmission = {
    id: 'foreign-submission',
    isLatest: true,
    memberId: 'member-other',
} as SubmissionInfo
const challengeInfo = {
    metadata: [],
    phases: [],
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
    challengeSubmissions: [],
    myResources: [
        {
            memberId: 'member-current',
            roleName: 'Submitter',
        },
    ],
    myRoles: ['Submitter'],
    resourceMemberIdMapping: {},
    resources: [],
    reviewers: [],
} as unknown as ChallengeDetailContextModel
const commonProps = {
    downloadSubmission: jest.fn(),
    isActiveChallenge: false,
    isDownloading: {},
    isLoadingReview: false,
    mappingReviewAppeal: {},
    reviewMinimumPassingScore: undefined,
    reviews: [],
    screeningOutcome: {
        failingSubmissionIds: new Set<string>(),
        passingSubmissionIds: new Set<string>(),
    },
    submitterReviews: [
        ownSubmission,
        foreignSubmission,
    ],
}

describe('TabContentReview submitter Appeals ownership', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockUseRole.mockReturnValue({
            actionChallengeRole: 'Submitter',
            hasApproverRole: false,
            isPrivilegedRole: false,
        })
    })

    it('passes only owned rows to Appeals and Appeals Response', () => {
        const rendered = render(
            <ChallengeDetailContext.Provider value={challengeContext}>
                <TabContentReview
                    {...commonProps}
                    selectedTab='Appeals'
                />
            </ChallengeDetailContext.Provider>,
        )

        expect(mockTableAppealsForSubmitter)
            .toHaveBeenLastCalledWith(expect.objectContaining({
                datas: [ownSubmission],
            }))

        rendered.rerender(
            <ChallengeDetailContext.Provider value={challengeContext}>
                <TabContentReview
                    {...commonProps}
                    selectedTab='Appeals Response'
                />
            </ChallengeDetailContext.Provider>,
        )

        expect(mockTableAppealsResponse)
            .toHaveBeenLastCalledWith(expect.objectContaining({
                datas: [ownSubmission],
            }))
    })

    it('leaves the completed Review tab data set unchanged', () => {
        render(
            <ChallengeDetailContext.Provider value={challengeContext}>
                <TabContentReview
                    {...commonProps}
                    selectedTab='Review'
                />
            </ChallengeDetailContext.Provider>,
        )

        expect(mockTableReviewForSubmitter)
            .toHaveBeenLastCalledWith(expect.objectContaining({
                datas: [
                    ownSubmission,
                    foreignSubmission,
                ],
            }))
    })
})
