import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrPostAsync } from '~/libs/core'

import { WalletDetails } from '../models/WalletDetails'
import { PaymentProvider, SetPaymentProviderResponse } from '../models/PaymentProvider'
import { ApiError } from '../models/ApiError'
import { WinningDetail } from '../models/WinningDetail'
import { SetupTaxFormResponse, TaxForm } from '../models/TaxForm'
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

export async function setupTaxForm(userId: string, taxForm: string): Promise<SetupTaxFormResponse> {
    const body = JSON.stringify({
        taxForm,
        userId,
    })

    const url = `${baseUrl}/user/tax-form`
    const response = await xhrPostAsync<string, ApiResponse<SetupTaxFormResponse>>(url, body)

    if (response.status === 'error') {
        throw new Error('Error setting tax form')
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

export async function verifyOtp(transactionId: string, code: string): Promise<void> {
    const body = JSON.stringify({
        otpCode: code,
        transactionId,
    })

    const url = `${baseUrl}/otp/verify`
    try {
        const response = await xhrPostAsync<string, ApiResponse<ApiError>>(url, body)

        if (response.status === 'error') {
            throw new Error('OTP verification failed or OTP has expired')
        }
    } catch (err) {
        throw new Error('OTP verification failed or OTP has expired')
    }
}
