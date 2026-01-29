/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useEffect, useRef, useState } from 'react'
import { bind } from 'lodash'
import { toast } from 'react-toastify'
import classNames from 'classnames'

import { BaseModal, Button, IconOutline } from '~/libs/ui'
import {
    updateDeleteOrCreateMemberTraitAsync,
    UserProfile, UserTrait,
    UserTraitCategoryNames,
    UserTraitIds,
} from '~/libs/core'
import {
    AddEditWorkExperienceForm,
    WorkExperienceCard,
} from '~/libs/shared'
import type { AddEditWorkExperienceFormRef } from '~/libs/shared/lib/components/add-edit-work-experience-form'
import { fetchSkillsByIds } from '~/libs/shared/lib/services/standard-skills'

import styles from './ModifyWorkExpirenceModal.module.scss'

interface ModifyWorkExpirenceModalProps {
    onClose: () => void
    onSave: () => void
    profile: UserProfile
    workExpirence: UserTrait[] | undefined
}

const ModifyWorkExpirenceModal: FC<ModifyWorkExpirenceModalProps> = (props: ModifyWorkExpirenceModalProps) => {
    const [isSaving, setIsSaving]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [addingNewItem, setAddingNewItem]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(props.workExpirence?.length === 0 || false)

    const [editedItemIndex, setEditedItemIndex]: [
        number | undefined,
        Dispatch<SetStateAction<number | undefined>>
    ] = useState<number | undefined>()

    const [workExpirence, setWorkExpirence]: [
        UserTrait[] | undefined,
        Dispatch<SetStateAction<UserTrait[] | undefined>>
    ]
        = useState<UserTrait[] | undefined>(props.workExpirence)

    const [skillNamesMap, setSkillNamesMap] = useState<Record<string, string>>({})
    const [loadingSkills, setLoadingSkills] = useState<boolean>(false)
    const fetchedSkillIdsRef = useRef<Set<string>>(new Set())
    const formRef = useRef<AddEditWorkExperienceFormRef>(null)

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

    function handleModifyWorkExpirenceSave(): void {
        if (addingNewItem || editedItemIndex !== undefined) {
            formRef.current?.submit()
            return
        }

        setIsSaving(true)

        updateDeleteOrCreateMemberTraitAsync(props.profile.handle, {
            categoryName: UserTraitCategoryNames.work,
            traitId: UserTraitIds.work,
            traits: {
                data: workExpirence || [],
                traitId: UserTraitIds.work,
            },
        }, props.workExpirence)
            .then(() => {
                toast.success('Work Experience updated successfully.', { position: toast.POSITION.BOTTOM_RIGHT })
                props.onSave()
            })
            .catch(() => {
                toast.error('Failed to update user\'s Work Experience.', { position: toast.POSITION.BOTTOM_RIGHT })
                setIsSaving(false)
            })
    }

    function handleFormSave(work: UserTrait): void {
        if (editedItemIndex !== undefined && workExpirence) {
            const updated = [...workExpirence]
            updated[editedItemIndex] = work
            setWorkExpirence(updated)
        } else {
            setWorkExpirence([...(workExpirence || []), work])
        }

        setEditedItemIndex(undefined)
        setAddingNewItem(false)
    }

    function handleWorkExpirenceEdit(indx: number): void {
        setEditedItemIndex(indx)
    }

    function handleWorkExpirenceDelete(indx: number): void {
        const updatedWorkExpirence: UserTrait[] = [...workExpirence || []]
        updatedWorkExpirence.splice(indx, 1)
        setWorkExpirence(updatedWorkExpirence)
    }

    function handleAddNewItem(): void {
        setAddingNewItem(true)
    }

    function handleModifyWorkExpirenceCancel(): void {
        if (addingNewItem || editedItemIndex !== undefined) {
            setAddingNewItem(false)
            setEditedItemIndex(undefined)
        } else {
            props.onClose()
        }
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='lg'
            title={`${addingNewItem ? 'Add ' : (editedItemIndex !== undefined ? 'Edit ' : '')}Experience`}
            buttons={(
                <div className={styles.modalButtons}>
                    <Button
                        label='Cancel'
                        onClick={handleModifyWorkExpirenceCancel}
                        secondary
                    />
                    <Button
                        label='Save'
                        onClick={handleModifyWorkExpirenceSave}
                        primary
                        disabled={isSaving}
                    />
                </div>
            )}
        >
            <div className={styles.container}>
                <p>
                    Add jobs that demonstrate your skills and abilities.
                </p>

                {editedItemIndex === undefined && !addingNewItem ? (
                    <div className={classNames(styles.workExpirenceWrap, !workExpirence?.length ? styles.noItems : '')}>
                        {
                            workExpirence?.map((work: UserTrait, indx: number) => {
                                const companyName: string | undefined = work.company || work.companyName
                                const uniqueKey: string = [
                                    companyName,
                                    work.industry,
                                    work.position,
                                    work.timePeriodFrom || work.startDate,
                                ].filter(Boolean)
                                    .join('-')

                                return (
                                    <div
                                        className={styles.workExpirenceCardWrap}
                                        key={uniqueKey || `${work.position}-${indx}`}
                                    >
                                        <WorkExperienceCard
                                            work={work}
                                            isModalView
                                            skillNamesMap={skillNamesMap}
                                            showSkills={!loadingSkills && areSkillsLoaded(work)}
                                        />
                                        <div className={styles.actionElements}>
                                            <Button
                                                className={styles.ctaBtn}
                                                icon={IconOutline.PencilIcon}
                                                onClick={bind(handleWorkExpirenceEdit, undefined, indx)}
                                                size='lg'
                                            />
                                            <Button
                                                className={styles.ctaBtn}
                                                icon={IconOutline.TrashIcon}
                                                onClick={bind(handleWorkExpirenceDelete, undefined, indx)}
                                                size='lg'
                                            />
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>
                ) : undefined}

                {editedItemIndex !== undefined || addingNewItem ? (
                    <AddEditWorkExperienceForm
                        ref={formRef}
                        initialWork={editedItemIndex !== undefined && workExpirence
                            ? workExpirence[editedItemIndex]
                            : undefined}
                        onSave={handleFormSave}
                    />
                ) : (
                    <Button
                        label='+ Add experience'
                        secondary
                        onClick={handleAddNewItem}
                    />
                )}
            </div>
        </BaseModal>
    )
}

export default ModifyWorkExpirenceModal
