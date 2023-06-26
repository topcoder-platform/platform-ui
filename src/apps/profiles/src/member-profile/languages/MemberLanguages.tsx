import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'
import { KeyedMutator } from 'swr'
import { useSearchParams } from 'react-router-dom'
import { compact } from 'lodash'

import { useMemberTraits, UserProfile, UserTrait, UserTraitIds, UserTraits } from '~/libs/core'

import { EditMemberPropertyBtn } from '../../components'
import { EDIT_MODE_QUERY_PARAM, profileEditModes } from '../../config'

import { ModifyLanguagesModal } from './ModifyLanguagesModal'
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

    const { data: memberLanguageTraits, mutate: mutateTraits }: {
        data: UserTraits[] | undefined,
        mutate: KeyedMutator<any>,
    }
        = useMemberTraits(props.profile.handle, { traitIds: UserTraitIds.languages })

    useEffect(() => {
        if (props.authProfile && editMode === profileEditModes.languages) {
            setIsEditMode(true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.authProfile])

    console.log('memberLanguageTraits', memberLanguageTraits)

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
                <p className='body-main-bold'>My Langagues:</p>
                {
                    canEdit && (
                        <EditMemberPropertyBtn
                            onClick={handleEditLangaguesClick}
                        />
                    )
                }
            </div>

            <div className={styles.languages}>
                {
                    memberLanguageTraits?.[0]?.traits?.data?.map((trait: UserTrait) => (
                        <div className={styles.language} key={`member-lan-${trait.language}`}>
                            <p className='body-main-medium'>{trait.language}</p>
                            <p className='body-small'>
                                {compact([
                                    trait.spokenLevel ? `Spoken: ${trait.spokenLevel}` : undefined,
                                    trait.writtenLevel ? `Written: ${trait.writtenLevel}` : undefined,
                                ])
                                    .join(' | ')}
                            </p>
                        </div>
                    ))
                }
            </div>

            {
                isEditMode && (
                    <ModifyLanguagesModal
                        onClose={handleEditModalClose}
                        onSave={handleEditModalSaved}
                        profile={props.profile}
                    // memberPersonalizationTraitsData={
                    //     (memberPersonalizationTraits?.[0]?.traits?.data || []) as UserTraits[]
                    // }
                    />
                )
            }
        </div>
    )
}

export default MemberLanguages
