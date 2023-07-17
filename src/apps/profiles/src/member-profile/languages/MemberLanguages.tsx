import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { MemberTraitsAPI, useMemberTraits, UserProfile, UserTrait, UserTraitIds } from '~/libs/core'

import { AddButton, EditMemberPropertyBtn } from '../../components'
import { EDIT_MODE_QUERY_PARAM, profileEditModes } from '../../config'
import { notifyUniNavi } from '../../lib'

import { ModifyLanguagesModal } from './ModifyLanguagesModal'
import { LanguageCard } from './LanguageCard'
import styles from './MemberLanguages.module.scss'

interface MemberLanguagesProps {
    profile: UserProfile
    authProfile: UserProfile | undefined
}

const MemberLanguages: FC<MemberLanguagesProps> = (props: MemberLanguagesProps) => {
    const [queryParams]: [URLSearchParams, any] = useSearchParams()
    const editMode: string | null = queryParams.get(EDIT_MODE_QUERY_PARAM)

    const canEdit: boolean = props.authProfile?.handle === props.profile.handle

    const [isEditMode, setIsEditMode]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const { data: memberLanguageTraits, mutate: mutateTraits, loading }: MemberTraitsAPI
        = useMemberTraits(props.profile.handle, { traitIds: UserTraitIds.languages })

    const memberLanguages: UserTrait[] | undefined
        = useMemo(() => memberLanguageTraits?.[0]?.traits?.data, [memberLanguageTraits])

    useEffect(() => {
        if (props.authProfile && editMode === profileEditModes.languages) {
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
            notifyUniNavi(props.profile)
        }, 1000)
    }

    return !loading && (canEdit || memberLanguages) ? (
        <div className={styles.container}>
            <div className={styles.titleWrap}>
                <p className='body-main-bold'>Languages</p>
                {canEdit && !!memberLanguages?.length && (
                    <EditMemberPropertyBtn
                        onClick={handleEditLangaguesClick}
                    />
                )}
            </div>

            {canEdit && !memberLanguages?.length && (
                <AddButton
                    variant='mt0'
                    label='Add your languages'
                    onClick={handleEditLangaguesClick}
                />
            )}
            <div className={styles.languages}>
                {
                    memberLanguages?.map((trait: UserTrait) => (
                        <LanguageCard trait={trait} key={`member-lan-${trait.language}`} />
                    ))
                }
            </div>

            {
                isEditMode && (
                    <ModifyLanguagesModal
                        onClose={handleEditModalClose}
                        onSave={handleEditModalSaved}
                        profile={props.profile}
                        memberLanguages={memberLanguages}
                    />
                )
            }
        </div>
    ) : <></>
}

export default MemberLanguages
