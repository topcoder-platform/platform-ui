/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { KeyedMutator } from 'swr'
import moment from 'moment'

import {
    useMemberTraits,
    UserProfile,
    UserTrait,
    UserTraitIds,
    UserTraits,
} from '~/libs/core'
import { ProfilePicture, useCheckIsMobile } from '~/libs/shared'

import { AddButton, EditMemberPropertyBtn } from '../../components'
import { EDIT_MODE_QUERY_PARAM, profileEditModes } from '../../config'

import { OpenForGigs } from './OpenForGigs'
import { ModifyMemberNameModal } from './ModifyMemberNameModal'
import { ModifyMemberPhotoModal } from './ModifyMemberPhotoModal'
import styles from './ProfileHeader.module.scss'

interface ProfileHeaderProps {
    profile: UserProfile
    authProfile: UserProfile | undefined
    refreshProfile: (handle: string) => void
}

export type NamesAndHandleAppearance = 'namesOnly' | 'handleOnly' | 'namesAndHandle'

const ProfileHeader: FC<ProfileHeaderProps> = (props: ProfileHeaderProps) => {
    const isMobile: boolean = useCheckIsMobile()

    const hasProfilePicture = !!props.profile.photoURL

    const canEdit: boolean = props.authProfile?.handle === props.profile.handle

    const [isNameEditMode, setIsNameEditMode]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [isPhotoEditMode, setIsPhotoEditMode]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [queryParams]: [URLSearchParams, any] = useSearchParams()
    const editMode: string | null = queryParams.get(EDIT_MODE_QUERY_PARAM)

    const { data: memberPersonalizationTraits, mutate: mutateTraits, loading: traitsLoading }: {
        data: UserTraits[] | undefined,
        mutate: KeyedMutator<any>,
        loading: boolean,
    }
        = useMemberTraits(props.profile.handle, { traitIds: UserTraitIds.personalization })

    const namesAndHandleAppearanceData: UserTrait | undefined
        = useMemo(() => memberPersonalizationTraits?.[0]?.traits?.data?.find(
            (trait: UserTrait) => trait.namesAndHandleAppearance,
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

    // Enable this with talent search app
    // function handleHireMeClick(): void {
    //     console.log('Hire Me button clicked')
    // }

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
            mutateTraits()
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
        }, 1000)
    }

    function renderOpenForWork(): JSX.Element {
        return (
            <div className={styles.profileActions}>
                <span>My status:</span>
                <OpenForGigs canEdit={canEdit} authProfile={props.authProfile} profile={props.profile} />
                {/* Enable this with talent search app */}
                {/* {
                            !canEdit && (
                                <Button
                                    label={`Hire ${props.profile.firstName}`}
                                    primary
                                    onClick={handleHireMeClick}
                                />
                            )
                        } */}
            </div>
        )
    }

    function renderMemberPhotoWrap(): JSX.Element {
        return (
            <div className={styles.photoWrap}>
                <ProfilePicture member={props.profile} className={styles.profilePhoto} />
                {canEdit && hasProfilePicture && (
                    <EditMemberPropertyBtn
                        className={styles.button}
                        onClick={handleModifyPhotoClick}
                    />
                )}
                {canEdit && !hasProfilePicture && (
                    <AddButton
                        className={styles.addButton}
                        label='Add a profile picture'
                        onClick={handleModifyPhotoClick}
                    />
                )}
            </div>
        )
    }

    return (
        <div className={styles.container}>
            {
                !isMobile ? renderMemberPhotoWrap() : undefined
            }

            {!traitsLoading && (
                <div className={styles.profileInfo}>
                    <div className={styles.nameWrap}>
                        <p>
                            {
                                namesAndHandleAppearanceData?.namesAndHandleAppearance === 'handleOnly'
                                    ? props.profile.handle
                                    : `${props.profile.firstName} ${props.profile.lastName}`
                            }
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
                        {
                            namesAndHandleAppearanceData?.namesAndHandleAppearance === 'namesAndHandle' ? (
                                <>
                                    <span>{props.profile.handle}</span>
                                    {' '}
                                    |
                                    {' '}
                                </>
                            ) : undefined
                        }
                        Member Since
                        {' '}
                        {moment(props.profile.createdAt)
                            .format('MMM YYYY')}
                    </p>
                </div>
            )}

            {
                // Showing only when they can edit until we have the talent search app
                // and enough data to make this useful
                canEdit ? renderOpenForWork() : undefined
            }

            {
                isMobile ? renderMemberPhotoWrap() : undefined
            }

            {
                isNameEditMode && (
                    <ModifyMemberNameModal
                        onClose={handleModifyNameModalClose}
                        onSave={handleModifyNameModalSave}
                        profile={props.profile}
                        memberPersonalizationTraitsData={memberPersonalizationTraits?.[0]?.traits?.data}
                        namesAndHandleAppearance={namesAndHandleAppearanceData?.namesAndHandleAppearance}
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
