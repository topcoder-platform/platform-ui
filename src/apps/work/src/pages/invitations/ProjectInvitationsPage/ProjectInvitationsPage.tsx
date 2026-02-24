import {
    FC,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import {
    BaseModal,
    Button,
} from '~/libs/ui'

import { LoadingSpinner } from '../../../lib/components'
import { ConfirmationModal } from '../../../lib/components/ConfirmationModal'
import { PROJECT_MEMBER_INVITE_STATUS } from '../../../lib/constants/project-roles.constants'
import { WorkAppContext } from '../../../lib/contexts'
import {
    useFetchProject,
    UseFetchProjectResult,
} from '../../../lib/hooks'
import {
    Project,
    ProjectInvite,
    WorkAppContextModel,
} from '../../../lib/models'
import { updateProjectMemberInvite } from '../../../lib/services'
import {
    checkIsUserInvitedToProject,
    getAuthAccessToken,
    showErrorToast,
} from '../../../lib/utils'

import styles from './ProjectInvitationsPage.module.scss'

function toOptionalString(value: unknown): string | undefined {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalizedValue = String(value)
        .trim()

    return normalizedValue || undefined
}

function resolveAutomaticActionStatus(
    action: string | undefined,
    pathname: string,
): string | undefined {
    const normalizedAction = action
        ? action
            .trim()
            .toLowerCase()
        : ''

    if (
        normalizedAction === PROJECT_MEMBER_INVITE_STATUS.ACCEPTED
        || normalizedAction === 'accept'
    ) {
        return PROJECT_MEMBER_INVITE_STATUS.ACCEPTED
    }

    if (
        normalizedAction === PROJECT_MEMBER_INVITE_STATUS.REFUSED
        || normalizedAction === 'decline'
    ) {
        return PROJECT_MEMBER_INVITE_STATUS.REFUSED
    }

    const normalizedPath = pathname
        .trim()
        .toLowerCase()

    if (normalizedPath.includes('/accept/')) {
        return PROJECT_MEMBER_INVITE_STATUS.ACCEPTED
    }

    if (normalizedPath.includes('/decline/')) {
        return PROJECT_MEMBER_INVITE_STATUS.REFUSED
    }

    return undefined
}

export const ProjectInvitationsPage: FC = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const routeParams: Readonly<{
        action?: string
        inviteId?: string
        projectId?: string
    }> = useParams<'action' | 'inviteId' | 'projectId'>()
    const [hasProcessedAutomaticAction, setHasProcessedAutomaticAction] = useState<boolean>(false)
    const [processedStatus, setProcessedStatus] = useState<string | undefined>(undefined)
    const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | undefined>(undefined)

    const projectId = useMemo((): string => {
        if (!routeParams.projectId) {
            return ''
        }

        return routeParams.projectId.trim()
    }, [routeParams.projectId])

    const automaticAction = useMemo(
        () => resolveAutomaticActionStatus(routeParams.action, location.pathname),
        [location.pathname, routeParams.action],
    )
    const inviteIdFromRoute = useMemo(
        () => toOptionalString(routeParams.inviteId),
        [routeParams.inviteId],
    )

    const source: string | undefined = useMemo(() => {
        const query = new URLSearchParams(location.search)

        return query.get('source') || undefined
    }, [location.search])

    const projectResult: UseFetchProjectResult = useFetchProject(projectId || undefined)
    const projectError: Error | undefined = projectResult.error
    const isProjectLoading: boolean = projectResult.isLoading
    const project: Project | undefined = projectResult.project

    const {
        loginUserInfo,
    }: WorkAppContextModel = useContext(WorkAppContext)
    const accessToken = useMemo(
        () => getAuthAccessToken(loginUserInfo),
        [loginUserInfo],
    )

    const invitationById = useMemo(() => {
        if (!project?.invites || !inviteIdFromRoute) {
            return undefined
        }

        return project.invites.find(invite => toOptionalString(invite.id) === inviteIdFromRoute)
    }, [inviteIdFromRoute, project])

    const invitation = useMemo(
        (): ProjectInvite | undefined => invitationById
            || checkIsUserInvitedToProject(accessToken, project || {
                id: projectId,
                name: '',
                status: 'active',
            }),
        [accessToken, invitationById, project, projectId],
    )
    const invitationId = useMemo(
        () => inviteIdFromRoute || toOptionalString(invitation?.id),
        [inviteIdFromRoute, invitation?.id],
    )
    const projectName = useMemo(
        () => toOptionalString(project?.name) || `Project ${projectId}`,
        [project?.name, projectId],
    )
    const resultTitle = useMemo(
        () => {
            if (processedStatus === PROJECT_MEMBER_INVITE_STATUS.ACCEPTED) {
                return 'Invitation Accepted'
            }

            return 'Invitation Declined'
        },
        [processedStatus],
    )
    const resultMessage = useMemo(
        () => {
            if (processedStatus === PROJECT_MEMBER_INVITE_STATUS.ACCEPTED) {
                return `You are now part of project "${projectName}".`
            }

            return `You have declined the invitation to join project "${projectName}".`
        },
        [processedStatus, projectName],
    )
    const resultButtonLabel = useMemo(
        () => {
            if (processedStatus === PROJECT_MEMBER_INVITE_STATUS.ACCEPTED) {
                return 'Go to project'
            }

            return 'Go to work'
        },
        [processedStatus],
    )

    const redirectToDefault = useCallback(() => {
        navigate('/projects')
    }, [navigate])

    const redirectToSiteRoot = useCallback(() => {
        window.location.assign(window.location.origin)
    }, [])

    const redirectAfterUpdate = useCallback((status: string): void => {
        if (status === PROJECT_MEMBER_INVITE_STATUS.ACCEPTED) {
            navigate(`/projects/${projectId}/challenges`)
            return
        }

        redirectToSiteRoot()
    }, [navigate, projectId, redirectToSiteRoot])

    const updateInvitationStatus = useCallback(
        async (status: string): Promise<void> => {
            if (isUpdatingStatus || !projectId || !invitationId) {
                return
            }

            setIsUpdatingStatus(status)

            try {
                await updateProjectMemberInvite(
                    projectId,
                    invitationId,
                    status,
                    source,
                )
                setProcessedStatus(status)
            } catch (error) {
                showErrorToast(error instanceof Error
                    ? error.message
                    : 'Failed to update invitation status')
                redirectToDefault()
            } finally {
                setIsUpdatingStatus(undefined)
            }
        },
        [
            invitationId,
            isUpdatingStatus,
            projectId,
            redirectToDefault,
            source,
        ],
    )

    const acceptInvitation = useCallback(() => {
        updateInvitationStatus(PROJECT_MEMBER_INVITE_STATUS.ACCEPTED)
    }, [updateInvitationStatus])

    const declineInvitation = useCallback(() => {
        updateInvitationStatus(PROJECT_MEMBER_INVITE_STATUS.REFUSED)
    }, [updateInvitationStatus])

    const closeResultModal = useCallback(() => {
        if (!processedStatus) {
            return
        }

        redirectAfterUpdate(processedStatus)
    }, [processedStatus, redirectAfterUpdate])

    useEffect(() => {
        if (!processedStatus) {
            return undefined
        }

        const timeoutId = window.setTimeout(() => {
            redirectAfterUpdate(processedStatus)
        }, 2200)

        return () => {
            window.clearTimeout(timeoutId)
        }
    }, [processedStatus, redirectAfterUpdate])

    useEffect(() => {
        if (!projectId) {
            redirectToDefault()
            return
        }

        if (projectError) {
            showErrorToast(projectError.message)
            redirectToDefault()
            return
        }

        if (isProjectLoading || !project) {
            return
        }

        if (!invitationId) {
            redirectToDefault()
            return
        }

        if (automaticAction && !hasProcessedAutomaticAction) {
            setHasProcessedAutomaticAction(true)
            updateInvitationStatus(automaticAction)
        }
    }, [
        automaticAction,
        hasProcessedAutomaticAction,
        invitationId,
        isProjectLoading,
        project,
        projectError,
        projectId,
        redirectToDefault,
        updateInvitationStatus,
    ])

    const isUpdating = !!isUpdatingStatus
    const shouldShowInvitationPrompt = !!project && !!invitation && !automaticAction && !processedStatus

    if (!projectId || isProjectLoading || isUpdating) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingSpinner />
            </div>
        )
    }

    if (!project || !invitationId) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingSpinner />
            </div>
        )
    }

    return (
        <div className={styles.container}>
            {processedStatus
                ? (
                    <BaseModal
                        buttons={(
                            <Button
                                label={resultButtonLabel}
                                onClick={closeResultModal}
                                primary
                            />
                        )}
                        onClose={closeResultModal}
                        open
                        size='md'
                        title={resultTitle}
                    >
                        <p className={styles.resultMessage}>
                            {resultMessage}
                        </p>
                    </BaseModal>
                )
                : undefined}

            {shouldShowInvitationPrompt
                ? (
                    <ConfirmationModal
                        cancelText='Decline'
                        confirmText='Join project'
                        message={`You have been invited to join "${project.name}". `
                            + 'Once you join, you can access project details and deliverables.'}
                        onCancel={declineInvitation}
                        onConfirm={acceptInvitation}
                        title='You are invited to join this project'
                    />
                )
                : undefined}
        </div>
    )
}

export default ProjectInvitationsPage
