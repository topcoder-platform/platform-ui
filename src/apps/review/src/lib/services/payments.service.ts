/**
 * Payments service (read-only for winnings lookup by challenge).
 */
import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

const financeApiBaseUrl = `${EnvironmentConfig.TC_FINANCE_API}`
const memberApiBaseUrl = `${EnvironmentConfig.API.V6}/members`

export interface PaymentDetailDto {
    id: string
    netAmount: string
    grossAmount: string
    totalAmount: string
    installmentNumber: number
    status: string
    currency: string
    datePaid: string | null
}

export interface WinningDetailDto {
    id: string
    winnerId: string
    description: string
    externalId: string
    category: string
    details: PaymentDetailDto[]
    createdAt: string
    releaseDate: string
}

export interface WinningsSearchResponse {
    winnings: WinningDetailDto[]
    pagination: { totalItems: number, totalPages: number, pageSize: number, currentPage: number }
}

/**
 * Fetch winnings (payments) by challenge externalId.
 */
export async function fetchWinningsByExternalId(challengeId: string): Promise<WinningDetailDto[]> {
    const url = `${financeApiBaseUrl}/challenge-payments/${challengeId}`
    const response = await xhrGetAsync<{ winnings: WinningDetailDto[] }>(url)
    return response.winnings || []
}

/**
 * Fetch mapping of userId -> handle for a list of user ids.
 */
export async function fetchMemberHandles(userIds: string[]): Promise<Map<number, string>> {
    const handleMap = new Map<number, string>()
    if (!userIds.length) return handleMap

    const BATCH_SIZE = 50
    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
        // eslint-disable-next-line no-await-in-loop
        const batch = userIds.slice(i, i + BATCH_SIZE)
        const url = `${memberApiBaseUrl}?userIds=[${batch.join(',')}]&fields=handle,userId`
        // eslint-disable-next-line no-await-in-loop
        const members = await xhrGetAsync<Array<{ handle: string, userId: number }>>(url)
        members.forEach(m => handleMap.set(m.userId, m.handle))
    }

    return handleMap
}
