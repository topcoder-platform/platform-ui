/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, react/jsx-no-bind */
import {
    fireEvent,
    render,
    RenderResult,
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
        onChange: (value: { label: string; value: string } | null) => void
        options: Array<{ label: string; value: string }>
        value?: { label: string; value: string }
    }) => (
        <div data-testid={props.inputId}>
            <div data-testid={`${props.inputId}-value`}>
                {props.value?.label || ''}
            </div>
            <button
                type='button'
                onClick={() => props.onChange({
                    label: 'Private',
                    value: 'private',
                })}
            >
                Select Private
            </button>
        </div>
    ),
}))
jest.mock('~/libs/ui', () => ({
    Button: (props: {
        disabled?: boolean
        label: string
        onClick?: () => void
    }) => (
        <button
            disabled={props.disabled}
            onClick={props.onClick}
            type='button'
        >
            {props.label}
        </button>
    ),
    IconOutline: {
        SearchIcon: () => <span>search-icon</span>,
    },
    InputMultiselect: (props: {
        label: string
        name: string
        onChange: (event: { target: { value: Array<{ label: string; value: string }> } }) => void
        options?: Array<{ label: string; value: string }>
        value?: Array<{ label: string; value: string }>
    }) => (
        <div data-testid={props.name}>
            <div data-testid={`${props.name}-label`}>{props.label}</div>
            <div data-testid={`${props.name}-options`}>
                {(props.options || []).map(option => option.label)
                    .join('|')}
            </div>
            <div data-testid={`${props.name}-value`}>
                {(props.value || []).map(option => option.label)
                    .join('|')}
            </div>
            <button
                type='button'
                onClick={() => props.onChange({
                    target: {
                        value: [
                            {
                                label: 'Open',
                                value: 'Open',
                            },
                            {
                                label: 'Active',
                                value: 'Active',
                            },
                        ],
                    },
                })}
            >
                Select Open and Active
            </button>
            <button
                type='button'
                onClick={() => props.onChange({
                    target: {
                        value: [],
                    },
                })}
            >
                Clear status
            </button>
        </div>
    ),
}), {
    virtual: true,
})

describe('EngagementsFilter', () => {
    it('defaults the status multiselect to all engagement statuses', () => {
        render(
            <EngagementsFilter
                filters={{}}
                onFiltersChange={jest.fn()}
            />,
        )

        expect(screen.getByTestId('work-engagements-status-label').textContent)
            .toBe('Engagement Status')
        expect(screen.getByTestId('work-engagements-status-options').textContent)
            .toBe(mockEngagementStatuses.join('|'))
        expect(screen.getByTestId('work-engagements-status-value').textContent)
            .toBe(mockEngagementStatuses.join('|'))
        expect((screen.getByRole('button', { name: 'Apply Filters' }) as HTMLButtonElement).disabled)
            .toBe(true)
    })

    it('defers status filter updates until Apply Filters is clicked', () => {
        const handleFiltersChange = jest.fn()

        render(
            <EngagementsFilter
                filters={{}}
                onFiltersChange={handleFiltersChange}
            />,
        )

        fireEvent.click(screen.getByRole('button', { name: 'Select Open and Active' }))

        expect(handleFiltersChange)
            .not
            .toHaveBeenCalled()
        expect(screen.getByTestId('work-engagements-status-value').textContent)
            .toBe('Open|Active')
        expect((screen.getByRole('button', { name: 'Apply Filters' }) as HTMLButtonElement).disabled)
            .toBe(false)

        fireEvent.click(screen.getByRole('button', { name: 'Apply Filters' }))

        expect(handleFiltersChange)
            .toHaveBeenCalledTimes(1)
        expect(handleFiltersChange)
            .toHaveBeenCalledWith({
                status: ['Open', 'Active'],
            })
    })

    it('resets status to the default when cleared and applied', () => {
        const handleFiltersChange = jest.fn()

        const { rerender }: RenderResult = render(
            <EngagementsFilter
                filters={{
                    status: ['Open', 'Active'],
                }}
                onFiltersChange={handleFiltersChange}
            />,
        )

        fireEvent.click(screen.getByRole('button', { name: 'Clear status' }))
        fireEvent.click(screen.getByRole('button', { name: 'Apply Filters' }))

        expect(handleFiltersChange)
            .toHaveBeenCalledWith({
                status: undefined,
            })

        rerender(
            <EngagementsFilter
                filters={{
                    status: undefined,
                }}
                onFiltersChange={handleFiltersChange}
            />,
        )

        expect(screen.getByTestId('work-engagements-status-value').textContent)
            .toBe(mockEngagementStatuses.join('|'))
        expect((screen.getByRole('button', { name: 'Apply Filters' }) as HTMLButtonElement).disabled)
            .toBe(true)
    })
})
