import { xhrGetAsync } from '~/libs/core'

import {
    fetchExpertSkillCategories,
    fetchExpertSkillCategoryMembers,
} from './statistics.service'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        API: { V6: 'https://api.example.com/v6' },
        REPORTS_API: 'https://reports.example.com',
    },
}), {
    virtual: true,
})

jest.mock('~/libs/core', () => ({
    xhrGetAsync: jest.fn(),
}), {
    virtual: true,
})

const mockedXhrGetAsync = xhrGetAsync as jest.MockedFunction<typeof xhrGetAsync>

describe('statistics.service expert-skills', () => {
    beforeEach(() => {
        mockedXhrGetAsync.mockReset()
    })

    it('loads skill categories from statistics/expert-skills', async () => {
        const categories = [{
            color: '#1B4F72',
            icon: 'TerminalIcon',
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
            officialName: 'Programming and Development',
            size: 10,
            skillsBreakdown: [{ name: 'JavaScript', percentage: 40 }],
            totalMembers: 101,
            totalSkills: 50,
        }]
        mockedXhrGetAsync.mockResolvedValueOnce(categories)

        await expect(fetchExpertSkillCategories())
            .resolves
            .toEqual(categories)
        expect(mockedXhrGetAsync)
            .toHaveBeenCalledWith(
                'https://reports.example.com/statistics/expert-skills/categories',
            )
    })

    it('loads category members from statistics/expert-skills', async () => {
        const members = [{
            countryCode: 'IN',
            countryName: 'India',
            handle: 'billzedison',
            name: 'Honghan W',
            rating: 2000,
            wins: 376,
        }]
        mockedXhrGetAsync.mockResolvedValueOnce(members)

        await expect(fetchExpertSkillCategoryMembers('Programming and Development'))
            .resolves
            .toEqual(members)
        expect(mockedXhrGetAsync)
            .toHaveBeenCalledWith(
                'https://reports.example.com/statistics/expert-skills/category-members'
                + '?selectedcategory=Programming+and+Development',
            )
    })
})
