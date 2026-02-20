import {
    FC,
    useMemo,
} from 'react'
import { Link } from 'react-router-dom'

import {
    useFetchBillingAccounts,
    useFetchProjectBillingAccount,
} from '../../hooks'
import type {
    UseFetchBillingAccountsResult,
    UseFetchProjectBillingAccountResult,
} from '../../hooks'

import styles from './ProjectBillingAccountExpiredNotice.module.scss'

interface ProjectBillingAccountExpiredNoticeProps {
    billingAccountId?: number | string
    billingAccountName?: string
    projectId: string
}

function normalizeOptionalString(value: unknown): string | undefined {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalizedValue = String(value)
        .trim()

    return normalizedValue || undefined
}

function isBillingAccountExpired(
    active: boolean | undefined,
    endDate: string | undefined,
): boolean {
    if (active === false) {
        return true
    }

    if (!endDate) {
        return false
    }

    const endDateTimestamp = Date.parse(endDate)
    if (Number.isNaN(endDateTimestamp)) {
        return false
    }

    return Date.now() >= endDateTimestamp
}

export const ProjectBillingAccountExpiredNotice: FC<ProjectBillingAccountExpiredNoticeProps> = (
    props: ProjectBillingAccountExpiredNoticeProps,
) => {
    const projectBillingAccountResult: UseFetchProjectBillingAccountResult = useFetchProjectBillingAccount(
        props.projectId,
    )
    const billingAccountsResult: UseFetchBillingAccountsResult = useFetchBillingAccounts()
    const billingAccount = projectBillingAccountResult.billingAccount
    const normalizedBillingAccountId = normalizeOptionalString(props.billingAccountId)
    const normalizedBillingAccountName = normalizeOptionalString(props.billingAccountName)
    const billingAccountNameFromLookup: string | undefined = useMemo(
        (): string | undefined => {
            if (!normalizedBillingAccountId) {
                return undefined
            }

            const matchedBillingAccount = billingAccountsResult.billingAccounts.find(
                account => normalizeOptionalString(account.id) === normalizedBillingAccountId,
            )

            return normalizeOptionalString(matchedBillingAccount?.name)
        },
        [
            billingAccountsResult.billingAccounts,
            normalizedBillingAccountId,
        ],
    )
    const billingAccountName = normalizedBillingAccountName || billingAccountNameFromLookup

    const shouldShowExpiredBillingAccountNotice: boolean = isBillingAccountExpired(
        billingAccount?.active,
        billingAccount?.endDate,
    )

    if (shouldShowExpiredBillingAccountNotice) {
        return (
            <div className={styles.container}>
                <span>
                    The billing account for this project has expired,
                    {' '}
                </span>
                <Link className={styles.link} to={`/projects/${props.projectId}/edit`}>
                    click here to update
                </Link>
            </div>
        )
    }

    if (!normalizedBillingAccountId) {
        return <></>
    }

    return (
        <div className={styles.details}>
            Billing account:
            {' '}
            {billingAccountName || 'Unknown'}
            {' '}
            /
            {' '}
            {normalizedBillingAccountId}
        </div>
    )
}

export default ProjectBillingAccountExpiredNotice
