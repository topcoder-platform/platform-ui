/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import {
    render,
    screen,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'

import { PhaseDurationInput } from './PhaseDurationInput'

jest.mock('../../../utils', () => ({
    convertPhaseHoursMinutesToPhaseDuration: (
        hoursMinutes: {
            hours: number
            minutes: number
        },
    ): number => (hoursMinutes.hours * 60) + hoursMinutes.minutes,
    getPhaseHoursMinutes: (durationMinutes: number): {
        hours: number
        minutes: number
    } => ({
        hours: Math.floor(durationMinutes / 60),
        minutes: durationMinutes % 60,
    }),
}))

interface TestHarnessProps {
    initialValue: number
    onChange: (durationMinutes: number) => void
}

const TestHarness = (props: TestHarnessProps): JSX.Element => {
    const [value, setValue] = useState<number>(props.initialValue)

    function handleChange(durationMinutes: number): void {
        props.onChange(durationMinutes)
        setValue(durationMinutes)
    }

    return (
        <PhaseDurationInput
            onChange={handleChange}
            value={value}
        />
    )
}

describe('PhaseDurationInput', () => {
    it('allows manual replacement of hours and minutes values', async () => {
        const user = userEvent.setup()
        const onChange = jest.fn()

        render(
            <TestHarness
                initialValue={720 * 60}
                onChange={onChange}
            />,
        )

        const hoursInput = screen.getByLabelText('Phase duration hours')
        const minutesInput = screen.getByLabelText('Phase duration minutes')

        await user.clear(hoursInput)
        await user.type(hoursInput, '24')

        expect(hoursInput)
            .toHaveValue('24')
        expect(onChange)
            .toHaveBeenLastCalledWith(24 * 60)

        await user.clear(minutesInput)
        await user.type(minutesInput, '15')

        expect(minutesInput)
            .toHaveValue('15')
        expect(onChange)
            .toHaveBeenLastCalledWith((24 * 60) + 15)
    })
})
