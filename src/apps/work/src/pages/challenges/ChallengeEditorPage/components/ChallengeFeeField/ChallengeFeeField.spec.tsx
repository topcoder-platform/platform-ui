/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { FC, useCallback } from 'react'
import {
    render,
    screen,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
    FormProvider,
    useForm,
    useFormContext,
} from 'react-hook-form'

import {
    ChallengeEditorFormData,
    PrizeSet,
} from '../../../../../lib/models'

import { ChallengeFeeField } from './ChallengeFeeField'

interface TestHarnessProps {
    challengeFee?: number
    defaultPrizeSets: PrizeSet[]
    markup?: number
    reviewers?: ChallengeEditorFormData['reviewers']
}

const UpdatePrizeSetsButton: FC = () => {
    const formContext = useFormContext<ChallengeEditorFormData>()
    const setValue = formContext.setValue
    const handleClick = useCallback((): void => {
        setValue('prizeSets', [
            {
                prizes: [
                    {
                        type: 'USD',
                        value: 200,
                    },
                ],
                type: 'PLACEMENT',
            },
            {
                prizes: [
                    {
                        type: 'USD',
                        value: 50,
                    },
                ],
                type: 'COPILOT',
            },
        ], {
            shouldDirty: true,
            shouldValidate: true,
        })
    }, [setValue])

    return (
        <button
            onClick={handleClick}
            type='button'
        >
            Update prize sets
        </button>
    )
}

const TestHarness: FC<TestHarnessProps> = props => {
    const formMethods = useForm<ChallengeEditorFormData>({
        defaultValues: {
            billing: props.markup === undefined
                ? undefined
                : {
                    billingAccountId: 12345,
                    markup: props.markup,
                },
            challengeFee: props.challengeFee,
            description: 'Public specification',
            name: 'Challenge fee test',
            prizeSets: props.defaultPrizeSets,
            reviewers: props.reviewers ?? [
                {
                    baseCoefficient: 0.15,
                    incrementalCoefficient: 0,
                    isMemberReview: true,
                    memberReviewerCount: 1,
                    phaseId: 'review-phase',
                    scorecardId: 'scorecard-id',
                },
            ],
            skills: [],
            tags: [],
            trackId: 'track-id',
            typeId: 'type-id',
        },
    })

    return (
        <FormProvider {...formMethods}>
            <ChallengeFeeField />
            <UpdatePrizeSetsButton />
        </FormProvider>
    )
}

describe('ChallengeFeeField', () => {
    it('calculates challenge fee from billing markup and current challenge costs', async () => {
        const user = userEvent.setup()

        render(
            <TestHarness
                defaultPrizeSets={[
                    {
                        prizes: [
                            {
                                type: 'USD',
                                value: 100,
                            },
                        ],
                        type: 'PLACEMENT',
                    },
                ]}
                markup={0.15}
            />,
        )

        expect(screen.getByText('$17.25'))
            .toBeTruthy()

        await user.click(screen.getByRole('button', {
            name: 'Update prize sets',
        }))

        expect(screen.getByText('$42.00'))
            .toBeTruthy()
    })

    it('calculates challenge fee from markup multipliers greater than one', () => {
        render(
            <TestHarness
                defaultPrizeSets={[
                    {
                        prizes: [
                            {
                                type: 'USD',
                                value: 150,
                            },
                            {
                                type: 'USD',
                                value: 75,
                            },
                        ],
                        type: 'PLACEMENT',
                    },
                    {
                        prizes: [
                            {
                                type: 'USD',
                                value: 100,
                            },
                        ],
                        type: 'COPILOT',
                    },
                ]}
                markup={1.2229}
                reviewers={[
                    {
                        baseCoefficient: 0.13,
                        incrementalCoefficient: 0.05,
                        isMemberReview: true,
                        memberReviewerCount: 2,
                        phaseId: 'review-phase',
                        scorecardId: 'scorecard-id',
                    },
                ]}
            />,
        )

        expect(screen.getByText('$481.82'))
            .toBeTruthy()
    })

    it('uses only the billable usd total when placement prizes are points', () => {
        render(
            <TestHarness
                defaultPrizeSets={[
                    {
                        prizes: [
                            {
                                type: 'POINT',
                                value: 1000,
                            },
                        ],
                        type: 'PLACEMENT',
                    },
                    {
                        prizes: [
                            {
                                type: 'USD',
                                value: 100,
                            },
                        ],
                        type: 'COPILOT',
                    },
                ]}
                markup={0.15}
            />,
        )

        expect(screen.getByText('$15.00'))
            .toBeTruthy()
    })

    it('pads persisted challenge fee values to two decimal places', () => {
        render(
            <TestHarness
                challengeFee={481.8}
                defaultPrizeSets={[]}
            />,
        )

        expect(screen.getByText('$481.80'))
            .toBeTruthy()
    })
})
