import { FC, useContext } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { RestrictedPage } from '~/libs/shared'
import { LoadingSpinner } from '~/libs/ui'

import { profileContext, ProfileContextData } from '../profile'

interface RestrictedRouteProps {
    children: JSX.Element
    loginUrl: string
    roleErrorRoute?: string
    rolesRequired?: Array<string>
}

const RestrictedRoute: FC<RestrictedRouteProps> = props => {

    const profileContextData: ProfileContextData = useContext(profileContext)
    const { profile, initialized }: ProfileContextData = profileContextData
    const location = useLocation()
    const normalizedPath = normalizePath(location.pathname)
    const normalizedRoleErrorPath = props.roleErrorRoute
        ? normalizePath(props.roleErrorRoute)
        : undefined
    const isRoleErrorPath = !!normalizedRoleErrorPath && normalizedPath === normalizedRoleErrorPath

    // if we're not initialized yet, just return the children
    if (!initialized) {
        return <LoadingSpinner />
    }

    // if we have a profile and `rolesRequired` is configured for the route
    // check the user's roles, allow access or show restricted page
    if (!!profile) {
        if (props.rolesRequired) {
            // if the profile doesn't include any required role, show the restricted page
            if (!profile.roles || !props.rolesRequired.some(role => profile.roles.includes(role))) {
                if (props.roleErrorRoute && normalizedRoleErrorPath && !isRoleErrorPath) {
                    return (
                        <Navigate replace to={props.roleErrorRoute} />
                    )
                }

                if (isRoleErrorPath) {
                    return props.children
                }

                return <RestrictedPage />
            }

            return props.children
        }

        return props.children

    }

    // redirect to the login page
    window.location.href = props.loginUrl
    return <></>
}

function normalizePath(path: string): string {
    if (path === '/') {
        return path
    }

    return path.replace(/\/+$/, '')
}

export default RestrictedRoute
