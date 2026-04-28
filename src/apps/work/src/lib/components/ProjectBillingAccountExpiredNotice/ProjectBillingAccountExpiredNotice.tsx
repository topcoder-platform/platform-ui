import {
    FC,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react'
import { Link } from 'react-router-dom'

import { IconOutline } from '~/libs/ui'

import {
    WorkAppContext,
} from '../../contexts/WorkAppContext'
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
import type { WorkAppContextModel } from '../../models'
import type {
    BillingAccountBudgetInfo,
    CopilotMemberPaymentsBudgetInfo,
} from '../../utils/project-billing-account.utils'
import {
    getBillingAccountBudgetInfo,
    getCopilotMemberPaymentsBudgetInfo,
    getProjectBillingAccountChallengeIssue,
    getProjectBillingAccountNoticeMessage,
} from '../../utils/project-billing-account.utils'
import { BillingAccountLineItemsModal } from '../BillingAccountLineItemsModal'

import styles from './ProjectBillingAccountExpiredNotice.module.scss'

interface ProjectBillingAccountExpiredNoticeProps {
    billingAccountId?: number | string
    billingAccountName?: string
    canManageProject: boolean
    displayMemberPaymentDetailsToCopilots?: boolean
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

function formatCurrency(amount: number, includeCents: boolean = false): string {
    return new Intl.NumberFormat('en-US', {
        currency: 'USD',
        maximumFractionDigits: includeCents ? 2 : 0,
        minimumFractionDigits: includeCents ? 2 : 0,
        style: 'currency',
    })
        .format(amount)
}

/**
 * Identifies copilot-only users whose project payment details are controlled
 * by the project-level display flag.
 *
 * @param workAppContext Current work app user context.
 * @returns `true` when the user is a copilot without admin or manager access.
 */
function isRestrictedCopilot(workAppContext: WorkAppContextModel): boolean {
    return workAppContext.isCopilot
        && !workAppContext.isAdmin
        && !workAppContext.isManager
}

/**
 * Resolves whether the current user may see project payment details.
 *
 * @param workAppContext Current work app user context.
 * @param displayMemberPaymentDetailsToCopilots Project-level copilot display flag.
 * @returns `true` when payment amounts and the line-item modal may be shown.
 */
function canShowProjectPaymentDetails(
    workAppContext: WorkAppContextModel,
    displayMemberPaymentDetailsToCopilots: boolean | undefined,
): boolean {
    return !isRestrictedCopilot(workAppContext)
        || displayMemberPaymentDetailsToCopilots === true
}

/**
 * Resolves whether the copilot-safe member-payment balance should be shown.
 *
 * @param workAppContext Current work app user context.
 * @param showPaymentDetails Whether payment details are enabled for this project.
 * @returns `true` when the user should see member payments remaining.
 */
function canShowMemberPaymentsRemaining(
    workAppContext: WorkAppContextModel,
    showPaymentDetails: boolean,
): boolean {
    return showPaymentDetails && isRestrictedCopilot(workAppContext)
}

interface VisibleBudgetInfoParams {
    copilotBudgetInfo: CopilotMemberPaymentsBudgetInfo | undefined
    showMemberPaymentsRemaining: boolean
    showPaymentDetails: boolean
    standardBudgetInfo: BillingAccountBudgetInfo | undefined
}

/**
 * Selects the budget payload that is safe for the current user to see.
 *
 * @param params Standard and copilot budget variants with display flags.
 * @returns The visible budget payload, or `undefined` when hidden.
 */
function getVisibleBudgetInfo(
    params: VisibleBudgetInfoParams,
): BillingAccountBudgetInfo | undefined {
    if (!params.showPaymentDetails) {
        return undefined
    }

    return params.showMemberPaymentsRemaining
        ? params.copilotBudgetInfo
        : params.standardBudgetInfo
}

function getBudgetStatusClass(
    budgetInfo: BillingAccountBudgetInfo | undefined,
): string {
    return budgetInfo
        ? styles[`budget${budgetInfo.status.charAt(0)
            .toUpperCase()}${budgetInfo.status.slice(1)}`]
        : ''
}

function renderBudgetDisplayContent(
    budgetInfo: BillingAccountBudgetInfo | undefined,
    copilotBudgetInfo: CopilotMemberPaymentsBudgetInfo | undefined,
    showMemberPaymentsRemaining: boolean,
): JSX.Element | undefined {
    if (!budgetInfo) {
        return undefined
    }

    if (showMemberPaymentsRemaining && copilotBudgetInfo) {
        return (
            <>
                Member Payments Remaining:
                {' '}
                {formatCurrency(copilotBudgetInfo.memberPaymentsRemaining, true)}
            </>
        )
    }

    return (
        <>
            {formatCurrency(budgetInfo.spent)}
            {' / '}
            {formatCurrency(budgetInfo.totalBudget)}
            {' spent'}
        </>
    )
}

export const ProjectBillingAccountExpiredNotice: FC<ProjectBillingAccountExpiredNoticeProps> = (
    props: ProjectBillingAccountExpiredNoticeProps,
) => {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
    const workAppContext: WorkAppContextModel = useContext(WorkAppContext)
    const showPaymentDetails: boolean = canShowProjectPaymentDetails(
        workAppContext,
        props.displayMemberPaymentDetailsToCopilots,
    )
    const showMemberPaymentsRemaining: boolean = canShowMemberPaymentsRemaining(
        workAppContext,
        showPaymentDetails,
    )

    const projectBillingAccountResult: UseFetchProjectBillingAccountResult = useFetchProjectBillingAccount(
        props.projectId,
    )
    const billingAccountsResult: UseFetchBillingAccountsResult = useFetchBillingAccounts()
    const billingAccount = projectBillingAccountResult.billingAccount
    const normalizedBillingAccountId = normalizeOptionalString(props.billingAccountId)
        || normalizeOptionalString(billingAccount?.id)
    const billingAccountDetailsResult: UseFetchBillingAccountDetailsResult = useFetchBillingAccountDetails(
        showPaymentDetails
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
    const billingAccountIssue = getProjectBillingAccountChallengeIssue(billingAccount)

    const standardBudgetInfo = useMemo(() => {
        if (!billingAccountDetailsData) {
            return undefined
        }

        return getBillingAccountBudgetInfo(billingAccountDetailsData)
    }, [billingAccountDetailsData])
    const copilotBudgetInfo = useMemo(() => (
        showMemberPaymentsRemaining
            ? getCopilotMemberPaymentsBudgetInfo(billingAccountDetailsData)
            : undefined
    ), [billingAccountDetailsData, showMemberPaymentsRemaining])
    const budgetInfo = getVisibleBudgetInfo({
        copilotBudgetInfo,
        showMemberPaymentsRemaining,
        showPaymentDetails,
        standardBudgetInfo,
    })

    const handleOpenModal = useCallback((): void => {
        setIsModalOpen(true)
    }, [])

    const handleCloseModal = useCallback((): void => {
        setIsModalOpen(false)
    }, [])

    const budgetStatusClass = getBudgetStatusClass(budgetInfo)
    const budgetDisplayContent = renderBudgetDisplayContent(
        budgetInfo,
        copilotBudgetInfo,
        showMemberPaymentsRemaining,
    )
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
                            {budgetDisplayContent}
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
                projectId={props.projectId}
                showMemberPaymentsRemaining={showMemberPaymentsRemaining}
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
