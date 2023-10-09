import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { MemberTraitsAPI, useMemberTraits, UserProfile, UserTrait, UserTraitIds } from '~/libs/core'
import {
    IconOutline,
    SocialIconFacebook,
    SocialIconTwitter,
    SocialIconYoutube,
} from '~/libs/ui'

import { AddButton, EditMemberPropertyBtn } from '../../components'
import { EDIT_MODE_QUERY_PARAM, profileEditModes } from '../../config'
import { notifyUniNavi, triggerSurvey } from '../../lib'

import { ModifyMemberLinksModal } from './ModifyMemberLinksModal'
import { ReactComponent as GitHubLinkIcon } from './assets/github-link-icon.svg'
import { ReactComponent as InstagramLinkIcon } from './assets/instagram-link-icon.svg'
import { ReactComponent as LinkedInLinkIcon } from './assets/linkedIn-link-icon.svg'
import styles from './MemberLinks.module.scss'

interface MemberLinksProps {
    profile: UserProfile
    authProfile: UserProfile | undefined
}

export function renderLinkIcon(linkName: string): JSX.Element {
    switch (linkName) {
        case 'Facebook':
            return <SocialIconFacebook />
        case 'GitHub':
            return <GitHubLinkIcon />
        case 'Twitter':
            return <SocialIconTwitter />
        case 'LinkedIn':
            return <LinkedInLinkIcon />
        case 'Instagram':
            return <InstagramLinkIcon />
        case 'YouTube':
            return <SocialIconYoutube />
        default:
            return <IconOutline.LinkIcon />
    }
}

const MemberLinks: FC<MemberLinksProps> = (props: MemberLinksProps) => {
    const [queryParams]: [URLSearchParams, any] = useSearchParams()
    const editMode: string | null = queryParams.get(EDIT_MODE_QUERY_PARAM)

    const canEdit: boolean = props.authProfile?.handle === props.profile.handle

    const [isEditMode, setIsEditMode]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const { data: memberPersonalizationTraits, mutate: mutateTraits, loading }: MemberTraitsAPI
        = useMemberTraits(props.profile.handle, { traitIds: UserTraitIds.personalization })

    const memberLinks: UserTrait | undefined
        = useMemo(() => memberPersonalizationTraits?.[0]?.traits?.data?.find(
            (trait: UserTrait) => trait.links,
        ), [memberPersonalizationTraits])

    useEffect(() => {
        if (props.authProfile && editMode === profileEditModes.links) {
            setIsEditMode(true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.authProfile])

    function handleEditClick(): void {
        setIsEditMode(true)
    }

    function handleEditModalClose(): void {
        setIsEditMode(false)
    }

    function handleEditModalSaved(): void {
        setTimeout(() => {
            setIsEditMode(false)
            mutateTraits()
            notifyUniNavi(props.profile)
            triggerSurvey()
        }, 1000)
    }

    return !loading && (canEdit || memberLinks?.links?.length) ? (
        <div className={styles.container}>
            {memberLinks?.links.length ? (
                <div className={styles.links}>
                    {
                        memberLinks?.links.map((trait: UserTrait) => (
                            <a
                                href={trait.url}
                                target='_blank'
                                rel='noreferrer'
                                key={`link-${trait.name}-${trait.url}`}
                            >
                                {renderLinkIcon(trait.name)}
                            </a>
                        ))
                    }
                </div>
            ) : undefined}

            {canEdit && !!memberLinks?.links.length && (
                <EditMemberPropertyBtn
                    onClick={handleEditClick}
                />
            )}

            {canEdit && !memberLinks?.links.length && (
                <AddButton
                    variant='mt0'
                    label='Add your social links'
                    onClick={handleEditClick}
                />
            )}

            {
                isEditMode && (
                    <ModifyMemberLinksModal
                        onClose={handleEditModalClose}
                        onSave={handleEditModalSaved}
                        profile={props.profile}
                        memberLinks={memberLinks ? memberLinks.links : undefined}
                        memberPersonalizationTraitsFullData={memberPersonalizationTraits?.[0]?.traits?.data}
                    />
                )
            }
        </div>
    ) : <></>
}

export default MemberLinks
