/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

import { MY_ENGAGEMENTS_STATUS, OpportunityFiltersPanel } from './OpportunityFiltersPanel'

jest.mock('~/libs/ui', () => {
    const Icon = (): JSX.Element => <svg />
    return {
        IconOutline: new Proxy({}, {
            get: () => Icon,
        }),
    }
}, { virtual: true })

describe('OpportunityFiltersPanel', () => {
    it('uses the single authored competition search control and helper', () => {
        const onSearchChange = jest.fn()
        const onTypeChange = jest.fn()

        render(
            <OpportunityFiltersPanel
                applied={false}
                isAuthenticated={false}
                kind='competitions'
                onAppliedChange={jest.fn()}
                onReset={jest.fn()}
                onRoleChange={jest.fn()}
                onSearchChange={onSearchChange}
                onStatusChange={jest.fn()}
                onTrackChange={jest.fn()}
                onTypeChange={onTypeChange}
                search=''
                selectedRole=''
                status='ACTIVE'
                tracks={[]}
                types={[]}
            />,
        )

        const search = screen.getByRole('searchbox', { name: 'Search opportunities' })
        expect(screen.getAllByRole('searchbox'))
            .toHaveLength(1)
        expect(search)
            .toHaveAttribute('aria-describedby', 'competitions-search-description')
        expect(screen.getByText('Search skills, technologies, projects'))
            .toHaveAttribute('id', 'competitions-search-description')
        expect(screen.queryByText('Skills / technologies'))
            .not.toBeInTheDocument()
        expect(screen.queryByPlaceholderText('React, Figma, Python'))
            .not.toBeInTheDocument()
        expect(screen.getByText('AI'))
            .toBeInTheDocument()

        const advancedFilters = screen.getByRole('button', { name: 'More filters' })
        expect(advancedFilters)
            .toHaveAttribute('aria-controls', 'competitions-advanced-filters')
        expect(advancedFilters)
            .toHaveAttribute('aria-expanded', 'false')
        fireEvent.click(advancedFilters)
        expect(screen.getByRole('button', { name: 'Less filters' }))
            .toHaveAttribute('aria-expanded', 'true')

        fireEvent.change(search, { target: { value: 'React project' } })
        expect(onSearchChange)
            .toHaveBeenCalledWith('React project')

        fireEvent.click(screen.getByRole('checkbox', { name: 'Task' }))
        expect(onTypeChange)
            .toHaveBeenCalledWith('TSK', true)
    })

    it('uses the authored unified search and supported My engagements filter', () => {
        const onRoleChange = jest.fn()
        const onStatusChange = jest.fn()

        render(
            <OpportunityFiltersPanel
                applied={false}
                isAuthenticated
                kind='engagements'
                onAppliedChange={jest.fn()}
                onReset={jest.fn()}
                onRoleChange={onRoleChange}
                onSearchChange={jest.fn()}
                onStatusChange={onStatusChange}
                onTrackChange={jest.fn()}
                onTypeChange={jest.fn()}
                search=''
                selectedRole=''
                status='OPEN'
                tracks={[]}
                types={[]}
            />,
        )

        expect(screen.queryByText('Skills / technologies'))
            .not.toBeInTheDocument()
        expect(screen.getByText('Search skills, technologies, projects'))
            .toBeInTheDocument()
        expect(screen.queryByText('Completed'))
            .not.toBeInTheDocument()
        expect(screen.queryByRole('checkbox', { name: 'My engagements' }))
            .not.toBeInTheDocument()
        expect(screen.getAllByRole('radio')
            .map(radio => radio.closest('label')?.textContent))
            .toEqual(['Open for application', 'My engagements'])
        fireEvent.click(screen.getByRole('radio', { name: 'My engagements' }))
        expect(onStatusChange)
            .toHaveBeenCalledWith(MY_ENGAGEMENTS_STATUS)
        fireEvent.click(screen.getByRole('combobox', { name: 'Role' }))
        expect(screen.getByRole('listbox'))
            .toBeInTheDocument()
        expect(screen.getAllByRole('option'))
            .toHaveLength(4)
        fireEvent.click(screen.getByRole('option', { name: 'Software Developer' }))
        expect(onRoleChange)
            .toHaveBeenCalledWith('SOFTWARE_DEVELOPER')
        expect(screen.getByText('Select e.g. “Software Engineer”'))
            .toHaveAttribute('id', 'engagements-role-description')
    })

    it('hides the owner-scoped engagements status from anonymous visitors', () => {
        render(
            <OpportunityFiltersPanel
                applied={false}
                isAuthenticated={false}
                kind='engagements'
                onAppliedChange={jest.fn()}
                onReset={jest.fn()}
                onRoleChange={jest.fn()}
                onSearchChange={jest.fn()}
                onStatusChange={jest.fn()}
                onTrackChange={jest.fn()}
                onTypeChange={jest.fn()}
                search=''
                selectedRole=''
                status='OPEN'
                tracks={[]}
                types={[]}
            />,
        )

        expect(screen.getAllByRole('radio')
            .map(radio => radio.closest('label')?.textContent))
            .toEqual(['Open for application'])
        expect(screen.queryByText('My engagements'))
            .not.toBeInTheDocument()
    })

    it('matches the authored review track facets without an extra Type section', () => {
        render(
            <OpportunityFiltersPanel
                applied={false}
                isAuthenticated
                kind='reviews'
                onAppliedChange={jest.fn()}
                onReset={jest.fn()}
                onRoleChange={jest.fn()}
                onSearchChange={jest.fn()}
                onStatusChange={jest.fn()}
                onTrackChange={jest.fn()}
                onTypeChange={jest.fn()}
                search=''
                selectedRole=''
                status='OPEN'
                tracks={[]}
                types={[]}
            />,
        )

        expect(screen.getByText('My review opportunities'))
            .toBeInTheDocument()
        expect(screen.getByText('Status'))
            .toBeInTheDocument()
        expect(screen.queryByText('Type'))
            .not.toBeInTheDocument()
        expect(screen.queryByText('Challenge'))
            .not.toBeInTheDocument()
        expect(screen.queryByText('Task'))
            .not.toBeInTheDocument()
        expect(screen.getByText('AI'))
            .toBeInTheDocument()
    })
})
