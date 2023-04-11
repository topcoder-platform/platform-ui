import { useContext } from 'react'

import { RestrictedPage } from '~/libs/ui'

import { profileContext, ProfileContextData } from '../profile'

interface RestrictedRouteProps {
    children: JSX.Element
    loginUrl: string
    rolesRequired?: Array<string>
}

const RestrictedRoute: (props: RestrictedRouteProps) => JSX.Element = props => {

    const profileContextData: ProfileContextData = useContext(profileContext)
    const { profile, initialized }: ProfileContextData = profileContextData

    // if we're not initialized yet, just return the children
    if (!initialized) {
        return props.children
    }

    // if we have a profile and `rolesRequired` is configured for the route
    // check the user's roles, allow access or show restricted page
    if (!!profile) {
        if (props.rolesRequired) {
            if (!profile.roles) {
                return RestrictedPage
            }

            // if the profile doesn't include all the required roles, show the restricted page
            if (props.rolesRequired.some(role => !profile.roles.includes(role))) {
                return RestrictedPage
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
