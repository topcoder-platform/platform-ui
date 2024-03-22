import { EnvironmentConfig } from '~/config'
import { xhrDeleteAsync, xhrGetAsync, xhrPatchAsync, xhrPostAsync } from '~/libs/core'
import { getAsyncWithBlobHandling } from '~/libs/core/lib/xhr/xhr-functions/xhr.functions'

import { WalletDetails } from '../models/WalletDetails'
import { PaymentProvider } from '../models/PaymentProvider'
import { WinningDetail } from '../models/WinningDetail'
import { TaxForm } from '../models/TaxForm'
import { TransactionResponse } from '../models/TransactionId'
import { PaginationInfo } from '../models/PaginationInfo'
import { WinningsAudit } from '../models/WinningsAudit'
import ApiResponse from '../models/ApiResponse'

const baseUrl = `${EnvironmentConfig.API.V5}/payments`
const memberApiBaseUrl = `${EnvironmentConfig.API.V5}/members`

export async function getWalletDetails(): Promise<WalletDetails> {
    const response = await xhrGetAsync<ApiResponse<WalletDetails>>(`${baseUrl}/wallet`)

    if (response.status === 'error') {
        throw new Error('Error fetching wallet details')
    }

    return response.data
}

export async function getUserPaymentProviders(): Promise<PaymentProvider[]> {
    const response = await xhrGetAsync<ApiResponse<PaymentProvider[]>>(`${baseUrl}/user/payment-methods`)

    if (response.status === 'error') {
        throw new Error('Error fetching user payment providers')
    }

    return response.data
}

export async function getUserTaxFormDetails(): Promise<TaxForm[]> {
    const response = await xhrGetAsync<ApiResponse<TaxForm[]>>(`${baseUrl}/user/tax-forms`)
    if (response.status === 'error') {
        throw new Error('Error fetching user tax form details')
    }

    return response.data
}

export async function fetchAuditLogs(paymentId: string): Promise<WinningsAudit[]> {
    const response = await xhrGetAsync<ApiResponse<WinningsAudit[]>>(`${baseUrl}/admin/winnings/${paymentId}/audit`)

    if (response.status === 'error') {
        throw new Error('Error fetching audit logs')
    }

    return response.data

}

export async function editPayment(updates: {
    winningsId: string,
    paymentStatus?: 'ON_HOLD_ADMIN' | 'OWED' | 'CANCELLED',
    paymentAmount?: number,
    releaseDate?: string,
}): Promise<string> {
    const body = JSON.stringify(updates)
    const url = `${baseUrl}/admin/winnings`

    const response = await xhrPatchAsync<string, ApiResponse<string>>(url, body)

    if (response.status === 'error') {
        throw new Error('Error editing payment')
    }

    return response.data
}

export async function getTaxForms(limit: number, offset: number, userIds: string[]): Promise<{
    forms: TaxForm[],
    pagination: PaginationInfo
}> {
    const body = JSON.stringify({
        limit,
        offset,
        userIds,
    })

    const url = `${baseUrl}/admin/tax-forms`
    const response = await xhrPostAsync<string, ApiResponse<{
        forms: TaxForm[],
        pagination: PaginationInfo
    }>>(url, body)

    if (response.status === 'error') {
        throw new Error('Error fetching tax forms')
    }

    return response.data
}

export async function downloadTaxForm(userId: string, taxFormId: string): Promise<Blob> {
    const url = `${baseUrl}/admin/tax-forms/${userId}/${taxFormId}/download`
    try {
        return await getAsyncWithBlobHandling<Blob>(url)
    } catch (err) {
        throw new Error('Failed to download users tax-form.')
    }
}

export async function deleteTaxForm(userId: string, taxFormId: string): Promise<void> {
    const url = `${baseUrl}/admin/tax-forms/${userId}/${taxFormId}`
    try {
        return await xhrDeleteAsync(url)
    } catch (err) {
        throw new Error('Failed to delete users tax-form')
    }
}

