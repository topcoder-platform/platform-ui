import {
    FC,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

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
    WorkAppContextModel,
} from '../../../lib/models'
import { updateProjectMemberInvite } from '../../../lib/services'
import {
    checkIsUserInvitedToProject,
    getAuthAccessToken,
    showErrorToast,
    showSuccessToast,
} from '../../../lib/utils'

import styles from './ProjectInvitationsPage.module.scss'

export const ProjectInvitationsPage: FC = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const routeParams: Readonly<{
        action?: string
        projectId?: string
    }> = useParams<'action' | 'projectId'>()
    const [hasProcessedAutomaticAction, setHasProcessedAutomaticAction] = useState<boolean>(false)
    const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | undefined>(undefined)

    const projectId = useMemo((): string => {
        if (!routeParams.projectId) {
            return ''
        }

        return routeParams.projectId.trim()
    }, [routeParams.projectId])

    const automaticAction = useMemo(() => {
        const actionValue = routeParams.action
            ? routeParams.action
                .trim()
                .toLowerCase()
            : ''

        if (actionValue === PROJECT_MEMBER_INVITE_STATUS.ACCEPTED) {
            return PROJECT_MEMBER_INVITE_STATUS.ACCEPTED
        }

        if (actionValue === PROJECT_MEMBER_INVITE_STATUS.REFUSED) {
            return PROJECT_MEMBER_INVITE_STATUS.REFUSED
        }

        return undefined
    }, [routeParams.action])

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

    const invitation = useMemo(
        () => checkIsUserInvitedToProject(accessToken, project || {
            id: projectId,
            name: '',
            status: 'active',
        }),
        [accessToken, project, projectId],
    )

    const redirectToDefault = useCallback(() => {
        navigate('/projects')
    }, [navigate])

    const updateInvitationStatus = useCallback(
        async (status: string): Promise<void> => {
            if (isUpdatingStatus || !projectId || !invitation?.id) {
                return
            }

            setIsUpdatingStatus(status)

            try {
                await updateProjectMemberInvite(
                    projectId,
                    String(invitation.id),
                    status,
                    source,
                )

                showSuccessToast(`Successfully ${status} the invitation.`)
                navigate(status === PROJECT_MEMBER_INVITE_STATUS.ACCEPTED
                    ? `/projects/${projectId}/challenges`
                    : '/projects')
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
            invitation?.id,
            isUpdatingStatus,
            navigate,
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

        if (!invitation) {
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
        invitation,
        isProjectLoading,
        project,
        projectError,
        projectId,
        redirectToDefault,
        updateInvitationStatus,
    ])

    const isUpdating = !!isUpdatingStatus

    if (!projectId || isProjectLoading || isUpdating) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingSpinner />
            </div>
        )
    }

    if (!project || !invitation) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingSpinner />
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <ConfirmationModal
                cancelText='Decline'
                confirmText='Join project'
                message={`You have been invited to join "${project.name}". `
                    + 'Once you join, you can access project details and deliverables.'}
                onCancel={declineInvitation}
                onConfirm={acceptInvitation}
                title='You are invited to join this project'
            />
        </div>
    )
}

export default ProjectInvitationsPage
