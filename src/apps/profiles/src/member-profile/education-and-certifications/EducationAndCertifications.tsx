import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import {
    MemberTraitsAPI,
    useMemberTraits,
    UserCompletedCertificationsResponse,
    UserProfile,
    UserTrait,
    UserTraitIds,
    useUserCompletedCertifications,
} from '~/libs/core'

import { EDIT_MODE_QUERY_PARAM, profileEditModes } from '../../config'
import { AddButton, EditMemberPropertyBtn, EmptySection } from '../../components'
import { MemberTCAInfo } from '../tca-info'
import { triggerSurvey } from '../../lib'

import { ModifyEducationModal } from './ModifyEducationModal'
import { EducationCard } from './EducationCard'
import styles from './EducationAndCertifications.module.scss'

interface EducationAndCertificationsProps {
    profile: UserProfile
    authProfile: UserProfile | undefined
    refreshProfile: (handle: string) => void
}

const EducationAndCertifications: FC<EducationAndCertificationsProps> = (props: EducationAndCertificationsProps) => {
    const [queryParams]: [URLSearchParams, any] = useSearchParams()
    const editMode: string | null = queryParams.get(EDIT_MODE_QUERY_PARAM)

    const { data: memberTCA, loading: tcaDataLoading }: UserCompletedCertificationsResponse
        = useUserCompletedCertifications(props.profile?.userId)

    const canEdit: boolean = props.authProfile?.handle === props.profile.handle

    const [isEditMode, setIsEditMode]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const { data: memberEducationTraits, mutate: mutateTraits, loading: traitsLoading }: MemberTraitsAPI
        = useMemberTraits(props.profile.handle, { traitIds: UserTraitIds.education })

    const loading = tcaDataLoading || traitsLoading

    const memberEducation: UserTrait[] | undefined
        = useMemo(() => memberEducationTraits?.[0]?.traits?.data, [memberEducationTraits])

    const hasEducationData = useMemo(() => !!(
        memberTCA?.courses?.length
        || memberTCA?.enrollments?.length
        || memberEducation?.length
    ), [memberEducation?.length, memberTCA?.courses?.length, memberTCA?.enrollments?.length])

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
            props.refreshProfile(props.profile.handle)
            triggerSurvey()
        }, 1000)
    }

    return (
        <div className={styles.container}>
            <div className={styles.headerWrap}>
                <h3>Education and Certifications</h3>
                {canEdit && hasEducationData && (
                    <EditMemberPropertyBtn
                        onClick={handleEditEducationClick}
                    />
                )}
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

            <MemberTCAInfo memberTcaData={memberTCA} profile={props.profile} />

            {!loading && !hasEducationData && (
                <EmptySection
                    className={styles.emptyBlock}
                    selfMessage={`
                        Including your education and certifications enhances the strength
                        of your profile in comparison to others.
                    `}
                    isSelf={canEdit}
                >
                    This member is still building their education and certifications here at Topcoder.
                </EmptySection>
            )}

            {!loading && canEdit && !hasEducationData && (
                <AddButton
                    label='Add education & certifications'
                    onClick={handleEditEducationClick}
                />
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