// eslint-disable-next-line max-len
export async function getPayments(limit: number, offset: number, filters: Record<string, string[]>): Promise<{
    winnings: WinningDetail[],
    pagination: PaginationInfo
}> {
    const filteredFilters: Record<string, string> = {}

    for (const key in filters) {
        if (filters[key].length > 0 && key !== 'pageSize') {
            filteredFilters[key] = filters[key][0]
        }
    }

    const payload: {
        limit: number, offset: number, winnerIds?: string[], [key: string]: string | number | string[] | undefined
    } = {
        limit,
        offset,
        ...filteredFilters,
    }

    if (filters.winnerIds && filters.winnerIds.length > 0) {
        payload.winnerIds = filters.winnerIds
    }

    const body = JSON.stringify(payload)

    const url = `${baseUrl}/admin/winnings/search`
    const response = await xhrPostAsync<string, ApiResponse<{
        winnings: WinningDetail[],
        pagination: PaginationInfo
    }>>(url, body)

    if (response.status === 'error') {
        throw new Error('Error fetching payments')
    }

    if (response.data.winnings === null || response.data.winnings === undefined) {
        response.data.winnings = []
    }

    return response.data
}

export async function setPaymentProvider(
    type: string,
): Promise<TransactionResponse> {
    const body = JSON.stringify({
        details: {},
        setDefault: true,
        type,
    })

    const url = `${baseUrl}/user/payment-method`
    const response = await xhrPostAsync<string, ApiResponse<TransactionResponse>>(url, body)

    if (response.status === 'error') {
        throw new Error('Error setting payment provider')
    }

    return response.data
}

export async function confirmPaymentProvider(provider: string, code: string, transactionId: string): Promise<string> {
    const body = JSON.stringify({
        code,
        provider,
        transactionId,
    })

    const url = `${baseUrl}/payment-provider/paypal/confirm`
    const response = await xhrPostAsync<string, ApiResponse<string>>(url, body)

    if (response.status === 'error') {
        throw new Error('Error confirming payment provider')
    }

    return response.data
}

export async function getPaymentProviderRegistrationLink(type: string): Promise<TransactionResponse> {
    const url = `${baseUrl}/user/payment-method/${type}/registration-link`
    const response = await xhrGetAsync<ApiResponse<TransactionResponse>>(url)

    if (response.status === 'error') {
        throw new Error('Error getting payment provider registration link')
    }

    return response.data
}

export async function removePaymentProvider(type: string): Promise<TransactionResponse> {
    const url = `${baseUrl}/user/payment-method/${type}`
    const response = await xhrDeleteAsync<ApiResponse<TransactionResponse>>(url)

    if (response.status === 'error') {
        throw new Error('Error getting payment provider registration link')
    }

    return response.data
}

export async function setupTaxForm(userId: string, taxForm: string): Promise<TransactionResponse> {
    const body = JSON.stringify({
        taxForm,
        userId,
    })

    const url = `${baseUrl}/user/tax-form`
    const response = await xhrPostAsync<string, ApiResponse<TransactionResponse>>(url, body)

    if (response.status === 'error') {
        throw new Error('Error setting tax form')
    }

    return response.data
}

export async function removeTaxForm(taxFormId: string): Promise<TransactionResponse> {
    const url = `${baseUrl}/user/tax-forms/${taxFormId}`
    const response = await xhrDeleteAsync<ApiResponse<TransactionResponse>>(url)

    if (response.status === 'error') {
        throw new Error('Error removing tax form')
    }

    return response.data
}

export async function getRecipientViewURL(): Promise<TransactionResponse> {
    const url = `${baseUrl}/user/tax-form/view`
    const response = await xhrGetAsync<ApiResponse<TransactionResponse>>(url)

    if (response.status === 'error') {
        throw new Error('Error removing tax form')
    }

    return response.data
}

export async function getMemberHandle(userIds: string[]): Promise<Map<number, string>> {
    const url = `${memberApiBaseUrl}?userIds=[${userIds.join(',')}]&fields=handle,userId`
    const response = await xhrGetAsync<{ handle: string, userId: number }[]>(url)

    const handleMap = new Map<number, string>()

    response.forEach(member => {
        handleMap.set(member.userId, member.handle)
    })

    return handleMap
}
