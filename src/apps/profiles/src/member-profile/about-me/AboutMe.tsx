import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { KeyedMutator } from 'swr'
import classNames from 'classnames'

import { NamesAndHandleAppearance, useMemberTraits, UserProfile, UserTraitIds, UserTraits } from '~/libs/core'

import { AddButton, EditMemberPropertyBtn, EmptySection } from '../../components'
import { EDIT_MODE_QUERY_PARAM, profileEditModes } from '../../config'

import { ModifyAboutMeModal } from './ModifyAboutMeModal'
import MemberRatingCard from './MemberRatingCard/MemberRatingCard'
import Phones from '../phones'
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

    const hasEmptyDescription = useMemo(() => (
        props.profile && !props.profile.description
    ), [props.profile])

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
                {
                    props.profile.namesAndHandleAppearance === NamesAndHandleAppearance.handleOnly
                        ? props.profile?.handle
                        : props.profile?.firstName
                }
            </p>

            <MemberRatingCard profile={props.profile} />

            <div className={classNames(styles.wizzardWrap, hasEmptyDescription && styles.emptyDesc)}>
                <p className='body-main-medium'>{memberTitleTrait?.profileSelfTitle}</p>
                {canEdit && !hasEmptyDescription && (
                    <EditMemberPropertyBtn
                        onClick={handleEditClick}
                    />
                )}
            </div>
            {hasEmptyDescription && (
                <>
                    <EmptySection
                        className={styles.empty}
                        selfMessage={`
                            Your bio is an opportunity to share your personality
                            and interests with the community and customers.
                        `}
                        isSelf={canEdit}
                    />
                    {canEdit && (
                        <AddButton
                            label='Add your bio'
                            onClick={handleEditClick}
                        />
                    )}
                </>
            )}
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

            <Phones
                profile={props.profile}
                authProfile={props.authProfile}
                refreshProfile={props.refreshProfile}
            />

        </div>
    )
}

export default AboutMe
