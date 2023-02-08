import { FC, useCallback, useContext } from 'react'

import { Button, profileContext, ProfileContextData } from '../../../../lib'
import { getAuthenticateAndEnrollRoute } from '../../learn.routes'

interface EnrollCtaBtnProps {
    onEnroll: () => void
}

const EnrollCtaBtn: FC<EnrollCtaBtnProps> = (props: EnrollCtaBtnProps) => {
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

        // if the user is wipro and s/he hasn't set up DICE,
        // let the user know
        if (profile?.isWipro && !profile.diceEnabled) {
            // setIsDiceModalOpen(true)
            return
        }

        props.onEnroll()
    }, [isLoggedIn, profile?.isWipro, profile?.diceEnabled, props.onEnroll])

    return (
        <>
            <Button
                buttonStyle='primary'
                size='md'
                label={isLoggedIn ? 'Enroll Now' : 'Log in to enroll'}
                onClick={handleEnrollClick}
            />
        </>
    )
}

export default EnrollCtaBtn
