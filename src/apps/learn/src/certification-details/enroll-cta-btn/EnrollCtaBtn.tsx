import { Dispatch, FC, SetStateAction, useCallback, useContext, useState } from 'react'
import { NavigateFunction, useNavigate } from 'react-router-dom'

import { Button } from '~/libs/ui'
import { profileContext, ProfileContextData } from '~/libs/core'

import { getAuthenticateAndEnrollRoute, getTCACertificationEnrollPath } from '../../learn.routes'
import { LearnConfig } from '../../config'
import { DiceModal } from '../../course-details/course-curriculum/dice-modal'

interface EnrollCtaBtnProps {
    certification: string
}

const EnrollCtaBtn: FC<EnrollCtaBtnProps> = (props: EnrollCtaBtnProps) => {
    const navigate: NavigateFunction = useNavigate()
    const { initialized: profileReady, profile }: ProfileContextData = useContext(profileContext)
    const [isDiceModalOpen, setIsDiceModalOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const isLoggedIn: boolean = profileReady && !!profile

    function onDiceModalClose(): void {
        setIsDiceModalOpen(false)
    }

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
        if (LearnConfig.REQUIRE_DICE_ID && profile?.isWipro && !profile.diceEnabled) {
            setIsDiceModalOpen(true)
            return
        }

        navigate(getTCACertificationEnrollPath(props.certification))
    }, [isLoggedIn, profile?.isWipro, profile?.diceEnabled, props, navigate])

    return (
        <>
            <Button
                primary
                size='lg'
                label={isLoggedIn ? 'Enroll Now' : 'Log in to enroll'}
                onClick={handleEnrollClick}
            />

            <DiceModal
                isOpen={isDiceModalOpen}
                onClose={onDiceModalClose}
            />
        </>
    )
}

export default EnrollCtaBtn
