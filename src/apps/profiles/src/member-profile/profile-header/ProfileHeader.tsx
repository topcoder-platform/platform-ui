/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react'
import { Location, useLocation, useSearchParams } from 'react-router-dom'
import moment from 'moment'

import {
    NamesAndHandleAppearance,
    UserProfile,
} from '~/libs/core'
import { ProfilePicture, useCheckIsMobile } from '~/libs/shared'

import { AddButton, EditMemberPropertyBtn } from '../../components'
import { EDIT_MODE_QUERY_PARAM, profileEditModes } from '../../config'

import { OpenForGigs } from './OpenForGigs'
import { ModifyMemberNameModal } from './ModifyMemberNameModal'
import { ModifyMemberPhotoModal } from './ModifyMemberPhotoModal'
import { HiringFormModal } from './HiringFormModal'
import styles from './ProfileHeader.module.scss'

interface ProfileHeaderProps {
    profile: UserProfile
    authProfile: UserProfile | undefined
    refreshProfile: (handle: string) => void
}

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

    const [isHiringFormOpen, setIsHiringFormOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const { state }: Location = useLocation()

    const searchedSkills: string[] = useMemo(
        () => (state?.queriedSkills || []).map((s: any) => s.name),
        [state?.queriedSkills],
    )

    useEffect(() => {
        if (props.authProfile && editMode === profileEditModes.names) {
            setIsNameEditMode(true)
        }

        if (props.authProfile && editMode === profileEditModes.photo) {
            setIsPhotoEditMode(true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.authProfile])

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
                <OpenForGigs
                    canEdit={canEdit}
                    authProfile={props.authProfile}
                    profile={props.profile}
                    refreshProfile={props.refreshProfile}
                />
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

    function handleStartHiringToggle(): void {
        setIsHiringFormOpen(!isHiringFormOpen)
    }

    return (
        <div className={styles.container}>
            {
                !isMobile ? renderMemberPhotoWrap() : undefined
            }

            <div className={styles.profileHeaderWrap}>
                <div className={styles.profileInfo}>
                    <div className={styles.nameWrap}>
                        <p>
                            {
                                props.profile.namesAndHandleAppearance === NamesAndHandleAppearance.handleOnly
                                    ? props.profile.handle
                                    : `${props.profile.firstName} ${props.profile.lastName?.slice(0, 1) ?? ''}`
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
                            // If the user hasn't set a name and handle appareance, display both name and handle
                            (props.profile.namesAndHandleAppearance === NamesAndHandleAppearance.both
                                || !props.profile.namesAndHandleAppearance) ? (
                                // eslint-disable-next-line react/jsx-indent
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
            </div>

            {
                // Showing only when they can edit until we have the talent search app
                // and enough data to make this useful
                canEdit ? renderOpenForWork() : undefined
            }

            {
                isMobile ? renderMemberPhotoWrap() : undefined
            }

            {
                isHiringFormOpen && (
                    <HiringFormModal
                        onClose={handleStartHiringToggle}
                        authProfile={props.authProfile}
                        profile={props.profile}
                        searchedSkills={searchedSkills}
                    />
                )
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
