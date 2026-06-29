import { Contract } from './contract.model'

/**
 * Summary response returned by the procurement dashboard endpoint.
 */
export interface DashboardSummary {
    activeContractCount: number
    activeRenewalCount: number
    expiringContractCount: number
    expiringContracts: Contract[]
    overdueInvoiceCount: number
    overdueInvoiceTotal: number
    pendingInvoiceCount: number
    pendingInvoiceTotal: number
    vendorCount: number
}
