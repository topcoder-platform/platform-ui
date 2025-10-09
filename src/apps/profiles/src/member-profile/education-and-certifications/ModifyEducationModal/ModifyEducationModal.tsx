import { Dispatch, FC, MutableRefObject, SetStateAction, useRef, useState } from 'react'
import { bind, range, trim } from 'lodash'
import { toast } from 'react-toastify'
import { getYear } from 'date-fns'
import classNames from 'classnames'

import { BaseModal, Button, IconOutline, InputSelect, InputText } from '~/libs/ui'
import {
    updateDeleteOrCreateMemberTraitAsync,
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

const years: number[] = range(1979, getYear(new Date()) + 10)
const yearOptions: any = years
    .map(v => ({
        label: `${v}`,
        value: `${v}`,
    }))

const ModifyEducationModal: FC<ModifyEducationModalProps> = (props: ModifyEducationModalProps) => {
    const [isSaving, setIsSaving]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [addingNewItem, setAddingNewItem]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(props.education?.length === 0 || false)

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
        if (addingNewItem || editedItemIndex !== undefined) {
            handleFormAction()

            return
        }

        setIsSaving(true)

        updateDeleteOrCreateMemberTraitAsync(props.profile.handle, {
            categoryName: UserTraitCategoryNames.education,
            traitId: UserTraitIds.education,
            traits: {
                data: memberEducation || [],
                traitId: UserTraitIds.education,
            },
        }, props.education)
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
        setFormValues({
            ...formValues,
            [key]: event.target.value,
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

        if (!trim(formValues.collegeName as string)) {
            setFormErrors({
                collegeName: 'School is required',
            })
            return
        }

        if (!trim(formValues.degree as string)) {
            setFormErrors({
                degree: 'Degree is required',
            })
            return
        }

        const updatedEducation: UserTrait = {
            collegeName: formValues.collegeName,
            degree: formValues.degree,
            endYear: formValues.endYear,
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

        resetForm()
    }

    function handleEducationEdit(indx: number): void {
        const education: UserTrait = memberEducation ? memberEducation[indx] : {}

        setEditedItemIndex(indx)

        setFormValues({
            collegeName: education.collegeName,
            degree: education.degree,
            endYear: education.endYear,
        })
    }

    function handleEducationDelete(indx: number): void {
        const updatedEducation: UserTrait[] = [...memberEducation || []]

        updatedEducation.splice(indx, 1)
        setMemberEducation(updatedEducation)
    }

    function handleAddNewItem(): void {
        setAddingNewItem(true)
    }

    function handleModifyEducationCancel(): void {
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
            bodyClassName={styles.eduModalBody}
            classNames={{
                modal: styles.eduModal,
            }}
            onClose={props.onClose}
            open
            size='lg'
            title='EDUCATION'
            buttons={(
                <div className={styles.modalButtons}>
                    <Button
                        label='Cancel'
                        onClick={handleModifyEducationCancel}
                        secondary
                    />
                    <Button
                        label='Save'
                        onClick={handleModifyEducationSave}
                        primary
                        disabled={isSaving}
                    />
                </div>
            )}
        >
            <div className={styles.container}>

                <p>
                    Add degrees or other education details.
                </p>

                {editedItemIndex === undefined && !addingNewItem ? (
                    <div className={classNames(styles.educationWrap, !memberEducation?.length ? styles.noItems : '')}>
                        {
                            memberEducation?.map((education: UserTrait, indx: number) => (
                                <div
                                    className={styles.educationCardWrap}
                                    key={`${education.collegeName}-${education.degree}`}
                                >
                                    <EducationCard education={education} isModalView />
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
                ) : undefined}

                {editedItemIndex !== undefined || addingNewItem ? (
                    <form
                        ref={formElRef}
                        className={styles.formWrap}
                    >
                        <InputText
                            name='school'
                            label='Name of College or University *'
                            error={formErrors.collegeName}
                            placeholder='Enter name of college or university'
                            dirty
                            tabIndex={0}
                            type='text'
                            onChange={bind(handleFormValueChange, this, 'collegeName')}
                            value={formValues.collegeName as string}
                        />
                        <InputText
                            name='degree'
                            label='Degree *'
                            error={formErrors.degree}
                            placeholder='Enter Degree'
                            dirty
                            tabIndex={0}
                            type='text'
                            onChange={bind(handleFormValueChange, this, 'degree')}
                            value={formValues.degree as string}
                        />
                        <InputSelect
                            options={yearOptions}
                            value={`${getYear(formValues.endDate as Date)}`}
                            onChange={bind(handleFormValueChange, this, 'endDate')}
                            dirty
                            error={formErrors.endDate}
                            name='endDate'
                            label='End Year or Expected'
                            placeholder='Select a year'
                            tabIndex={0}
                        />
                    </form>
                ) : (
                    <Button
                        label='+ Add Education'
                        secondary
                        onClick={handleAddNewItem}
                    />
                )}
            </div>
        </BaseModal>
    )
}

export default ModifyEducationModal
