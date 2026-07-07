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
    budgetApprovalsRouteId,
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
    projectAssetsRouteId,
    projectCreateRouteId,
    projectEditRouteId,
    projectInvitationsRouteId,
    projectShowcaseRouteId,
    projectsRouteId,
    roleErrorRoute,
    roleErrorRouteId,
    rootRoute,
    taasCreateRouteId,
    taasEditRouteId,
    taasRouteId,
    usersRouteId,
} from './config/routes.config'
import { WORK_MANAGER_ALLOWED_ROLES } from './config/access.config'
import {
    ErrorMessage,
    ProjectRouteAccessGuard,
} from './lib/components'
import { WorkAppContext } from './lib/contexts'
import { WorkAppContextModel } from './lib/models'
import { canViewAllEngagements } from './lib/utils'

const WorkApp: LazyLoadedComponent = lazyLoad(() => import('./WorkApp'))

const ChallengesListPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/challenges/ChallengesListPage'),
)

const ChallengeEditorPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/challenges/ChallengeEditorPage'),
)

const ChallengeRouteRedirectPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/challenges/ChallengeRouteRedirectPage/ChallengeRouteRedirectPage'),
)

const ProjectsListPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/projects/ProjectsListPage'),
)

const BudgetApprovalsPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/budget-approvals/BudgetApprovalsPage'),
)

const ProjectEditorPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/projects/ProjectEditorPage'),
)

const ProjectAssetsPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/assets/ProjectAssetsPage'),
)

const ProjectShowcasePage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/showcase/ProjectShowcasePage'),
)

const EngagementsListPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/engagements/EngagementsListPage'),
)

const EngagementEditorPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/engagements/EngagementEditorPage'),
)

const ApplicationsListPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/engagements/ApplicationsListPage'),
)

const EngagementPaymentPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/engagements/EngagementPaymentPage'),
)

const EngagementFeedbackPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/engagements/EngagementFeedbackPage'),
)

const EngagementExperiencePage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/engagements/EngagementExperiencePage'),
)

const TaasListPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/taas/TaasListPage'),
)

const TaasProjectFormPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/taas/TaasProjectFormPage'),
)

const UsersManagementPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/users/UsersManagementPage'),
)

const ProjectInvitationsPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/invitations/ProjectInvitationsPage'),
)

const GroupsPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/groups/GroupsPage'),
)

const GroupEditPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/groups/GroupEditPage'),
)

const RoleErrorPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/role-error/RoleErrorPage'),
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

const EngagementsRouteGuard: FC<PropsWithChildren> = (props: PropsWithChildren) => {
    const contextValue: WorkAppContextModel = useContext(WorkAppContext)

    if (!canViewAllEngagements(contextValue.userRoles)) {
        return <ErrorMessage message='You need Admin or Talent Manager role to view all engagements.' />
    }

    return <>{props.children}</>
}

const BudgetApprovalsRouteGuard: FC<PropsWithChildren> = (props: PropsWithChildren) => {
    const contextValue: WorkAppContextModel = useContext(WorkAppContext)

    if (!contextValue.isAdmin && !contextValue.isManager) {
        return <ErrorMessage message='You need Admin or Manager role to view Budget Approvals.' />
    }

    return <>{props.children}</>
}

export const toolTitle: string = ToolTitle.work

