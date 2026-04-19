/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { render } from '@testing-library/react'

import AssignmentDetailsModal from './AssignmentDetailsModal'

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
        label: string
        onClick?: () => void
    }): JSX.Element => (
        <button onClick={props.onClick} type='button'>
            {props.label}
        </button>
    ),
}), {
    virtual: true,
})

jest.mock('../../../../lib/components/form', () => ({
    StartDateTimeInput: (props: { label: string }): JSX.Element => mockStartDateTimeInput(props),
}))

jest.mock('../../../../lib/utils', () => ({
    calculateAssignmentRatePerWeek: jest.fn(() => ''),
    deserializeTentativeAssignmentDate: jest.fn(() => undefined),
    sanitizePositiveNumericInput: jest.fn((value: string) => value),
    serializeTentativeAssignmentDate: jest.fn((value: Date) => value.toISOString()),
    toPositiveInteger: jest.fn(() => 1),
    toPositiveNumber: jest.fn(() => 1),
    toPositiveNumberWithMaxDecimalPlaces: jest.fn(() => 1),
}))

describe('AssignmentDetailsModal', () => {
    beforeEach(() => {
        mockStartDateTimeInput.mockClear()
    })

    it('allows past engagement start dates in the assignment form', () => {
        render(
            <AssignmentDetailsModal
                memberHandle='testaws1'
                onCancel={jest.fn()}
                onSave={jest.fn()}
                open
            />,
        )

        const startDateTimeInputProps = mockStartDateTimeInput
            .mock.calls[mockStartDateTimeInput.mock.calls.length - 1][0] as {
            label: string
            minDate?: Date | null
        }

        expect(startDateTimeInputProps.label)
            .toBe('Engagement start date *')
        expect(startDateTimeInputProps.minDate)
            .toBeUndefined()
    })
})
