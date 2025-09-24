import { FC, useCallback, useContext } from 'react'
import { NavigateFunction, useNavigate } from 'react-router-dom'

import { Button } from '~/libs/ui'
import { profileContext, ProfileContextData } from '~/libs/core'

import { getAuthenticateAndEnrollRoute, getTCACertificationEnrollPath } from '../../learn.routes'

interface EnrollCtaBtnProps {
    certification: string
}

const EnrollCtaBtn: FC<EnrollCtaBtnProps> = (props: EnrollCtaBtnProps) => {
    const navigate: NavigateFunction = useNavigate()
    const { initialized: profileReady, profile }: ProfileContextData = useContext(profileContext)

    const isLoggedIn: boolean = profileReady && !!profile

    /**
     * Handle user click on start course/resume/login button
     */
    const handleEnrollClick: () => void = useCallback(() => {

        // if user is not logged in, redirect to login page
        if (!isLoggedIn) {
            // add a flag to the return url to show the academic policy modal
            // or resume the course when they're back
            window.location.href = getAuthenticateAndEnrollRoute()
            return
        }

        navigate(getTCACertificationEnrollPath(props.certification))
    }, [isLoggedIn, props, navigate])

    return (
        <>
            <Button
                primary
                size='lg'
                label={isLoggedIn ? 'Enroll Now' : 'Log in to enroll'}
                onClick={handleEnrollClick}
            />
        </>
    )
}

export default EnrollCtaBtn
