/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { fireEvent, render, screen } from '@testing-library/react'

import ReviewViewer from './ReviewViewer'

const mockUseChallengeDetailsContext = jest.fn()
const mockUseFetchSubmissionReviews = jest.fn()
const mockUseRole = jest.fn()

jest.mock('swr', () => ({
    mutate: jest.fn(),
}))

jest.mock('react-router-dom', () => ({
    useSearchParams: () => [new URLSearchParams()],
}))

jest.mock('~/apps/review/src/lib/components/ChallengeLinksForAdmin', () => ({
    ChallengeLinksForAdmin: (props: {
        canEditScorecard?: boolean
        isManagerEdit?: boolean
        onToggleManagerEdit?: () => void
    }) => (props.canEditScorecard ? (
        <button
            type='button'
            onClick={props.onToggleManagerEdit}
        >
            {props.isManagerEdit ? 'Exit Edit Mode' : 'Edit Scorecard'}
        </button>
    ) : <></>),
}), { virtual: true })

jest.mock('~/apps/review/src/lib/components/Scorecard', () => ({
    ScorecardViewer: (props: {
        autoOpenManagerComment?: boolean
        isManagerEdit?: boolean
    }) => (
        <div>
            <span data-testid='manager-edit'>{String(Boolean(props.isManagerEdit))}</span>
            <span data-testid='auto-open-manager-comment'>
                {String(Boolean(props.autoOpenManagerComment))}
            </span>
        </div>
    ),
}), { virtual: true })

jest.mock('~/apps/review/src/lib/hooks', () => ({
    useAppNavigate: () => jest.fn(),
    useFetchSubmissionReviews: () => mockUseFetchSubmissionReviews(),
    useReviewEditAccess: () => ({
        isEdit: false,
        reviewPhaseType: 'review',
    }),
    useRole: () => mockUseRole(),
}), { virtual: true })

jest.mock('~/apps/review/src/lib', () => ({
    ChallengeLinks: () => <></>,
    ConfirmModal: () => <></>,
    useChallengeDetailsContext: () => mockUseChallengeDetailsContext(),
}), { virtual: true })

jest.mock('~/apps/review/src/lib/hooks/useIsEditReview', () => ({
    useIsEditReview: () => ({ isEdit: false }),
}), { virtual: true })

jest.mock('~/apps/review/src/config/routes.config', () => ({
    rootRoute: '/review',
}), { virtual: true })

jest.mock('../../ReviewsContext', () => ({
    useReviewsContext: () => ({
        reviewId: 'review-1',
        reviewStatus: undefined,
        setActionButtons: jest.fn(),
        setReviewStatus: jest.fn(),
        workflow: undefined,
    }),
}))

jest.mock('./ReviewScorecardHeader', () => ({
    ReviewScorecardHeader: () => <></>,
}))

describe('ReviewViewer scorecard manager editing', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockUseChallengeDetailsContext.mockReturnValue({
            challengeInfo: {
                id: 'challenge-1',
                status: 'ACTIVE',
                track: {
                    name: 'Design',
                },
            },
        })
        mockUseFetchSubmissionReviews.mockReturnValue({
            addAppeal: jest.fn(),
            addAppealResponse: jest.fn(),
            addManagerComment: jest.fn(),
            doDeleteAppeal: jest.fn(),
            isLoading: false,
            isSavingAppeal: false,
            isSavingAppealResponse: false,
            isSavingManagerComment: false,
            isSavingReview: false,
            isSubmitterPhaseLocked: false,
            mappingAppeals: {},
            reviewInfo: {
                committed: true,
                id: 'review-1',
            },
            saveReviewInfo: jest.fn(),
            scorecardInfo: {
                scorecardGroups: [],
            },
        })
        mockUseRole.mockReturnValue({
            actionChallengeRole: 'Copilot',
            hasReviewerRole: false,
            myChallengeResources: [
                {
                    roleName: 'Copilot',
                },
            ],
            myChallengeRoles: ['Copilot'],
        })
    })

    it('lets an assigned copilot enter scorecard edit mode for a committed active review', () => {
        render(<ReviewViewer />)

        expect(screen.getByRole('button', { name: 'Edit Scorecard' }))
            .toBeTruthy()
        expect(screen.getByTestId('manager-edit').textContent)
            .toBe('false')
        expect(screen.getByTestId('auto-open-manager-comment').textContent)
            .toBe('false')

        fireEvent.click(screen.getByRole('button', { name: 'Edit Scorecard' }))

        expect(screen.getByRole('button', { name: 'Exit Edit Mode' }))
            .toBeTruthy()
        expect(screen.getByTestId('manager-edit').textContent)
            .toBe('true')
        expect(screen.getByTestId('auto-open-manager-comment').textContent)
            .toBe('true')
    })
})
