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
    BILLING_ACCOUNT_BUDGET_DISPLAY_ENABLED,
    BILLING_ACCOUNT_DETAILS_MODAL_ENABLED,
} from '../../constants'
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
import type {
    BillingAccountDetails,
} from '../../services'
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

type BillingAccountIssue = ReturnType<typeof getProjectBillingAccountChallengeIssue>

interface BillingAccountDetailsContentProps {
    billingAccountId: string
    billingAccountName: string | undefined
    budgetDisplayContent: JSX.Element | undefined
    budgetInfo: BillingAccountBudgetInfo | undefined
    onOpenModal: () => void
    showDetailsButton: boolean
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
 * Renders the visible billing account label plus optional budget and details controls.
 *
 * @param props Billing account label, optional budget data, and modal open handler.
 * @returns The billing account details row for project pages.
 */
const BillingAccountDetailsContent: FC<BillingAccountDetailsContentProps> = (
    props: BillingAccountDetailsContentProps,
) => {
    const budgetStatusClass = getBudgetStatusClass(props.budgetInfo)

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
                        {props.budgetDisplayContent}
                    </span>
                )
                : undefined}
            {props.showDetailsButton
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
 * @param projectId Project id used to build project-scoped line-item links.
 * @param showMemberPaymentsRemaining Whether the modal should hide markup and show copilot-safe payment values.
 * @returns The line-item modal, or `undefined` when the feature is hidden.
 */
function renderBillingAccountModal(
    billingAccountDetails: BillingAccountDetails | undefined,
    isModalOpen: boolean,
    onClose: () => void,
    projectId: string,
    showMemberPaymentsRemaining: boolean,
): JSX.Element | undefined {
    if (!BILLING_ACCOUNT_DETAILS_MODAL_ENABLED || !isModalOpen || !billingAccountDetails) {
        return undefined
    }

    return (
        <BillingAccountLineItemsModal
            billingAccountDetails={billingAccountDetails}
            onClose={onClose}
            projectId={projectId}
            showMemberPaymentsRemaining={showMemberPaymentsRemaining}
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
    const shouldFetchBillingAccountDetails = (BILLING_ACCOUNT_BUDGET_DISPLAY_ENABLED && showPaymentDetails)
        || showMemberPaymentsRemaining
        || (BILLING_ACCOUNT_DETAILS_MODAL_ENABLED && isModalOpen && showPaymentDetails)
    const billingAccountDetailsResult: UseFetchBillingAccountDetailsResult = useFetchBillingAccountDetails(
        shouldFetchBillingAccountDetails
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

    const standardBudgetInfo = useMemo(() => {
        if (!BILLING_ACCOUNT_BUDGET_DISPLAY_ENABLED || !billingAccountDetailsData) {
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
    const budgetDisplayContent = renderBudgetDisplayContent(
        budgetInfo,
        copilotBudgetInfo,
        showMemberPaymentsRemaining,
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
                budgetDisplayContent={budgetDisplayContent}
                budgetInfo={budgetInfo}
                onOpenModal={handleOpenModal}
                showDetailsButton={BILLING_ACCOUNT_DETAILS_MODAL_ENABLED && showPaymentDetails}
            />
        )
        : undefined
    const billingAccountModal = renderBillingAccountModal(
        billingAccountDetailsData,
        isModalOpen,
        handleCloseModal,
        props.projectId,
        showMemberPaymentsRemaining,
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
