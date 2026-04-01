/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { FC } from 'react'
import {
    render,
    waitFor,
} from '@testing-library/react'
import {
    FormProvider,
    useForm,
} from 'react-hook-form'

import {
    fetchBillingAccountById,
    fetchProjectBillingAccounts,
    searchBillingAccounts,
} from '../../../services'

import { FormBillingAccountAutocomplete } from './FormBillingAccountAutocomplete'

let latestAsyncSelectProps: Record<string, unknown> | undefined

const fetchBillingAccountByIdMock = fetchBillingAccountById as jest.Mock
const fetchProjectBillingAccountsMock = fetchProjectBillingAccounts as jest.Mock
const searchBillingAccountsMock = searchBillingAccounts as jest.Mock

jest.mock('react-select/async', () => ({
    __esModule: true,
    default: (props: Record<string, unknown>) => {
        latestAsyncSelectProps = props

        return false
    },
}))

jest.mock('../../../services', () => ({
    fetchBillingAccountById: jest.fn(),
    fetchProjectBillingAccounts: jest.fn(),
    searchBillingAccounts: jest.fn(),
}))

jest.mock('../../../utils', () => ({
    formatDate: (value?: string | null) => value || '-',
}))

interface TestFormValues {
    billingAccountId: string
}

interface TestHarnessProps {
    defaultBillingAccountId?: string
    projectId?: string
}

const TestHarness: FC<TestHarnessProps> = (
    props: TestHarnessProps,
) => {
    const formMethods = useForm<TestFormValues>({
        defaultValues: {
            billingAccountId: props.defaultBillingAccountId || '',
        },
    })

    return (
        <FormProvider {...formMethods}>
            <FormBillingAccountAutocomplete
                label='Billing Account'
                name='billingAccountId'
                projectId={props.projectId}
            />
        </FormProvider>
    )
}

describe('FormBillingAccountAutocomplete', () => {
    beforeEach(() => {
        latestAsyncSelectProps = undefined
        jest.clearAllMocks()
        fetchProjectBillingAccountsMock.mockResolvedValue([])
    })

    it('preloads project billing accounts into the edit-project dropdown', async () => {
        fetchProjectBillingAccountsMock.mockResolvedValue([
            {
                active: true,
                endDate: '2028-10-31T00:00:00.000Z',
                id: '80001059',
                name: 'Platform Dev - Two',
                startDate: '2023-10-31T00:00:00.000Z',
            },
            {
                active: true,
                endDate: '2028-10-31T00:00:00.000Z',
                id: '80001012',
                name: 'Platform Dev - One',
                startDate: '2023-10-31T00:00:00.000Z',
            },
        ])

        render(
            <TestHarness projectId='100578' />,
        )

        await waitFor(() => {
            expect(fetchProjectBillingAccountsMock)
                .toHaveBeenCalledWith('100578')
        })

        await waitFor(() => {
            expect(latestAsyncSelectProps?.defaultOptions)
                .toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        label: expect.stringContaining('Platform Dev - One'),
                        value: '80001012',
                    }),
                    expect.objectContaining({
                        label: expect.stringContaining('Platform Dev - Two'),
                        value: '80001059',
                    }),
                ]))
        })
    })

    it('keeps search-only behavior when no project is provided', () => {
        render(
            <TestHarness />,
        )

        expect(fetchProjectBillingAccounts)
            .not
            .toHaveBeenCalled()
        expect(latestAsyncSelectProps?.defaultOptions)
            .toBe(false)
    })

    it('does not fetch the selected billing account when the field is blank', () => {
        render(
            <TestHarness projectId='100578' />,
        )

        expect(fetchBillingAccountByIdMock)
            .not
            .toHaveBeenCalled()
        expect(searchBillingAccountsMock)
            .not
            .toHaveBeenCalled()
    })
})
