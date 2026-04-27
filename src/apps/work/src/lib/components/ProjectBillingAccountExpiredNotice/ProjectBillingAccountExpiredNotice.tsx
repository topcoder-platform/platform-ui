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

function canShowMemberPaymentsRemaining(workAppContext: WorkAppContextModel): boolean {
    return workAppContext.isCopilot
        && !workAppContext.isAdmin
        && !workAppContext.isManager
}

interface CopilotPaymentDetailsVisibility {
    billingAccountDetailsId?: string
    isCopilotOnly: boolean
    showMemberPaymentsRemaining: boolean
}

/**
 * Resolves copilot-only visibility for project payment details.
 *
 * @param workAppContext Current work-app user role context.
 * @param billingAccountId Normalized project billing account id.
 * @param displayMemberPaymentDetailsToCopilots Project-level display flag.
 * @returns Whether copilot-safe payments should render and which billing account id may be fetched.
 */
function resolveCopilotPaymentDetailsVisibility(
    workAppContext: WorkAppContextModel,
    billingAccountId: string | undefined,
    displayMemberPaymentDetailsToCopilots: boolean | undefined,
): CopilotPaymentDetailsVisibility {
    const isCopilotOnly = canShowMemberPaymentsRemaining(workAppContext)
    const isDisabledForCopilot = isCopilotOnly && displayMemberPaymentDetailsToCopilots === false

    return {
        billingAccountDetailsId: isDisabledForCopilot
            ? undefined
            : billingAccountId,
        isCopilotOnly,
        showMemberPaymentsRemaining: isCopilotOnly && !isDisabledForCopilot,
    }
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

    const projectBillingAccountResult: UseFetchProjectBillingAccountResult = useFetchProjectBillingAccount(
        props.projectId,
    )
    const billingAccountsResult: UseFetchBillingAccountsResult = useFetchBillingAccounts()
    const billingAccount = projectBillingAccountResult.billingAccount
    const normalizedBillingAccountId = normalizeOptionalString(props.billingAccountId)
        || normalizeOptionalString(billingAccount?.id)
    const copilotPaymentDetailsVisibility = resolveCopilotPaymentDetailsVisibility(
        workAppContext,
        normalizedBillingAccountId,
        props.displayMemberPaymentDetailsToCopilots,
    )
    const showMemberPaymentsRemaining = copilotPaymentDetailsVisibility.showMemberPaymentsRemaining
    const billingAccountDetailsResult: UseFetchBillingAccountDetailsResult = useFetchBillingAccountDetails(
        copilotPaymentDetailsVisibility.billingAccountDetailsId,
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
    const budgetInfo = copilotPaymentDetailsVisibility.isCopilotOnly
        ? copilotBudgetInfo
        : standardBudgetInfo

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
