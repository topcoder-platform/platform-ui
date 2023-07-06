import { Dispatch, FC, MutableRefObject, SetStateAction, useRef, useState } from 'react'
import { bind, trim } from 'lodash'
import { toast } from 'react-toastify'
import classNames from 'classnames'

import { BaseModal, Button, IconOutline, InputDatePicker, InputText } from '~/libs/ui'
import {
    createMemberTraitsAsync,
    updateMemberTraitsAsync,
    UserProfile, UserTrait,
    UserTraitCategoryNames,
    UserTraitIds,
} from '~/libs/core'

import { WorkExpirenceCard } from '../WorkExpirenceCard'

import styles from './ModifyWorkExpirenceModal.module.scss'

interface ModifyWorkExpirenceModalProps {
    onClose: () => void
    onSave: () => void
    profile: UserProfile
    workExpirence: UserTrait[] | undefined
}

const methodsMap: { [key: string]: any } = {
    create: createMemberTraitsAsync,
    update: updateMemberTraitsAsync,
}

const ModifyWorkExpirenceModal: FC<ModifyWorkExpirenceModalProps> = (props: ModifyWorkExpirenceModalProps) => {
    const [isSaving, setIsSaving]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [isFormChanged, setIsFormChanged]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

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

    function handleModifyWorkExpirenceSave(): void {
        setIsSaving(true)

        methodsMap[!!props.workExpirence ? 'update' : 'create'](props.profile.handle, [{
            categoryName: UserTraitCategoryNames.work,
            traitId: UserTraitIds.work,
            traits: {
                data: workExpirence || [],
            },
        }])
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

        switch (key) {
            case 'currentlyWorking':
                value = event.target.checked
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
            ...formValues,
            [key]: value,
        })
    }

    function handleCancelEditMode(): void {
        setEditedItemIndex(undefined)
        resetForm()
    }

    function resetForm(): void {
        setFormValues({})
        formElRef.current.reset()
        setEditedItemIndex(undefined)
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

        setIsFormChanged(true)
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
        setIsFormChanged(true)
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='lg'
            title='Work Experience'
            buttons={(
                <div className={styles.modalButtons}>
                    <Button
                        label='Cancel'
                        onClick={props.onClose}
                        secondary
                    />
                    <Button
                        label='Save'
                        onClick={handleModifyWorkExpirenceSave}
                        primary
                        disabled={isSaving || !isFormChanged}
                    />
                </div>
            )}
        >
            <div className={styles.container}>
                <div className={classNames(styles.workExpirenceWrap, !workExpirence?.length ? styles.noItems : '')}>
                    {
                        workExpirence?.map((work: UserTrait, indx: number) => (
                            <div
                                className={styles.workExpirenceCardWrap}
                                key={`${work.company}-${work.industry}-${work.position}`}
                            >
                                <WorkExpirenceCard work={work} />
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

                <p>
                    Enter your work experience to show customers
                    the roles and responsibilites you have held in the past.
                </p>

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
                        tabIndex={-1}
                        type='text'
                        onChange={bind(handleFormValueChange, this, 'position')}
                        value={formValues.position as string}
                    />
                    <div className={styles.row}>
                        <InputText
                            name='industry'
                            label='Industry'
                            error={formErrors.industry}
                            placeholder='Enter an industry'
                            dirty
                            tabIndex={-1}
                            type='text'
                            onChange={bind(handleFormValueChange, this, 'industry')}
                            value={formValues.industry as string}
                        />
                        <InputText
                            name='city'
                            label='City'
                            error={formErrors.city}
                            placeholder='Enter a city'
                            dirty
                            tabIndex={-1}
                            type='text'
                            onChange={bind(handleFormValueChange, this, 'city')}
                            value={formValues.city as string}
                        />
                    </div>
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
                            disabled={false}
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
                        tabIndex={-1}
                        type='checkbox'
                        onChange={bind(handleFormValueChange, this, 'currentlyWorking')}
                        checked={formValues.currentlyWorking as boolean}
                    />
                    <div className={styles.formCTAs}>
                        {editedItemIndex === undefined ? <IconOutline.PlusCircleIcon /> : undefined}
                        <Button
                            link
                            label={`${editedItemIndex !== undefined ? 'Edit' : 'Add'} Job to your List`}
                            onClick={handleFormAction}
                        />
                        {editedItemIndex !== undefined && (
                            <Button
                                className={styles.ctaBtnCancel}
                                link
                                label='Cancel'
                                onClick={handleCancelEditMode}
                            />
                        )}
                    </div>
                </form>
            </div>
        </BaseModal>
    )
}

export default ModifyWorkExpirenceModal
