/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { FC } from 'react'
import {
    act,
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
    selectedBillingAccount?: {
        active?: boolean
        endDate?: string
        id: string
        name: string
        startDate?: string
        status?: string
    }
    userId?: string
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
                selectedBillingAccount={props.selectedBillingAccount}
                userId={props.userId}
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

    it('keeps project default options isolated from later filtered search results', async () => {
        fetchProjectBillingAccountsMock.mockResolvedValue([
            {
                active: true,
                endDate: '2028-10-31T00:00:00.000Z',
                id: '80001012',
                name: 'Platform Dev - One',
                startDate: '2023-10-31T00:00:00.000Z',
            },
        ])
        searchBillingAccountsMock.mockResolvedValue([
            {
                active: true,
                endDate: '2029-01-01T00:00:00.000Z',
                id: '90000001',
                name: 'Acme Search Result',
                startDate: '2024-01-01T00:00:00.000Z',
            },
        ])

        render(
            <TestHarness projectId='100578' />,
        )

        await waitFor(() => {
            expect(fetchProjectBillingAccountsMock)
                .toHaveBeenCalledWith('100578')
        })

        const loadOptions = latestAsyncSelectProps?.loadOptions as ((value: string) => Promise<unknown>)

        await act(async () => {
            expect(await loadOptions('Acme'))
                .toEqual([])
        })

        expect(searchBillingAccountsMock)
            .not
            .toHaveBeenCalled()

        expect(latestAsyncSelectProps?.defaultOptions)
            .toEqual([
                expect.objectContaining({
                    label: expect.stringContaining('Platform Dev - One'),
                    value: '80001012',
                }),
            ])
        expect(latestAsyncSelectProps?.defaultOptions)
            .toEqual(expect.not.arrayContaining([
                expect.objectContaining({
                    value: '90000001',
                }),
            ]))
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

    it('preloads user billing accounts into the create-project dropdown', async () => {
        searchBillingAccountsMock.mockResolvedValue([
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
            <TestHarness userId='12345' />,
        )

        await waitFor(() => {
            expect(searchBillingAccountsMock)
                .toHaveBeenCalledWith({
                    page: 1,
                    perPage: 20,
                    userId: '12345',
                })
        })

        await waitFor(() => {
            expect(latestAsyncSelectProps?.defaultOptions)
                .toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        label: expect.stringContaining('[80001012] Platform Dev - One'),
                        value: '80001012',
                    }),
                    expect.objectContaining({
                        label: expect.stringContaining('[80001059] Platform Dev - Two'),
                        value: '80001059',
                    }),
                ]))
        })
    })

    it('passes the current user id when searching create-project billing accounts', async () => {
        searchBillingAccountsMock.mockResolvedValue([
            {
                active: true,
                endDate: '2029-01-01T00:00:00.000Z',
                id: '90000001',
                name: 'Acme Search Result',
                startDate: '2024-01-01T00:00:00.000Z',
            },
        ])

        render(
            <TestHarness userId='12345' />,
        )

        const loadOptions = latestAsyncSelectProps?.loadOptions as ((value: string) => Promise<unknown>)

        await act(async () => {
            await loadOptions('Acme')
        })

        await waitFor(() => {
            expect(searchBillingAccountsMock)
                .toHaveBeenCalledWith({
                    name: 'Acme',
                    page: 1,
                    perPage: 20,
                    userId: '12345',
                })
        })
    })

    it('filters preloaded project billing accounts locally when searching in edit mode', async () => {
        fetchProjectBillingAccountsMock.mockResolvedValue([
            {
                active: true,
                endDate: '2023-11-20T00:00:00.000Z',
                id: '80001042',
                name: 'Budget Validation - 3',
                startDate: '2023-10-23T00:00:00.000Z',
            },
            {
                active: true,
                endDate: '2028-11-01T00:00:00.000Z',
                id: '80001012',
                name: 'Platform Dev - One',
                startDate: '2023-10-04T00:00:00.000Z',
            },
        ])

        render(
            <TestHarness
                projectId='100578'
                userId='12345'
            />,
        )

        await waitFor(() => {
            expect(fetchProjectBillingAccountsMock)
                .toHaveBeenCalledWith('100578')
        })
        await waitFor(() => {
            expect(latestAsyncSelectProps?.defaultOptions)
                .toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        label: expect.stringContaining('Budget Validation - 3'),
                        value: '80001042',
                    }),
                ]))
        })

        const loadOptions = latestAsyncSelectProps?.loadOptions as ((value: string) => Promise<unknown>)
        let options: unknown

        await act(async () => {
            options = await loadOptions('Budget')
        })

        expect(searchBillingAccountsMock)
            .not
            .toHaveBeenCalled()
        expect(options)
            .toEqual([
                expect.objectContaining({
                    label: expect.stringContaining('Budget Validation - 3'),
                    value: '80001042',
                }),
            ])
    })

    it('keeps debounced edit-mode searches synced with the latest preloaded options', async () => {
        let resolveProjectBillingAccounts: ((value: unknown[]) => void) | undefined

        fetchProjectBillingAccountsMock.mockImplementation(
            () => new Promise<unknown[]>(resolve => {
                resolveProjectBillingAccounts = resolve
            }),
        )

        render(
            <TestHarness projectId='100578' />,
        )

        await waitFor(() => {
            expect(fetchProjectBillingAccountsMock)
                .toHaveBeenCalledWith('100578')
        })

        const initialLoadOptions = latestAsyncSelectProps?.loadOptions as ((value: string) => Promise<unknown>)
        const pendingOptions = initialLoadOptions('Budget')

        await act(async () => {
            resolveProjectBillingAccounts?.([
                {
                    active: true,
                    endDate: '2023-11-20T00:00:00.000Z',
                    id: '80001042',
                    name: 'Budget Validation - 3',
                    startDate: '2023-10-23T00:00:00.000Z',
                },
                {
                    active: true,
                    endDate: '2028-11-01T00:00:00.000Z',
                    id: '80001012',
                    name: 'Platform Dev - One',
                    startDate: '2023-10-04T00:00:00.000Z',
                },
            ])
            await Promise.resolve()
        })

        await waitFor(() => {
            expect(latestAsyncSelectProps?.defaultOptions)
                .toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        label: expect.stringContaining('Budget Validation - 3'),
                        value: '80001042',
                    }),
                ]))
        })

        expect(latestAsyncSelectProps?.loadOptions)
            .toBe(initialLoadOptions)
        expect(searchBillingAccountsMock)
            .not
            .toHaveBeenCalled()
        await expect(pendingOptions)
            .resolves
            .toEqual([
                expect.objectContaining({
                    label: expect.stringContaining('Budget Validation - 3'),
                    value: '80001042',
                }),
            ])
    })

    it('clears the initial loading state when project preload is abandoned', async () => {
        let resolveProjectBillingAccounts: ((value: unknown[]) => void) | undefined

        fetchProjectBillingAccountsMock.mockImplementation(
            () => new Promise<unknown[]>(resolve => {
                resolveProjectBillingAccounts = resolve
            }),
        )

        const renderResult: ReturnType<typeof render> = render(
            <TestHarness projectId='100578' />,
        )

        await waitFor(() => {
            expect(fetchProjectBillingAccountsMock)
                .toHaveBeenCalledWith('100578')
            expect(latestAsyncSelectProps?.isLoading)
                .toBe(true)
        })

        renderResult.rerender(
            <TestHarness />,
        )

        await waitFor(() => {
            expect(latestAsyncSelectProps?.defaultOptions)
                .toBe(false)
            expect(latestAsyncSelectProps?.isLoading)
                .toBe(false)
        })

        await act(async () => {
            resolveProjectBillingAccounts?.([])
            await Promise.resolve()
        })
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

    it('uses the provided selected billing-account details before fetching by id', async () => {
        render(
            <TestHarness
                defaultBillingAccountId='80001063'
                projectId='100578'
                selectedBillingAccount={{
                    active: true,
                    endDate: '2026-10-16T23:59:00.000Z',
                    id: '80001063',
                    name: 'BA For Marios',
                    startDate: '2023-10-31T00:00:00.000Z',
                    status: 'ACTIVE',
                }}
            />,
        )

        await waitFor(() => {
            expect(latestAsyncSelectProps?.value)
                .toEqual(expect.objectContaining({
                    label: expect.stringContaining('BA For Marios'),
                    value: '80001063',
                }))
        })

        expect(fetchBillingAccountByIdMock)
            .not
            .toHaveBeenCalled()
    })
})
