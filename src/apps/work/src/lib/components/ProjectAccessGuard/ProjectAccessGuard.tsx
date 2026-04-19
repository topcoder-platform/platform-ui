import {
    FC,
    PropsWithChildren,
    useContext,
    useMemo,
} from 'react'
import {
    Location,
    Navigate,
    useLocation,
    useParams,
} from 'react-router-dom'

import {
    ErrorMessage,
    LoadingSpinner,
} from '..'
import { WorkAppContext } from '../../contexts'
import {
    useFetchProject,
    UseFetchProjectResult,
} from '../../hooks'
import {
    checkIsUserInvitedToProject,
    checkProjectMembership,
    getAuthAccessToken,
} from '../../utils'

export const PROJECT_ACCESS_ERROR_MESSAGE
    = 'You don’t have access to this project. Please contact support@topcoder.com.'

/**
 * Returns whether the current route already targets the project invitation flow.
 *
 * @param pathname current router pathname.
 * @returns `true` when the path is an invitation, accept, or decline route.
 */
function isProjectInvitationPath(pathname: string): boolean {
    const normalizedPathname = pathname
        .trim()
        .toLowerCase()

    return normalizedPathname.includes('/invitations')
        || normalizedPathname.includes('/accept/')
        || normalizedPathname.includes('/decline/')
}

/**
 * Builds the canonical invitation route for a project.
 *
 * @param projectId route project identifier.
 * @returns the encoded invitation path for the project.
 */
function buildProjectInvitationPath(projectId: string): string {
    return `/projects/${encodeURIComponent(projectId)}/invitations`
}

/**
 * Returns whether the current caller should be treated as invited to the project.
 *
 * @param accessToken decoded caller token used for invite matching.
 * @param project loaded project payload.
 * @returns `true` when the project is marked invited or contains a matching invite.
 */
function hasInvitationAccess(
    accessToken: string,
    project: Parameters<typeof checkIsUserInvitedToProject>[1] | undefined,
): boolean {
    if (!project) {
        return false
    }

    return project.isInvited === true
        || !!checkIsUserInvitedToProject(accessToken, project)
}

/**
 * Blocks unauthorized project-scoped Work Manager routes before page content loads.
 *
 * Admins and managers retain global project access. Project members can open
 * project routes normally. Invitees are redirected into the invitation flow so
 * they can accept or decline access instead of opening project workspace pages.
 *
 * @param props wrapped project route element.
 * @returns a loading state, invitation redirect, access error, or the child route.
 */
export const ProjectAccessGuard: FC<PropsWithChildren> = (props: PropsWithChildren) => {
    const location: Location = useLocation()
    const {
        projectId: routeProjectId,
    }: Readonly<{ projectId?: string }> = useParams<'projectId'>()
    const projectId = routeProjectId?.trim() || ''
    const workAppContext = useContext(WorkAppContext)
    const isPrivilegedUser = workAppContext.isAdmin || workAppContext.isManager
    const shouldWaitForIdentity = !isPrivilegedUser && workAppContext.loginUserInfo?.userId === undefined
    const projectResult: UseFetchProjectResult = useFetchProject(projectId || undefined)
    const accessToken = useMemo(
        () => getAuthAccessToken(workAppContext.loginUserInfo),
        [workAppContext.loginUserInfo],
    )
    const hasInviteAccess = hasInvitationAccess(accessToken, projectResult.project)
    const hasProjectAccess = isPrivilegedUser
        || checkProjectMembership(projectResult.project, workAppContext.loginUserInfo?.userId)
        || hasInviteAccess

    if (!projectId) {
        return <ErrorMessage message='Project id is required.' />
    }

    if (shouldWaitForIdentity || projectResult.isLoading) {
        return <LoadingSpinner />
    }

    if (projectResult.error) {
        return <ErrorMessage message={projectResult.error.message} />
    }

    if (hasInviteAccess && !isProjectInvitationPath(location.pathname)) {
        return (
            <Navigate
                replace
                to={buildProjectInvitationPath(projectId)}
            />
        )
    }

    if (!hasProjectAccess) {
        return <ErrorMessage message={PROJECT_ACCESS_ERROR_MESSAGE} />
    }

    return <>{props.children}</>
}

export default ProjectAccessGuard
