/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, sort-keys */
import {
    render,
    screen,
} from '@testing-library/react'

import { getDashboardSummary, getOverdueInvoices } from '../../lib/services'

import { ProcurementDashboardPage } from './ProcurementDashboardPage'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        PROCUREMENT_API: 'https://api.test/v6/procurement',
    },
}), {
    virtual: true,
})

jest.mock('../../lib/services', () => ({
    getDashboardSummary: jest.fn(),
    getOverdueInvoices: jest.fn(),
}))

const mockedGetDashboardSummary = getDashboardSummary as jest.Mock
const mockedGetOverdueInvoices = getOverdueInvoices as jest.Mock

describe('ProcurementDashboardPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedGetDashboardSummary.mockResolvedValue({
            activeContractCount: 2,
            activeRenewalCount: 1,
            expiringContractCount: 1,
            expiringContracts: [{
                autoRenew: false,
                contractNumber: 'MSA-001',
                createdAt: '2026-01-01T00:00:00.000Z',
                endDate: '2026-07-15T00:00:00.000Z',
                id: 'contract-1',
                lifecycle: 'expiring',
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
            }],
            overdueInvoiceCount: 1,
            overdueInvoiceTotal: 300,
            pendingInvoiceCount: 2,
            pendingInvoiceTotal: 500,
            vendorCount: 3,
        })
        mockedGetOverdueInvoices.mockResolvedValue([{
            amount: 300,
            createdAt: '2026-01-01T00:00:00.000Z',
            dueDate: '2026-01-10T00:00:00.000Z',
            id: 'invoice-1',
            invoiceDate: '2026-01-01T00:00:00.000Z',
            invoiceNumber: 'INV-001',
            paymentState: 'overdue',
            status: 'issued',
            updatedAt: '2026-01-02T00:00:00.000Z',
            vendor: {
                id: 'vendor-1',
                name: 'Acme Software',
            },
            vendorId: 'vendor-1',
        }])
    })

    it('renders dashboard cards and urgent tables', async () => {
        render(<ProcurementDashboardPage />)

        expect(await screen.findByText('Active contracts'))
            .toBeTruthy()
        expect(screen.getByText('Pending invoices'))
            .toBeTruthy()
        expect(screen.getByText('$500.00'))
            .toBeTruthy()
        expect(screen.getByText('MSA-001'))
            .toBeTruthy()
        expect(screen.getByText('INV-001'))
            .toBeTruthy()
        expect(mockedGetDashboardSummary)
            .toHaveBeenCalledTimes(1)
        expect(mockedGetOverdueInvoices)
            .toHaveBeenCalledTimes(1)
    })
})
