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
const mockTableReview = jest.fn()
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
    TableReview: (props: { datas: SubmissionInfo[] }) => {
        mockTableReview(props)
        return (
            <div>
                {props.datas.map(submission => submission.id)
                    .join(',')}
            </div>
        )
    },
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

    it('passes both finite-limit Design reviews for one member to the reviewer table', () => {
        const olderSubmission = {
            id: 'member-submission-older',
            isLatest: false,
            memberId: 'member-shared',
            review: {
                phaseName: 'Review',
                reviewType: 'Review',
            },
            submittedDate: '2026-08-12T10:00:00Z',
            type: 'CONTEST_SUBMISSION',
        } as SubmissionInfo
        const latestSubmission = {
            ...olderSubmission,
            id: 'member-submission-latest',
            isLatest: true,
            submittedDate: '2026-08-12T11:00:00Z',
        }
        const reviewerChallengeInfo = {
            ...challengeInfo,
            metadata: [{
                name: 'submissionLimit',
                value: JSON.stringify({ count: '2', limit: 'true', unlimited: 'false' }),
            }],
            submissions: [olderSubmission, latestSubmission],
            track: {
                id: 'design-track',
                name: 'Design',
            },
        } as ChallengeInfo
        const reviewerContext = {
            ...challengeContext,
            challengeInfo: reviewerChallengeInfo,
            myResources: [],
            myRoles: ['Reviewer'],
        } as unknown as ChallengeDetailContextModel
        mockUseRole.mockReturnValue({
            actionChallengeRole: 'Reviewer',
            hasApproverRole: false,
            isPrivilegedRole: true,
        })

        render(
            <ChallengeDetailContext.Provider value={reviewerContext}>
                <TabContentReview
                    {...commonProps}
                    isActiveChallenge
                    reviews={[olderSubmission, latestSubmission]}
                    selectedTab='Review'
                />
            </ChallengeDetailContext.Provider>,
        )

        expect(mockTableReview)
            .toHaveBeenLastCalledWith(expect.objectContaining({
                datas: [olderSubmission, latestSubmission],
            }))
    })
})
