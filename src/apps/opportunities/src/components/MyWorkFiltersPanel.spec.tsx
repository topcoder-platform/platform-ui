/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

import { MyWorkFiltersPanel } from './MyWorkFiltersPanel'

describe('MyWorkFiltersPanel', () => {
    it('renders the complete authored taxonomy and forwards controlled changes', () => {
        const onKindChange = jest.fn()
        const onReset = jest.fn()
        const onSearchChange = jest.fn()
        const onStatusChange = jest.fn()
        const onTrackChange = jest.fn()
        const onTypeChange = jest.fn()

        render(
            <MyWorkFiltersPanel
                kinds={[]}
                onKindChange={onKindChange}
                onReset={onReset}
                onSearchChange={onSearchChange}
                onStatusChange={onStatusChange}
                onTrackChange={onTrackChange}
                onTypeChange={onTypeChange}
                search=''
                status='all'
                tracks={[]}
                types={[]}
            />,
        )

        expect(screen.getByRole('radio', { name: 'All work' }))
            .toBeChecked()
        expect(screen.getByRole('checkbox', { name: 'Competition' }))
            .toBeInTheDocument()
        expect(screen.getByRole('checkbox', { name: 'Review work' }))
            .toBeInTheDocument()
        expect(screen.getByRole('checkbox', { name: 'AI' }))
            .toBeInTheDocument()
        expect(screen.getByRole('checkbox', { name: 'Task' }))
            .toBeInTheDocument()

        fireEvent.change(screen.getByRole('searchbox', { name: 'Search my work' }), {
            target: { value: 'Figma' },
        })
        fireEvent.click(screen.getByRole('radio', { name: 'Active work' }))
        fireEvent.click(screen.getByRole('checkbox', { name: 'Engagements' }))
        fireEvent.click(screen.getByRole('checkbox', { name: 'Development' }))
        fireEvent.click(screen.getByRole('checkbox', { name: 'First2Finish' }))
        fireEvent.click(screen.getByRole('button', { name: 'Reset all' }))

        expect(onSearchChange)
            .toHaveBeenCalledWith('Figma')
        expect(onStatusChange)
            .toHaveBeenCalledWith('active')
        expect(onKindChange)
            .toHaveBeenCalledWith('engagements', true)
        expect(onTrackChange)
            .toHaveBeenCalledWith('development', true)
        expect(onTypeChange)
            .toHaveBeenCalledWith('first2finish', true)
        expect(onReset)
            .toHaveBeenCalledTimes(1)
    })
})
