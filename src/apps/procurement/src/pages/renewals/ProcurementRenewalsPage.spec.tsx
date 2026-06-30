/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, react/jsx-no-bind, sort-keys */
import { PropsWithChildren } from 'react'
import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react'

import {
    createRenewal,
    deleteRenewal,
    getContracts,
    getRenewals,
    getRenewalStages,
    moveRenewalStage,
    updateRenewal,
} from '../../lib/services'

import { ProcurementRenewalsPage } from './ProcurementRenewalsPage'

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
    createRenewal: jest.fn(),
    deleteRenewal: jest.fn(),
    getContracts: jest.fn(),
    getRenewals: jest.fn(),
    getRenewalStages: jest.fn(),
    moveRenewalStage: jest.fn(),
    updateRenewal: jest.fn(),
}))

const contract = {
    autoRenew: false,
    contractNumber: 'MSA-001',
    createdAt: '2026-01-01T00:00:00.000Z',
    endDate: '2026-12-31T00:00:00.000Z',
    id: 'contract-1',
    lifecycle: 'active',
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
}
const backendNull = JSON.parse('null') as null
const renewals = [
    {
        assignee: 'buyer@example.com',
        contract: {
            contractNumber: 'RN-1',
            id: 'contract-1',
            title: 'Design Subscription',
            vendor: {
                id: 'vendor-1',
                name: 'Acme Software',
            },
        },
        contractId: 'contract-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'renewal-1',
        newEndDate: '2027-12-31T00:00:00.000Z',
        newStartDate: '2027-01-01T00:00:00.000Z',
        newValue: 1300,
        renewalTermMonths: 12,
        stage: 'quotation',
        stageLabel: 'Quotation',
        stageOrder: 1,
        updatedAt: '2026-01-02T00:00:00.000Z',
    },
    {
        assignee: 'legal@example.com',
        contract: {
            contractNumber: 'RN-2',
            id: 'contract-2',
            title: 'Security Subscription',
            vendor: {
                id: 'vendor-2',
                name: 'Secure Co',
            },
        },
        contractId: 'contract-2',
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'renewal-2',
        newEndDate: '2027-12-31T00:00:00.000Z',
        newStartDate: '2027-01-01T00:00:00.000Z',
        newValue: backendNull,
        renewalTermMonths: 12,
        stage: 'vra',
        stageLabel: 'VRA',
        stageOrder: 2,
        updatedAt: '2026-01-02T00:00:00.000Z',
    },
]
const stages = [
    {
        label: 'Quotation',
        order: 1,
        stage: 'quotation',
        terminal: false,
    },
    {
        label: 'VRA',
        order: 2,
        stage: 'vra',
        terminal: false,
    },
    {
        label: 'CIO Approval',
        order: 3,
        stage: 'cio_approval',
        terminal: false,
    },
    {
        label: 'PO Release',
        order: 4,
        stage: 'po_release',
        terminal: true,
    },
]
const mockedCreateRenewal = createRenewal as jest.Mock
const mockedDeleteRenewal = deleteRenewal as jest.Mock
const mockedGetContracts = getContracts as jest.Mock
const mockedGetRenewals = getRenewals as jest.Mock
const mockedGetRenewalStages = getRenewalStages as jest.Mock
const mockedMoveRenewalStage = moveRenewalStage as jest.Mock
const mockedUpdateRenewal = updateRenewal as jest.Mock

describe('ProcurementRenewalsPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedCreateRenewal.mockResolvedValue(renewals[0])
        mockedDeleteRenewal.mockResolvedValue(renewals[0])
        mockedGetContracts.mockResolvedValue([contract])
        mockedGetRenewals.mockResolvedValue(renewals)
        mockedGetRenewalStages.mockResolvedValue(stages)
        mockedMoveRenewalStage.mockResolvedValue(renewals[0])
        mockedUpdateRenewal.mockResolvedValue(renewals[0])
    })

    it('toggles board/list views and moves renewals to adjacent stages', async () => {
        render(<ProcurementRenewalsPage />)

        expect(await screen.findByText('Quotation'))
            .toBeTruthy()
        expect(screen.getByText('RN-1'))
            .toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: 'List' }))
        expect(screen.getByText('New term'))
            .toBeTruthy()

        const row = screen.getByText('RN-2')
            .closest('tr') as HTMLElement
        fireEvent.click(within(row)
            .getByRole('button', { name: 'Back' }))

        await waitFor(() => expect(mockedMoveRenewalStage)
            .toHaveBeenCalledWith('renewal-2', 'quotation'))

        fireEvent.click(screen.getByRole('button', { name: 'Board' }))
        const card = screen.getByText('RN-1')
            .closest('article') as HTMLElement
        fireEvent.click(within(card)
            .getByRole('button', { name: 'Next' }))

        await waitFor(() => expect(mockedMoveRenewalStage)
            .toHaveBeenCalledWith('renewal-1', 'vra'))
    })

    it('renders nullable renewal values as absent and keeps the edit field blank', async () => {
        render(<ProcurementRenewalsPage />)

        const boardCard = (await screen.findByText('RN-2'))
            .closest('article') as HTMLElement

        expect(within(boardCard)
            .getByText('-'))
            .toBeTruthy()
        expect(within(boardCard)
            .queryByText('$0.00'))
            .toBeNull()

        fireEvent.click(screen.getByRole('button', { name: 'List' }))

        const row = screen.getByText('RN-2')
            .closest('tr') as HTMLElement
        expect(within(row)
            .getByText('-'))
            .toBeTruthy()
        expect(within(row)
            .queryByText('$0.00'))
            .toBeNull()

        fireEvent.click(within(row)
            .getByRole('button', { name: 'Edit' }))

        expect((screen.getByLabelText('New value') as HTMLInputElement).value)
            .toBe('')
    })
})
