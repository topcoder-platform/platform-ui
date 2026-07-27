/* eslint-disable import/no-extraneous-dependencies */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { updateChallengeReviewContext } from '~/apps/work/src/lib/services'
import { ChallengeReviewContextData } from '~/apps/work/src/lib/models'

import ReviewContextEditor, {
    validateReviewContext,
} from './ReviewContextEditor'

jest.mock('~/apps/work/src/lib/services', () => ({
    updateChallengeReviewContext: jest.fn(),
}))
jest.mock('~/apps/work/src/lib', () => ({
    showErrorToast: jest.fn(),
}))
jest.mock('./ReviewContextRawEditor', () => function ReviewContextRawEditor(): JSX.Element {
    return <div data-testid='raw-editor'>Raw editor</div>
})
jest.mock('~/libs/ui', () => ({
    Button: (props: { label: string; onClick: () => void }): JSX.Element => (
        <button type='button' onClick={props.onClick}>{props.label}</button>
    ),
    InputSelect: (props: { value: string }): JSX.Element => (
        <input value={props.value} readOnly />
    ),
    InputText: (props: { value: string }): JSX.Element => (
        <input value={props.value} readOnly />
    ),
    InputTextarea: (props: { value: string }): JSX.Element => (
        <textarea value={props.value} readOnly />
    ),
}))
jest.mock('~/apps/work/src/lib/components', () => ({
    ConfirmationModal: (props: {
        confirmText: string
        onCancel: () => void
        onConfirm: () => void
    }): JSX.Element => (
        <div data-testid='confirmation-modal'>
            <button type='button' onClick={props.onConfirm}>{props.confirmText}</button>
            <button type='button' onClick={props.onCancel}>Cancel</button>
        </div>
    ),
}))

type UpdateChallengeReviewContextFunction = jest.MockedFunction<
    typeof updateChallengeReviewContext
>

const mockUpdateChallengeReviewContext:
    UpdateChallengeReviewContextFunction = updateChallengeReviewContext as UpdateChallengeReviewContextFunction

const baseContext = {
    challengeId: 'challenge-1',
    descriptionRaw: 'Description',
    prizes: [],
    requirements: [],
    skills: [],
    tech_stack: [],
    timeline: {
        endDate: '2026-12-31',
        registrationEndDate: '2026-01-01',
        registrationStartDate: '2026-01-01',
        startDate: '2026-01-01',
        totalDurationDays: 365,
    },
    title: 'Test review context',
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
            challengeId: 'challenge-1',
            context: {
                ...baseContext,
                requirements: [],
            },
            id: 'context-1',
            status: 'AI_GENERATED',
        } as any)

        const onContextSaved = jest.fn(async () => undefined)

        render(
            <ReviewContextEditor
                challengeId='challenge-1'
                reviewContext={{
                    challengeId: 'challenge-1',
                    context: {
                        ...baseContext,
                        requirements: [
                            {
                                constraints: [
                                    {
                                        id: 'const-1',
                                        text: 'No hard-coded values.',
                                    },
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
            expect(mockUpdateChallengeReviewContext)
                .toHaveBeenCalledTimes(1)
        })

        expect(mockUpdateChallengeReviewContext)
            .toHaveBeenCalledWith('challenge-1', {
                context: expect.objectContaining({
                    requirements: [],
                }),
                status: 'AI_GENERATED',
            })

        expect(onContextSaved)
            .toHaveBeenCalledTimes(1)
    })

    it('marks empty review context as invalid only at the top level', () => {
        const validation = validateReviewContext({
            ...baseContext,
            requirements: [],
        })

        expect(validation.requirementsError)
            .toBe('Add at least one requirement.')
        expect(validation.requirementErrors)
            .toEqual({})
    })
})
