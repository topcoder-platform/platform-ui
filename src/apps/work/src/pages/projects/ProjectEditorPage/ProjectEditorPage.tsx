import {
    FC,
    useCallback,
    useContext,
    useMemo,
} from 'react'
import {
    Navigate,
    useParams,
} from 'react-router-dom'

import { PageWrapper } from '~/apps/review/src/lib'

import {
    PROJECT_ROLES,
} from '../../../lib/constants'
import {
    WorkAppContext,
} from '../../../lib/contexts'
import {
    useFetchProject,
    useFetchProjectTypes,
} from '../../../lib/hooks'
import {
    Project,
    ProjectType,
    WorkAppContextModel,
} from '../../../lib/models'
import {
    ErrorMessage,
    LoadingSpinner,
} from '../../../lib/components'

import {
    ProjectEditorForm,
} from './components'
import styles from './ProjectEditorPage.module.scss'

function normalizeStringValue(value: unknown): string {
    if (typeof value !== 'string') {
        return ''
    }

    const normalizedValue = value.trim()

    return normalizedValue.toLowerCase()
}

function normalizeUserId(userId: unknown): string | undefined {
    if (userId === undefined || userId === null) {
        return undefined
    }

    const normalizedUserId = String(userId)
        .trim()

    return normalizedUserId || undefined
}

function hasProjectManagePermission(project: Project | undefined, userId: string | undefined): boolean {
    if (!project || !userId || !Array.isArray(project.members)) {
        return false
    }

    return project.members.some(member => {
        const memberUserId = normalizeUserId(member.userId)
        const memberRole = normalizeStringValue(member.role)

        return memberUserId === userId
            && (
                memberRole === PROJECT_ROLES.COPILOT
                || memberRole === PROJECT_ROLES.MANAGER
            )
    })
}

function getErrorMessage(error: Error | undefined): string {
    if (!error) {
        return 'Something went wrong while loading project data.'
    }

    return error.message || 'Something went wrong while loading project data.'
}

function shouldRedirectToProjects(
    isEdit: boolean,
    canCreateProject: boolean,
    canManageProject: boolean,
    isProjectLoading: boolean,
    hasProject: boolean,
): boolean {
    if (!isEdit) {
        return !canCreateProject
    }

    if (isProjectLoading || !hasProject) {
        return false
    }

    return !canManageProject
}

interface RenderEditorContentParams {
    canManageProject: boolean
    isEdit: boolean
    isLoading: boolean
    loadError: Error | undefined
    onSuccess: (project: Project) => void
    project: Project | undefined
    projectTypes: ProjectType[]
}

function renderEditorContent(params: RenderEditorContentParams): JSX.Element {
    if (params.isLoading) {
        return <LoadingSpinner />
    }

    if (params.loadError) {
        return (
            <ErrorMessage
                message={getErrorMessage(params.loadError)}
            />
        )
    }

    if (params.isEdit && !params.project) {
        return (
            <ErrorMessage
                message='Project not found.'
            />
        )
    }

    return (
        <ProjectEditorForm
            canManage={params.canManageProject}
            isEdit={params.isEdit}
            onSuccess={params.onSuccess}
            projectDetail={params.project}
            projectTypes={params.projectTypes}
        />
    )
}

export const ProjectEditorPage: FC = () => {
    const params: Readonly<{ projectId?: string }> = useParams<'projectId'>()
    const projectId = params.projectId

    const isEdit = !!projectId

    const {
        isAdmin,
        isCopilot,
        loginUserInfo,
    }: WorkAppContextModel = useContext(WorkAppContext)

    const currentUserId = normalizeUserId(loginUserInfo?.userId)

    const projectResult = useFetchProject(projectId)
    const projectTypesResult = useFetchProjectTypes()

    const canCreateProject = isAdmin || isCopilot
    const canManageProject = isAdmin
        || isCopilot
        || hasProjectManagePermission(projectResult.project, currentUserId)
    const shouldRedirect = shouldRedirectToProjects(
        isEdit,
        canCreateProject,
        canManageProject,
        projectResult.isLoading,
        !!projectResult.project,
    )

    const isLoading = projectTypesResult.isLoading
        || (isEdit && projectResult.isLoading)

    const loadError = projectResult.error || projectTypesResult.error

    const breadCrumb = useMemo(
        () => [
            {
                index: 1,
                label: 'Projects',
            },
            {
                index: 2,
                label: isEdit ? 'Edit Project' : 'Create Project',
            },
        ],
        [isEdit],
    )

    const pageTitle = isEdit
        ? 'Edit Project'
        : 'Create Project'

    const backUrl = isEdit && projectId
        ? `/projects/${projectId}/challenges`
        : '/projects'

    const handleSuccess = useCallback(
        (project: Project): void => {
            if (!isEdit) {
                return
            }

            projectResult.mutate(project, false)
                .catch(() => undefined)
        },
        [isEdit, projectResult],
    )

    if (shouldRedirect) {
        return <Navigate replace to='/projects' />
    }

    return (
        <PageWrapper
            backUrl={backUrl}
            breadCrumb={breadCrumb}
            pageTitle={pageTitle}
        >
            <div className={styles.container}>
                {renderEditorContent({
                    canManageProject,
                    isEdit,
                    isLoading,
                    loadError,
                    onSuccess: handleSuccess,
                    project: projectResult.project,
                    projectTypes: projectTypesResult.projectTypes,
                })}
            </div>
        </PageWrapper>
    )
}

export default ProjectEditorPage
