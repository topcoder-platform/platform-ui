import {
    FC,
    PropsWithChildren,
    useContext,
} from 'react'

import { AppSubdomain, ToolTitle } from '~/config'
import {
    lazyLoad,
    LazyLoadedComponent,
    PlatformRoute,
    Rewrite,
} from '~/libs/core'

import {
    challengeCreateRouteId,
    challengeEditRouteId,
    challengesRouteId,
    engagementApplicationsRouteId,
    engagementAssignmentsRouteId,
    engagementCreateRouteId,
    engagementEditRouteId,
    engagementExperienceRouteId,
    engagementFeedbackRouteId,
    engagementsRouteId,
    groupsEditRouteId,
    groupsRouteId,
    projectCreateRouteId,
    projectEditRouteId,
    projectInvitationsRouteId,
    projectsRouteId,
    rootRoute,
    taasCreateRouteId,
    taasEditRouteId,
    taasRouteId,
    usersRouteId,
} from './config/routes.config'
import { ErrorMessage } from './lib/components'
import { WorkAppContext } from './lib/contexts'
import { WorkAppContextModel } from './lib/models'

const WorkApp: LazyLoadedComponent = lazyLoad(() => import('./WorkApp'))

const ChallengesListPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/challenges/ChallengesListPage'),
    'ChallengesListPage',
)

const ChallengeEditorPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/challenges/ChallengeEditorPage'),
    'ChallengeEditorPage',
)

const ProjectsListPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/projects/ProjectsListPage'),
    'ProjectsListPage',
)

const ProjectEditorPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/projects/ProjectEditorPage'),
    'ProjectEditorPage',
)

const EngagementsListPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/engagements/EngagementsListPage'),
    'EngagementsListPage',
)

const EngagementEditorPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/engagements/EngagementEditorPage'),
    'EngagementEditorPage',
)

const ApplicationsListPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/engagements/ApplicationsListPage'),
    'ApplicationsListPage',
)

const EngagementPaymentPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/engagements/EngagementPaymentPage'),
    'EngagementPaymentPage',
)

const EngagementFeedbackPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/engagements/EngagementFeedbackPage'),
    'EngagementFeedbackPage',
)

const EngagementExperiencePage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/engagements/EngagementExperiencePage'),
    'EngagementExperiencePage',
)

const TaasListPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/taas/TaasListPage'),
    'TaasListPage',
)

const TaasProjectFormPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/taas/TaasProjectFormPage'),
    'TaasProjectFormPage',
)

const UsersManagementPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/users/UsersManagementPage'),
    'UsersManagementPage',
)

const ProjectInvitationsPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/invitations/ProjectInvitationsPage'),
    'ProjectInvitationsPage',
)

const GroupsPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/groups/GroupsPage'),
    'GroupsPage',
)

const GroupEditPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/groups/GroupEditPage'),
    'GroupEditPage',
)

function canManageGroups(contextValue: WorkAppContextModel): boolean {
    return contextValue.isAdmin || contextValue.isCopilot || contextValue.isManager
}

const GroupsRouteGuard: FC<PropsWithChildren> = (props: PropsWithChildren) => {
    const contextValue: WorkAppContextModel = useContext(WorkAppContext)

    if (!canManageGroups(contextValue)) {
        return <ErrorMessage message='You do not have permission to manage groups.' />
    }

    return <>{props.children}</>
}

export const toolTitle: string = ToolTitle.work

