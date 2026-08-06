/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    act,
    render,
} from '@testing-library/react'

import {
    fetchBillingAccountById,
    searchBillingAccounts,
} from '../../services'

import { ProjectsFilter } from './ProjectsFilter'

let latestAsyncSelectProps: Record<string, unknown> | undefined

const searchBillingAccountsMock = searchBillingAccounts as jest.Mock

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        ADMIN: {},
        API: {
            V5: 'https://example.com/v5',
            V6: 'https://example.com/v6',
        },
        TC_DOMAIN: 'example.com',
    },
}), {
    virtual: true,
})

jest.mock('react-select/async', () => ({
    __esModule: true,
    default: (props: Record<string, unknown>) => {
        latestAsyncSelectProps = props

        return false
    },
}))

jest.mock('react-select', () => ({
    __esModule: true,
    default: () => false,
}))

jest.mock('~/libs/ui', () => ({
    Button: () => false,
    IconOutline: {
        SearchIcon: () => false,
    },
    InputCheckbox: () => false,
}), {
    virtual: true,
})

jest.mock('../../services', () => ({
    fetchBillingAccountById: jest.fn(),
    searchBillingAccounts: jest.fn(),
}))

describe('ProjectsFilter', () => {
    beforeEach(() => {
        latestAsyncSelectProps = undefined
        jest.clearAllMocks()
        searchBillingAccountsMock.mockResolvedValue([])
    })

    it('includes matching billing accounts from visible project rows for project managers', async () => {
        render(
            <ProjectsFilter
                filters={{}}
                isManager
                onFiltersChange={jest.fn()}
                projects={[
                    {
                        billingAccountId: 80001012,
                        billingAccountName: 'Platform Dev - One',
                        id: 'project-1',
                        name: 'Visible Platform project',
                        status: 'active',
                    },
                    {
                        billingAccountId: 80001063,
                        billingAccountName: 'BA For Marios',
                        id: 'project-2',
                        name: 'Other project',
                        status: 'active',
                    },
                ]}
            />,
        )

        const loadOptions = latestAsyncSelectProps?.loadOptions as (
            (value: string) => Promise<unknown>
        )
        let options: unknown

        await act(async () => {
            options = await loadOptions('pla')
        })

        expect(searchBillingAccountsMock)
            .toHaveBeenCalledWith({
                name: 'pla',
                page: 1,
                perPage: 20,
            })
        expect(options)
            .toEqual([
                {
                    label: 'Platform Dev - One / 80001012',
                    value: '80001012',
                },
            ])
        expect(fetchBillingAccountById)
            .not
            .toHaveBeenCalled()
    })
})
