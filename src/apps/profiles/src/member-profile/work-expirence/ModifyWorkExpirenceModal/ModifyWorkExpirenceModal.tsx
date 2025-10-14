/* eslint-disable complexity */
import { Dispatch, FC, MutableRefObject, SetStateAction, useRef, useState } from 'react'
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
import { getIndustryOptionLabels, getIndustryOptionValues, INDUSTRIES_OPTIONS } from '~/libs/shared'

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
        { [key: string]: string | boolean | Date | undefined },
        Dispatch<SetStateAction<{ [key: string]: string | boolean | Date | undefined }>>
    ]
        = useState<{ [key: string]: string | boolean | Date | undefined }>({})

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

    const industryOptions: any = sortBy(INDUSTRIES_OPTIONS)
        .map(v => ({
            label: getIndustryOptionLabels(v),
            value: getIndustryOptionValues(v),
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

    function handleFormValueChange(key: string, event: React.ChangeEvent<HTMLInputElement>): void {
        let value: string | boolean | Date | undefined
        const oldFormValues = { ...formValues }

        switch (key) {
            case 'currentlyWorking':
                value = event.target.checked
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

        const updatedWorkExpirence: UserTrait = {
            cityTown: formValues.city,
            company: formValues.company,
            industry: formValues.industry,
            position: formValues.position,
            timePeriodFrom: formValues.startDate ? (formValues.startDate as Date).toISOString() : undefined,
            timePeriodTo: formValues.endDate ? (formValues.endDate as Date).toISOString() : undefined,
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

    function handleWorkExpirenceEdit(indx: number): void {
        const work: UserTrait = workExpirence ? workExpirence[indx] : {}

        setEditedItemIndex(indx)

        setFormValues({
            city: work.cityTown,
            company: work.company,
            currentlyWorking: work.working,
            endDate: work.timePeriodTo ? new Date(work.timePeriodTo) : undefined,
            industry: work.industry,
            position: work.position,
            startDate: work.timePeriodFrom ? new Date(work.timePeriodFrom) : undefined,
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
                            workExpirence?.map((work: UserTrait, indx: number) => (
                                <div
                                    className={styles.workExpirenceCardWrap}
                                    key={`${work.company}-${work.industry}-${work.position}`}
                                >
                                    <WorkExpirenceCard work={work} isModalView />
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
                            ))
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
