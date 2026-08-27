/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { SWRConfig } from 'swr'

import { getTabIdFromPathName, getTabsConfig } from '../../../lib/components/NavTabs/config/tabs-config'
import {
    fetchExpertSkillCategories,
    fetchExpertSkillCategoryMembers,
} from '../../../lib'
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
    statisticsNavRouteId: 'statistics-nav',
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

jest.mock('../../../lib', () => ({
    EXPERT_SKILL_CATEGORIES_CACHE_KEY: 'customer-portal-expert-skill-categories',
    expertSkillCategoryMembersCacheKey: (selectedCategory: string) => (
        `customer-portal-expert-skill-category-members:${selectedCategory}`
    ),
    fetchExpertSkillCategories: jest.fn(),
    fetchExpertSkillCategoryMembers: jest.fn(),
}))

const mockedFetchCategories = fetchExpertSkillCategories as jest.MockedFunction<
    typeof fetchExpertSkillCategories
>
const mockedFetchMembers = fetchExpertSkillCategoryMembers as jest.MockedFunction<
    typeof fetchExpertSkillCategoryMembers
>

const CATEGORIES = [
    {
        color: '#1B4F72',
        icon: 'TerminalIcon',
        id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
        name: 'Programming and Development',
        officialName: 'Programming and Development',
        size: 10,
        skillsBreakdown: [{ name: 'JavaScript', percentage: 40 }],
        totalMembers: 101,
        totalSkills: 50,
    },
    {
        color: '#4A6A7A',
        icon: 'CodeIcon',
        id: '1f5ed3e8-8d22-44ea-b75d-ea85147a04da',
        name: 'Scripting and Automation',
        officialName: 'Scripting and Automation',
        size: 3,
        skillsBreakdown: [],
        totalMembers: 10,
        totalSkills: 4,
    },
]

const MEMBERS = [
    {
        countryCode: 'IN',
        countryName: 'India',
        handle: 'billzedison',
        name: 'Honghan W',
        rating: 2000,
        wins: 376,
    },
    {
        countryCode: 'US',
        countryName: 'USA',
        handle: 'Ghostar',
        name: 'Justin G',
        rating: 1900,
        wins: 322,
    },
    {
        countryCode: 'GB',
        countryName: 'UK',
        handle: 'diazx',
        name: 'DAT N',
        rating: 2300,
        wins: 200,
    },
]

function renderPage(): ReturnType<typeof render> {
    return render(
        <SWRConfig value={{
            dedupingInterval: 0,
            errorRetryCount: 0,
            provider: () => new Map(),
        }}
        >
            <SkillStatisticsPage />
        </SWRConfig>,
    )
}

describe('Customer Portal Skill Statistics tabs', () => {
    it('nests General Statistics and Skill Statistics under Statistics', () => {
        const tabs = getTabsConfig(['administrator'], false, false)

        expect(tabs.map(tab => tab.title))
            .toEqual([
                'Statistics',
                'Talent Search',
                'Showcase',
                'Flexi-Talent',
            ])
        expect(tabs[0].children?.map(tab => tab.title))
            .toEqual([
                'General Statistics',
                'Skill Statistics',
            ])
        expect(getTabIdFromPathName('/skill-statistics', ['administrator'], false, false))
            .toBe('statistics-nav')
        expect(getTabIdFromPathName('/statistics', ['administrator'], false, false))
            .toBe('statistics-nav')
    })
})

