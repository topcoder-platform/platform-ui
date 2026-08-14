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
        const onSkillsChange = jest.fn()

        render(
            <OpportunityFiltersPanel
                applied={false}
                isAuthenticated={false}
                kind='competitions'
                onAppliedChange={jest.fn()}
                onReset={jest.fn()}
                onSearchChange={onSearchChange}
                onSkillsChange={onSkillsChange}
                onStatusChange={jest.fn()}
                onTrackChange={jest.fn()}
                onTypeChange={jest.fn()}
                search=''
                skills='React'
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
        expect(onSkillsChange)
            .not.toHaveBeenCalled()
    })

    it('retains the owner-specific skills field for engagements', () => {
        render(
            <OpportunityFiltersPanel
                applied={false}
                isAuthenticated={false}
                kind='engagements'
                onAppliedChange={jest.fn()}
                onReset={jest.fn()}
                onSearchChange={jest.fn()}
                onSkillsChange={jest.fn()}
                onStatusChange={jest.fn()}
                onTrackChange={jest.fn()}
                onTypeChange={jest.fn()}
                search=''
                skills=''
                status='OPEN'
                tracks={[]}
                types={[]}
            />,
        )

        expect(screen.getByText('Skills / technologies'))
            .toBeInTheDocument()
        expect(screen.queryByText('Search skills, technologies, projects'))
            .not.toBeInTheDocument()
    })
})
