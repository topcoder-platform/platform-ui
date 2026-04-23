import {
    FC,
    useCallback,
    useMemo,
    useState,
} from 'react'
import { Link } from 'react-router-dom'

import { IconOutline } from '~/libs/ui'

import {
    useFetchBillingAccountDetails,
    useFetchBillingAccounts,
    useFetchProjectBillingAccount,
} from '../../hooks'
import type {
    UseFetchBillingAccountDetailsResult,
    UseFetchBillingAccountsResult,
    UseFetchProjectBillingAccountResult,
} from '../../hooks'
import {
    getProjectBillingAccountChallengeIssue,
    getProjectBillingAccountNoticeMessage,
} from '../../utils/project-billing-account.utils'
import { BillingAccountLineItemsModal } from '../BillingAccountLineItemsModal'

import styles from './ProjectBillingAccountExpiredNotice.module.scss'

interface ProjectBillingAccountExpiredNoticeProps {
    billingAccountId?: number | string
    billingAccountName?: string
    canManageProject: boolean
    projectId: string
}

type BudgetStatus = 'healthy' | 'warning' | 'critical'

function normalizeOptionalString(value: unknown): string | undefined {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalizedValue = String(value)
        .trim()

    return normalizedValue || undefined
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        currency: 'USD',
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
        style: 'currency',
    })
        .format(amount)
}

function getBudgetStatus(remaining: number, total: number): BudgetStatus {
    if (total <= 0) {
        return 'healthy'
    }

    const percentage = (remaining / total) * 100

    if (percentage < 10) {
        return 'critical'
    }

    if (percentage < 30) {
        return 'warning'
    }

    return 'healthy'
}

export const ProjectBillingAccountExpiredNotice: FC<ProjectBillingAccountExpiredNoticeProps> = (
    props: ProjectBillingAccountExpiredNoticeProps,
) => {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

    const projectBillingAccountResult: UseFetchProjectBillingAccountResult = useFetchProjectBillingAccount(
        props.projectId,
    )
    const billingAccountsResult: UseFetchBillingAccountsResult = useFetchBillingAccounts()
    const billingAccount = projectBillingAccountResult.billingAccount
    const normalizedBillingAccountId = normalizeOptionalString(props.billingAccountId)
        || normalizeOptionalString(billingAccount?.id)
    const billingAccountDetailsResult: UseFetchBillingAccountDetailsResult = useFetchBillingAccountDetails(
        normalizedBillingAccountId,
    )

    const billingAccountDetailsData = billingAccountDetailsResult.billingAccountDetails
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

    const billingAccountName = normalizedBillingAccountName
        || normalizeOptionalString(billingAccount?.name)
        || billingAccountNameFromLookup
    const billingAccountIssue = getProjectBillingAccountChallengeIssue(billingAccount)

    const budgetInfo = useMemo(() => {
        if (!billingAccountDetailsData) {
            return undefined
        }

        const totalBudget = Number(billingAccountDetailsData.budget) || 0
        const remaining = Number(billingAccountDetailsData.totalBudgetRemaining) || 0
        const status = getBudgetStatus(remaining, totalBudget)

        return {
            spent: Math.max(totalBudget - remaining, 0),
            status,
            totalBudget,
        }
    }, [billingAccountDetailsData])

    const handleOpenModal = useCallback((): void => {
        setIsModalOpen(true)
    }, [])

    const handleCloseModal = useCallback((): void => {
        setIsModalOpen(false)
    }, [])

    const budgetStatusClass = budgetInfo
        ? styles[`budget${budgetInfo.status.charAt(0)
            .toUpperCase()}${budgetInfo.status.slice(1)}`]
        : ''
    const billingAccountDetailsContent = normalizedBillingAccountId
        ? (
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
                {budgetInfo && (
                    <>
                        <span className={`${styles.budgetDisplay} ${budgetStatusClass}`}>
                            {formatCurrency(budgetInfo.spent)}
                            {' / '}
                            {formatCurrency(budgetInfo.totalBudget)}
                            {' spent'}
                        </span>
                        <button
                            aria-label='View billing account details'
                            className={styles.infoButton}
                            onClick={handleOpenModal}
                            type='button'
                        >
                            <IconOutline.InformationCircleIcon className={styles.infoIcon} />
                        </button>
                    </>
                )}
            </div>
        )
        : undefined
    const billingAccountModal = isModalOpen && billingAccountDetailsData
        ? (
            <BillingAccountLineItemsModal
                billingAccountDetails={billingAccountDetailsData}
                onClose={handleCloseModal}
            />
        )
        : undefined

    if (billingAccountIssue) {
        const noticeMessage = getProjectBillingAccountNoticeMessage(billingAccountIssue)
        const managedNoticeMessage = `${noticeMessage.slice(0, -1)}, `

        return (
            <div className={styles.noticeStack}>
                {billingAccountDetailsContent}
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
                {billingAccountModal}
            </div>
        )
    }

    if (!normalizedBillingAccountId) {
        return <></>
    }

    return (
        <>
            {billingAccountDetailsContent}
            {billingAccountModal}
        </>
    )
}

export default ProjectBillingAccountExpiredNotice
