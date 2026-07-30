/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type { ComponentProps } from 'react'
import { render, screen } from '@testing-library/react'

import { ChallengeDetailsContent } from './ChallengeDetailsContent'

const mockUseDownloadSubmission = jest.fn()

jest.mock('~/libs/ui', () => ({
    LoadingSpinner: (props: { message?: string; overlay?: boolean }) => (
        <div data-overlay={String(props.overlay)}>
            {props.message}
        </div>
    ),
}), { virtual: true })

jest.mock('../../contexts', () => {
    const React: typeof import('react') = jest.requireActual('react')

    return {
        ChallengeDetailContext: React.createContext({
            aiReviewConfig: undefined,
            challengeInfo: undefined,
            myResources: [],
        }),
    }
})

jest.mock('../../hooks', () => ({
    useDownloadSubmission: () => mockUseDownloadSubmission(),
    useRole: () => ({
        actionChallengeRole: undefined,
    }),
    useSubmissionDownloadAccess: () => ({
        currentMemberId: undefined,
    }),
}))

jest.mock('../../hooks/useFetchChallengeResults', () => ({
    useFetchChallengeResults: () => ({
        isLoading: false,
        projectResults: [],
    }),
}))

jest.mock('./TabContentAiApproval', () => () => undefined)
jest.mock('./TabContentApproval', () => () => undefined)
jest.mock('./TabContentCheckpoint', () => () => undefined)
jest.mock('./TabContentIterativeReview', () => () => undefined)
jest.mock('./TabContentRegistration', () => ({
    __esModule: true,
    default: () => <div>Registration content</div>,
}))
jest.mock('./TabContentReview', () => () => undefined)
jest.mock('./TabContentScreening', () => () => undefined)
jest.mock('./TabContentSubmissions', () => () => undefined)
jest.mock('./TabContentWinners', () => () => undefined)
jest.mock('../TableNoRecord', () => ({
    TableNoRecord: (noRecordProps: { message?: string }) => (
        <div>{noRecordProps.message}</div>
    ),
}))

const props: ComponentProps<typeof ChallengeDetailsContent> = {
    approvalMinimumPassingScore: undefined,
    approvalReviews: [],
    checkpoint: [],
    checkpointReview: [],
    checkpointReviewMinimumPassingScore: undefined,
    checkpointScreeningMinimumPassingScore: undefined,
    isActiveChallenge: true,
    isLoadingSubmission: false,
    mappingReviewAppeal: {},
    postMortemMinimumPassingScore: undefined,
    postMortemReviews: [],
    review: [],
    reviewMinimumPassingScore: undefined,
    screening: [],
    screeningMinimumPassingScore: undefined,
    selectedTab: 'Registration',
    submissions: [],
    submitterReviews: [],
}

describe('ChallengeDetailsContent', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockUseDownloadSubmission.mockReturnValue({
            downloadSubmission: jest.fn(),
            isLoading: {},
            isLoadingBool: false,
        })
    })

    it('shows download-starting feedback only while a submission request is pending', () => {
        mockUseDownloadSubmission.mockReturnValue({
            downloadSubmission: jest.fn(),
            isLoading: {
                'submission-1': true,
            },
            isLoadingBool: true,
        })

        const renderResult: ReturnType<typeof render>
            = render(<ChallengeDetailsContent {...props} />)

        const indicator = screen.getByText('Download starting')
        expect(indicator.dataset.overlay)
            .toBe('true')

        mockUseDownloadSubmission.mockReturnValue({
            downloadSubmission: jest.fn(),
            isLoading: {
                'submission-1': false,
            },
            isLoadingBool: false,
        })
        renderResult.rerender(<ChallengeDetailsContent {...props} />)

        expect(screen.queryByText('Download starting'))
            .toBeNull()
    })
})
