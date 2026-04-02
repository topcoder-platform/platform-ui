/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import {
    render,
    screen,
} from '@testing-library/react'

import { StartDateTimeInput } from './StartDateTimeInput'

const mockInputDatePicker = jest.fn((props: unknown) => (
    <div
        data-has-props={String(props !== undefined)}
        data-testid='input-date-picker'
    />
))

jest.mock('~/libs/ui', () => ({
    InputDatePicker: (props: unknown): JSX.Element => mockInputDatePicker(props),
}), {
    virtual: true,
})

describe('StartDateTimeInput', () => {
    beforeEach(() => {
        mockInputDatePicker.mockClear()
    })

    it('passes preventOpenOnFocus to the shared date picker', () => {
        render(
            <StartDateTimeInput
                label='Billing start date'
                onChange={jest.fn()}
                preventOpenOnFocus
                showTimeSelect={false}
                value={undefined}
            />,
        )

        expect(mockInputDatePicker)
            .toHaveBeenCalledWith(expect.objectContaining({
                preventOpenOnFocus: true,
            }))
    })

    it('renders an outside label and wrapper hook when labelOutside is enabled', () => {
        render(
            <StartDateTimeInput
                label='Start Date'
                labelOutside
                onChange={jest.fn()}
                showTimeSelect={false}
                value={undefined}
            />,
        )

        expect(screen.getByText('Start Date'))
            .toBeInTheDocument()
        expect(mockInputDatePicker)
            .toHaveBeenCalledWith(expect.objectContaining({
                classNameWrapper: expect.any(String),
                label: '',
            }))
    })
})
