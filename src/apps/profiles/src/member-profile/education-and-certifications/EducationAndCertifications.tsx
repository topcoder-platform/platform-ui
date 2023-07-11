import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { MemberTraitsAPI, useMemberTraits, UserProfile, UserTrait, UserTraitIds } from '~/libs/core'

import { EDIT_MODE_QUERY_PARAM, profileEditModes } from '../../config'
import { EditMemberPropertyBtn, EmptySection } from '../../components'
import { MemberTCAInfo } from '../tca-info'
import { notifyUniNavi } from '../../lib'

import { ModifyEducationModal } from './ModifyEducationModal'
import { EducationCard } from './EducationCard'
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

    const { data: memberEducationTraits, mutate: mutateTraits, loading }: MemberTraitsAPI
        = useMemberTraits(props.profile.handle, { traitIds: UserTraitIds.education })

    const memberEducation: UserTrait[] | undefined
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
        setTimeout(() => {
            setIsEditMode(false)
            mutateTraits()
            notifyUniNavi(props.profile)
        }, 1000)
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

            <div className={styles.educationContentWrap}>
                {!loading && (
                    (memberEducation?.length as number) > 0 && (
                        memberEducation?.map((education: UserTrait) => (
                            <EducationCard
                                key={`${education.schoolCollegeName}-${education.major}`}
                                education={education}
                            />
                        ))
                    )
                )}
            </div>

            <MemberTCAInfo profile={props.profile} />

            {!loading && !memberEducation?.length && (
                <EmptySection
                    className={styles.emptyBlock}
                    selfMessage={`
                        Including your education and certifications enhances the strength
                        of your profile in comparison to others.
                    `}
                    isSelf={canEdit}
                >
                    I&apos;m still building up my education and certifications here at Topcoder.
                </EmptySection>
            )}

            {
                isEditMode && (
                    <ModifyEducationModal
                        profile={props.profile}
                        onClose={handleEditEducationModalClose}
                        onSave={handleEditEducationModalSave}
                        education={memberEducation}
                    />
                )
            }
        </div>
    )
}

export default EducationAndCertifications
