/**
 * Common config for routes in admin app.
 */
import { AppSubdomain, EnvironmentConfig } from '~/config'

export const rootRoute: string
    = EnvironmentConfig.SUBDOMAIN === AppSubdomain.admin
        ? ''
        : `/${AppSubdomain.admin}`

export const manageChallengeRouteId = 'challenge-management'
export const manageReviewRouteId = 'review-management'
export const userManagementRouteId = 'user-management'
export const billingAccountRouteId = 'billing-account'
export const permissionManagementRouteId = 'permission-management'
export const gamificationAdminRouteId = 'gamification-admin'
export const termsRouteId = 'terms'
export const platformRouteId = 'platform'
export const paymentsRouteId = 'payments'
