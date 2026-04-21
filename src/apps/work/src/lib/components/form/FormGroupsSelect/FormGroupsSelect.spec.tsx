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

import { fetchGroups } from '../../../services'

import { FormGroupsSelect } from './FormGroupsSelect'

let latestAsyncSelectProps: Record<string, unknown> | undefined

const fetchGroupsMock = fetchGroups as jest.Mock

jest.mock('react-select/async', () => ({
    __esModule: true,
    default: (props: Record<string, unknown>) => {
        latestAsyncSelectProps = props

        return false
    },
}))

jest.mock('react-select/async-creatable', () => ({
    __esModule: true,
    default: (props: Record<string, unknown>) => {
        latestAsyncSelectProps = props

        return false
    },
}))

jest.mock('../../../services', () => ({
    createGroup: jest.fn(),
    fetchGroups: jest.fn(),
}))

interface TestFormValues {
    groups: string[]
}

const TestHarness: FC = () => {
    const formMethods = useForm<TestFormValues>({
        defaultValues: {
            groups: ['db53f15b-2d61-4d9e-8263-8cfc3f98337e'],
        },
    })

    return (
        <FormProvider {...formMethods}>
            <FormGroupsSelect
                label='Groups'
                name='groups'
            />
        </FormProvider>
    )
}

describe('FormGroupsSelect', () => {
    beforeEach(() => {
        latestAsyncSelectProps = undefined
        jest.clearAllMocks()
    })

    it('hydrates saved group ids from the accessible groups list before falling back to raw ids', async () => {
        fetchGroupsMock.mockResolvedValue([
            {
                id: 'db53f15b-2d61-4d9e-8263-8cfc3f98337e',
                name: 'Hide Challenges',
            },
        ])

        render(
            <TestHarness />,
        )

        await waitFor(() => {
            expect(fetchGroupsMock)
                .toHaveBeenCalledWith()
        })

        await waitFor(() => {
            expect(latestAsyncSelectProps?.value)
                .toEqual([
                    {
                        label: 'Hide Challenges',
                        value: 'db53f15b-2d61-4d9e-8263-8cfc3f98337e',
                    },
                ])
        })
    })
})
