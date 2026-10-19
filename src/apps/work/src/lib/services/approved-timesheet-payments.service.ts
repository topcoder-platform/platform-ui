import { ApprovedTimesheetRow } from '../models'
import {
    buildApprovedTimesheetPaymentTitle,
    getApprovedTimesheetPaymentAmount,
} from '../utils/approved-timesheet.utils'
import {
    getProjectBillingAccountEngagementPaymentErrorMessage,
    getProjectBillingAccountEngagementPaymentIssue,
} from '../utils/project-billing-account.utils'

import { linkTimesheetEntriesToPayment } from './engagements.service'
import {
    createMemberPayment,
    getPaymentReference,
} from './payments.service'
import {
    fetchProjectBillingAccount,
    FetchProjectBillingAccountResponse,
} from './projects.service'

/**
 * What happened to one selected row:
 * - `paid`: the payment exists and its entries are marked paid.
 * - `unlinked`: the payment exists, but its entries could not be marked paid and need reconciling.
 * - `failed`: no payment was created.
 */
export type ApprovedTimesheetPaymentStatus = 'failed' | 'paid' | 'unlinked'

export interface ApprovedTimesheetPaymentResult {
    message?: string
    paymentReference?: string
    row: ApprovedTimesheetRow
    status: ApprovedTimesheetPaymentStatus
}

/**
 * Resolves the billing account to charge for a project, or the reason a payment cannot be made.
 */
interface BillingAccountResolution {
    billingAccountId?: number | string
    error?: string
}

async function resolveBillingAccount(
    projectId: string,
): Promise<BillingAccountResolution> {
    try {
        const { billingAccount }: FetchProjectBillingAccountResponse = await fetchProjectBillingAccount(projectId)
        const issue = getProjectBillingAccountEngagementPaymentIssue(billingAccount)

        if (issue) {
            return { error: getProjectBillingAccountEngagementPaymentErrorMessage(issue) }
        }

        return billingAccount?.id
            ? { billingAccountId: billingAccount.id }
            : { error: 'Billing account is required to create payment' }
    } catch (error) {
        return {
            error: error instanceof Error
                ? error.message
                : 'Failed to load the project billing account',
        }
    }
}

async function payRow(
    row: ApprovedTimesheetRow,
    remarks: string,
    billingAccountId: number | string,
): Promise<ApprovedTimesheetPaymentResult> {
    const amount = getApprovedTimesheetPaymentAmount(row)

    if (amount === undefined) {
        return {
            message: 'The assignment has no hourly rate to calculate the payment amount from',
            row,
            status: 'failed',
        }
    }

    if (!row.assigneeId) {
        return { message: 'Member ID is required to create payment', row, status: 'failed' }
    }

    let paymentReference: string | undefined

    try {
        const payment = await createMemberPayment(
            row.assignmentId,
            row.assigneeId,
            row.assigneeHandle,
            buildApprovedTimesheetPaymentTitle(row),
            remarks,
            row.agreementRate ?? '',
            amount,
            row.hours,
            billingAccountId,
            row.entryIds,
        )
        paymentReference = getPaymentReference(payment)
    } catch (error) {
        return {
            message: error instanceof Error ? error.message : 'Failed to create payment',
            row,
            status: 'failed',
        }
    }

    // Linked after the payment exists, as on the Assignees page: a failed link leaves a real payment
    // with unmarked entries, which is recoverable, where marking first could strand approved hours.
    if (!paymentReference) {
        return {
            message: 'The payment returned no identifier, so its entries could not be marked as paid',
            row,
            status: 'unlinked',
        }
    }

    try {
        await linkTimesheetEntriesToPayment(
            row.engagementId,
            row.assignmentId,
            row.entryIds,
            paymentReference,
        )
    } catch (error) {
        return {
            message: error instanceof Error ? error.message : undefined,
            paymentReference,
            row,
            status: 'unlinked',
        }
    }

    return { paymentReference, row, status: 'paid' }
}

/**
 * Creates one payment per selected approval, the same way the Assignees page does: the payment goes
 * to finance first, then its entries are marked paid. Rows are paid one at a time so a failure on one
 * row never leaves the others in an unknown state, and each project's billing account is loaded once.
 */
export async function createApprovedTimesheetPayments(
    rows: ApprovedTimesheetRow[],
    remarks: string,
): Promise<ApprovedTimesheetPaymentResult[]> {
    const billingAccounts = new Map<string, BillingAccountResolution>()
    const results: ApprovedTimesheetPaymentResult[] = []

    for (const row of rows) {
        let billingAccount = billingAccounts.get(row.projectId)

        if (!billingAccount) {
            // eslint-disable-next-line no-await-in-loop
            billingAccount = await resolveBillingAccount(row.projectId)
            billingAccounts.set(row.projectId, billingAccount)
        }

        results.push(
            billingAccount.billingAccountId
                // eslint-disable-next-line no-await-in-loop
                ? await payRow(row, remarks, billingAccount.billingAccountId)
                : { message: billingAccount.error, row, status: 'failed' },
        )
    }

    return results
}
