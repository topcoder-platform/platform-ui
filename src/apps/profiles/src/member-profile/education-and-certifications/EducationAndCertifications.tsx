import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { KeyedMutator } from 'swr'

import { useMemberTraits, UserProfile, UserTrait, UserTraitIds, UserTraits } from '~/libs/core'

import { EDIT_MODE_QUERY_PARAM, profileEditModes } from '../../config'
import { EditMemberPropertyBtn } from '../../components'
import { MemberTCAInfo } from '../tca-info'

import { ModifyEducationModal } from './ModifyEducationModal'
import styles from './EducationAndCertifications.module.scss'

interface EducationAndCertificationsProps {
    profile: UserProfile
    authProfile: UserProfile | undefined
}

const EducationAndCertifications: FC<EducationAndCertificationsProps> = (props: EducationAndCertificationsProps) => {
    const [queryParams]: [URLSearchParams, any] = useSearchParams()
    const editMode: string | null = queryParams.get(EDIT_MODE_QUERY_PARAM)

    const canEdit: boolean = props.authProfile?.handle === props.profile.handle

    const [isEditMode, setIsEditMode]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const { data: memberEducationTraits, mutate: mutateTraits }: {
        data: UserTraits[] | undefined,
        mutate: KeyedMutator<any>,
    }
        = useMemberTraits(props.profile.handle, { traitIds: UserTraitIds.education })

    const education: UserTrait[] | undefined
        = useMemo(() => memberEducationTraits?.[0]?.traits?.data, [memberEducationTraits])

    useEffect(() => {
        if (props.authProfile && editMode === profileEditModes.education) {
            setIsEditMode(true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.authProfile])

    function handleEditEducationClick(): void {
        setIsEditMode(true)
    }

    function handleEditEducationModalClose(): void {
        setIsEditMode(false)
    }

    function handleEditEducationModalSave(): void {
        mutateTraits()
    }

    return (
        <div className={styles.container}>
            <div className={styles.headerWrap}>
                <h3>Education and Certifications</h3>
                {
                    canEdit && (
                        <EditMemberPropertyBtn
                            onClick={handleEditEducationClick}
                        />
                    )
                }
            </div>

            <MemberTCAInfo profile={props.profile} />

            {
                isEditMode && (
                    <ModifyEducationModal
                        // profile={props.profile}
                        // authProfile={props.authProfile}
                        onClose={handleEditEducationModalClose}
                        onSave={handleEditEducationModalSave}
                        education={education}
                    />
                )
            }
        </div>
    )
}

export default EducationAndCertifications
