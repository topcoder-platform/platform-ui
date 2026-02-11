import { AppSubdomain, EnvironmentConfig } from '~/config'

export const rootRoute: string
    = EnvironmentConfig.SUBDOMAIN === AppSubdomain.work
        ? ''
        : `/${AppSubdomain.work}`

export const challengesRouteId = 'challenges'
export const challengeCreateRouteId = 'challenge-create'
export const challengeEditRouteId = 'challenge-edit'
export const projectsRouteId = 'projects'
export const projectCreateRouteId = 'project-create'
export const projectEditRouteId = 'project-edit'
export const taasRouteId = 'taas'
export const taasCreateRouteId = 'taas-create'
export const taasEditRouteId = 'taas-edit'
export const engagementsRouteId = 'engagements'
export const engagementCreateRouteId = 'engagement-create'
export const engagementEditRouteId = 'engagement-edit'
export const engagementApplicationsRouteId = 'engagement-applications'
export const engagementAssignmentsRouteId = 'engagement-assignments'
export const engagementFeedbackRouteId = 'engagement-feedback'
export const engagementExperienceRouteId = 'engagement-experience'
export const usersRouteId = 'users'
export const projectInvitationsRouteId = 'project-invitations'
export const groupsRouteId = 'groups'
export const groupsEditRouteId = 'group-edit'
