import {
    FC,
    useCallback,
    useMemo,
} from 'react'
import { Link } from 'react-router-dom'

import { Sort } from '~/apps/admin/src/platform/gamification-admin/src/game-lib'
import {
    LoadingSpinner,
    Table,
    TableColumn,
} from '~/libs/ui'

import { PROJECT_STATUS } from '../../constants'
import {
    Project,
    ProjectStatusValue,
} from '../../models'
import { ProjectCard } from '../ProjectCard'
import { ProjectStatus } from '../ProjectStatus'

import styles from './ProjectsTable.module.scss'

type SortOrder = 'asc' | 'desc'

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
    canEditProjects?: boolean
    projects: Project[]
    isLoading?: boolean
    sortBy: string
    sortOrder: SortOrder
    onSort: (fieldName: string) => void
}

function getProjectPath(project: Project): string {
    const projectId = String(project.id)
    const isInvited = project.isInvited ?? !!project.invites?.length

    return `/projects/${projectId}/${isInvited ? 'invitations' : 'challenges'}`
}

export const ProjectsTable: FC<ProjectsTableProps> = (props: ProjectsTableProps) => {
    const canEditProjects = !!props.canEditProjects
    const projects: Project[] = props.projects
    const isLoading: boolean = !!props.isLoading
    const onSort: (fieldName: string) => void = props.onSort
    const sortBy: string = props.sortBy
    const sortOrder: SortOrder = props.sortOrder

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
                label: 'Actions',
                renderer: (project: Project) => {
                    const projectPath = getProjectPath(project)
                    const editPath = `/projects/${project.id}/edit`

                    return (
                        <div className={styles.actions}>
                            <Link className={styles.actionLink} to={projectPath}>
                                Open
                            </Link>
                            {canEditProjects
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
        [canEditProjects],
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
                        canEdit={canEditProjects}
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
