/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

import { OpportunityFiltersPanel } from './OpportunityFiltersPanel'

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
                onTypeChange={jest.fn()}
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

        fireEvent.change(search, { target: { value: 'React project' } })
        expect(onSearchChange)
            .toHaveBeenCalledWith('React project')
    })

    it('uses the authored unified search and supported My engagements filter', () => {
        const onAppliedChange = jest.fn()
        const onRoleChange = jest.fn()

        render(
            <OpportunityFiltersPanel
                applied={false}
                isAuthenticated
                kind='engagements'
                onAppliedChange={onAppliedChange}
                onReset={jest.fn()}
                onRoleChange={onRoleChange}
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

        expect(screen.queryByText('Skills / technologies'))
            .not.toBeInTheDocument()
        expect(screen.getByText('Search skills, technologies, projects'))
            .toBeInTheDocument()
        expect(screen.getByText('Completed'))
            .toBeInTheDocument()
        const myEngagements = screen.getByRole('checkbox', { name: 'My engagements' })
        fireEvent.click(myEngagements)
        expect(onAppliedChange)
            .toHaveBeenCalledWith(true)
        fireEvent.change(screen.getByRole('combobox', { name: 'Role' }), {
            target: { value: 'SOFTWARE_DEVELOPER' },
        })
        expect(onRoleChange)
            .toHaveBeenCalledWith('SOFTWARE_DEVELOPER')
        expect(screen.getByText('Select e.g. “Software Engineer”'))
            .toHaveAttribute('id', 'engagements-role-description')
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
