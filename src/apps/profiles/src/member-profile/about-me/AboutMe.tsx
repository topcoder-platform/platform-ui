import {
    Dispatch,
    FC,
    SetStateAction,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import { KeyedMutator } from 'swr'
import classNames from 'classnames'

import { NamesAndHandleAppearance, useMemberTraits, UserProfile, UserTraitIds, UserTraits } from '~/libs/core'

import { AddButton, EditMemberPropertyBtn, EmptySection } from '../../components'
import { EDIT_MODE_QUERY_PARAM, profileEditModes } from '../../config'
import { canSeePhones, getFirstProfileSelfTitle } from '../../lib/helpers'
import { CommunityAwards } from '../community-awards'
import { Phones } from '../phones'

import { isBioOverflowing } from './AboutMe.utils'
import { ModifyAboutMeModal } from './ModifyAboutMeModal'
import MemberRatingCard from './MemberRatingCard/MemberRatingCard'
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

    const memberTitle: string | undefined = useMemo(
        () => getFirstProfileSelfTitle(memberPersonalizationTraits?.[0]?.traits?.data),
        [memberPersonalizationTraits],
    )

    const [isBioExpanded, setIsBioExpanded]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isBioTruncated, setIsBioTruncated]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const bioRef = useRef<HTMLParagraphElement>(null)

    const hasEmptyDescription = useMemo(() => (
        props.profile && !props.profile.description
    ), [props.profile])

    useEffect(() => {
        if (props.authProfile && editMode === profileEditModes.aboutMe) {
            setIsEditMode(true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.authProfile])

    useEffect(() => {
        setIsBioExpanded(false)
    }, [props.profile.description])

    /**
     * Re-evaluates whether the collapsed bio has content hidden by its line clamp.
     * Used after rendering and whenever the bio element is resized.
     *
     * @returns {void} Updates the bio truncation state when the collapsed element is available.
     * @throws This callback does not raise exceptions.
     */
    const updateBioTruncation = useCallback((): void => {
        if (!bioRef.current || isBioExpanded) {
            return
        }

        setIsBioTruncated(isBioOverflowing(bioRef.current))
    }, [isBioExpanded])

    useLayoutEffect(() => {
        updateBioTruncation()

        if (!bioRef.current || isBioExpanded) {
            return undefined
        }

        const resizeObserver = typeof ResizeObserver === 'undefined'
            ? undefined
            : new ResizeObserver(updateBioTruncation)

        resizeObserver?.observe(bioRef.current)
        window.addEventListener('resize', updateBioTruncation)

        return () => {
            resizeObserver?.disconnect()
            window.removeEventListener('resize', updateBioTruncation)
        }
    }, [isBioExpanded, props.profile.description, updateBioTruncation])

    const canEdit: boolean = props.authProfile?.handle === props.profile.handle

    function handleEditClick(): void {
        setIsEditMode(!isEditMode)
    }

    function handleBioToggleClick(): void {
        setIsBioExpanded(!isBioExpanded)
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

            <MemberRatingCard
                authProfile={props.authProfile}
                memberPersonalizationTraitsData={memberPersonalizationTraits?.[0]?.traits?.data}
                mutatePersonalizationTraits={mutateTraits}
                profile={props.profile}
            />

            <div className={classNames(styles.wizzardWrap, hasEmptyDescription && styles.emptyDesc)}>
                <p className='body-main-medium'>{memberTitle}</p>
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
            {!hasEmptyDescription && (
                <div className={styles.bioWrap}>
                    <p
                        className={classNames(!isBioExpanded && styles.bioCollapsed)}
                        ref={bioRef}
                    >
                        {props.profile.description}
                    </p>
                    {isBioTruncated && (
                        <button
                            className={styles.bioToggle}
                            onClick={handleBioToggleClick}
                            type='button'
                        >
                            {isBioExpanded ? 'See Less' : 'See More'}
                        </button>
                    )}
                </div>
            )}

            <CommunityAwards profile={props.profile} />

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

            {canSeePhones(props.authProfile, props.profile) && (
                <Phones
                    profile={props.profile}
                    authProfile={props.authProfile}
                    refreshProfile={props.refreshProfile}
                />
            )}

        </div>
    )
}

export default AboutMe
