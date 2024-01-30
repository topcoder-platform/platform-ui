/* eslint-disable ordered-imports/ordered-imports */

import { AxiosError } from 'axios'

import { EnvironmentConfig } from '~/config'
import { xhrDeleteAsync, xhrGetAsync, xhrPatchAsync, xhrPostAsync, xhrPostAsyncWithBlobHandling } from '~/libs/core'

import { getAsyncWithBlobHandling } from '~/libs/core/lib/xhr/xhr-functions/xhr.functions'
import { WalletDetails } from '../models/WalletDetails'
import { PaymentProvider } from '../models/PaymentProvider'
import { WinningDetail } from '../models/WinningDetail'
import { TaxForm } from '../models/TaxForm'
import { OtpVerificationResponse } from '../models/OtpVerificationResponse'
import { TransactionResponse } from '../models/TransactionId'
import ApiResponse from '../models/ApiResponse'

const baseUrl = `${EnvironmentConfig.API.V5}/payments`

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

export async function getPayments(userId: string): Promise<WinningDetail[]> {
    const body = JSON.stringify({
        winnerId: userId,
    })

    const url = `${baseUrl}/user/winnings`
    const response = await xhrPostAsync<string, ApiResponse<WinningDetail[]>>(url, body)

    if (response.status === 'error') {
        throw new Error('Error fetching payments')
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

export async function processPayments(paymentIds: string[]): Promise<{ processed: boolean }> {
    const body = JSON.stringify({
        paymentIds,
    })
    const url = `${baseUrl}/withdraw`
    const response = await xhrPostAsync<string, ApiResponse<{ processed: boolean }>>(url, body)

    if (response.status === 'error') {
        throw new Error('Error processing payments')
    }

    return response.data
}

// eslint-disable-next-line max-len
export async function verifyOtp(transactionId: string, code: string, blob: boolean = false): Promise<OtpVerificationResponse | Blob> {
    const body = JSON.stringify({
        otpCode: code,
        transactionId,
    })

    const url = `${baseUrl}/otp/verify`
    try {
        // eslint-disable-next-line max-len
        const response = await xhrPostAsyncWithBlobHandling<string, ApiResponse<OtpVerificationResponse> | Blob>(url, body, {
            responseType: blob ? 'blob' : 'json',
        })

        if (response instanceof Blob) {
            return response as Blob
        }

        if (response.status === 'error') {
            throw new Error('OTP verification failed or OTP has expired')
        }

        return response.data
    } catch (err) {
        throw new Error('OTP verification failed or OTP has expired')
    }
}

export async function resendOtp(transactionId: string): Promise<TransactionResponse> {
    const body = JSON.stringify({
        transactionId,
    })

    const url = `${baseUrl}/otp/resend`
    try {
        const response = await xhrPostAsync<string, ApiResponse<TransactionResponse>>(url, body)

        if (response.status === 'error') {
            throw new Error('Failed to resend OTP.')
        }

        return response.data
    } catch (err) {
        if (err instanceof AxiosError && err.response?.data?.error !== undefined) {
            throw new Error(err.response.data.error?.message)
        }

        throw new Error('Failed to resend OTP.')
    }
}

export async function fetchTaxForms(pageNumber: number, pageSize: number, userIds: string[]): Promise<any> {
    const body = JSON.stringify({
        pageNumber,
        pageSize,
        userIds,
    })

    try {
        const response = await xhrPostAsync<string, ApiResponse<any>>(`${baseUrl}/admin/tax-forms`, body)

        if (response.status === 'error') {
            throw new Error('Error fetching tax forms')
        }

        return response.data
    } catch (err) {
        throw new Error('Error fetching tax forms')
    }
}

export async function fetchPaymentProviders(pageNumber: number, pageSize: number, userIds: string[]): Promise<any> {
    const body = JSON.stringify({
        pageNumber,
        pageSize,
        userIds,
    })

    try {
        const response = await xhrPostAsync<string, ApiResponse<any>>(`${baseUrl}/admin/payment-methods`, body)

        if (response.status === 'error') {
            throw new Error('Error fetching tax forms')
        }

        return response.data
    } catch (err) {
        throw new Error('Error fetching tax forms')
    }
}

export async function fetchPaymentProviderDetail(userId: string, paymentProviderId: string): Promise<any> {
    const url = `${baseUrl}/admin/payment-methods/${userId}/${paymentProviderId}`
    try {
        const response = await xhrGetAsync<ApiResponse<any>>(url)

        if (response.status === 'error') {
            throw new Error('Error fetching tax forms')
        }

        return response.data
    } catch (err) {
        throw new Error('Error fetching tax forms')
    }
}

export async function deletePaymentProvider(userId: string, paymentProviderId: string): Promise<any> {
    const url = `${baseUrl}/admin/payment-methods/${userId}/${paymentProviderId}`
    try {
        const response = await xhrDeleteAsync<ApiResponse<any>>(url)

        if (response.status === 'error') {
            throw new Error('Error fetching tax forms')
        }

        return response.data
    } catch (err) {
        throw new Error('Error fetching tax forms')
    }
}

export async function fetchTaxFormDetail(userId: string, taxFormId: string): Promise<any> {
    const url = `${baseUrl}/admin/tax-forms/${userId}/${taxFormId}/download`
    try {
        const response = await getAsyncWithBlobHandling<ApiResponse<any>>(url)

        console.log('Response', response)

        return response
    } catch (err) {
        throw new Error('Error fetching tax forms')
    }
}

export async function deleteTaxForm(userId: string, taxFormId: string): Promise<any> {
    const url = `${baseUrl}/admin/tax-forms/${userId}/${taxFormId}`
    try {
        const response = await xhrDeleteAsync<ApiResponse<any>>(url)

        if (response.status === 'error') {
            throw new Error('Error fetching tax forms')
        }

        return response.data
    } catch (err) {
        throw new Error('Error fetching tax forms')
    }
}

export async function searchWinnings(pageNumber: number, pageSize: number, filters: any): Promise<unknown> {
    const body = JSON.stringify({
        externalIds: filters.externalIds,
        winnerId: filters.winnerId,
    })

    try {
        const response = await xhrPostAsync<string, ApiResponse<any>>(`${baseUrl}/admin/winnings/search`, body)

        if (response.status === 'error') {
            throw new Error('Error fetching tax forms')
        }

        return response.data
    } catch (err) {
        throw new Error('Error fetching tax forms')
    }
}

export async function editWinningRecord(winningId: string, paymentId: string, status: string): Promise<unknown> {
    const body = JSON.stringify({
        paymentId,
        paymentStatus: status,
        winningsId: winningId,
    })

    try {
        const response = await xhrPatchAsync<string, ApiResponse<any>>(`${baseUrl}/admin/winnings`, body)

        if (response.status === 'error') {
            throw new Error('Error updating payment record')
        }

        return response.data
    } catch (err) {
        throw new Error('Error updating payment record')
    }
}
