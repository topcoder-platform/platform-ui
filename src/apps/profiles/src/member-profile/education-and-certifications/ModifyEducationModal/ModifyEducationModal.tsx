import { Dispatch, FC, MutableRefObject, SetStateAction, useRef, useState } from 'react'
import { bind, trim } from 'lodash'
import { toast } from 'react-toastify'
import classNames from 'classnames'

import { BaseModal, Button, IconOutline, InputDatePicker, InputText } from '~/libs/ui'
import {
    createMemberTraitsAsync,
    updateMemberTraitsAsync,
    UserProfile,
    UserTrait,
    UserTraitCategoryNames,
    UserTraitIds,
} from '~/libs/core'

import { EducationCard } from '../EducationCard'

import styles from './ModifyEducationModal.module.scss'

interface ModifyEducationModalProps {
    onClose: () => void
    onSave: () => void
    profile: UserProfile
    education: UserTrait[] | undefined
}

const methodsMap: { [key: string]: any } = {
    create: createMemberTraitsAsync,
    update: updateMemberTraitsAsync,
}

const ModifyEducationModal: FC<ModifyEducationModalProps> = (props: ModifyEducationModalProps) => {
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

    const [memberEducation, setMemberEducation]: [
        UserTrait[] | undefined,
        Dispatch<SetStateAction<UserTrait[] | undefined>>
    ]
        = useState<UserTrait[] | undefined>(props.education)

    function handleModifyEducationSave(): void {
        setIsSaving(true)

        methodsMap[!!props.education ? 'update' : 'create'](props.profile.handle, [{
            categoryName: UserTraitCategoryNames.education,
            traitId: UserTraitIds.education,
            traits: {
                data: memberEducation || [],
            },
        }])
            .then(() => {
                toast.success('Education updated successfully.', { position: toast.POSITION.BOTTOM_RIGHT })
                props.onSave()
            })
            .catch(() => {
                toast.error('Failed to update your Education.', { position: toast.POSITION.BOTTOM_RIGHT })
                setIsSaving(false)
            })
    }

    function handleFormValueChange(key: string, event: React.ChangeEvent<HTMLInputElement>): void {
        let value: string | boolean | Date | undefined

        switch (key) {
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

        if (!trim(formValues.schoolCollegeName as string)) {
            setFormErrors({
                schoolCollegeName: 'School is required',
            })
            return
        }

        if (!trim(formValues.major as string)) {
            setFormErrors({
                major: 'Degree is required',
            })
            return
        }

        const updatedEducation: UserTrait = {
            graduated: formValues.graduated,
            major: formValues.major,
            schoolCollegeName: formValues.schoolCollegeName,
            timePeriodTo: formValues.endDate ? (formValues.endDate as Date).toISOString() : undefined,
        }

        if (editedItemIndex !== undefined && memberEducation) {
            memberEducation[editedItemIndex] = updatedEducation

            setMemberEducation([
                ...memberEducation,
            ])
        } else {
            setMemberEducation(
                [...memberEducation || [], updatedEducation],
            )
        }

        setIsFormChanged(true)
        resetForm()
    }

    function handleEducationEdit(indx: number): void {
        const education: UserTrait = memberEducation ? memberEducation[indx] : {}

        setEditedItemIndex(indx)

        setFormValues({
            endDate: education.timePeriodTo ? new Date(education.timePeriodTo) : undefined,
            graduated: education.graduated,
            major: education.major,
            schoolCollegeName: education.schoolCollegeName,
        })
    }

    function handleEducationDelete(indx: number): void {
        const updatedEducation: UserTrait[] = [...memberEducation || []]

        updatedEducation.splice(indx, 1)
        setMemberEducation(updatedEducation)
        setIsFormChanged(true)
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='lg'
            title='LEARNING & EDUCATION'
            buttons={(
                <div className={styles.modalButtons}>
                    <Button
                        label='Cancel'
                        onClick={props.onClose}
                        secondary
                    />
                    <Button
                        label='Save'
                        onClick={handleModifyEducationSave}
                        primary
                        disabled={isSaving || !isFormChanged}
                    />
                </div>
            )}
        >
            <div className={styles.container}>
                <div className={classNames(styles.educationWrap, !memberEducation?.length ? styles.noItems : '')}>
                    {
                        memberEducation?.map((education: UserTrait, indx: number) => (
                            <div
                                className={styles.educationCardWrap}
                                key={`${education.schoolCollegeName}-${education.major}`}
                            >
                                <EducationCard education={education} />
                                <div className={styles.actionElements}>
                                    <Button
                                        className={styles.ctaBtn}
                                        icon={IconOutline.PencilIcon}
                                        onClick={bind(handleEducationEdit, this, indx)}
                                        size='lg'
                                    />
                                    <Button
                                        className={styles.ctaBtn}
                                        icon={IconOutline.TrashIcon}
                                        onClick={bind(handleEducationDelete, this, indx)}
                                        size='lg'
                                    />
                                </div>
                            </div>
                        ))
                    }
                </div>

                <p>
                    Enter information about your schooling and degrees.
                </p>

                <form
                    ref={formElRef}
                    className={styles.formWrap}
                >
                    <InputText
                        name='school'
                        label='Name of College or University *'
                        error={formErrors.schoolCollegeName}
                        placeholder='Enter name of college or university'
                        dirty
                        tabIndex={0}
                        type='text'
                        onChange={bind(handleFormValueChange, this, 'schoolCollegeName')}
                        value={formValues.schoolCollegeName as string}
                    />
                    <InputText
                        name='major'
                        label='Degree *'
                        error={formErrors.major}
                        placeholder='Enter Degree'
                        dirty
                        tabIndex={-1}
                        type='text'
                        onChange={bind(handleFormValueChange, this, 'major')}
                        value={formValues.major as string}
                    />
                    <InputDatePicker
                        label='End date (or expected)'
                        date={formValues.endDate as Date}
                        onChange={bind(handleFormValueChange, this, 'endDate')}
                        disabled={false}
                        error={formErrors.endDate}
                        dirty
                        showMonthPicker={false}
                        showYearPicker
                        dateFormat='yyyy'
                    />
                    <div className={styles.formCTAs}>
                        {editedItemIndex === undefined ? <IconOutline.PlusCircleIcon /> : undefined}
                        <Button
                            link
                            label={`${editedItemIndex !== undefined ? 'Edit' : 'Add'} School / Degree`}
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

export default ModifyEducationModal
