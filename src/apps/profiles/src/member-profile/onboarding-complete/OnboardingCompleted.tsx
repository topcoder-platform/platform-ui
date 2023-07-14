import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { UserProfile } from '~/libs/core'
import { BaseModal, Button } from '~/libs/ui'

import { EDIT_MODE_QUERY_PARAM, profileEditModes } from '../../config'

import styles from './OnboardingCompleted.module.scss'

interface OnboardingCompletedProps {
    authProfile: UserProfile | undefined
}

const OnboardingCompleted: FC<OnboardingCompletedProps> = (props: OnboardingCompletedProps) => {
    const [queryParams]: [URLSearchParams, any] = useSearchParams()

    const editMode: string | null = queryParams.get(EDIT_MODE_QUERY_PARAM)

    const [isOpenModal, setIsOpenModal]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    useEffect(() => {
        if (props.authProfile && editMode === profileEditModes.onboardingCompleted) {
            setIsOpenModal(true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.authProfile])

    function handleInfoModalClose(): void {
        setIsOpenModal(false)
    }

    return (
        <>
            <BaseModal
                onClose={handleInfoModalClose}
                open={isOpenModal}
                size='lg'
                showCloseIcon={false}
                title={<h3 className={styles.modalTitle}>Off to a great start!</h3>}
                buttons={(
                    <div className={styles.modalButtons}>
                        <Button
                            label='View your profile'
                            onClick={handleInfoModalClose}
                            primary
                        />
                    </div>
                )}
            >
                <div className={styles.container}>
                    <p>
                        Great work on starting your profile.
                        The more information you add, the more visibility you have in our community and to customers.
                    </p>
                </div>
            </BaseModal>
        </>
    )
}

export default OnboardingCompleted
