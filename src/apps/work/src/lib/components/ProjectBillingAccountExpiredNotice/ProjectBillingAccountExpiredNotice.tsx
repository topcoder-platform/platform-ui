import {
    FC,
    useMemo,
} from 'react'
import { Link } from 'react-router-dom'

import {
    useFetchBillingAccounts,
    useFetchProjectBillingAccount,
} from '../../hooks'
import {
    getProjectBillingAccountChallengeIssue,
    getProjectBillingAccountNoticeMessage,
} from '../../utils/project-billing-account.utils'
import type {
    UseFetchBillingAccountsResult,
    UseFetchProjectBillingAccountResult,
} from '../../hooks'

import styles from './ProjectBillingAccountExpiredNotice.module.scss'

interface ProjectBillingAccountExpiredNoticeProps {
    billingAccountId?: number | string
    billingAccountName?: string
    canManageProject: boolean
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
    const billingAccountIssue = getProjectBillingAccountChallengeIssue(billingAccount)

    if (billingAccountIssue) {
        const noticeMessage = getProjectBillingAccountNoticeMessage(billingAccountIssue)
        const managedNoticeMessage = `${noticeMessage.slice(0, -1)}, `

        return (
            <div className={styles.container}>
                {props.canManageProject
                    ? (
                        <>
                            <span>{managedNoticeMessage}</span>
                            <Link className={styles.link} to={`/projects/${props.projectId}/edit`}>
                                click here to update
                            </Link>
                        </>
                    )
                    : (
                        <span>{noticeMessage}</span>
                    )}
            </div>
        )
    }

    if (!normalizedBillingAccountId) {
        return <></>
    }

    return (
        <div className={styles.details}>
            <span>
                Billing account:
                {' '}
                {billingAccountName || 'Unknown'}
                {' '}
                /
                {' '}
                {normalizedBillingAccountId}
            </span>
        </div>
    )
}

export default ProjectBillingAccountExpiredNotice
