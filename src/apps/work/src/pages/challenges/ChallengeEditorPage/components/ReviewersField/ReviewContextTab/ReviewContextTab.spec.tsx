/* eslint-disable import/no-extraneous-dependencies */
import { render, screen } from '@testing-library/react'

import ReviewContextTab from './ReviewContextTab'

const mockUseFetchChallengeReviewContext = jest.fn()

jest.mock('../../../../../../lib', () => ({
    createChallengeReviewContext: jest.fn(),
    generateChallengeReviewContext: jest.fn(),
    showErrorToast: jest.fn(),
    showSuccessToast: jest.fn(),
    useFetchChallengeReviewContext: () => mockUseFetchChallengeReviewContext(),
}))

jest.mock('./ReviewContextEditor', () => ({
    __esModule: true,
    default: (props: { isLocked?: boolean }) => (
        <div
            data-testid='review-context-editor'
            data-is-locked={props.isLocked ? 'true' : 'false'}
        />
    ),
}))

describe('ReviewContextTab', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('reports the current requirement count to the parent', () => {
        const onRequirementCountChange = jest.fn()

        mockUseFetchChallengeReviewContext.mockReturnValue({
            context: {
                challengeId: 'challenge-1',
                context: {
                    requirements: [
                        {
                            constraints: [
                                { id: 'const-1', text: 'No hard-coded values.' },
                            ],
                            description: 'Ensure code is clean and maintainable.',
                            id: 'req-1',
                            priority: 'medium',
                            title: 'Code quality',
                        },
                    ],
                },
                id: 'context-1',
                status: 'AI_GENERATED',
            },
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
        })

        render(
            <ReviewContextTab
                challengeId='challenge-1'
                challengeDescription={'A'.repeat(120)}
                onRequirementCountChange={onRequirementCountChange}
            />,
        )

        expect(onRequirementCountChange)
            .toHaveBeenCalledWith(1)
    })

    it('passes isLocked true to the editor when submissions exist', () => {
        mockUseFetchChallengeReviewContext.mockReturnValue({
            context: {
                challengeId: 'challenge-1',
                context: {
                    requirements: [
                        {
                            constraints: [
                                { id: 'const-1', text: 'No hard-coded values.' },
                            ],
                            description: 'Ensure code is clean and maintainable.',
                            id: 'req-1',
                            priority: 'medium',
                            title: 'Code quality',
                        },
                    ],
                },
                id: 'context-1',
                status: 'AI_GENERATED',
            },
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
        })

        render(
            <ReviewContextTab
                challengeId='challenge-1'
                challengeDescription={'A'.repeat(120)}
                hasSubmissions
            />,
        )

        expect(screen.getByTestId('review-context-editor').dataset.isLocked)
            .toBe('true')
    })
})
