/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import {
    FormProvider,
    useForm,
} from 'react-hook-form'

import FormTextField from './FormTextField'

interface TestFormData {
    reviewerCount: number
}

interface TestHarnessProps {
    defaultReviewerCount?: number
    onChange?: (value: string) => void
}

/**
 * Mimics the reviewer count clamp used by `HumanReviewTab`.
 *
 * @param value raw input value from the number field.
 * @returns a minimum reviewer count string.
 * @throws Does not throw.
 */
function sanitizeReviewerCount(value: string): string {
    return value === '0' ? '1' : value
}

/**
 * Renders `FormTextField` with form-state output for regression assertions.
 *
 * @returns the test form wrapper.
 * @throws Does not throw.
 */
const TestHarness = (props: TestHarnessProps): JSX.Element => {
    const formMethods = useForm<TestFormData>({
        defaultValues: {
            reviewerCount: props.defaultReviewerCount ?? 1,
        },
    })

    return (
        <FormProvider {...formMethods}>
            <FormTextField
                label='Reviewer Count'
                min={1}
                name='reviewerCount'
                onChange={props.onChange}
                sanitize={sanitizeReviewerCount}
                type='number'
            />
            <div data-testid='is-dirty'>
                {formMethods.formState.isDirty ? 'true' : 'false'}
            </div>
        </FormProvider>
    )
}

describe('FormTextField', () => {
    it('does not dirty the form when sanitization keeps the rendered value unchanged', async () => {
        const onChange = jest.fn()

        render(<TestHarness onChange={onChange} />)

        const reviewerCountInput = screen.getByRole('spinbutton', {
            name: 'Reviewer Count',
        }) as HTMLInputElement

        fireEvent.change(reviewerCountInput, {
            target: {
                value: '0',
            },
        })

        await waitFor(() => {
            expect(reviewerCountInput.value)
                .toBe('1')
        })
        expect(screen.getByTestId('is-dirty').textContent)
            .toBe('false')
        expect(onChange)
            .not
            .toHaveBeenCalled()
    })

    it('reports the sanitized value after updating the form field', async () => {
        const onChange = jest.fn()

        render(
            <TestHarness
                defaultReviewerCount={2}
                onChange={onChange}
            />,
        )

        const reviewerCountInput = screen.getByRole('spinbutton', {
            name: 'Reviewer Count',
        }) as HTMLInputElement

        fireEvent.change(reviewerCountInput, {
            target: {
                value: '0',
            },
        })

        await waitFor(() => {
            expect(reviewerCountInput.value)
                .toBe('1')
        })
        expect(onChange)
            .toHaveBeenCalledTimes(1)
        expect(onChange)
            .toHaveBeenCalledWith('1')
    })
})
