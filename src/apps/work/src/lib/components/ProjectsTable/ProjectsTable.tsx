import {
    FC,
    useCallback,
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
} from '../../models'
import type { BillingAccount } from '../../services'
import {
    buildProjectChallengesPath,
} from '../../utils'
import { BillingAccountLineItemsModal } from '../BillingAccountLineItemsModal'
import { ProjectCard } from '../ProjectCard'
import { ProjectStatus } from '../ProjectStatus'

import styles from './ProjectsTable.module.scss'

type SortOrder = 'asc' | 'desc'

interface BillingBudgetInfo {
    spent: number
    totalBudget: number
}

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
 * Converts optional API numeric fields into finite numbers.
 *
 * @param value Raw budget field from the billing-account API.
 * @returns A finite number, or `undefined` when the value is missing or invalid.
 */
function normalizeOptionalNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value
    }

    if (typeof value !== 'string') {
        return undefined
    }

    const normalizedValue = value.trim()

    if (!normalizedValue) {
        return undefined
    }

    const parsedValue = Number(normalizedValue)

    return Number.isFinite(parsedValue)
        ? parsedValue
        : undefined
}

/**
 * Formats budget amounts for compact project-list display.
 *
 * @param amount Dollar amount to format.
 * @returns Whole-dollar USD currency text.
 */
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        currency: 'USD',
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
        style: 'currency',
    })
        .format(amount)
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

/**
 * Resolves the spent/total budget values for a billing-account summary.
 *
 * @param billingAccount Matching billing-account summary from the list API.
 * @returns Spent and total budget amounts, or `undefined` when budget data is incomplete.
 */
function getBillingAccountBudgetInfo(
    billingAccount: BillingAccount | undefined,
): BillingBudgetInfo | undefined {
    const totalBudget = normalizeOptionalNumber(billingAccount?.budget)

    if (totalBudget === undefined) {
        return undefined
    }

    const lockedBudget = normalizeOptionalNumber(billingAccount?.lockedBudget)
    const consumedBudget = normalizeOptionalNumber(billingAccount?.consumedBudget)
    const totalBudgetRemaining = normalizeOptionalNumber(billingAccount?.totalBudgetRemaining)
    let spent: number | undefined

    if (lockedBudget !== undefined || consumedBudget !== undefined) {
        spent = (lockedBudget || 0) + (consumedBudget || 0)
    } else if (totalBudgetRemaining !== undefined) {
        spent = totalBudget - totalBudgetRemaining
    }

    return spent === undefined
        ? undefined
        : {
            spent: Math.max(spent, 0),
            totalBudget,
        }
}

interface ProjectBillingAccountCellProps {
    billingAccount: BillingAccount | undefined
    project: Project
}

/**
 * Renders a project billing-account summary and lazily loads the line-item
 * modal only after the details button is opened.
 *
 * @param props Project row and matching billing-account summary from the list API.
 * @returns Billing-account label, spent/total badge, and optional line-item modal.
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
    const budgetInfo = getBillingAccountBudgetInfo(props.billingAccount)

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
                    <span className={styles.budgetDisplay}>
                        {formatCurrency(budgetInfo.spent)}
                        {' / '}
                        {formatCurrency(budgetInfo.totalBudget)}
                        {' spent'}
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
        [billingAccountsById, canEditProject],
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
