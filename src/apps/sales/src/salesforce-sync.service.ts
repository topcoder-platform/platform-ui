import { EnvironmentConfig } from '~/config'
import { xhrPostAsync } from '~/libs/core'

/** Outcome for every local record scanned by the administrator metadata sync. */
export interface SalesforceSyncCounts {
    scanned: number
    updated: number
    unchanged: number
    unmatched: number
    conflicted: number
}

/** Returned only after the database transaction has committed. */
export interface SalesforceSyncResult {
    clients: SalesforceSyncCounts
    billingAccounts: SalesforceSyncCounts
}

/**
 * Syncs all existing client and billing-account metadata through the Billing Accounts API.
 * The shared XHR client attaches the signed-in user's JWT; no Salesforce credentials reach the browser.
 * @returns Counts for both models after the sync commits.
 * @throws Propagates authorization, concurrent-sync, upstream and database failures.
 */
export function syncSalesforceData(): Promise<SalesforceSyncResult> {
    return xhrPostAsync<undefined, SalesforceSyncResult>(
        `${EnvironmentConfig.API.V6}/billing-accounts/salesforce-sync`,
        undefined,
        { timeout: 360000 },
    )
}

/**
 * Gives sync-specific recovery guidance without exposing server error details.
 * @param error Unknown XHR rejection.
 * @returns Message shown near the Sync SF Data action. Does not throw.
 */
export function salesforceSyncErrorMessage(error: unknown): string {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status === 401) return 'Your session has expired. Sign in again to sync Salesforce data.'
    if (status === 403) return 'Only Administrators can sync Salesforce data.'
    if (status === 409) return 'A Salesforce sync is already running. Wait for it to finish before trying again.'
    if (status === 503) return 'Salesforce sync is not configured. Contact your administrator.'
    return 'We could not confirm the Salesforce sync completed. Refresh the page and try again.'
}
