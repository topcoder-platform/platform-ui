import { Dispatch, FC, SetStateAction, useState } from 'react'

import { UserProfile } from '~/libs/core'

import { EditMemberPropertyBtn } from '../../components'

import { ModifyAboutMeModal } from './ModifyAboutMeModal'
import styles from './AboutMe.module.scss'

interface AboutMeProps {
    profile: UserProfile
    refreshProfile: () => void
    authProfile: UserProfile | undefined
}

const AboutMe: FC<AboutMeProps> = (props: AboutMeProps) => {
    const [isEditMode, setIsEditMode]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    const canEdit: boolean = props.authProfile?.handle === props.profile.handle

    function handleEditClick(): void {
        setIsEditMode(!isEditMode)
    }

    function handleEditModalClose(): void {
        setIsEditMode(false)
    }

    return (
        <div className={styles.shortBio}>
            <p className='body-large-medium'>
                Hello,
                {' '}
                I&apos;m
                {' '}
                {props.profile?.firstName || props.profile?.handle}
            </p>
            <div className={styles.wizzardWrap}>
                <p className='body-large'>Front End Wizzard</p>
                {
                    canEdit && (
                        <EditMemberPropertyBtn
                            onClick={handleEditClick}
                        />
                    )
                }
            </div>
            <p>{props.profile?.description}</p>

            {
                isEditMode && (
                    <ModifyAboutMeModal
                        onClose={handleEditModalClose}
                        profile={props.authProfile as UserProfile}
                        refreshProfile={props.refreshProfile}
                    />
                )
            }
        </div>
    )
}

export default AboutMe
