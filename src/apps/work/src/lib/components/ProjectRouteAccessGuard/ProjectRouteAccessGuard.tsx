import {
    FC,
    PropsWithChildren,
    useContext,
} from 'react'
import { useParams } from 'react-router-dom'

import { PageWrapper } from '~/apps/review/src/lib'

import { WorkAppContext } from '../../contexts'
import { useFetchProject } from '../../hooks'
import { WorkAppContextModel } from '../../models'
import { checkProjectAccess } from '../../utils'
import { ErrorMessage } from '../ErrorMessage'
import { LoadingSpinner } from '../LoadingSpinner'

export const PROJECT_ACCESS_DENIED_MESSAGE
    = 'You don’t have access to this project. Please contact support@topcoder.com.'

interface ProjectRouteAccessGuardProps extends PropsWithChildren {
    pageTitle: string
}

/**
 * Blocks project-scoped Work routes until the current user has project access.
 *
 * @param props child route content and fallback page title used while access is loading or denied.
 * @returns child route content when the project exists and the caller is an admin or project member.
 * @remarks Used by project workspace routes so unauthorized users do not mount pages that fetch project child data.
 * Access decisions use cached project data when available, so SWR revalidation errors do not block authorized users.
 * @throws Does not throw; missing project access renders the standard project access denial message.
 */
export const ProjectRouteAccessGuard: FC<ProjectRouteAccessGuardProps> = (
    props: ProjectRouteAccessGuardProps,
) => {
    const params: Readonly<{ projectId?: string }> = useParams<'projectId'>()
    const projectId = params.projectId?.trim()

    const workAppContext = useContext(WorkAppContext) as WorkAppContextModel
    const projectResult = useFetchProject(projectId || undefined)

    if (!projectId) {
        return <>{props.children}</>
    }

    if (projectResult.isLoading) {
        return (
            <PageWrapper
                breadCrumb={[]}
                pageTitle={props.pageTitle}
            >
                <LoadingSpinner />
            </PageWrapper>
        )
    }

    const hasProjectAccess = checkProjectAccess(
        workAppContext.userRoles,
        workAppContext.loginUserInfo?.userId,
        projectResult.project,
    )

    if (!hasProjectAccess) {
        return (
            <PageWrapper
                breadCrumb={[]}
                pageTitle={props.pageTitle}
            >
                <ErrorMessage message={PROJECT_ACCESS_DENIED_MESSAGE} />
            </PageWrapper>
        )
    }

    return <>{props.children}</>
}

export default ProjectRouteAccessGuard
