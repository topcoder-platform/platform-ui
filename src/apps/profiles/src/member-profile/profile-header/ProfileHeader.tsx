import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import moment from 'moment'

import {
    getVerificationStatusAsync,
    useMemberTraits,
    UserProfile,
    UserTrait,
    UserTraitIds,
    UserTraits,
} from '~/libs/core'
import { Button, IconOutline } from '~/libs/ui'

import { EditMemberPropertyBtn } from '../../components'
import { EDIT_MODE_QUERY_PARAM, profileEditModes } from '../../config'
import { notifyUniNavi } from '../../lib'

import { OpenForGigs } from './OpenForGigs'
import { ModifyMemberNameModal } from './ModifyMemberNameModal'
import { ModifyMemberPhotoModal } from './ModifyMemberPhotoModal'
import styles from './ProfileHeader.module.scss'

interface ProfileHeaderProps {
    profile: UserProfile
    authProfile: UserProfile | undefined
    refreshProfile: (handle: string) => void
}

const DEFAULT_MEMBER_AVATAR: string
    = 'https://d1aahxkjiobka8.cloudfront.net/static-assets/images/ab4a084a9815ebb1cf8f7b451ce4c88f.svg'

const ProfileHeader: FC<ProfileHeaderProps> = (props: ProfileHeaderProps) => {
    const photoURL: string = props.profile.photoURL || DEFAULT_MEMBER_AVATAR

    const [isMemberVerified, setIsMemberVerified]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const canEdit: boolean = props.authProfile?.handle === props.profile.handle

    const [isNameEditMode, setIsNameEditMode]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [isPhotoEditMode, setIsPhotoEditMode]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [queryParams]: [URLSearchParams, any] = useSearchParams()
    const editMode: string | null = queryParams.get(EDIT_MODE_QUERY_PARAM)

    const { data: memberPersonalizationTraits }: {
        data: UserTraits[] | undefined,
    }
        = useMemberTraits(props.profile.handle, { traitIds: UserTraitIds.personalization })

    const openForWork: UserTrait | undefined
        = useMemo(() => memberPersonalizationTraits?.[0]?.traits?.data?.find(
            (trait: UserTrait) => trait.availableForGigs,
        ), [memberPersonalizationTraits])

    useEffect(() => {
        if (props.authProfile && editMode === profileEditModes.names) {
            setIsNameEditMode(true)
        }

        if (props.authProfile && editMode === profileEditModes.photo) {
            setIsPhotoEditMode(true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.authProfile])

    useEffect(() => {
        if (!props.profile?.handle) {
            return
        }

        getVerificationStatusAsync(props.profile.handle)
            .then(verified => setIsMemberVerified(verified))
    }, [props.profile.handle])

    function handleHireMeClick(): void {
        console.log('Hire Me button clicked')
    }

    function handleModifyNameClick(): void {
        setIsNameEditMode(true)
    }

    function handleModifyNameModalClose(): void {
        setIsNameEditMode(false)
    }

    function handleModifyNameModalSave(): void {
        setTimeout(() => {
            setIsNameEditMode(false)
            props.refreshProfile(props.profile.handle)
            notifyUniNavi(props.profile)
        }, 1000)
    }

    function handleModifyPhotoClick(): void {
        setIsPhotoEditMode(true)
    }

    function handleModifyPhotoModalClose(): void {
        setIsPhotoEditMode(false)
    }

    function handleModifyPhotoModalSave(): void {
        setTimeout(() => {
            setIsPhotoEditMode(false)
            props.refreshProfile(props.profile.handle)
            notifyUniNavi(props.profile)
        }, 1000)
    }

    return (
        <div className={styles.container}>
            <div className={styles.photoWrap}>
                <img src={photoURL} alt='Topcoder - Member Profile Avatar' className={styles.profilePhoto} />
                {
                    isMemberVerified ? (
                        <div className={styles.verifiedBadge}>
                            <IconOutline.CheckCircleIcon />
                        </div>
                    ) : undefined
                }
                {
                    canEdit && (
                        <EditMemberPropertyBtn
                            onClick={handleModifyPhotoClick}
                        />
                    )
                }
            </div>

            <div className={styles.profileInfo}>
                <div className={styles.nameWrap}>
                    <p>
                        {props.profile.firstName}
                        {' '}
                        {props.profile.lastName}
                    </p>
                    {
                        canEdit && (
                            <EditMemberPropertyBtn
                                onClick={handleModifyNameClick}
                            />
                        )
                    }
                </div>

                <p className={styles.memberSince}>
                    <span>{props.profile.handle}</span>
                    {' '}
                    |
                    {' '}
                    Member Since
                    {' '}
                    {moment(props.profile.createdAt)
                        .format('MMM YYYY')}
                </p>
            </div>

            {
                openForWork || canEdit ? (
                    <div className={styles.profileActions}>
                        <span>
                            {canEdit ? 'I am' : `${props.profile.firstName} is`}
                        </span>
                        <OpenForGigs canEdit={canEdit} authProfile={props.authProfile} profile={props.profile} />
                        {
                            !canEdit && (
                                <Button
                                    label={`Hire ${props.profile.firstName}`}
                                    primary
                                    onClick={handleHireMeClick}
                                />
                            )
                        }
                    </div>
                ) : undefined
            }

            {
                isNameEditMode && (
                    <ModifyMemberNameModal
                        onClose={handleModifyNameModalClose}
                        onSave={handleModifyNameModalSave}
                        profile={props.profile}
                    />
                )
            }

            {
                isPhotoEditMode && (
                    <ModifyMemberPhotoModal
                        onClose={handleModifyPhotoModalClose}
                        onSave={handleModifyPhotoModalSave}
                        profile={props.profile}
                    />
                )
            }
        </div>
    )
}

export default ProfileHeader
