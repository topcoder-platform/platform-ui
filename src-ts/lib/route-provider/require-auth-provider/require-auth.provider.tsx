import { useContext } from 'react'

import { profileContext, ProfileContextData } from '../../profile-provider'

interface RequireAuthProviderProps {
    children: JSX.Element
    loginUrl: string
}

function RequireAuthProvider(props: RequireAuthProviderProps): JSX.Element {

    const profileContextData: ProfileContextData = useContext(profileContext)
    const { profile, initialized }: ProfileContextData = profileContextData

    // if we have a profile or we're not initialized yet, just return the children
    if (!initialized || !!profile) {
        return props.children
    }

    // redirect to the login page
    window.location.href = props.loginUrl
    return <></>
}

export default RequireAuthProvider
