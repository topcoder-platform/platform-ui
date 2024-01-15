import { AxiosError } from 'axios'

import { EnvironmentConfig } from '~/config'
import { xhrDeleteAsync, xhrGetAsync, xhrPostAsync, xhrPostAsyncWithBlobHandling } from '~/libs/core'

import { WalletDetails } from '../models/WalletDetails'
import { PaymentProvider, SetPaymentProviderResponse } from '../models/PaymentProvider'
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
    details: any,
    type: string,
    setDefault: boolean,
): Promise<SetPaymentProviderResponse> {
    const body = JSON.stringify({
        details,
        setDefault,
        type,
    })

    const url = `${baseUrl}/user/payment-method`
    const response = await xhrPostAsync<string, ApiResponse<SetPaymentProviderResponse>>(url, body)

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
    const url = `${baseUrl}/user/tax-form/esign-url`
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
