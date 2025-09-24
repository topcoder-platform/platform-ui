import { FC, useContext } from 'react'

import { RestrictedPage } from '~/libs/shared'
import { LoadingSpinner } from '~/libs/ui'

import { profileContext, ProfileContextData } from '../profile'

interface RestrictedRouteProps {
    children: JSX.Element
    loginUrl: string
    rolesRequired?: Array<string>
}

const RestrictedRoute: FC<RestrictedRouteProps> = props => {

    const profileContextData: ProfileContextData = useContext(profileContext)
    const { profile, initialized }: ProfileContextData = profileContextData

    // if we're not initialized yet, just return the children
    if (!initialized) {
        return <LoadingSpinner />
    }

    // if we have a profile and `rolesRequired` is configured for the route
    // check the user's roles, allow access or show restricted page
    if (!!profile) {
        if (props.rolesRequired) {
            // if the profile doesn't include all the required roles, show the restricted page
            if (!profile.roles || !props.rolesRequired.some(role => profile.roles.includes(role))) {
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

export default RestrictedRoute
