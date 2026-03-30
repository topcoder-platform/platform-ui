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

import { FormCheckboxField } from './FormCheckboxField'

interface TestFormValues {
    wiproAllowed: boolean
}

const TestForm = (): JSX.Element => {
    const form = useForm<TestFormValues>({
        defaultValues: {
            wiproAllowed: false,
        },
    })

    return (
        <FormProvider {...form}>
            <FormCheckboxField
                label='Wipro Allowed'
                name='wiproAllowed'
            />
        </FormProvider>
    )
}

describe('FormCheckboxField', () => {
    it('does not toggle when clicking the checkbox row container', async () => {
        const user = userEvent.setup()

        render(<TestForm />)

        const checkbox = screen.getByRole('checkbox') as HTMLInputElement

        expect(checkbox.checked)
            .toBe(false)

        await user.click(checkbox.parentElement as HTMLElement)

        expect(checkbox.checked)
            .toBe(false)
    })

    it('toggles when clicking the checkbox text label', async () => {
        const user = userEvent.setup()

        render(<TestForm />)

        const checkbox = screen.getByRole('checkbox') as HTMLInputElement
        const labels = screen.getAllByText('Wipro Allowed', {
            selector: 'label',
        })

        await user.click(labels[1])

        expect(checkbox.checked)
            .toBe(true)
    })
})
