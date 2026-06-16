import { FC, useContext, useEffect } from 'react'
import { NavigateFunction, useNavigate } from 'react-router-dom'

import { profileContext, ProfileContextData } from '~/libs/core'

import { rootRoute } from '../profiles.routes'

const ProfilesLandingPage: FC = () => {
    const navigate: NavigateFunction = useNavigate()

    const { profile: authProfile }: ProfileContextData = useContext(profileContext)

    // redirect to profile page if logged in
    useEffect(() => {
        if (authProfile) {
            navigate(`${rootRoute}/${authProfile.handle}`)
        }
    }, [authProfile, navigate])

    return (
        // TODO: no profile specified - redirect to talent search or dedicated page
        <></>
    )
}

export default ProfilesLandingPage
