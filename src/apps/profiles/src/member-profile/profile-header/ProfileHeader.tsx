/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react'
import { Location, useLocation, useSearchParams } from 'react-router-dom'
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
import { Button } from '~/libs/ui'

import { AddButton, EditMemberPropertyBtn } from '../../components'
import { EDIT_MODE_QUERY_PARAM, profileEditModes } from '../../config'
import { MemberProfileContextValue, useMemberProfileContext } from '../MemberProfile.context'

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

    const [isHiringFormOpen, setIsHiringFormOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const { isTalentSearch }: MemberProfileContextValue = useMemberProfileContext()

    const { state }: Location = useLocation()

    const searchedSkills: string[] = useMemo(
        () => (state.queriedSkills || []).map((s: any) => s.name),
        [state.queriedSkills],
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

            {!traitsLoading && (
                <div className={styles.profileHeaderWrap}>
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
                                // If the user hasn't set a name and handle appareance, display both name and handle
                                (namesAndHandleAppearanceData?.namesAndHandleAppearance === 'namesAndHandle'
                                    || !namesAndHandleAppearanceData) ? (
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
                    {
                        !canEdit && isTalentSearch ? (
                            <div className={styles.hiringClickWrap}>
                                <Button
                                    label='Start Hiring'
                                    primary
                                    size='lg'
                                    onClick={handleStartHiringToggle}
                                />
                            </div>
                        ) : undefined
                    }
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
