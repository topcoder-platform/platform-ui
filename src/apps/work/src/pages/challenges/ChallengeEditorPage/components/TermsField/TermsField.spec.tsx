/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { FC } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import {
    FormProvider,
    useForm,
    useFormContext,
    useWatch,
} from 'react-hook-form'

import { DEFAULT_NDA_UUID } from '../../../../../lib/constants/challenge-editor.constants'
import { useFetchTerms } from '../../../../../lib/hooks'
import { ChallengeEditorFormData } from '../../../../../lib/models'

import {
    findDefaultStandardTermId,
    TermsField,
} from './TermsField'

jest.mock('../../../../../lib/components/form', () => ({
    FormSelectField: () => <div data-testid='terms-select' />,
}))

jest.mock('../../../../../lib/hooks', () => ({
    useFetchTerms: jest.fn(),
}))

const mockedUseFetchTerms = useFetchTerms as jest.MockedFunction<typeof useFetchTerms>

const STANDARD_TERM_ID = 'standard-terms-id'
const CONFIGURED_STANDARD_TERM_ID = 'configured-standard-terms-id'

const baseDefaultValues: ChallengeEditorFormData = {
    description: 'Public challenge specification',
    name: 'Challenge name',
    skills: [],
    tags: [],
    terms: [],
    trackId: 'track-id',
    typeId: 'type-id',
}

const TermsWatcher: FC = () => {
    const control = useFormContext<ChallengeEditorFormData>().control
    const terms = useWatch<ChallengeEditorFormData>({
        control,
        name: 'terms',
    }) ?? []

    return <div data-testid='terms-value'>{JSON.stringify(terms)}</div>
}

interface TestFormProps {
    defaultValues?: Partial<ChallengeEditorFormData>
    shouldDefaultStandardTerm?: boolean
}

const TestForm: FC<TestFormProps> = (props: TestFormProps) => {
    const formMethods = useForm<ChallengeEditorFormData>({
        defaultValues: {
            ...baseDefaultValues,
            ...props.defaultValues,
        },
    })

    return (
        <FormProvider {...formMethods}>
            <TermsField shouldDefaultStandardTerm={props.shouldDefaultStandardTerm} />
            <TermsWatcher />
        </FormProvider>
    )
}

describe('TermsField', () => {
    beforeEach(() => {
        mockedUseFetchTerms.mockReturnValue({
            error: undefined,
            isError: false,
            isLoading: false,
            terms: [
                {
                    id: STANDARD_TERM_ID,
                    title: 'Standard Terms v3',
                },
                {
                    id: 'custom-term-id',
                    title: 'Custom term',
                },
            ],
        })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('detects the standard term by title', () => {
        expect(findDefaultStandardTermId([
            {
                id: STANDARD_TERM_ID,
                title: 'Standard Terms v3',
            },
        ]))
            .toBe(STANDARD_TERM_ID)
    })

    it('prefers the configured standard term id over legacy matches', () => {
        expect(findDefaultStandardTermId([
            {
                id: STANDARD_TERM_ID,
                title: 'Standard Terms v3',
            },
            {
                id: CONFIGURED_STANDARD_TERM_ID,
                title: 'Updated Standard Terms',
            },
        ], CONFIGURED_STANDARD_TERM_ID))
            .toBe(CONFIGURED_STANDARD_TERM_ID)
    })

    it('defaults the standard term for new challenges', async () => {
        render(
            <TestForm shouldDefaultStandardTerm />,
        )

        await waitFor(() => {
            expect(screen.getByTestId('terms-value').textContent)
                .toBe(JSON.stringify([STANDARD_TERM_ID]))
        })
    })

    it('keeps the NDA term while adding the standard term for new challenges', async () => {
        render(
            <TestForm
                defaultValues={{
                    terms: [DEFAULT_NDA_UUID],
                }}
                shouldDefaultStandardTerm
            />,
        )

        await waitFor(() => {
            expect(screen.getByTestId('terms-value').textContent)
                .toBe(JSON.stringify([
                    DEFAULT_NDA_UUID,
                    STANDARD_TERM_ID,
                ]))
        })
    })

    it('defaults the standard term on the create route even after the draft receives an id', async () => {
        render(
            <TestForm
                defaultValues={{
                    id: 'challenge-1',
                }}
                shouldDefaultStandardTerm
            />,
        )

        await waitFor(() => {
            expect(screen.getByTestId('terms-value').textContent)
                .toBe(JSON.stringify([STANDARD_TERM_ID]))
        })
    })

    it('does not add the standard term when editing an existing challenge', async () => {
        render(
            <TestForm
                shouldDefaultStandardTerm={false}
            />,
        )

        await waitFor(() => {
            expect(screen.getByTestId('terms-value').textContent)
                .toBe(JSON.stringify([]))
        })
    })
})
