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
    createInvoice,
    deleteInvoice,
    getContracts,
    getInvoices,
    getVendors,
    updateInvoice,
} from '../../lib/services'

import { ProcurementInvoicesPage } from './ProcurementInvoicesPage'

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
    createInvoice: jest.fn(),
    deleteInvoice: jest.fn(),
    getContracts: jest.fn(),
    getInvoices: jest.fn(),
    getVendors: jest.fn(),
    updateInvoice: jest.fn(),
}))

const invoice = {
    amount: 300,
    createdAt: '2026-01-01T00:00:00.000Z',
    dueDate: '2026-07-01T00:00:00.000Z',
    id: 'invoice-1',
    invoiceDate: '2026-06-01T00:00:00.000Z',
    invoiceNumber: 'INV-001',
    paymentState: 'pending',
    status: 'issued',
    updatedAt: '2026-01-02T00:00:00.000Z',
    vendor: {
        id: 'vendor-1',
        name: 'Acme Software',
    },
    vendorId: 'vendor-1',
}
const mockedCreateInvoice = createInvoice as jest.Mock
const mockedDeleteInvoice = deleteInvoice as jest.Mock
const mockedGetContracts = getContracts as jest.Mock
const mockedGetInvoices = getInvoices as jest.Mock
const mockedGetVendors = getVendors as jest.Mock
const mockedUpdateInvoice = updateInvoice as jest.Mock

describe('ProcurementInvoicesPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedCreateInvoice.mockResolvedValue(invoice)
        mockedDeleteInvoice.mockResolvedValue(invoice)
        mockedGetContracts.mockResolvedValue([])
        mockedGetInvoices.mockResolvedValue([invoice])
        mockedGetVendors.mockResolvedValue([{
            createdAt: '2026-01-01T00:00:00.000Z',
            id: 'vendor-1',
            name: 'Acme Software',
            updatedAt: '2026-01-02T00:00:00.000Z',
        }])
        mockedUpdateInvoice.mockResolvedValue({
            ...invoice,
            paidDate: '2026-07-02',
            paymentState: 'paid',
            status: 'paid',
        })
    })

    it('switches invoice filters and refreshes after mark-paid', async () => {
        render(<ProcurementInvoicesPage />)

        expect(await screen.findByText('INV-001'))
            .toBeTruthy()
        expect(mockedGetInvoices)
            .toHaveBeenCalledWith(undefined)

        fireEvent.click(screen.getByRole('button', { name: 'Pending' }))

        await waitFor(() => expect(mockedGetInvoices)
            .toHaveBeenLastCalledWith('pending'))
        await waitFor(() => expect(screen.queryByText('Loading invoices...'))
            .toBeFalsy())

        fireEvent.click(screen.getByRole('button', { name: 'Mark paid' }))

        await waitFor(() => expect(mockedUpdateInvoice)
            .toHaveBeenCalledWith('invoice-1', expect.objectContaining({
                paidDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
                status: 'paid',
            })))
        expect(mockedGetInvoices)
            .toHaveBeenLastCalledWith('pending')
    })

    it('does not allow draft or cancelled invoices to be marked paid', async () => {
        mockedGetInvoices.mockResolvedValue([{
            ...invoice,
            id: 'invoice-draft',
            invoiceNumber: 'INV-DRAFT',
            paymentState: 'draft',
            status: 'draft',
        }, {
            ...invoice,
            id: 'invoice-cancelled',
            invoiceNumber: 'INV-CANCELLED',
            paymentState: 'cancelled',
            status: 'cancelled',
        }])

        render(<ProcurementInvoicesPage />)

        const draftRow = (await screen.findByText('INV-DRAFT'))
            .closest('tr') as HTMLElement
        const cancelledRow = screen.getByText('INV-CANCELLED')
            .closest('tr') as HTMLElement
        const draftMarkPaidButton = within(draftRow)
            .getByRole('button', { name: 'Mark paid' }) as HTMLButtonElement
        const cancelledMarkPaidButton = within(cancelledRow)
            .getByRole('button', { name: 'Mark paid' }) as HTMLButtonElement

        expect(draftMarkPaidButton.disabled)
            .toBe(true)
        expect(cancelledMarkPaidButton.disabled)
            .toBe(true)

        fireEvent.click(draftMarkPaidButton)
        fireEvent.click(cancelledMarkPaidButton)

        expect(mockedUpdateInvoice)
            .not
            .toHaveBeenCalled()
    })
})
