import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react'
import { KeyedMutator } from 'swr'
import { useSearchParams } from 'react-router-dom'

import { useMemberTraits, UserProfile, UserTrait, UserTraitIds, UserTraits } from '~/libs/core'
import { IconOutline } from '~/libs/ui'

import { EditMemberPropertyBtn } from '../../components'
import { EDIT_MODE_QUERY_PARAM, profileEditModes } from '../../config'

import { ModifyMemberLinksModal } from './ModifyMemberLinksModal'
import styles from './MemberLinks.module.scss'

interface MemberLinksProps {
    profile: UserProfile
    authProfile: UserProfile | undefined
}

export function renderLinkIcon(linkName: string): JSX.Element {
    switch (linkName) {
        case 'Facebook':
            return <IconOutline.LinkIcon />
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

    const { data: memberPersonalizationTraits, mutate: mutateTraits }: {
        data: UserTraits[] | undefined,
        mutate: KeyedMutator<any>,
    }
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

    function handleEditLangaguesClick(): void {
        setIsEditMode(true)
    }

    function handleEditModalClose(): void {
        setIsEditMode(false)
    }

    function handleEditModalSaved(): void {
        setTimeout(() => {
            setIsEditMode(false)
            mutateTraits()
        }, 1000)
    }

    return (
        <div className={styles.container}>
            <div className={styles.titleWrap}>
                <p className='body-main-bold'>My Links:</p>
                {
                    canEdit && (
                        <EditMemberPropertyBtn
                            onClick={handleEditLangaguesClick}
                        />
                    )
                }
            </div>

            <div className={styles.links}>
                {
                    memberLinks?.links.map((trait: UserTrait) => (
                        <a
                            href={trait.url}
                            target='_blank'
                            rel='noreferrer'
                            key={`link-${trait.name}`}
                        >
                            {renderLinkIcon(trait.name)}
                        </a>
                    ))
                }
            </div>

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
    )
}

export default MemberLinks
