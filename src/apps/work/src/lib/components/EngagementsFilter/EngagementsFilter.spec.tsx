/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, react/jsx-no-bind */
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'

import {
    EngagementsFilter,
} from './EngagementsFilter'

const mockEngagementStatuses = [
    'Open',
    'Active',
    'On Hold',
    'Cancelled',
    'Closed',
] as const

jest.mock('../../constants', () => ({
    ENGAGEMENT_STATUSES: [
        'Open',
        'Active',
        'On Hold',
        'Cancelled',
        'Closed',
    ],
}))
jest.mock('react-select', () => ({
    __esModule: true,
    default: (props: {
        inputId: string
        isClearable?: boolean
        isMulti?: boolean
        onChange: (value: Array<{ label: string; value: string }>) => void
        options: Array<{ label: string; value: string }>
        value?: Array<{ label: string; value: string }> | { label: string; value: string }
    }) => {
        const values = Array.isArray(props.value)
            ? props.value
            : props.value
                ? [props.value]
                : []
        const isStatusSelect = props.inputId === 'work-engagements-status'

        return (
            <div data-testid={props.inputId}>
                <div data-testid={`${props.inputId}-is-clearable`}>
                    {String(!!props.isClearable)}
                </div>
                <div data-testid={`${props.inputId}-is-multi`}>
                    {String(!!props.isMulti)}
                </div>
                <div data-testid={`${props.inputId}-options`}>
                    {props.options.map(option => option.label)
                        .join('|')}
                </div>
                <div data-testid={`${props.inputId}-value`}>
                    {values.map(option => option.label)
                        .join('|')}
                </div>
                {isStatusSelect && (
                    <>
                        <button
                            type='button'
                            onClick={() => props.onChange([
                                {
                                    label: 'Open',
                                    value: 'Open',
                                },
                                {
                                    label: 'Active',
                                    value: 'Active',
                                },
                            ])}
                        >
                            Select Open and Active
                        </button>
                        <button
                            type='button'
                            onClick={() => props.onChange([])}
                        >
                            Clear status
                        </button>
                    </>
                )}
            </div>
        )
    },
}))
jest.mock('~/libs/ui', () => ({
    IconOutline: {
        SearchIcon: () => <span>search-icon</span>,
    },
}), {
    virtual: true,
})

describe('EngagementsFilter', () => {
    it('defaults the status multi-select to all engagement statuses without an All option', () => {
        render(
            <EngagementsFilter
                filters={{}}
                onFiltersChange={jest.fn()}
            />,
        )

        expect(screen.getByTestId('work-engagements-status-is-multi').textContent)
            .toBe('true')
        expect(screen.getByTestId('work-engagements-status-is-clearable').textContent)
            .toBe('true')
        expect(screen.getByTestId('work-engagements-status-options').textContent)
            .toBe(mockEngagementStatuses.join('|'))
        expect(screen.getByTestId('work-engagements-status-value').textContent)
            .toBe(mockEngagementStatuses.join('|'))
    })

    it('stores selected statuses and resets to the default when cleared', () => {
        const handleFiltersChange = jest.fn()

        render(
            <EngagementsFilter
                filters={{}}
                onFiltersChange={handleFiltersChange}
            />,
        )

        fireEvent.click(screen.getByRole('button', { name: 'Select Open and Active' }))
        fireEvent.click(screen.getByRole('button', { name: 'Clear status' }))

        expect(handleFiltersChange)
            .toHaveBeenNthCalledWith(1, {
                status: ['Open', 'Active'],
            })
        expect(handleFiltersChange)
            .toHaveBeenNthCalledWith(2, {
                status: undefined,
            })
    })
})