describe('SkillStatisticsPage', () => {
    const originalInnerWidth = window.innerWidth

    beforeEach(() => {
        Object.defineProperty(window, 'innerWidth', {
            configurable: true,
            value: originalInnerWidth,
        })
        mockedFetchCategories.mockReset()
        mockedFetchMembers.mockReset()
        mockedFetchCategories.mockResolvedValue(CATEGORIES)
        mockedFetchMembers.mockImplementation(async selectedCategory => (
            selectedCategory === 'Programming and Development' ? MEMBERS : []
        ))
    })

    it('renders skill categories from the reports API', async () => {
        renderPage()

        expect(await screen.findByRole('button', { name: 'Programming and Development' }))
            .toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Scripting and Automation' }))
            .toBeInTheDocument()
        expect(screen.getByText('Browse and connect with verified experts across 2 skill categories.'))
            .toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Bar' }))
            .not.toBeInTheDocument()
        expect(mockedFetchCategories)
            .toHaveBeenCalledTimes(1)
    })

    it('shows the category popover on hover and the members UI on click', async () => {
        renderPage()

        const bubble = await screen.findByRole('button', { name: 'Programming and Development' })
        fireEvent.mouseEnter(bubble)

        expect(screen.getByText('Total Members'))
            .toBeInTheDocument()
        expect(await screen.findByText('billzedison'))
            .toBeInTheDocument()
        expect(screen.getByText('Total Members')
            .closest('[data-placement]'))
            .toHaveAttribute('data-placement', expect.stringMatching(/^(top|bottom|left|right)$/))
        expect(screen.queryByRole('heading', { name: 'Members for Programming and Development' }))
            .not.toBeInTheDocument()

        fireEvent.click(bubble)

        expect(await screen.findByRole('heading', { name: 'Members for Programming and Development' }))
            .toBeInTheDocument()
        expect(within(screen.getByRole('table'))
            .getByText('Ghostar'))
            .toBeInTheDocument()
    })

    it('filters members from in-memory state when searching', async () => {
        renderPage()
        fireEvent.click(await screen.findByRole('button', { name: 'Programming and Development' }))

        expect(await screen.findByRole('heading', { name: 'Members for Programming and Development' }))
            .toBeInTheDocument()
        expect(within(screen.getByRole('table'))
            .getByText('billzedison'))
            .toBeInTheDocument()

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
            .getByText('2nd'))
            .toBeInTheDocument()
    })

    it('centers the empty members message when filters match nobody', async () => {
        renderPage()
        fireEvent.click(await screen.findByRole('button', { name: 'Programming and Development' }))

        expect(await screen.findByRole('heading', { name: 'Members for Programming and Development' }))
            .toBeInTheDocument()

        fireEvent.change(screen.getByLabelText('Search members'), {
            target: { value: 'no-such-member' },
        })

        expect(screen.getByText('No members match the current filters.'))
            .toBeInTheDocument()
    })

    it('keeps original rank when filtering by country', async () => {
        renderPage()
        fireEvent.click(await screen.findByRole('button', { name: 'Programming and Development' }))

        expect(await screen.findByRole('heading', { name: 'Members for Programming and Development' }))
            .toBeInTheDocument()
        expect(within(screen.getByRole('table'))
            .getByText('billzedison'))
            .toBeInTheDocument()

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
            .getByText('3rd'))
            .toBeInTheDocument()
    })

    it('opens the members table on double click in mobile view', async () => {
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 })
        renderPage()

        const bubble = await screen.findByRole('button', { name: 'Programming and Development' })
        fireEvent.click(bubble)

        expect(screen.queryByRole('heading', { name: 'Members for Programming and Development' }))
            .not.toBeInTheDocument()
        expect(screen.getByText('Total Members'))
            .toBeInTheDocument()

        fireEvent.doubleClick(bubble)

        expect(await screen.findByRole('heading', { name: 'Members for Programming and Development' }))
            .toBeInTheDocument()
        expect(screen.queryByText('Total Members'))
            .not.toBeInTheDocument()
    })

    it('hides the popover when the same bubble is clicked again', async () => {
        const now = jest.spyOn(Date, 'now')

        try {
            now.mockReturnValue(1_000)
            Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 })
            renderPage()

            const bubble = await screen.findByRole('button', { name: 'Programming and Development' })
            fireEvent.click(bubble)

            expect(screen.getByText('Total Members'))
                .toBeInTheDocument()

            now.mockReturnValue(1_500)
            fireEvent.click(bubble)

            expect(screen.queryByText('Total Members'))
                .not.toBeInTheDocument()
        } finally {
            now.mockRestore()
        }
    })

    it('hides the popover when clicking outside the bubbles', async () => {
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 })
        renderPage()

        fireEvent.click(await screen.findByRole('button', { name: 'Programming and Development' }))

        expect(screen.getByText('Total Members'))
            .toBeInTheDocument()

        fireEvent.pointerDown(document.body)

        expect(screen.queryByText('Total Members'))
            .not.toBeInTheDocument()
    })

    it('expands a member row to show rating, country, and wins', async () => {
        renderPage()
        fireEvent.click(await screen.findByRole('button', { name: 'Programming and Development' }))

        expect(await screen.findByRole('heading', { name: 'Members for Programming and Development' }))
            .toBeInTheDocument()

        fireEvent.click(screen.getByText('Justin G'))

        const details = screen.getByLabelText('Details for Ghostar')
        expect(within(details)
            .getByText('1900'))
            .toBeInTheDocument()
        expect(within(details)
            .getByText('USA'))
            .toBeInTheDocument()
        expect(within(details)
            .getByText('322'))
            .toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Hide details for Ghostar' }))
            .toHaveAttribute('aria-expanded', 'true')
    })

    it('shows an error when skill categories fail to load', async () => {
        mockedFetchCategories.mockRejectedValueOnce(new Error('failed'))
        renderPage()

        expect(await screen.findByRole('alert'))
            .toHaveTextContent('Skill categories could not be loaded.')
        expect(screen.queryByRole('button', { name: 'Programming and Development' }))
            .not.toBeInTheDocument()
    })
})
