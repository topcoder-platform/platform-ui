import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { KeyedMutator } from 'swr'

import { useMemberTraits, UserProfile, UserTrait, UserTraitIds, UserTraits } from '~/libs/core'

import { EditMemberPropertyBtn } from '../../../components'
import { OpenForGigsModifyModal } from '../OpenForGigsModifyModal'
import { EDIT_MODE_QUERY_PARAM, profileEditModes } from '../../../config'
import { notifyUniNavi } from '../../../lib'

import styles from './OpenForGigs.module.scss'

interface OpenForGigsProps {
    canEdit: boolean
    authProfile: UserProfile | undefined
    profile: UserProfile
}

const OpenForGigs: FC<OpenForGigsProps> = (props: OpenForGigsProps) => {
    const [queryParams]: [URLSearchParams, any] = useSearchParams()
    const editMode: string | null = queryParams.get(EDIT_MODE_QUERY_PARAM)

    const [isEditMode, setIsEditMode]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    useEffect(() => {
        if (props.authProfile && editMode === profileEditModes.openForWork) {
            setIsEditMode(true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.authProfile])

    const { data: memberPersonalizationTraits, mutate: mutateTraits }: {
        data: UserTraits[] | undefined,
        mutate: KeyedMutator<any>,
    }
        = useMemberTraits(props.profile.handle, { traitIds: UserTraitIds.personalization })

    const openForWork: UserTrait | undefined
        = useMemo(() => memberPersonalizationTraits?.[0]?.traits?.data?.find(
            (trait: UserTrait) => trait.availableForGigs,
        ), [memberPersonalizationTraits])

    function handleModifyOpenForWorkClick(): void {
        setIsEditMode(true)
    }

    function handleModifyOpenForWorkClose(): void {
        setIsEditMode(false)
    }

    function handleModifyOpenForWorkSave(): void {
        setTimeout(() => {
            setIsEditMode(false)
            mutateTraits()
            notifyUniNavi(props.profile)
        }, 1000)
    }

    return props.canEdit || openForWork ? (
        <div className={styles.container}>
            <p className='body-main-bold'>
                {openForWork?.availableForGigs ? 'open to work' : 'not open to work'}
            </p>
            {
                props.canEdit && (
                    <EditMemberPropertyBtn
                        onClick={handleModifyOpenForWorkClick}
                    />
                )
            }
            {
                isEditMode && (
                    <OpenForGigsModifyModal
                        onClose={handleModifyOpenForWorkClose}
                        onSave={handleModifyOpenForWorkSave}
                        openForWork={openForWork?.availableForGigs || false}
                        memberPersonalizationTraitsFullData={memberPersonalizationTraits?.[0]?.traits?.data}
                        profile={props.profile}
                    />
                )
            }
        </div>
    ) : <></>
}

export default OpenForGigs
