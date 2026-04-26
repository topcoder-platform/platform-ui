import {
    FC,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react'
import { Link } from 'react-router-dom'

import { Sort } from '~/apps/admin/src/platform/gamification-admin/src/game-lib'
import {
    IconOutline,
    LoadingSpinner,
    Table,
    TableColumn,
} from '~/libs/ui'

import { PROJECT_STATUS } from '../../constants'
import { WorkAppContext } from '../../contexts/WorkAppContext'
import {
    useFetchBillingAccountDetails,
    useFetchBillingAccounts,
} from '../../hooks'
import type {
    UseFetchBillingAccountDetailsResult,
    UseFetchBillingAccountsResult,
} from '../../hooks'
import {
    Project,
    ProjectStatusValue,
    WorkAppContextModel,
} from '../../models'
import type { BillingAccount } from '../../services'
import {
    buildProjectChallengesPath,
} from '../../utils'
import type {
    BillingAccountBudgetInfo,
    CopilotMemberPaymentsBudgetInfo,
} from '../../utils/project-billing-account.utils'
import {
    getBillingAccountBudgetInfo,
    getCopilotMemberPaymentsBudgetInfo,
} from '../../utils/project-billing-account.utils'
import { BillingAccountLineItemsModal } from '../BillingAccountLineItemsModal'
import { ProjectCard } from '../ProjectCard'
import { ProjectStatus } from '../ProjectStatus'

import styles from './ProjectsTable.module.scss'

type SortOrder = 'asc' | 'desc'

const NOOP_CAN_EDIT_PROJECT = (): boolean => false

const PROJECT_TYPE_LABEL_OVERRIDES: Readonly<Record<string, string>> = {
    'analytics-and-data-science': 'Analytics & Data Science',
    app_dev: 'App Development',
}

const PROJECT_TYPE_WORD_OVERRIDES: Readonly<Record<string, string>> = {
    ai: 'AI',
    api: 'API',
    qa: 'QA',
    ui: 'UI',
    ux: 'UX',
}

function formatProjectTypeLabel(projectType?: string): string {
    const normalizedType = projectType?.trim()

    if (!normalizedType) {
        return '-'
    }

    const typeOverride = PROJECT_TYPE_LABEL_OVERRIDES[normalizedType.toLowerCase()]

    if (typeOverride) {
        return typeOverride
    }

    return normalizedType
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
        .map(word => {
            const lowerWord = word.toLowerCase()

            if (PROJECT_TYPE_WORD_OVERRIDES[lowerWord]) {
                return PROJECT_TYPE_WORD_OVERRIDES[lowerWord]
            }

            const firstCharacter = lowerWord.charAt(0)

            return `${firstCharacter.toUpperCase()}${lowerWord.slice(1)}`
        })
        .join(' ')
}

interface ProjectsTableProps {
    canEditProject?: (project: Project) => boolean
    projects: Project[]
    isLoading?: boolean
    sortBy: string
    sortOrder: SortOrder
    onSort: (fieldName: string) => void
}

function getProjectPath(project: Project): string {
    return buildProjectChallengesPath(project.id)
}

/**
 * Converts optional id or label values into trimmed display strings.
 *
 * @param value Raw value from a project or billing-account payload.
 * @returns A trimmed string, or `undefined` when the value is blank.
 */
function normalizeOptionalString(value: unknown): string | undefined {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalizedValue = String(value)
        .trim()

    return normalizedValue || undefined
}

/**
 * Formats budget amounts for compact project-list display.
 *
 * @param amount Dollar amount to format.
 * @param includeCents Whether to include cents in the formatted value.
 * @returns USD currency text.
 */
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

function getBudgetStatusClass(
    budgetInfo: BillingAccountBudgetInfo | undefined,
    showMemberPaymentsRemaining: boolean,
): string {
    return showMemberPaymentsRemaining && budgetInfo
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
 * Builds the billing-account label for a project row.
 *
 * @param project Project summary from the projects API.
 * @param billingAccount Matching billing-account summary from the billing API.
 * @returns Name/id text, falling back to `-` when no account is available.
 */
function getBillingAccountDisplay(
    project: Project,
    billingAccount: BillingAccount | undefined,
): string {
    const billingAccountId = normalizeOptionalString(project.billingAccountId)
        || normalizeOptionalString(billingAccount?.id)
        || ''
    const billingAccountName = normalizeOptionalString(project.billingAccountName)
        || normalizeOptionalString(billingAccount?.name)

    if (!billingAccountId && !billingAccountName) {
        return '-'
    }

    if (!billingAccountId) {
        return billingAccountName || '-'
    }

    return `${billingAccountName || 'Unknown'} / ${billingAccountId}`
}

interface ProjectBillingAccountCellProps {
    billingAccount: BillingAccount | undefined
    project: Project
    showMemberPaymentsRemaining: boolean
}

/**
 * Renders a project billing-account summary and lazily loads the line-item
 * modal only after the details button is opened.
 *
 * @param props Project row and matching billing-account summary from the list API.
 * @returns Billing-account label, role-specific budget badge, and optional
 * line-item modal.
 */
const ProjectBillingAccountCell: FC<ProjectBillingAccountCellProps> = (
    props: ProjectBillingAccountCellProps,
) => {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
    const normalizedBillingAccountId = normalizeOptionalString(props.project.billingAccountId)
        || normalizeOptionalString(props.billingAccount?.id)
    const billingAccountDetailsResult: UseFetchBillingAccountDetailsResult = useFetchBillingAccountDetails(
        isModalOpen ? normalizedBillingAccountId : undefined,
    )
    const standardBudgetInfo = getBillingAccountBudgetInfo(props.billingAccount)
    const copilotBudgetInfo = props.showMemberPaymentsRemaining
        ? getCopilotMemberPaymentsBudgetInfo(props.billingAccount)
        : undefined
    const budgetInfo = props.showMemberPaymentsRemaining
        ? copilotBudgetInfo
        : standardBudgetInfo
    const budgetStatusClass = getBudgetStatusClass(
        budgetInfo,
        props.showMemberPaymentsRemaining,
    )
    const budgetDisplayClass = budgetStatusClass
        ? `${styles.budgetDisplay} ${budgetStatusClass}`
        : styles.budgetDisplay
    const budgetDisplayContent = renderBudgetDisplayContent(
        budgetInfo,
        copilotBudgetInfo,
        props.showMemberPaymentsRemaining,
    )

    const handleOpenModal = useCallback((): void => {
        setIsModalOpen(true)
    }, [])

    const handleCloseModal = useCallback((): void => {
        setIsModalOpen(false)
    }, [])

    return (
        <div className={styles.billingAccountCell}>
            <span className={styles.billingAccountLabel}>
                {getBillingAccountDisplay(props.project, props.billingAccount)}
            </span>
            {budgetInfo
                ? (
                    <span className={budgetDisplayClass}>
                        {budgetDisplayContent}
                    </span>
                )
                : undefined}
            {normalizedBillingAccountId
                ? (
                    <button
                        aria-label='View billing account details'
                        className={styles.infoButton}
                        onClick={handleOpenModal}
                        title='View billing account details'
                        type='button'
                    >
                        <IconOutline.InformationCircleIcon className={styles.infoIcon} />
                    </button>
                )
                : undefined}
            {isModalOpen && billingAccountDetailsResult.billingAccountDetails
                ? (
                    <BillingAccountLineItemsModal
                        billingAccountDetails={billingAccountDetailsResult.billingAccountDetails}
                        onClose={handleCloseModal}
                        showMemberPaymentsRemaining={props.showMemberPaymentsRemaining}
                    />
                )
                : undefined}
        </div>
    )
}

export const ProjectsTable: FC<ProjectsTableProps> = (props: ProjectsTableProps) => {
    const canEditProject = props.canEditProject || NOOP_CAN_EDIT_PROJECT
    const projects: Project[] = props.projects
    const isLoading: boolean = !!props.isLoading
    const onSort: (fieldName: string) => void = props.onSort
    const sortBy: string = props.sortBy
    const sortOrder: SortOrder = props.sortOrder
    const workAppContext: WorkAppContextModel = useContext(WorkAppContext)
    const showMemberPaymentsRemaining: boolean = canShowMemberPaymentsRemaining(workAppContext)
    const {
        billingAccounts,
    }: UseFetchBillingAccountsResult = useFetchBillingAccounts()
    const billingAccountsById = useMemo(
        () => new Map(
            billingAccounts.map(account => ([
                String(account.id),
                account,
            ])),
        ),
        [billingAccounts],
    )

    const columns: TableColumn<Project>[] = useMemo(
        () => [
            {
                label: 'Project Name',
                propertyName: 'name',
                renderer: (project: Project) => {
                    const path = getProjectPath(project)

                    return (
                        <Link className={styles.projectLink} to={path}>
                            {project.name}
                        </Link>
                    )
                },
                type: 'element',
            },
            {
                label: 'Status',
                propertyName: 'status',
                renderer: (project: Project) => (
                    <ProjectStatus
                        status={(project.status || PROJECT_STATUS.DRAFT) as ProjectStatusValue}
                    />
                ),
                type: 'element',
            },
            {
                label: 'Type',
                propertyName: 'type',
                renderer: (project: Project) => <>{formatProjectTypeLabel(project.type)}</>,
                type: 'element',
            },
            {
                isSortable: false,
                label: 'Billing Account',
                renderer: (project: Project) => (
                    <ProjectBillingAccountCell
                        billingAccount={billingAccountsById.get(String(project.billingAccountId))}
                        project={project}
                        showMemberPaymentsRemaining={showMemberPaymentsRemaining}
                    />
                ),
                type: 'element',
            },
            {
                isSortable: false,
                label: 'Actions',
                renderer: (project: Project) => {
                    const projectPath = getProjectPath(project)
                    const editPath = `/projects/${project.id}/edit`
                    const canEdit = canEditProject(project)

                    return (
                        <div className={styles.actions}>
                            <Link className={styles.actionLink} to={projectPath}>
                                Open
                            </Link>
                            {canEdit
                                ? (
                                    <Link className={styles.actionLink} to={editPath}>
                                        Edit
                                    </Link>
                                )
                                : undefined}
                        </div>
                    )
                },
                type: 'action',
            },
        ],
        [billingAccountsById, canEditProject, showMemberPaymentsRemaining],
    )

    const forceSort = useMemo<Sort>(
        () => ({
            direction: sortOrder,
            fieldName: sortBy,
        }),
        [sortBy, sortOrder],
    )

    const onToggleSort = useCallback(
        (sort?: Sort): void => {
            if (!sort?.fieldName) {
                return
            }

            onSort(sort.fieldName)
        },
        [onSort],
    )

    if (isLoading && projects.length === 0) {
        return (
            <div className={styles.loadingState}>
                <LoadingSpinner inline />
            </div>
        )
    }

    if (!isLoading && projects.length === 0) {
        return (
            <div className={styles.emptyState}>
                No projects available yet
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.tableView}>
                <Table
                    className={styles.tableWrap}
                    columns={columns}
                    data={projects}
                    forceSort={forceSort}
                    onToggleSort={onToggleSort}
                />
            </div>

            <div className={styles.listView}>
                {projects.map(project => (
                    <ProjectCard
                        billingAccountContent={(
                            <ProjectBillingAccountCell
                                billingAccount={billingAccountsById.get(String(project.billingAccountId))}
                                project={project}
                                showMemberPaymentsRemaining={showMemberPaymentsRemaining}
                            />
                        )}
                        canEdit={canEditProject(project)}
                        key={String(project.id)}
                        project={project}
                    />
                ))}
            </div>

            {isLoading && projects.length > 0 ? (
                <div className={styles.loadingMore}>
                    <LoadingSpinner inline />
                </div>
            ) : undefined}
        </div>
    )
}

export default ProjectsTable
