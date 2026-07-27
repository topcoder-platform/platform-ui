/* eslint-disable import/no-extraneous-dependencies */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import ReviewContextEditor, {
    validateReviewContext,
} from './ReviewContextEditor'
import { updateChallengeReviewContext } from '~/apps/work/src/lib/services'
import { ChallengeReviewContextData } from '~/apps/work/src/lib/models'

jest.mock('~/apps/work/src/lib/services', () => ({
    updateChallengeReviewContext: jest.fn(),
}))
jest.mock('~/apps/work/src/lib', () => ({
    showErrorToast: jest.fn(),
}))
jest.mock('./ReviewContextRawEditor', () => () => (
    <div data-testid='raw-editor'>Raw editor</div>
))
jest.mock('~/libs/ui', () => ({
    Button: ({ label, onClick }: { label: string, onClick: () => void }) => (
        <button type='button' onClick={onClick}>{label}</button>
    ),
    InputSelect: ({ value }: { value: string }) => (
        <input value={value} readOnly />
    ),
    InputText: ({ value }: { value: string }) => (
        <input value={value} readOnly />
    ),
    InputTextarea: ({ value }: { value: string }) => (
        <textarea value={value} readOnly />
    ),
}))
jest.mock('~/apps/work/src/lib/components', () => ({
    ConfirmationModal: ({ onCancel, onConfirm, confirmText }: {
        onCancel: () => void
        onConfirm: () => void
        confirmText: string
    }) => (
        <div data-testid='confirmation-modal'>
            <button type='button' onClick={onConfirm}>{confirmText}</button>
            <button type='button' onClick={onCancel}>Cancel</button>
        </div>
    ),
}))

const mockUpdateChallengeReviewContext = updateChallengeReviewContext as jest.MockedFunction<typeof updateChallengeReviewContext>

const baseContext = {
    title: 'Test review context',
    prizes: [],
    skills: [],
    timeline: {
        endDate: '2026-12-31',
        startDate: '2026-01-01',
        totalDurationDays: 365,
        registrationEndDate: '2026-01-01',
        registrationStartDate: '2026-01-01',
    },
    tech_stack: [],
    challengeId: 'challenge-1',
    requirements: [],
    descriptionRaw: 'Description',
} as ChallengeReviewContextData

describe('ReviewContextEditor', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('saves the empty requirements state after removing the last requirement', async () => {
        mockUpdateChallengeReviewContext.mockResolvedValue({
            id: 'context-1',
            challengeId: 'challenge-1',
            status: 'AI_GENERATED',
            context: {
                ...baseContext,
                requirements: [],
            },
        } as any)

        const onContextSaved = jest.fn(async () => undefined)

        render(
            <ReviewContextEditor
                challengeId='challenge-1'
                reviewContext={{
                    id: 'context-1',
                    challengeId: 'challenge-1',
                    status: 'AI_GENERATED',
                    context: {
                        ...baseContext,
                        requirements: [
                            {
                                id: 'req-1',
                                title: 'Code quality',
                                priority: 'medium',
                                description: 'Ensure code is clean and maintainable.',
                                constraints: [
                                    {
                                        id: 'const-1',
                                        text: 'No hard-coded values.',
                                    },
                                ],
                            },
                        ],
                    },
                }}
                onContextSaved={onContextSaved}
            />,
        )

        fireEvent.click(screen.getByText('Remove'))
        fireEvent.click(screen.getByText('Remove'))

        await act(async () => {
            jest.advanceTimersByTime(500)
            await Promise.resolve()
        })

        await waitFor(() => {
            expect(mockUpdateChallengeReviewContext).toHaveBeenCalledTimes(1)
        })

        expect(mockUpdateChallengeReviewContext).toHaveBeenCalledWith('challenge-1', {
            status: 'AI_GENERATED',
            context: expect.objectContaining({
                requirements: [],
            }),
        })

        expect(onContextSaved).toHaveBeenCalledTimes(1)
    })

    it('marks empty review context as invalid only at the top level', () => {
        const validation = validateReviewContext({
            ...baseContext,
            requirements: [],
        })

        expect(validation.requirementsError).toBe('Add at least one requirement.')
        expect(validation.requirementErrors).toEqual({})
    })
})
