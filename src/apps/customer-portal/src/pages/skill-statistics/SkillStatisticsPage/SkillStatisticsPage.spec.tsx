/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { fireEvent, render, screen, within } from '@testing-library/react'

import { getTabIdFromPathName, getTabsConfig } from '../../../lib/components/NavTabs/config/tabs-config'
import { SKILL_CATEGORIES } from './mock'
import SkillStatisticsPage from './SkillStatisticsPage'

jest.mock('~/config', () => ({
    AppSubdomain: {
        customer: 'customer',
    },
    EnvironmentConfig: {
        SUBDOMAIN: 'customer',
        USER_PROFILE_URL: 'https://profiles.example.com',
    },
}), {
    virtual: true,
})

jest.mock('~/libs/core', () => ({
    getRatingColor: (rating?: number) => (rating && rating >= 2200 ? '#EF3A3A' : '#F2C900'),
}), {
    virtual: true,
})

jest.mock('~/libs/shared', () => ({
    ProfilePicture: () => <span data-testid='avatar' />,
}), {
    virtual: true,
})

const DummyIcon = (): JSX.Element => <span data-testid='icon' />

jest.mock('~/libs/ui', () => ({
    IconOutline: new Proxy({}, {
        get: () => DummyIcon,
    }),
    TabsNavItem: {},
}), {
    virtual: true,
})

jest.mock('~/apps/customer-portal/src/config/routes.config', () => ({
    flexiTalentRouteId: 'flexi-talent',
    showcaseSearchRouteId: 'showcase',
    skillStatisticsRouteId: 'skill-statistics',
    statisticsRouteId: 'statistics',
    talentSearchRouteId: 'talent-search',
}), {
    virtual: true,
})

jest.mock('flag-icons/css/flag-icons.min.css', () => ({}), {
    virtual: true,
})

jest.mock('../../statistics/StatisticsPage/assets', () => ({
    IconFirstPlace: () => <span>1st</span>,
    IconSecondPlace: () => <span>2nd</span>,
    IconThirdPlace: () => <span>3rd</span>,
}), {
    virtual: true,
})

jest.mock('../../statistics/StatisticsPage/assets/member-group.svg', () => 'member-group.svg', {
    virtual: true,
})

jest.mock('../../statistics/StatisticsPage/assets/skill-cognition.svg', () => 'skill-cognition.svg', {
    virtual: true,
})

describe('Customer Portal Skill Statistics tabs', () => {
    it('adds Skill Statistics beside General Statistics', () => {
        const tabs = getTabsConfig(['administrator'], false, false)

        expect(tabs.map(tab => tab.title))
            .toEqual([
                'General Statistics',
                'Skill Statistics',
                'Talent Search',
                'Showcase',
                'Flexi-Talent',
            ])
        expect(getTabIdFromPathName('/skill-statistics', ['administrator'], false, false))
            .toBe('skill-statistics')
        expect(getTabIdFromPathName('/statistics', ['administrator'], false, false))
            .toBe('statistics')
    })
})

describe('SkillStatisticsPage', () => {
    it('renders all 23 skill categories', () => {
        render(<SkillStatisticsPage />)

        expect(SKILL_CATEGORIES)
            .toHaveLength(23)
        expect(screen.queryByRole('button', { name: 'Bar' }))
            .not.toBeInTheDocument()
        SKILL_CATEGORIES.forEach(category => {
            expect(screen.getByRole('button', { name: category.name }))
                .toBeInTheDocument()
        })
    })

    it('shows the category popover on hover and the members UI on click', () => {
        render(<SkillStatisticsPage />)

        const bubble = screen.getByRole('button', { name: 'Programming & Development' })
        fireEvent.mouseEnter(bubble)

        expect(screen.getByText('Total Members'))
            .toBeInTheDocument()
        expect(screen.getByText('banerjeesourish'))
            .toBeInTheDocument()
        expect(screen.getByText('Total Members')
            .closest('[data-placement]'))
            .toHaveAttribute('data-placement', expect.stringMatching(/^(top|bottom|left|right)$/))
        expect(screen.queryByRole('heading', { name: 'Members for Programming & Development' }))
            .not.toBeInTheDocument()

        fireEvent.click(bubble)

        expect(screen.getByRole('heading', { name: 'Members for Programming & Development' }))
            .toBeInTheDocument()
        expect(screen.getByText('billzedison'))
            .toBeInTheDocument()
    })

    it('filters members from in-memory state when searching', () => {
        render(<SkillStatisticsPage />)
        fireEvent.click(screen.getByRole('button', { name: 'Programming & Development' }))

        fireEvent.change(screen.getByLabelText('Search members'), {
            target: { value: 'Ghostar' },
        })

        const table = screen.getByRole('table')
        expect(within(table)
            .getByText('Ghostar'))
            .toBeInTheDocument()
        expect(within(table)
            .queryByText('billzedison'))
            .not.toBeInTheDocument()
        expect(within(table)
            .getByText('1st'))
            .toBeInTheDocument()
    })

    it('reranks members when filtering by country', () => {
        render(<SkillStatisticsPage />)
        fireEvent.click(screen.getByRole('button', { name: 'Programming & Development' }))

        fireEvent.change(screen.getByLabelText('Filter By'), {
            target: { value: 'GB' },
        })

        const table = screen.getByRole('table')
        expect(within(table)
            .getByText('diazx'))
            .toBeInTheDocument()
        expect(within(table)
            .queryByText('billzedison'))
            .not.toBeInTheDocument()
        expect(within(table)
            .getByText('1st'))
            .toBeInTheDocument()
    })
})
