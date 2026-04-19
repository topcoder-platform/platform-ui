/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { render } from '@testing-library/react'

import AcceptApplicationModal from './AcceptApplicationModal'

const mockStartDateTimeInput = jest.fn((props: { label: string }): JSX.Element => (
    <div>{props.label}</div>
))

jest.mock('~/libs/ui', () => ({
    BaseModal: (props: {
        buttons?: JSX.Element
        children: JSX.Element
        open: boolean
    }): JSX.Element => (
        props.open ? (
            <div>
                {props.children}
                {props.buttons}
            </div>
        ) : <></>
    ),
    Button: (props: {
        disabled?: boolean
        label: string
        onClick?: () => void
    }): JSX.Element => (
        <button disabled={props.disabled} onClick={props.onClick} type='button'>
            {props.label}
        </button>
    ),
}), {
    virtual: true,
})

jest.mock('../form', () => ({
    StartDateTimeInput: (props: { label: string }): JSX.Element => mockStartDateTimeInput(props),
}))

jest.mock('../../utils', () => ({
    calculateAssignmentRatePerWeek: jest.fn(() => ''),
    sanitizePositiveNumericInput: jest.fn((value: string) => value),
    serializeTentativeAssignmentDate: jest.fn((value: Date) => value.toISOString()),
    toPositiveInteger: jest.fn(() => 1),
    toPositiveNumber: jest.fn(() => 1),
    toPositiveNumberWithMaxDecimalPlaces: jest.fn(() => 1),
}))

describe('AcceptApplicationModal', () => {
    beforeEach(() => {
        mockStartDateTimeInput.mockClear()
    })

    it('does not restrict the billing start date to today or later', () => {
        render(
            <AcceptApplicationModal
                application={undefined}
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
                open
            />,
        )

        const startDateTimeInputProps = mockStartDateTimeInput
            .mock.calls[mockStartDateTimeInput.mock.calls.length - 1][0] as {
            label: string
            minDate?: Date | null
        }

        expect(startDateTimeInputProps.label)
            .toBe('Billing start date')
        expect(startDateTimeInputProps.minDate)
            .toBeUndefined()
    })
})
