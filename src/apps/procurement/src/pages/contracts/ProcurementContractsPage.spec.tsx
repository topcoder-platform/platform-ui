/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, react/jsx-no-bind, sort-keys */
import { PropsWithChildren } from 'react'
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'

import { getContracts, getVendors } from '../../lib/services'

import { ProcurementContractsPage } from './ProcurementContractsPage'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        PROCUREMENT_API: 'https://api.test/v6/procurement',
    },
}), {
    virtual: true,
})

jest.mock('~/libs/ui', () => ({
    BaseModal: (props: PropsWithChildren<{ open: boolean }>) => (
        props.open ? <div>{props.children}</div> : <></>
    ),
    Button: (props: {
        disabled?: boolean
        label: string
        onClick?: () => void
        type?: 'button' | 'submit'
    }) => (
        <button
            disabled={props.disabled}
            onClick={props.onClick}
            type={props.type === 'submit' ? 'submit' : 'button'}
        >
            {props.label}
        </button>
    ),
    ConfirmModal: (props: PropsWithChildren<{ open: boolean }>) => (
        props.open ? <div>{props.children}</div> : <></>
    ),
}), {
    virtual: true,
})

jest.mock('../../lib/services', () => ({
    getContracts: jest.fn(),
    getVendors: jest.fn(),
}))

const mockedGetContracts = getContracts as jest.Mock
const mockedGetVendors = getVendors as jest.Mock
const backendNull = JSON.parse('null') as null

describe('ProcurementContractsPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedGetContracts.mockResolvedValue([{
            autoRenew: true,
            contractNumber: 'MSA-001',
            createdAt: '2026-01-01T00:00:00.000Z',
            endDate: '2026-07-15T00:00:00.000Z',
            id: 'contract-1',
            lifecycle: 'expiring',
            renewalNoticeDays: 30,
            startDate: '2026-01-01T00:00:00.000Z',
            status: 'active',
            title: 'Design Subscription',
            updatedAt: '2026-01-02T00:00:00.000Z',
            value: 1200,
            vendor: {
                id: 'vendor-1',
                name: 'Acme Software',
            },
            vendorId: 'vendor-1',
        }])
        mockedGetVendors.mockResolvedValue([{
            createdAt: '2026-01-01T00:00:00.000Z',
            id: 'vendor-1',
            name: 'Acme Software',
            updatedAt: '2026-01-02T00:00:00.000Z',
        }])
    })

    it('renders stored status and backend-derived lifecycle', async () => {
        render(<ProcurementContractsPage />)

        expect(await screen.findByText('MSA-001'))
            .toBeTruthy()
        expect(screen.getByText('Active'))
            .toBeTruthy()
        expect(screen.getByText('Expiring'))
            .toBeTruthy()
    })

    it('keeps nullable renewal notice days blank when editing', async () => {
        mockedGetContracts.mockResolvedValue([{
            autoRenew: true,
            contractNumber: 'MSA-001',
            createdAt: '2026-01-01T00:00:00.000Z',
            endDate: '2026-07-15T00:00:00.000Z',
            id: 'contract-1',
            lifecycle: 'expiring',
            renewalNoticeDays: backendNull,
            startDate: '2026-01-01T00:00:00.000Z',
            status: 'active',
            title: 'Design Subscription',
            updatedAt: '2026-01-02T00:00:00.000Z',
            value: 1200,
            vendor: {
                id: 'vendor-1',
                name: 'Acme Software',
            },
            vendorId: 'vendor-1',
        }])

        render(<ProcurementContractsPage />)

        expect(await screen.findByText('MSA-001'))
            .toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: 'Edit' }))

        expect((screen.getByLabelText('Renewal notice days') as HTMLInputElement).value)
            .toBe('')
    })
})