export const workRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: true,
        children: [
            {
                authRequired: true,
                element: <RoleErrorPage />,
                route: roleErrorRouteId,
                title: 'Role Error',
            },
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
                element: <ChallengesListPage />,
                route: '/projects/:projectId/challenges',
                title: 'Challenges',
            },
            {
                authRequired: true,
                element: <Rewrite to='/projects/:projectId/challenges' />,
                route: '/projects/:projectId',
                title: 'Project Overview',
            },
            {
                authRequired: true,
                element: <ChallengeEditorPage />,
                id: challengeCreateRouteId,
                route: '/projects/:projectId/challenges/new',
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
                element: <ChallengeEditorPage />,
                route: `${challengesRouteId}/:challengeId/view`,
                title: 'View Challenge',
            },
            {
                authRequired: true,
                element: <ChallengeEditorPage />,
                route: '/projects/:projectId/challenges/:challengeId/edit',
                title: 'Edit Challenge',
            },
            {
                authRequired: true,
                element: <ChallengeEditorPage />,
                route: '/projects/:projectId/challenges/:challengeId/view',
                title: 'View Challenge',
            },
            {
                authRequired: true,
                element: <ChallengeRouteRedirectPage />,
                route: '/challenges/:challengeId',
                title: 'View Challenge',
            },
            {
                authRequired: true,
                element: (
                    <ProjectRouteAccessGuard pageTitle='Project Assets'>
                        <ProjectAssetsPage />
                    </ProjectRouteAccessGuard>
                ),
                id: projectAssetsRouteId,
                route: '/projects/:projectId/assets',
                title: 'Project Assets',
            },
            {
                authRequired: true,
                element: (
                    <ProjectRouteAccessGuard pageTitle='Showcase'>
                        <ProjectShowcasePage />
                    </ProjectRouteAccessGuard>
                ),
                id: projectShowcaseRouteId,
                route: '/projects/:projectId/showcase',
                title: 'Showcase',
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
                element: (
                    <BudgetApprovalsRouteGuard>
                        <BudgetApprovalsPage />
                    </BudgetApprovalsRouteGuard>
                ),
                id: budgetApprovalsRouteId,
                route: budgetApprovalsRouteId,
                title: 'Budget Approvals',
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
                element: (
                    <EngagementsRouteGuard>
                        <EngagementsListPage />
                    </EngagementsRouteGuard>
                ),
                id: engagementsRouteId,
                route: engagementsRouteId,
                title: 'Engagements',
            },
            {
                authRequired: true,
                element: (
                    <ProjectRouteAccessGuard pageTitle='Engagements'>
                        <EngagementsListPage />
                    </ProjectRouteAccessGuard>
                ),
                route: '/projects/:projectId/engagements',
                title: 'Engagements',
            },
            {
                authRequired: true,
                element: (
                    <ProjectRouteAccessGuard pageTitle='Create Engagement'>
                        <EngagementEditorPage />
                    </ProjectRouteAccessGuard>
                ),
                id: engagementCreateRouteId,
                route: '/projects/:projectId/engagements/new',
                title: 'Create Engagement',
            },
            {
                authRequired: true,
                element: (
                    <ProjectRouteAccessGuard pageTitle='Edit Engagement'>
                        <EngagementEditorPage />
                    </ProjectRouteAccessGuard>
                ),
                id: engagementEditRouteId,
                route: '/projects/:projectId/engagements/:engagementId',
                title: 'Edit Engagement',
            },
            {
                authRequired: true,
                element: (
                    <ProjectRouteAccessGuard pageTitle='Applications'>
                        <ApplicationsListPage />
                    </ProjectRouteAccessGuard>
                ),
                id: engagementApplicationsRouteId,
                route: '/projects/:projectId/engagements/:engagementId/applications',
                title: 'Applications',
            },
            {
                authRequired: true,
                element: (
                    <ProjectRouteAccessGuard pageTitle='Assignments'>
                        <EngagementPaymentPage />
                    </ProjectRouteAccessGuard>
                ),
                id: engagementAssignmentsRouteId,
                route: '/projects/:projectId/engagements/:engagementId/assignments',
                title: 'Assignments',
            },
            {
                authRequired: true,
                element: (
                    <ProjectRouteAccessGuard pageTitle='Feedback'>
                        <EngagementFeedbackPage />
                    </ProjectRouteAccessGuard>
                ),
                id: engagementFeedbackRouteId,
                route: '/projects/:projectId/engagements/:engagementId/assignments/:assignmentId/feedback',
                title: 'Feedback',
            },
            {
                authRequired: true,
                element: (
                    <ProjectRouteAccessGuard pageTitle='Experience'>
                        <EngagementExperiencePage />
                    </ProjectRouteAccessGuard>
                ),
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
                route: '/projects/:projectId/accept/:inviteId',
                title: 'Project Invitations',
            },
            {
                authRequired: true,
                element: <ProjectInvitationsPage />,
                route: '/projects/:projectId/decline/:inviteId',
                title: 'Project Invitations',
            },
            {
                authRequired: true,
                element: <ProjectInvitationsPage />,
                route: '/projects/:projectId/invitation/:action?',
                title: 'Project Invitations',
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
                element: (
                    <ProjectRouteAccessGuard pageTitle='Users'>
                        <UsersManagementPage />
                    </ProjectRouteAccessGuard>
                ),
                id: usersRouteId,
                route: '/projects/:projectId/users',
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
        roleErrorRoute,
        rolesRequired: WORK_MANAGER_ALLOWED_ROLES,
        route: rootRoute,
        title: toolTitle,
    },
]
