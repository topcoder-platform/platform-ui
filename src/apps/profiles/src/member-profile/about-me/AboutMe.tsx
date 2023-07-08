import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { KeyedMutator } from 'swr'

import { useMemberTraits, UserProfile, UserTraitIds, UserTraits } from '~/libs/core'

import { EditMemberPropertyBtn } from '../../components'
import { EDIT_MODE_QUERY_PARAM, profileEditModes } from '../../config'

import { ModifyAboutMeModal } from './ModifyAboutMeModal'
import styles from './AboutMe.module.scss'

interface AboutMeProps {
    profile: UserProfile
    refreshProfile: (handle: string) => void
    authProfile: UserProfile | undefined
}

const AboutMe: FC<AboutMeProps> = (props: AboutMeProps) => {
    const [queryParams]: [URLSearchParams, any] = useSearchParams()
    const editMode: string | null = queryParams.get(EDIT_MODE_QUERY_PARAM)

    const [isEditMode, setIsEditMode]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const { data: memberPersonalizationTraits, mutate: mutateTraits }: {
        data: UserTraits[] | undefined,
        mutate: KeyedMutator<any>,
    }
        = useMemberTraits(props.profile.handle, { traitIds: UserTraitIds.personalization })

    const memberTitleTrait: any
        = memberPersonalizationTraits?.[0]?.traits?.data?.find((trait: any) => trait.profileSelfTitle)

    useEffect(() => {
        if (props.authProfile && editMode === profileEditModes.aboutMe) {
            setIsEditMode(true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.authProfile])

    const canEdit: boolean = props.authProfile?.handle === props.profile.handle

    function handleEditClick(): void {
        setIsEditMode(!isEditMode)
    }

    function handleEditModalClose(): void {
        setIsEditMode(false)
    }

    function handleEditModalSaved(): void {
        setTimeout(() => {
            setIsEditMode(false)
            mutateTraits()
            props.refreshProfile(props.profile.handle)
        }, 1000)
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
                <p className='body-large'>{memberTitleTrait?.profileSelfTitle}</p>
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
                        onSave={handleEditModalSaved}
                        profile={props.profile}
                        memberPersonalizationTraitsData={
                            memberPersonalizationTraits?.[0]?.traits?.data
                        }
                    />
                )
            }
        </div>
    )
}

export default AboutMe