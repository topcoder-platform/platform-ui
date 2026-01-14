import { Dispatch, FC, SetStateAction, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { MemberTraitsAPI, useMemberTraits, UserProfile, UserTrait, UserTraitIds } from '~/libs/core'
import { fetchSkillsByIds } from '~/libs/shared/lib/services/standard-skills'

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

    const [skillNamesMap, setSkillNamesMap] = useState<Record<string, string>>({})
    const [loadingSkills, setLoadingSkills] = useState<boolean>(false)
    const fetchedSkillIdsRef = useRef<Set<string>>(new Set())

    useEffect(() => {
        if (!workExpirence) {
            setLoadingSkills(false)
            return
        }

        const allSkillIds = new Set<string>()
        workExpirence.forEach((work: UserTrait) => {
            if (work.associatedSkills && Array.isArray(work.associatedSkills)) {
                work.associatedSkills.forEach((skillId: string) => {
                    if (skillId && typeof skillId === 'string') {
                        allSkillIds.add(skillId)
                    }
                })
            }
        })

        if (allSkillIds.size > 0) {
            const skillIdsToFetch = Array.from(allSkillIds)
                .filter(id => !fetchedSkillIdsRef.current.has(id))

            if (skillIdsToFetch.length > 0) {
                setLoadingSkills(true)
                skillIdsToFetch.forEach(id => fetchedSkillIdsRef.current.add(id))

                fetchSkillsByIds(skillIdsToFetch)
                    .then(skills => {
                        setSkillNamesMap(prevMap => {
                            const newMap: Record<string, string> = { ...prevMap }
                            skills.forEach(skill => {
                                if (skill.id && skill.name) {
                                    newMap[skill.id] = skill.name
                                }
                            })
                            skillIdsToFetch.forEach(skillId => {
                                if (!newMap[skillId]) {
                                    newMap[skillId] = skillId
                                }
                            })
                            return newMap
                        })
                    })
                    .catch(() => {
                        setSkillNamesMap(prevMap => {
                            const fallbackMap: Record<string, string> = { ...prevMap }
                            skillIdsToFetch.forEach(skillId => {
                                if (!fallbackMap[skillId]) {
                                    fallbackMap[skillId] = skillId
                                }
                            })
                            return fallbackMap
                        })
                    })
                    .finally(() => {
                        setLoadingSkills(false)
                    })
            } else {
                setLoadingSkills(false)
            }
        } else {
            setLoadingSkills(false)
        }
    }, [workExpirence])

    const areSkillsLoaded = (work: UserTrait): boolean => {
        if (!work.associatedSkills || !Array.isArray(work.associatedSkills) || work.associatedSkills.length === 0) {
            return true
        }

        return work.associatedSkills.every((skillId: string) => {
            const skillName = skillNamesMap[skillId]
            return skillName && skillName !== skillId
        })
    }

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
