import moment from 'moment'

import { TABLE_DATE_FORMAT } from '../../config/index.config'

import { ClientInfo } from './ClientInfo.model'

/**
 * Model for billing account info
 */
export interface BillingAccount {
    id: number
    name: string
    status: string
    startDate: Date
    startDateString: string
    endDate: Date
    endDateString: string
    companyId: number
    budgetAmount?: number
    poNumber: string
    subscriptionNumber?: string
    description: string
    paymentTerms?: string
    clientId: number
    client?: ClientInfo
    salesTax: number
}

/**
 * Update billing account to show in ui
 * @param data data from backend response
 * @returns updated data
 */
export function adjustBillingAccountResponse(
    data: BillingAccount,
): BillingAccount {
    const startDate = data.startDate ? new Date(data.startDate) : data.startDate
    const endDate = data.endDate ? new Date(data.endDate) : data.endDate
    const budgetAmount = (data as unknown as any).budget !== undefined && (data as unknown as any).budget !== null
        ? Number((data as unknown as any).budget)
        : (data as unknown as any).budgetAmount
    // companyId on UI corresponds to client's codeName (customer number)
    const derivedCompanyId = (data as unknown as any).companyId !== undefined
        ? (data as unknown as any).companyId
        : (data.client && (data.client as any).codeName
            ? Number.parseInt((data.client as any).codeName, 10)
            : (undefined as unknown as number | undefined))
    return {
        ...data,
        budgetAmount,
        companyId: derivedCompanyId as any,
        endDate,
        endDateString: data.endDate
            ? moment(data.endDate)
                .local()
                .format(TABLE_DATE_FORMAT)
            : data.endDate,
        startDate,
        startDateString: data.startDate
            ? moment(data.startDate)
                .local()
                .format(TABLE_DATE_FORMAT)
            : data.startDate,
        status: data.status
            ? data.status.toString()
                .toUpperCase()
            : data.status,
    }
}
