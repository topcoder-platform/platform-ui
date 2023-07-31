import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { MemberTraitsAPI, useMemberTraits, UserProfile, UserTrait, UserTraitIds } from '~/libs/core'

import { EDIT_MODE_QUERY_PARAM, profileEditModes } from '../../config'
import { notifyUniNavi, triggerSprigSurvey } from '../../lib'
import { AddButton, EditMemberPropertyBtn, EmptySection } from '../../components'

import { ModifyWorkExpirenceModal } from './ModifyWorkExpirenceModal'
import { WorkExpirenceCard } from './WorkExpirenceCard'
import styles from './WorkExpirence.module.scss'

interface WorkExpirenceProps {
    profile: UserProfile
    authProfile: UserProfile | undefined
}

const WorkExpirence: FC<WorkExpirenceProps> = (props: WorkExpirenceProps) => {
    const [queryParams]: [URLSearchParams, any] = useSearchParams()
    const editMode: string | null = queryParams.get(EDIT_MODE_QUERY_PARAM)

    const canEdit: boolean = props.authProfile?.handle === props.profile.handle

    const [isEditMode, setIsEditMode]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const { data: memberWorkExpirenceTraits, mutate: mutateTraits, loading }: MemberTraitsAPI
        = useMemberTraits(props.profile.handle, { traitIds: UserTraitIds.work })

    const workExpirence: UserTrait[] | undefined
        = useMemo(() => memberWorkExpirenceTraits?.[0]?.traits?.data, [memberWorkExpirenceTraits])

    useEffect(() => {
        if (props.authProfile && editMode === profileEditModes.workExperience) {
            setIsEditMode(true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.authProfile])

    function handleEditWorkExpirenceClick(): void {
        setIsEditMode(true)
    }

    function handleModyfyWorkExpirenceModalClose(): void {
        setIsEditMode(false)
    }

    function handleModyfyWorkExpirenceSave(): void {
        setTimeout(() => {
            setIsEditMode(false)
            mutateTraits()
            notifyUniNavi(props.profile)
            triggerSprigSurvey(props.profile)
        }, 1000)
    }

    return (
        <div className={styles.container}>
            <div className={styles.headerWrap}>
                <h3>Experience</h3>
                {canEdit && !!workExpirence?.length && (
                    <EditMemberPropertyBtn
                        onClick={handleEditWorkExpirenceClick}
                    />
                )}
            </div>

            <div className={styles.contentWrap}>
                {!loading && (
                    <>
                        {(workExpirence?.length as number) > 0
                            ? workExpirence?.map((work: UserTrait) => (
                                <WorkExpirenceCard
                                    key={`${work.company}-${work.industry}-${work.position}`}
                                    work={work}
                                />
                            ))
                            : (
                                <EmptySection
                                    selfMessage={
                                        'Adding experience enhances the professional '
                                        + 'appearance of your profile.'
                                    }
                                    isSelf={canEdit}
                                >
                                    This member is still building their experience here at Topcoder.
                                </EmptySection>
                            )}
                        {canEdit && !workExpirence?.length && (
                            <AddButton
                                label='Add experience'
                                onClick={handleEditWorkExpirenceClick}
                            />
                        )}
                    </>
                )}
            </div>

            {
                isEditMode && (
                    <ModifyWorkExpirenceModal
                        onClose={handleModyfyWorkExpirenceModalClose}
                        onSave={handleModyfyWorkExpirenceSave}
                        profile={props.profile}
                        workExpirence={workExpirence}
                    />
                )
            }
        </div>
    )
}

export default WorkExpirence
