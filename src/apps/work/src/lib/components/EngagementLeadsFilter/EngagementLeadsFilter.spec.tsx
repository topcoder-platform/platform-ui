/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, react/jsx-no-bind */
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'

import { EngagementLeadStatusGroup, EngagementLeadType } from '../../models/EngagementLead.model'

import {
    DEFAULT_FILTERS,
    EngagementLeadsFilter,
} from './EngagementLeadsFilter'

jest.mock('../../constants', () => ({
    LEAD_SMU_OPTIONS: ['AMR1'],
}))
jest.mock('~/libs/ui', () => ({
    Button: (props: { label: string, onClick?: () => void }) => (
        <button onClick={props.onClick} type='button'>{props.label}</button>
    ),
    InputMultiselect: (props: {
        name: string
        onChange: (event: { target: { value: Array<{ label: string, value: string }> } }) => void
        options?: Array<{ label: string, value: string }>
        value?: Array<{ label: string, value: string }>
    }) => (
        <div>
            <div data-testid={`${props.name}-value`}>
                {(props.value || []).map(option => option.label)
                    .join(',')}
            </div>
            <button
                type='button'
                onClick={() => props.onChange({ target: { value: [] } })}
            >
                Clear statuses
            </button>
            <button
                type='button'
                onClick={() => props.onChange({
                    target: { value: (props.options || []).slice(2, 3) },
                })}
            >
                Select third status
            </button>
        </div>
    ),
}), { virtual: true })

function renderFilter(onFiltersChange: jest.Mock): void {
    render(
        <EngagementLeadsFilter
            filters={DEFAULT_FILTERS}
            leadType={EngagementLeadType.WIPRO_CONSUMPTION}
            onFiltersChange={onFiltersChange}
        />,
    )
}

describe('EngagementLeadsFilter', () => {
    it('shows new and under review leads by default', () => {
        renderFilter(jest.fn())

        expect(screen.getByTestId('engagement-leads-status-value').textContent)
            .toBe('New,Under Review')
    })

    it('applies the selected status groups', () => {
        const onFiltersChange = jest.fn()
        renderFilter(onFiltersChange)

        fireEvent.click(screen.getByText('Select third status'))
        fireEvent.click(screen.getByText('Apply Filters'))

        expect(onFiltersChange)
            .toHaveBeenCalledWith(expect.objectContaining({
                statusGroups: [EngagementLeadStatusGroup.FULFILLED],
            }))
    })

    it('applies every status when no status is selected', () => {
        const onFiltersChange = jest.fn()
        renderFilter(onFiltersChange)

        fireEvent.click(screen.getByText('Clear statuses'))
        fireEvent.click(screen.getByText('Apply Filters'))

        expect(onFiltersChange)
            .toHaveBeenCalledWith(expect.objectContaining({ statusGroups: undefined }))
    })

    it('restores the default statuses when the filters are cleared', () => {
        const onFiltersChange = jest.fn()
        renderFilter(onFiltersChange)

        fireEvent.click(screen.getByText('Clear statuses'))
        fireEvent.click(screen.getByText('Clear Filters'))

        expect(onFiltersChange)
            .toHaveBeenCalledWith(expect.objectContaining({
                statusGroups: [EngagementLeadStatusGroup.NEW, EngagementLeadStatusGroup.UNDER_REVIEW],
            }))
        expect(screen.getByTestId('engagement-leads-status-value').textContent)
            .toBe('New,Under Review')
    })
})
