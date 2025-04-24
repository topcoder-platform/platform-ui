/* eslint-disable camelcase */
import { AxiosError } from 'axios'

import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrPostAsync, xhrPostAsyncWithBlobHandling } from '~/libs/core'

import { WalletDetails } from '../models/WalletDetails'
import { WinningDetail } from '../models/WinningDetail'
import { OtpVerificationResponse } from '../models/OtpVerificationResponse'
import { TransactionResponse } from '../models/TransactionId'
import { PaginationInfo } from '../models/PaginationInfo'
import ApiResponse from '../models/ApiResponse'

const baseUrl = `${EnvironmentConfig.TC_FINANCE_API}`

export async function getWalletDetails(): Promise<WalletDetails> {
    const response = await xhrGetAsync<ApiResponse<WalletDetails>>(`${baseUrl}/wallet`)

    if (response.status === 'error') {
        throw new Error('Error fetching wallet details')
    }

    return response.data
}

// eslint-disable-next-line max-len
export async function getPayments(userId: string, limit: number, offset: number, filters: Record<string, string[]>): Promise<{
    winnings: WinningDetail[],
    pagination: PaginationInfo
}> {
    const filteredFilters: Record<string, string> = {}

    for (const key in filters) {
        if (filters[key].length > 0 && key !== 'pageSize') {
            filteredFilters[key] = filters[key][0]
        }
    }

    const body = JSON.stringify({
        limit,
        offset,
        winnerId: userId,
        ...filteredFilters,
    })

    const url = `${baseUrl}/user/winnings`
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
