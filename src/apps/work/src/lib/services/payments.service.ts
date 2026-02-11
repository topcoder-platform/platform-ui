import {
    xhrGetAsync,
    xhrPostAsync,
} from '~/libs/core'

import {
    TC_FINANCE_API_URL,
} from '../constants'
import {
    AssignmentPayment,
} from '../models'

const DEFAULT_ENGAGEMENT_PAYMENT_STATUS = 'ON_HOLD_ADMIN'

interface PaymentDetailsPayload {
    billingAccount: string
    challengeFee: number
    currency: string
    grossAmount: number
    installmentNumber: number
    totalAmount: number
}

interface MemberPaymentPayload {
    attributes: {
        agreementRate?: number | string
        assignmentId: number | string
        memberHandle: string
        remarks: string
    }
    category: string
    description: string
    details: PaymentDetailsPayload[]
    externalId: string
    origin: string
    status: string
    title: string
    type: string
    winnerId: string
}

interface PaymentsByAssignmentResponse {
    data?: AssignmentPayment[]
    result?: AssignmentPayment[]
}

function normalizeError(error: unknown, fallbackMessage: string): Error {
    const typedError = error as {
        message?: string
        response?: {
            data?: {
                message?: string
            }
        }
    }

    const message = typedError?.response?.data?.message
        || typedError?.message
        || fallbackMessage

    return new Error(message)
}

function normalizePaymentsResponse(response: unknown): AssignmentPayment[] {
    if (Array.isArray(response)) {
        return response
    }

    if (typeof response === 'object' && response) {
        const typedResponse = response as PaymentsByAssignmentResponse

        if (Array.isArray(typedResponse.data)) {
            return typedResponse.data
        }

        if (Array.isArray(typedResponse.result)) {
            return typedResponse.result
        }

        const nestedData = (typedResponse as {
            data?: {
                data?: AssignmentPayment[]
            }
        }).data?.data

        if (Array.isArray(nestedData)) {
            return nestedData
        }
    }

    return []
}

export async function createMemberPayment(
    assignmentId: number | string,
    memberId: number | string,
    memberHandle: string,
    title: string,
    remarks: string,
    rate: number | string,
    amount: number | string,
    billingAccountId: number | string,
): Promise<AssignmentPayment> {
    const numericAmount = Number(amount)

    const payload: MemberPaymentPayload = {
        attributes: {
            agreementRate: rate,
            assignmentId,
            memberHandle,
            remarks: remarks.trim(),
        },
        category: 'ENGAGEMENT_PAYMENT',
        description: title.trim(),
        details: [
            {
                billingAccount: String(billingAccountId),
                challengeFee: 0,
                currency: 'USD',
                grossAmount: numericAmount,
                installmentNumber: 1,
                totalAmount: numericAmount,
            },
        ],
        externalId: String(assignmentId),
        origin: 'Topcoder',
        status: DEFAULT_ENGAGEMENT_PAYMENT_STATUS,
        title: title.trim(),
        type: 'PAYMENT',
        winnerId: String(memberId),
    }

    try {
        return xhrPostAsync<MemberPaymentPayload, AssignmentPayment>(
            `${TC_FINANCE_API_URL}/winnings`,
            payload,
        )
    } catch (error) {
        throw normalizeError(error, 'Failed to create payment')
    }
}

export async function fetchAssignmentPayments(
    assignmentId: number | string,
): Promise<AssignmentPayment[]> {
    try {
        const response = await xhrGetAsync<unknown>(
            `${TC_FINANCE_API_URL}/winnings/by-external-id/${assignmentId}`,
        )

        return normalizePaymentsResponse(response)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch payment history')
    }
}

export async function createPayment(
    paymentData: Record<string, unknown>,
): Promise<AssignmentPayment> {
    try {
        return await xhrPostAsync<Record<string, unknown>, AssignmentPayment>(
            `${TC_FINANCE_API_URL}/winnings`,
            paymentData,
        )
    } catch (error) {
        throw normalizeError(error, 'Failed to create payment')
    }
}

export async function getPaymentsByAssignmentId(
    assignmentId: number | string,
): Promise<AssignmentPayment[]> {
    return fetchAssignmentPayments(assignmentId)
}