export const workRoutes: ReadonlyArray<PlatformRoute> = [
    {
        children: [
            {
                authRequired: true,
                element: <Rewrite to={challengesRouteId} />,
                route: '',
            },
            {
                authRequired: true,
                element: <ChallengesListPage />,
                id: challengesRouteId,
                route: challengesRouteId,
                title: 'Challenges',
            },
            {
                authRequired: true,
                element: <ChallengeEditorPage />,
                id: challengeCreateRouteId,
                route: `${challengesRouteId}/new`,
                title: 'Create Challenge',
            },
            {
                authRequired: true,
                element: <ChallengeEditorPage />,
                id: challengeEditRouteId,
                route: `${challengesRouteId}/:challengeId/edit`,
                title: 'Edit Challenge',
            },
            {
                authRequired: true,
                element: <ProjectsListPage />,
                id: projectsRouteId,
                route: projectsRouteId,
                title: 'Projects',
            },
            {
                authRequired: true,
                element: <ProjectEditorPage />,
                id: projectCreateRouteId,
                route: `${projectsRouteId}/new`,
                title: 'Create Project',
            },
            {
                authRequired: true,
                element: <ProjectEditorPage />,
                id: projectEditRouteId,
                route: `${projectsRouteId}/:projectId/edit`,
                title: 'Edit Project',
            },
            {
                authRequired: true,
                element: <EngagementsListPage />,
                id: engagementsRouteId,
                route: '/projects/:projectId/engagements',
                title: 'Engagements',
            },
            {
                authRequired: true,
                element: <EngagementEditorPage />,
                id: engagementCreateRouteId,
                route: '/projects/:projectId/engagements/new',
                title: 'Create Engagement',
            },
            {
                authRequired: true,
                element: <EngagementEditorPage />,
                id: engagementEditRouteId,
                route: '/projects/:projectId/engagements/:engagementId',
                title: 'Edit Engagement',
            },
            {
                authRequired: true,
                element: <ApplicationsListPage />,
                id: engagementApplicationsRouteId,
                route: '/projects/:projectId/engagements/:engagementId/applications',
                title: 'Applications',
            },
            {
                authRequired: true,
                element: <EngagementPaymentPage />,
                id: engagementAssignmentsRouteId,
                route: '/projects/:projectId/engagements/:engagementId/assignments',
                title: 'Assignments',
            },
            {
                authRequired: true,
                element: <EngagementFeedbackPage />,
                id: engagementFeedbackRouteId,
                route: '/projects/:projectId/engagements/:engagementId/assignments/:assignmentId/feedback',
                title: 'Feedback',
            },
            {
                authRequired: true,
                element: <EngagementExperiencePage />,
                id: engagementExperienceRouteId,
                route: '/projects/:projectId/engagements/:engagementId/assignments/:assignmentId/experience',
                title: 'Experience',
            },
            {
                authRequired: true,
                element: <TaasListPage />,
                id: taasRouteId,
                route: taasRouteId,
                title: 'TaaS Projects',
            },
            {
                authRequired: true,
                element: <TaasProjectFormPage />,
                id: taasCreateRouteId,
                route: `${taasRouteId}/new`,
                title: 'Create TaaS Project',
            },
            {
                authRequired: true,
                element: <TaasProjectFormPage />,
                id: taasEditRouteId,
                route: `${taasRouteId}/:projectId/edit`,
                title: 'Edit TaaS Project',
            },
            {
                authRequired: true,
                element: <ProjectInvitationsPage />,
                id: projectInvitationsRouteId,
                route: '/projects/:projectId/invitations/:action?',
                title: 'Project Invitations',
            },
            {
                authRequired: true,
                element: <UsersManagementPage />,
                id: usersRouteId,
                route: usersRouteId,
                title: 'Users',
            },
            {
                authRequired: true,
                element: (
                    <GroupsRouteGuard>
                        <GroupsPage />
                    </GroupsRouteGuard>
                ),
                id: groupsRouteId,
                route: groupsRouteId,
                title: 'Groups',
            },
            {
                authRequired: true,
                element: (
                    <GroupsRouteGuard>
                        <GroupEditPage />
                    </GroupsRouteGuard>
                ),
                id: groupsEditRouteId,
                route: `${groupsRouteId}/:groupId/edit`,
                title: 'Edit Group',
            },
        ],
        domain: AppSubdomain.work,
        element: <WorkApp />,
        id: toolTitle,
        route: rootRoute,
        title: toolTitle,
    },
]
