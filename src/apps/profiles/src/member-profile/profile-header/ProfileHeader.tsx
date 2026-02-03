/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react'
import { Location, useLocation, useSearchParams } from 'react-router-dom'
import moment from 'moment'

import {
    NamesAndHandleAppearance,
    useMemberTraits,
    UserProfile,
    UserRole,
    UserTraitIds,
    UserTraits,
} from '~/libs/core'
import { ProfilePicture, useCheckIsMobile } from '~/libs/shared'
import { Tooltip } from '~/libs/ui'

import { AddButton, EditMemberPropertyBtn } from '../../components'
import { EDIT_MODE_QUERY_PARAM, profileEditModes } from '../../config'
import { formatRoleList, getAvailabilityLabel, getPreferredRoleLabels } from '../../lib'

import { OpenForGigs } from './OpenForGigs'
import { ModifyMemberNameModal } from './ModifyMemberNameModal'
import { ModifyMemberPhotoModal } from './ModifyMemberPhotoModal'
import { HiringFormModal } from './HiringFormModal'
import IdentityVerifiedBadge from './IdentityVerifiedBadge'
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

    const roles = props.authProfile?.roles || []

    const isPrivilegedViewer
    = !canEdit
    && (
        roles.includes(UserRole.administrator)
        || roles.includes(UserRole.projectManager)
        || roles.includes(UserRole.talentManager)
    )

    const canSeeActivityBadge = props.profile.recentActivity

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

    const activeTooltipText = canEdit ? `You have been active in the past 3 months. 
(this information is visible to you only)` : `${props.profile.firstName} has been active in the past 3 months.`

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
        const showMyStatusLabel = canEdit
        const showAdminLabel = isPrivilegedViewer

        const content = (
            <div className={styles.profileActions}>
                {showMyStatusLabel && <span>My status:</span>}

                {showAdminLabel && (
                    <span>
                        {props.profile.firstName}
                        {' '}
                        is
                    </span>
                )}
                <OpenForGigs
                    canEdit={canEdit}
                    authProfile={props.authProfile}
                    profile={props.profile}
                    refreshProfile={props.refreshProfile}
                    isPrivilegedViewer={isPrivilegedViewer}
                />
            </div>
        )

        return canEdit ? (
            <Tooltip
                content='This information is visible to you only'
                place='top'
            >
                {content}
            </Tooltip>
        ) : (
            content
        )
    }

    function renderActivityStatus(): JSX.Element {
        return (
            <Tooltip
                content={activeTooltipText}
                triggerOn='hover'
                place='top'
                className={styles.tooltipText}
            >
                <div className={styles.activeBadge}>
                    Active
                </div>
            </Tooltip>
        )
    }

    const { data: memberPersonalizationTraits }: {
                    data: UserTraits[] | undefined,
                } = useMemberTraits(
                    props.profile.handle,
                    { traitIds: UserTraitIds.personalization },
                )
    const personalizationData = memberPersonalizationTraits?.[0]?.traits?.data?.[0]?.openToWork || {}

    function renderOpenToWorkSummary(): JSX.Element {
        const openToWork = props.profile.availableForGigs

        if (!openToWork) return <></>

        if (!personalizationData.availability || !personalizationData.preferredRoles?.length) return <></>

        const availabilityLabel = getAvailabilityLabel(personalizationData.availability)
        const roleLabels = getPreferredRoleLabels(personalizationData.preferredRoles)

        return (
            <p className={styles.openToWorkSummary}>
                Interested in
                {' '}
                <span>{availabilityLabel}</span>
                {' '}
                roles as
                {' '}
                <span className={styles.roleText}>{formatRoleList(roleLabels)}</span>
            </p>
        )
    }

    function renderMemberPhotoWrap(): JSX.Element {
        return (
            <div className={styles.photoWrap}>
                <ProfilePicture member={props.profile} className={styles.profilePhoto} />
                <IdentityVerifiedBadge identityVerified={props.profile.identityVerified} />
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
            <div className={styles.statusSection}>
                <div className={styles.statusRow}>
                    {canSeeActivityBadge ? renderActivityStatus() : undefined}

                    {canEdit || isPrivilegedViewer ? renderOpenForWork() : undefined}
                </div>

                {canEdit || isPrivilegedViewer ? renderOpenToWorkSummary() : undefined}
            </div>

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
