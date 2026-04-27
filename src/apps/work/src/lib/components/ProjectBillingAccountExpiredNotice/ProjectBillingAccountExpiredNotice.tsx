import {
    FC,
    useCallback,
    useMemo,
    useState,
} from 'react'
import { Link } from 'react-router-dom'

import { IconOutline } from '~/libs/ui'

import {
    BILLING_ACCOUNT_BUDGET_DISPLAY_ENABLED,
    BILLING_ACCOUNT_DETAILS_MODAL_ENABLED,
} from '../../constants'
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
import type {
    BillingAccountDetails,
} from '../../services'
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
type BillingAccountIssue = ReturnType<typeof getProjectBillingAccountChallengeIssue>

interface BillingBudgetInfo {
    spent: number
    status: BudgetStatus
    totalBudget: number
}

interface BillingAccountDetailsContentProps {
    billingAccountId: string
    billingAccountName: string | undefined
    budgetInfo: BillingBudgetInfo | undefined
    onOpenModal: () => void
}

interface RenderBillingAccountContentParams {
    billingAccountDetailsContent: JSX.Element | undefined
    billingAccountModal: JSX.Element | undefined
    canManageProject: boolean
    projectId: string
    visibleBillingAccountIssue: BillingAccountIssue
}

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

/**
 * Hides budget-derived billing account notices while budget display is disabled.
 *
 * @param billingAccountIssue The billing account issue resolved for the project.
 * @returns The issue to display, or `undefined` when the temporary hide applies.
 */
function getVisibleBillingAccountIssue(
    billingAccountIssue: BillingAccountIssue,
): BillingAccountIssue {
    const isInsufficientFundsNoticeHidden = !BILLING_ACCOUNT_BUDGET_DISPLAY_ENABLED
        && billingAccountIssue === 'insufficient-funds'

    return isInsufficientFundsNoticeHidden
        ? undefined
        : billingAccountIssue
}

/**
 * Builds the optional spent/total budget display model from fetched billing details.
 *
 * @param billingAccountDetails Billing account details returned by the work app hook.
 * @returns Spent, total, and status information, or `undefined` while hidden or unavailable.
 */
function getBillingAccountBudgetInfo(
    billingAccountDetails: BillingAccountDetails | undefined,
): BillingBudgetInfo | undefined {
    if (!BILLING_ACCOUNT_BUDGET_DISPLAY_ENABLED || !billingAccountDetails) {
        return undefined
    }

    const totalBudget = Number(billingAccountDetails.budget) || 0
    const remaining = Number(billingAccountDetails.totalBudgetRemaining) || 0
    const status = getBudgetStatus(remaining, totalBudget)

    return {
        spent: Math.max(totalBudget - remaining, 0),
        status,
        totalBudget,
    }
}

/**
 * Renders the visible billing account label plus optional budget and details controls.
 *
 * @param props Billing account label, optional budget data, and modal open handler.
 * @returns The billing account details row for project pages.
 */
const BillingAccountDetailsContent: FC<BillingAccountDetailsContentProps> = (
    props: BillingAccountDetailsContentProps,
) => {
    const budgetStatusClass = props.budgetInfo
        ? styles[`budget${props.budgetInfo.status.charAt(0)
            .toUpperCase()}${props.budgetInfo.status.slice(1)}`]
        : ''

    return (
        <div className={styles.details}>
            <span>
                Billing account:
                {' '}
                {props.billingAccountName || 'Unknown'}
                {' '}
                /
                {' '}
                {props.billingAccountId}
            </span>
            {props.budgetInfo
                ? (
                    <span className={`${styles.budgetDisplay} ${budgetStatusClass}`}>
                        {formatCurrency(props.budgetInfo.spent)}
                        {' / '}
                        {formatCurrency(props.budgetInfo.totalBudget)}
                        {' spent'}
                    </span>
                )
                : undefined}
            {BILLING_ACCOUNT_DETAILS_MODAL_ENABLED
                ? (
                    <button
                        aria-label='View billing account details'
                        className={styles.infoButton}
                        onClick={props.onOpenModal}
                        type='button'
                    >
                        <IconOutline.InformationCircleIcon className={styles.infoIcon} />
                    </button>
                )
                : undefined}
        </div>
    )
}

