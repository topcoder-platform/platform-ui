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
                onSearchChange={onSearchChange}
                onStatusChange={jest.fn()}
                onTrackChange={jest.fn()}
                onTypeChange={jest.fn()}
                search=''
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

        fireEvent.change(search, { target: { value: 'React project' } })
        expect(onSearchChange)
            .toHaveBeenCalledWith('React project')
    })

    it('uses the authored unified search for engagements', () => {
        render(
            <OpportunityFiltersPanel
                applied={false}
                isAuthenticated={false}
                kind='engagements'
                onAppliedChange={jest.fn()}
                onReset={jest.fn()}
                onSearchChange={jest.fn()}
                onStatusChange={jest.fn()}
                onTrackChange={jest.fn()}
                onTypeChange={jest.fn()}
                search=''
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
    })

    it('matches the authored review track and challenge-type facets', () => {
        render(
            <OpportunityFiltersPanel
                applied={false}
                isAuthenticated
                kind='reviews'
                onAppliedChange={jest.fn()}
                onReset={jest.fn()}
                onSearchChange={jest.fn()}
                onStatusChange={jest.fn()}
                onTrackChange={jest.fn()}
                onTypeChange={jest.fn()}
                search=''
                status='OPEN'
                tracks={[]}
                types={[]}
            />,
        )

        expect(screen.getByText('My review opportunities'))
            .toBeInTheDocument()
        expect(screen.getByText('Status'))
            .toBeInTheDocument()
        expect(screen.getByText('Type'))
            .toBeInTheDocument()
        expect(screen.getByText('Challenge'))
            .toBeInTheDocument()
        expect(screen.getByText('Task'))
            .toBeInTheDocument()
        expect(screen.getByText('AI'))
            .toBeInTheDocument()
    })
})
