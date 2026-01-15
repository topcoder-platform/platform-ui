import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { MemberTraitsAPI, useMemberTraits, UserProfile, UserTrait, UserTraitIds } from '~/libs/core'
import { useSkillsByIds } from '~/libs/shared/lib/services/standard-skills'

import { EDIT_MODE_QUERY_PARAM, profileEditModes } from '../../config'
import { AddButton, EditMemberPropertyBtn, EmptySection } from '../../components'

import { ModifyWorkExpirenceModal } from './ModifyWorkExpirenceModal'
import { WorkExpirenceCard } from './WorkExpirenceCard'
import styles from './WorkExpirence.module.scss'

interface WorkExpirenceProps {
    profile: UserProfile
    authProfile: UserProfile | undefined
    refreshProfile: (handle: string) => void
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

    // Collect all unique skill IDs from work experience entries
    const allSkillIds = useMemo(() => {
        if (!workExpirence) {
            return []
        }

        const skillIdsSet = new Set<string>()
        workExpirence.forEach((work: UserTrait) => {
            if (work.associatedSkills && Array.isArray(work.associatedSkills)) {
                work.associatedSkills.forEach((skillId: string) => {
                    if (skillId && typeof skillId === 'string') {
                        skillIdsSet.add(skillId)
                    }
                })
            }
        })

        return Array.from(skillIdsSet)
    }, [workExpirence])

    // Fetch skills using SWR hook
    const { data: fetchedSkills, error: skillsError } = useSkillsByIds(
        allSkillIds.length > 0 ? allSkillIds : undefined,
    )

    // Determine loading state: data is undefined and no error yet
    const loadingSkills = fetchedSkills === undefined && !skillsError

    // Build skill names map from fetched skills
    const skillNamesMap = useMemo(() => {
        const map: Record<string, string> = {}

        if (fetchedSkills) {
            fetchedSkills.forEach(skill => {
                if (skill.id && skill.name) {
                    map[skill.id] = skill.name
                }
            })
        }

        // For skills that weren't found, use ID as fallback
        allSkillIds.forEach(skillId => {
            if (!map[skillId]) {
                map[skillId] = skillId
            }
        })

        return map
    }, [fetchedSkills, allSkillIds])

    const areSkillsLoaded = useCallback((work: UserTrait): boolean => {
        if (!work.associatedSkills || !Array.isArray(work.associatedSkills) || work.associatedSkills.length === 0) {
            return true
        }

        return work.associatedSkills.every((skillId: string) => {
            const skillName = skillNamesMap[skillId]
            return skillName && skillName !== skillId
        })
    }, [skillNamesMap])

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
            props.refreshProfile(props.profile.handle)
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
                            ? workExpirence?.map((work: UserTrait, index: number) => {
                                const companyName: string | undefined = work.company || work.companyName
                                const uniqueKey: string = [
                                    companyName,
                                    work.industry,
                                    work.position,
                                    work.timePeriodFrom || work.startDate,
                                ].filter(Boolean)
                                    .join('-')

                                return (
                                    <WorkExpirenceCard
                                        key={uniqueKey || `${work.position || 'experience'}-${index}`}
                                        work={work}
                                        skillNamesMap={skillNamesMap}
                                        showSkills={!loadingSkills && areSkillsLoaded(work)}
                                    />
                                )
                            })
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