/**
 * Renders the temporarily enabled/disabled line-item modal.
 *
 * @param billingAccountDetails Billing account detail payload, if loaded.
 * @param isModalOpen Whether the details modal has been requested.
 * @param onClose Close handler passed to the modal.
 * @returns The line-item modal, or `undefined` when the feature is hidden.
 */
function renderBillingAccountModal(
    billingAccountDetails: BillingAccountDetails | undefined,
    isModalOpen: boolean,
    onClose: () => void,
): JSX.Element | undefined {
    if (!BILLING_ACCOUNT_DETAILS_MODAL_ENABLED || !isModalOpen || !billingAccountDetails) {
        return undefined
    }

    return (
        <BillingAccountLineItemsModal
            billingAccountDetails={billingAccountDetails}
            onClose={onClose}
        />
    )
}

/**
 * Renders the project billing-account issue notice when one should remain visible.
 *
 * @param params Project billing display state and rendered child content.
 * @returns The notice stack, normal details content, or an empty fragment.
 */
function renderBillingAccountContent(params: RenderBillingAccountContentParams): JSX.Element {
    if (params.visibleBillingAccountIssue) {
        const noticeMessage = getProjectBillingAccountNoticeMessage(params.visibleBillingAccountIssue)
        const managedNoticeMessage = `${noticeMessage.slice(0, -1)}, `

        return (
            <div className={styles.noticeStack}>
                {params.billingAccountDetailsContent}
                <div className={styles.container}>
                    {params.canManageProject
                        ? (
                            <>
                                <span>{managedNoticeMessage}</span>
                                <Link className={styles.link} to={`/projects/${params.projectId}/edit`}>
                                    click here to update
                                </Link>
                            </>
                        )
                        : (
                            <span>{noticeMessage}</span>
                        )}
                </div>
                {params.billingAccountModal}
            </div>
        )
    }

    if (!params.billingAccountDetailsContent) {
        return <></>
    }

    return (
        <>
            {params.billingAccountDetailsContent}
            {params.billingAccountModal}
        </>
    )
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
        BILLING_ACCOUNT_BUDGET_DISPLAY_ENABLED || BILLING_ACCOUNT_DETAILS_MODAL_ENABLED
            ? normalizedBillingAccountId
            : undefined,
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
    const visibleBillingAccountIssue = getVisibleBillingAccountIssue(
        getProjectBillingAccountChallengeIssue(billingAccount),
    )

    const budgetInfo = useMemo(
        () => getBillingAccountBudgetInfo(billingAccountDetailsData),
        [billingAccountDetailsData],
    )

    const handleOpenModal = useCallback((): void => {
        setIsModalOpen(true)
    }, [])

    const handleCloseModal = useCallback((): void => {
        setIsModalOpen(false)
    }, [])

    const billingAccountDetailsContent = normalizedBillingAccountId
        ? (
            <BillingAccountDetailsContent
                billingAccountId={normalizedBillingAccountId}
                billingAccountName={billingAccountName}
                budgetInfo={budgetInfo}
                onOpenModal={handleOpenModal}
            />
        )
        : undefined
    const billingAccountModal = renderBillingAccountModal(
        billingAccountDetailsData,
        isModalOpen,
        handleCloseModal,
    )

    return renderBillingAccountContent({
        billingAccountDetailsContent,
        billingAccountModal,
        canManageProject: props.canManageProject,
        projectId: props.projectId,
        visibleBillingAccountIssue,
    })
}

export default ProjectBillingAccountExpiredNotice
