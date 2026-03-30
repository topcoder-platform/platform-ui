/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    render,
    screen,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
    FormProvider,
    useForm,
} from 'react-hook-form'

import {
    ChallengeEditorFormData,
    Reviewer,
} from '../../../../../lib/models'
import { patchChallenge } from '../../../../../lib/services'

import { ReviewersField } from './ReviewersField'

jest.mock('~/libs/ui', () => ({
    TabsNavbar: function TabsNavbar(props: {
        onChange: (active: string) => void
        tabs: Array<{ id: string, title: string }>
    }) {
        return (
            <div>
                {props.tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={function onClick() {
                            props.onChange(tab.id)
                        }}
                        type='button'
                    >
                        {tab.title}
                    </button>
                ))}
            </div>
        )
    },
}), {
    virtual: true,
})
jest.mock('./HumanReviewTab', () => ({
    __esModule: true,
    default: () => <div data-testid='human-review-tab'>Human review content</div>,
}))
jest.mock('./AiReviewTab', () => ({
    __esModule: true,
    default: function AiReviewTabMock(
        props: { onConfigRemoved?: () => Promise<void> | void },
    ) {
        function handleRemoveClick(): void {
            props.onConfigRemoved?.()
        }

        return (
            <div data-testid='ai-review-tab'>
                <button
                    onClick={handleRemoveClick}
                    type='button'
                >
                    Remove AI config
                </button>
                AI review content
            </div>
        )
    },
}))
jest.mock('../../../../../lib/services', () => ({
    patchChallenge: jest.fn(),
}))

const mockedPatchChallenge = patchChallenge as jest.Mock

interface TestHarnessProps {
    reviewers: Reviewer[]
}

const TestHarness = (props: TestHarnessProps): JSX.Element => {
    const formMethods = useForm<ChallengeEditorFormData>({
        defaultValues: {
            id: 'challenge-1',
            phases: [],
            reviewers: props.reviewers,
            trackId: 'track-id',
            typeId: 'type-id',
        },
    })

    return (
        <FormProvider {...formMethods}>
            <ReviewersField />
        </FormProvider>
    )
}

describe('ReviewersField', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedPatchChallenge.mockResolvedValue({})
    })

    it('uses tab labels with reviewer counts and toggles between human and AI content', async () => {
        const user = userEvent.setup()

        render(
            <TestHarness
                reviewers={[
                    {
                        handle: 'human-1',
                        isMemberReview: true,
                        memberId: 'member-1',
                    },
                    {
                        handle: 'human-2',
                        isMemberReview: true,
                        memberId: 'member-2',
                    },
                    {
                        aiWorkflowId: 'workflow-1',
                        isMemberReview: false,
                    },
                ]}
            />,
        )

        expect(screen.getByRole('button', { name: 'Human Review (2)' })).not.toBeNull()
        expect(screen.getByRole('button', { name: 'AI Review (1)' })).not.toBeNull()
        expect(screen.getByTestId('human-review-tab').parentElement?.className)
            .not.toContain('tabPanelHidden')
        expect(screen.getByTestId('ai-review-tab').parentElement?.className)
            .toContain('tabPanelHidden')

        await user.click(screen.getByRole('button', { name: 'AI Review (1)' }))

        expect(screen.getByTestId('human-review-tab').parentElement?.className)
            .toContain('tabPanelHidden')
        expect(screen.getByTestId('ai-review-tab').parentElement?.className)
            .not.toContain('tabPanelHidden')
    })

    it('removes AI reviewers from the form and challenge when the AI config is removed', async () => {
        const user = userEvent.setup()

        render(
            <TestHarness
                reviewers={[
                    {
                        handle: 'human-1',
                        isMemberReview: true,
                        memberId: 'member-1',
                    },
                    {
                        aiWorkflowId: 'workflow-1',
                        isMemberReview: false,
                        phaseId: 'phase-1',
                        scorecardId: 'scorecard-1',
                    },
                ]}
            />,
        )

        await user.click(screen.getByRole('button', { name: 'AI Review (1)' }))
        await user.click(screen.getByRole('button', { name: 'Remove AI config' }))

        expect(screen.getByRole('button', { name: 'Human Review (1)' })).not.toBeNull()
        expect(screen.getByRole('button', { name: 'AI Review (0)' })).not.toBeNull()
        expect(mockedPatchChallenge)
            .toHaveBeenCalledWith('challenge-1', {
                reviewers: [
                    {
                        handle: 'human-1',
                        isMemberReview: true,
                        memberId: 'member-1',
                    },
                ],
            })
    })
})
