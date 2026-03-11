import { FC } from 'react'
import { Navigate } from 'react-router-dom'

import { ProfileContextData, useProfileContext } from '~/libs/core'

import { manageChallengeRouteId, reportsRouteId } from './config/routes.config'
import { isAdministrator } from './lib/utils'

/**
 * Redirects authenticated admin-app users to the first route they can access.
 */
const AdminHomeRedirect: FC = () => {
    const { profile }: ProfileContextData = useProfileContext()
    const defaultRoute: string = isAdministrator(profile?.roles)
        ? manageChallengeRouteId
        : reportsRouteId

    return <Navigate replace to={defaultRoute} />
}

export default AdminHomeRedirect
