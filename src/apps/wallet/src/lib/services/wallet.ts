/* eslint-disable camelcase */
import { AxiosError } from 'axios'

import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrPostAsync, xhrPostAsyncWithBlobHandling } from '~/libs/core'

import { WalletDetails } from '../models/WalletDetails'
import { WinningDetail, WinningsType } from '../models/WinningDetail'
import { OtpVerificationResponse } from '../models/OtpVerificationResponse'
import { TransactionResponse } from '../models/TransactionId'
import { PaginationInfo } from '../models/PaginationInfo'
import ApiResponse from '../models/ApiResponse'

export const WALLET_API_BASE_URL = `${EnvironmentConfig.TC_FINANCE_API}`

export async function getWalletDetails(): Promise<WalletDetails> {
    const response = await xhrGetAsync<ApiResponse<WalletDetails>>(`${WALLET_API_BASE_URL}/wallet`)

    if (response.status === 'error') {
        throw new Error('Error fetching wallet details')
    }

    return response.data
}

// eslint-disable-next-line max-len
export async function fetchUserWinnings(
    userId: string,
    type: WinningsType,
    limit: number,
    offset: number,
    filters: Record<string, string[]>,
): Promise<{
    winnings: WinningDetail[],
    pagination: PaginationInfo
}> {
    const filteredFilters: Record<string, string> = {}

    for (const key in filters) {
        if (filters[key].length > 0 && key !== 'pageSize' && filters[key][0]) {
            filteredFilters[key] = filters[key][0]
        }
    }

    const body = JSON.stringify({
        limit,
        offset,
        winnerId: userId,
        ...filteredFilters,
        type,
    })

    const url = `${WALLET_API_BASE_URL}/user/winnings`
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

export const getPayments = async (
    userId: string,
    limit: number,
    offset: number,
    filters: Record<string, string[]>,
): Promise<{
    winnings: WinningDetail[],
    pagination: PaginationInfo
}> => fetchUserWinnings(
    userId,
    WinningsType.PAYMENT,
    limit,
    offset,
    filters,
)

export const getPoints = async (
    userId: string,
    limit: number,
    offset: number,
    filters: Record<string, string[]>,
): Promise<{
    winnings: WinningDetail[],
    pagination: PaginationInfo
}> => fetchUserWinnings(
    userId,
    WinningsType.POINTS,
    limit,
    offset,
    filters,
)

export async function processWinningsPayments(
    winningsIds: string[],
    otpCode?: string,
): Promise<{ processed: boolean }> {
    const body = JSON.stringify({
        otpCode,
        winningsIds,
    })
    const url = `${WALLET_API_BASE_URL}/withdraw`
    const response = await xhrPostAsync<string, ApiResponse<{ processed: boolean }>>(url, body)

    if (response.status === 'error' && response.error?.code?.startsWith('otp_')) {
        throw response.error
    }

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

    const url = `${WALLET_API_BASE_URL}/otp/verify`
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

    const url = `${WALLET_API_BASE_URL}/otp/resend`
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

/**
 * Fetches the Trolley portal link from the server.
 *
 * @returns {Promise<string>} A promise that resolves to the Trolley portal link.
 * @throws {Error} If the response does not contain a valid link.
 */
export async function getTrolleyPortalLink(): Promise<string> {
    const url = `${WALLET_API_BASE_URL}/trolley/portal-link`
    const response = await xhrGetAsync<{ link: string }>(url)

    if (!response.link) {
        throw new Error('Error fetching Trolley portal link')
    }

    return response.link
}
