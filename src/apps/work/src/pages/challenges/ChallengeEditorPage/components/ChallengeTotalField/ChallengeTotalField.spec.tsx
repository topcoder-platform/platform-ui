/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { FC } from 'react'
import {
    render,
    screen,
} from '@testing-library/react'
import {
    FormProvider,
    useForm,
} from 'react-hook-form'

import {
    ChallengeEditorFormData,
    PrizeSet,
    Reviewer,
} from '../../../../../lib/models'

import { ChallengeTotalField } from './ChallengeTotalField'

interface TestHarnessProps {
    challengeFee?: number
    includeChallengeFee?: boolean
    label?: string
    markup?: number
    prizeSets: PrizeSet[]
    reviewers?: Reviewer[]
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
            name: 'Challenge total test',
            prizeSets: props.prizeSets,
            reviewers: props.reviewers || [],
            skills: [],
            tags: [],
            trackId: 'track-id',
            typeId: 'type-id',
        },
    })

    return (
        <FormProvider {...formMethods}>
            <ChallengeTotalField
                includeChallengeFee={props.includeChallengeFee}
                label={props.label}
            />
        </FormProvider>
    )
}

describe('ChallengeTotalField', () => {
    it('adds challenge fee on top of prizes, copilot fee, and review cost', () => {
        render(
            <TestHarness
                markup={0.1}
                prizeSets={[
                    {
                        prizes: [
                            {
                                type: 'USD',
                                value: 100,
                            },
                        ],
                        type: 'PLACEMENT',
                    },
                    {
                        prizes: [
                            {
                                type: 'USD',
                                value: 20,
                            },
                        ],
                        type: 'COPILOT',
                    },
                ]}
                reviewers={[
                    {
                        baseCoefficient: 0.15,
                        incrementalCoefficient: 0,
                        isMemberReview: true,
                        memberReviewerCount: 1,
                        phaseId: 'review-phase',
                        scorecardId: 'scorecard-id',
                    },
                ]}
            />,
        )

        expect(screen.getByText('$148.50'))
            .toBeTruthy()
    })

    it('falls back to the persisted challenge fee when markup is unavailable', () => {
        render(
            <TestHarness
                challengeFee={481.8}
                prizeSets={[
                    {
                        prizes: [
                            {
                                type: 'USD',
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
                reviewers={[
                    {
                        baseCoefficient: 0.26,
                        incrementalCoefficient: 0.1,
                        isMemberReview: true,
                        memberReviewerCount: 1,
                        phaseId: 'review-phase',
                        scorecardId: 'scorecard-id',
                    },
                ]}
            />,
        )

        expect(screen.getByText('$2,041.80'))
            .toBeTruthy()
    })

    it('can omit challenge fee and use a copilot-safe cost label', () => {
        render(
            <TestHarness
                includeChallengeFee={false}
                label='Estimated challenge cost:'
                markup={0.1}
                prizeSets={[
                    {
                        prizes: [
                            {
                                type: 'USD',
                                value: 100,
                            },
                        ],
                        type: 'PLACEMENT',
                    },
                    {
                        prizes: [
                            {
                                type: 'USD',
                                value: 20,
                            },
                        ],
                        type: 'COPILOT',
                    },
                ]}
                reviewers={[
                    {
                        baseCoefficient: 0.15,
                        incrementalCoefficient: 0,
                        isMemberReview: true,
                        memberReviewerCount: 1,
                        phaseId: 'review-phase',
                        scorecardId: 'scorecard-id',
                    },
                ]}
            />,
        )

        expect(screen.getByText('Estimated challenge cost:'))
            .toBeTruthy()
        expect(screen.getByText('$135.00'))
            .toBeTruthy()
    })
})
