/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import {
    FormProvider,
    useForm,
    type UseFormReturn,
    useFormContext,
    useWatch,
} from 'react-hook-form'

import { REVIEW_TYPES } from '../../../../../lib/constants/challenge-editor.constants'
import { ChallengeEditorFormData } from '../../../../../lib/models'

import { ReviewTypeField } from './ReviewTypeField'

jest.mock('../../../../../lib/components/form', () => ({
    FormRadioGroup: (props: {
        label: string
        name: string
    }) => (
        <div
            data-label={props.label}
            data-name={props.name}
            data-testid='review-type-radio'
        />
    ),
    FormUserAutocomplete: (props: {
        label: string
        name: string
        placeholder?: string
        required?: boolean
    }) => (
        <div
            data-label={props.label}
            data-name={props.name}
            data-placeholder={props.placeholder || ''}
            data-required={props.required ? 'true' : 'false'}
            data-testid='reviewer-autocomplete'
        />
    ),
}))

interface TestHarnessProps {
    isTaskChallenge: boolean
    reviewType?: NonNullable<ChallengeEditorFormData['legacy']>['reviewType']
}

type TestFormContext = Pick<UseFormReturn<ChallengeEditorFormData>, 'control'>

const ReviewTypeValue = (): JSX.Element => {
    const formContext: TestFormContext = useFormContext<ChallengeEditorFormData>()
    const control: TestFormContext['control'] = formContext.control
    const reviewType: string | undefined = useWatch({
        control,
        name: 'legacy.reviewType',
    }) as string | undefined

    return <div data-testid='review-type-value'>{reviewType || ''}</div>
}

const TestHarness = (props: TestHarnessProps): JSX.Element => {
    const formMethods = useForm<ChallengeEditorFormData>({
        defaultValues: {
            legacy: {
                reviewType: props.reviewType,
            },
            reviewer: 'ExistingReviewer',
        },
    })

    return (
        <FormProvider {...formMethods}>
            <ReviewTypeField isTaskChallenge={props.isTaskChallenge} />
            <ReviewTypeValue />
        </FormProvider>
    )
}

describe('ReviewTypeField', () => {
    it('renders a reviewer autocomplete for task challenges', () => {
        render(
            <TestHarness
                isTaskChallenge
                reviewType={REVIEW_TYPES.INTERNAL}
            />,
        )

        expect(
            screen.getByTestId('reviewer-autocomplete')
                .getAttribute('data-placeholder'),
        )
            .toBe('Search reviewer')
        expect(
            screen.getByTestId('reviewer-autocomplete')
                .getAttribute('data-name'),
        )
            .toBe('reviewer')
        expect(
            screen.getByTestId('reviewer-autocomplete')
                .getAttribute('data-required'),
        )
            .toBe('true')
    })

    it('forces task challenges to use the internal review type', async () => {
        render(
            <TestHarness
                isTaskChallenge
                reviewType={REVIEW_TYPES.COMMUNITY}
            />,
        )

        await waitFor(() => {
            expect(screen.getByTestId('review-type-value').textContent)
                .toBe(REVIEW_TYPES.INTERNAL)
        })
    })
})
