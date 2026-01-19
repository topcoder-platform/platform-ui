/* eslint-disable complexity */
import { ChangeEvent, Dispatch, FC, MutableRefObject, SetStateAction, useEffect, useRef, useState } from 'react'
import { bind, sortBy, trim } from 'lodash'
import { toast } from 'react-toastify'
import classNames from 'classnames'

import { BaseModal, Button, IconOutline, InputDatePicker, InputSelect, InputText } from '~/libs/ui'
import {
    updateDeleteOrCreateMemberTraitAsync,
    UserProfile, UserTrait,
    UserTraitCategoryNames,
    UserTraitIds,
} from '~/libs/core'
import {
    FieldHtmlEditor,
    getIndustryOptionLabel,
    getIndustryOptionValue,
    INDUSTRIES_OPTIONS,
    InputSkillSelector,
} from '~/libs/shared'
import { fetchSkillsByIds } from '~/libs/shared/lib/services/standard-skills'

import { WorkExpirenceCard } from '../WorkExpirenceCard'

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

    const [formValues, setFormValues]: [
        { [key: string]: string | boolean | Date | any[] | undefined },
        Dispatch<SetStateAction<{ [key: string]: string | boolean | Date | any[] | undefined }>>
    ]
        = useState<{ [key: string]: string | boolean | Date | any[] | undefined }>({})

    const [formErrors, setFormErrors]: [
        { [key: string]: string },
        Dispatch<SetStateAction<{ [key: string]: string }>>
    ]
        = useState<{ [key: string]: string }>({})

    const formElRef: MutableRefObject<HTMLDivElement | any> = useRef()

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
            // No skills to fetch
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

    const industryOptions: any = sortBy(INDUSTRIES_OPTIONS)
        .map(v => ({
            label: getIndustryOptionLabel(v),
            value: getIndustryOptionValue(v),
        }))

    function handleModifyWorkExpirenceSave(): void {
        if (addingNewItem || editedItemIndex !== undefined) {
            handleFormAction()

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

    function handleFormValueChange(
        key: string,
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ): void {
        let value: string | boolean | Date | undefined
        const oldFormValues = { ...formValues }

        switch (key) {
            case 'currentlyWorking':
                value = (event.target as HTMLInputElement).checked
                if (value) {
                    oldFormValues.endDate = undefined
                }

                break
            case 'startDate':
            case 'endDate':
                value = event as unknown as Date
                break
            default:
                value = event.target.value
                break
        }

        setFormValues({
            ...oldFormValues,
            [key]: value,
        })
    }

    function handleDescriptionChange(value: string): void {
        setFormValues({
            ...formValues,
            description: value,
        })
    }

    function handleSkillsChange(event: ChangeEvent<HTMLInputElement>): void {
        const selectedSkills = (event.target as any).value || []
        setFormValues({
            ...formValues,
            associatedSkills: selectedSkills.map((skill: any) => ({
                id: skill.value || skill.id,
                name: skill.label || skill.name,
            })),
        })
    }

    function resetForm(): void {
        setFormValues({})
        setFormErrors({})
        formElRef.current.reset()
        setEditedItemIndex(undefined)
        setAddingNewItem(false)
    }

    function handleFormAction(): void {
        setFormErrors({})

        if (!trim(formValues.company as string)) {
            setFormErrors({
                company: 'Company is required',
            })
            return
        }

        if (!trim(formValues.position as string)) {
            setFormErrors({
                position: 'Position is required',
            })
            return
        }

        if (formValues.endDate && formValues.startDate && formValues.endDate <= formValues.startDate) {
            setFormErrors({
                endDate: 'End date must be greater than start date',
            })
            return
        }

        if (formValues.endDate || formValues.startDate) {
            if (formValues.endDate && !formValues.startDate && !formValues.currentlyWorking) {
                setFormErrors({
                    startDate: 'Start date is required when end date is given',
                })
                return
            }

            if (formValues.startDate && !formValues.endDate && !formValues.currentlyWorking) {
                setFormErrors({
                    endDate: 'End date is required when start date is given',
                })
                return
            }
        }

        const companyName: string | undefined = formValues.company as string | undefined
        const startDateIso: string | undefined = formValues.startDate
            ? (formValues.startDate as Date).toISOString()
            : undefined
        const endDateIso: string | undefined = formValues.endDate
            ? (formValues.endDate as Date).toISOString()
            : undefined

        const updatedWorkExpirence: UserTrait = {
            associatedSkills: (formValues.associatedSkills as any[])?.map((s: any) => s.id || s) || [],
            company: companyName,
            companyName,
            description: (formValues.description as string) || undefined,
            endDate: endDateIso,
            industry: formValues.industry,
            position: formValues.position,
            startDate: startDateIso,
            timePeriodFrom: startDateIso,
            timePeriodTo: endDateIso,
            working: formValues.currentlyWorking,
        }

        if (editedItemIndex !== undefined && workExpirence) {
            workExpirence[editedItemIndex] = updatedWorkExpirence

            setWorkExpirence([
                ...workExpirence,
            ])
        } else {
            setWorkExpirence(
                [...workExpirence || [], updatedWorkExpirence],
            )
        }

        resetForm()
    }

    async function handleWorkExpirenceEdit(indx: number): Promise<void> {
        const work: UserTrait = workExpirence ? workExpirence[indx] : {}

        setEditedItemIndex(indx)

        let associatedSkills: any[] = []
        if (work.associatedSkills && Array.isArray(work.associatedSkills) && work.associatedSkills.length > 0) {
            try {
                const skills = await fetchSkillsByIds(
                    work.associatedSkills.filter((id): id is string => typeof id === 'string'),
                )
                const skillsMap = new Map(skills.map(s => [s.id, s.name]))

                associatedSkills = work.associatedSkills.map((skillId: string) => ({
                    id: skillId,
                    name: skillsMap.get(skillId) || '',
                }))
            } catch {
                associatedSkills = work.associatedSkills.map((skillId: string) => ({
                    id: skillId,
                    name: skillNamesMap[skillId] || '',
                }))
            }
        }

        setFormValues({
            associatedSkills,
            company: (work.company || work.companyName || '') as string,
            currentlyWorking: work.working || false,
            description: work.description || '',
            endDate: work.timePeriodTo
                ? new Date(work.timePeriodTo)
                : (work.endDate ? new Date(work.endDate) : undefined),
            industry: work.industry || '',
            position: (work.position || '') as string,
            startDate: work.timePeriodFrom
                ? new Date(work.timePeriodFrom)
                : (work.startDate ? new Date(work.startDate) : undefined),
        })
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
            resetForm()
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
                                        <WorkExpirenceCard
                                            work={work}
                                            isModalView
                                            skillNamesMap={skillNamesMap}
                                            showSkills={!loadingSkills && areSkillsLoaded(work)}
                                        />
                                        <div className={styles.actionElements}>
                                            <Button
                                                className={styles.ctaBtn}
                                                icon={IconOutline.PencilIcon}
                                                onClick={bind(handleWorkExpirenceEdit, this, indx)}
                                                size='lg'
                                            />
                                            <Button
                                                className={styles.ctaBtn}
                                                icon={IconOutline.TrashIcon}
                                                onClick={bind(handleWorkExpirenceDelete, this, indx)}
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
                    <form
                        ref={formElRef}
                        className={styles.formWrap}
                    >
                        <InputText
                            name='company'
                            label='Company *'
                            error={formErrors.company}
                            placeholder='Enter a company'
                            dirty
                            tabIndex={0}
                            forceUpdateValue
                            type='text'
                            onChange={bind(handleFormValueChange, this, 'company')}
                            value={formValues.company as string}
                        />
                        <InputText
                            name='position'
                            label='Position *'
                            error={formErrors.position}
                            placeholder='Enter a position'
                            dirty
                            tabIndex={0}
                            type='text'
                            forceUpdateValue
                            onChange={bind(handleFormValueChange, this, 'position')}
                            value={formValues.position as string}
                        />
                        <InputSelect
                            tabIndex={0}
                            options={industryOptions}
                            value={formValues.industry as string}
                            onChange={bind(handleFormValueChange, this, 'industry')}
                            name='industry'
                            label='Industry'
                            placeholder='Select industry'
                            dirty
                            error={formErrors.industry}
                        />
                        <div className={styles.row}>
                            <InputDatePicker
                                label='Start Date'
                                date={formValues.startDate as Date}
                                onChange={bind(handleFormValueChange, this, 'startDate')}
                                disabled={false}
                                error={formErrors.startDate}
                                dirty
                                maxDate={new Date()}
                            />
                            <InputDatePicker
                                label='End Date'
                                date={formValues.endDate as Date}
                                onChange={bind(handleFormValueChange, this, 'endDate')}
                                disabled={formValues.currentlyWorking as boolean}
                                error={formErrors.endDate}
                                dirty
                                maxDate={new Date()}
                            />
                        </div>
                        <InputText
                            name='currentlyWorking'
                            label='I am currently working in this role'
                            error={formErrors.currentlyWorking}
                            dirty
                            tabIndex={0}
                            type='checkbox'
                            onChange={bind(handleFormValueChange, this, 'currentlyWorking')}
                            checked={formValues.currentlyWorking as boolean}
                        />
                        <FieldHtmlEditor
                            name='description'
                            label='Description'
                            placeholder='Describe your role and achievements at this company'
                            dirty
                            tabIndex={0}
                            onChange={handleDescriptionChange}
                            toolbar='undo redo | formatselect | bold italic underline strikethrough | link | alignleft aligncenter alignright alignjustify | numlist bullist outdent indent | table | removeformat'
                            value={formValues.description as string}
                        />
                        <InputSkillSelector
                            label='Associated Skills'
                            placeholder='Type to search and add skills...'
                            value={formValues.associatedSkills as any[]}
                            onChange={handleSkillsChange}
                            loading={false}
                        />
                    </form>
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
