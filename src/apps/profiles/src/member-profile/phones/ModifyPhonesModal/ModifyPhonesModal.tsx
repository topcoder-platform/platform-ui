/* eslint-disable complexity */
import { Dispatch, FC, MutableRefObject, SetStateAction, useRef, useState } from 'react'
import { bind, trim } from 'lodash'
import { toast } from 'react-toastify'
import classNames from 'classnames'

import { BaseModal, Button, IconOutline, InputSelect, InputText } from '~/libs/ui'
import { updateMemberProfileAsync, UserProfile } from '~/libs/core'

import { PhoneCard } from '../PhoneCard'

import styles from './ModifyPhonesModal.module.scss'

interface ModifyPhonesModalProps {
    onClose: () => void
    onSave: () => void
    profile: UserProfile
    phones: Array<{
        type: string
        number: string
    }>
    initialEditIndex?: number
}

const PHONE_TYPE_OPTIONS = [
    { label: 'Work', value: 'Work' },
    { label: 'Mobile', value: 'Mobile' },
    { label: 'Home', value: 'Home' },
]

const PHONE_VALIDATION_REGEX = /^\+[1-9]\d{1,14}$/

/**
 * Normalize phone number by removing spaces and dashes
 */
function normalizePhoneNumber(phone: string): string {
    return phone.replace(/[\s-]/g, '')
}

const ModifyPhonesModal: FC<ModifyPhonesModalProps> = (props: ModifyPhonesModalProps) => {
    const [isSaving, setIsSaving]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [addingNewItem, setAddingNewItem]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(props.initialEditIndex === undefined && props.phones.length === 0)

    const [formValues, setFormValues]: [
        { [key: string]: string | undefined },
        Dispatch<SetStateAction<{ [key: string]: string | undefined }>>
    ]
        = useState<{ [key: string]: string | undefined }>(
            props.initialEditIndex !== undefined && props.phones[props.initialEditIndex]
                ? {
                    number: props.phones[props.initialEditIndex].number,
                    type: props.phones[props.initialEditIndex].type,
                }
                : {},
        )

    const [formErrors, setFormErrors]: [
        { [key: string]: string },
        Dispatch<SetStateAction<{ [key: string]: string }>>
    ]
        = useState<{ [key: string]: string }>({})

    const formElRef: MutableRefObject<HTMLDivElement | any> = useRef()

    const [editedItemIndex, setEditedItemIndex]: [
        number | undefined,
        Dispatch<SetStateAction<number | undefined>>
    ] = useState<number | undefined>(props.initialEditIndex)

    const [phones, setPhones]: [
        Array<{ type: string; number: string }>,
        Dispatch<SetStateAction<Array<{ type: string; number: string }>>>
    ]
        = useState<Array<{ type: string; number: string }>>(props.phones)

    function handleModifyPhonesSave(): void {
        if (addingNewItem || editedItemIndex !== undefined) {
            handleFormAction()
            return
        }

        setIsSaving(true)

        updateMemberProfileAsync(props.profile.handle, {
            phones,
        })
            .then(() => {
                toast.success('Phone numbers updated successfully.', { position: toast.POSITION.BOTTOM_RIGHT })
                props.onSave()
            })
            .catch(() => {
                toast.error('Failed to update phone numbers.', { position: toast.POSITION.BOTTOM_RIGHT })
                setIsSaving(false)
            })
    }

    function handleFormValueChange(
        key: string,
        event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ): void {
        const value: string = event.target.value

        setFormValues({
            ...formValues,
            [key]: value,
        })

        // Clear error when user starts typing
        if (formErrors[key]) {
            setFormErrors({
                ...formErrors,
                [key]: '',
            })
        }
    }

    function handlePhoneNumberBlur(): void {
        const phoneNumber = formValues.number || ''

        if (phoneNumber) {
            const normalized = normalizePhoneNumber(phoneNumber)
            if (!PHONE_VALIDATION_REGEX.test(normalized)) {
                setFormErrors({
                    ...formErrors,
                    number: 'Phone number is not in valid E.164 format (must start with + followed by 1-9, then 1-14 more digits)',
                })
            } else {
                // Clear error if valid
                setFormErrors({
                    ...formErrors,
                    number: '',
                })
            }
        }
    }

    function resetForm(): void {
        setFormValues({})
        setFormErrors({})
        if (formElRef.current && formElRef.current.reset) {
            formElRef.current.reset()
        }

        setEditedItemIndex(undefined)
        setAddingNewItem(false)
    }

    function handleFormAction(): void {
        setFormErrors({})

        if (!trim(formValues.type as string)) {
            setFormErrors({
                type: 'Phone type is required',
            })
            return
        }

        if (!trim(formValues.number as string)) {
            setFormErrors({
                number: 'Phone number is required',
            })
            return
        }

        const phoneNumber = trim(formValues.number as string)
        const normalized = normalizePhoneNumber(phoneNumber)
        
        if (!PHONE_VALIDATION_REGEX.test(normalized)) {
            setFormErrors({
                number: 'Phone number is not in valid E.164 format (must start with + followed by 1-9, then 1-14 more digits)',
            })
            return
        }

        const updatedPhone: { type: string; number: string } = {
            number: normalized,
            type: formValues.type as string,
        }

        if (editedItemIndex !== undefined) {
            const updatedPhones = [...phones]
            updatedPhones[editedItemIndex] = updatedPhone
            setPhones(updatedPhones)
        } else {
            setPhones([...phones, updatedPhone])
        }

        resetForm()
    }

    function handlePhoneEdit(indx: number): void {
        const phone = phones[indx]

        setEditedItemIndex(indx)
        setFormValues({
            number: phone.number,
            type: phone.type,
        })
    }

    function handlePhoneDelete(indx: number): void {
        const updatedPhones = [...phones]
        updatedPhones.splice(indx, 1)
        setPhones(updatedPhones)
    }

    function handleAddNewItem(): void {
        setAddingNewItem(true)
    }

    function handleModifyPhonesCancel(): void {
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
            title={`${addingNewItem ? 'Add ' : (editedItemIndex !== undefined ? 'Edit ' : '')}Phone`}
            buttons={(
                <div className={styles.modalButtons}>
                    <Button
                        label='Cancel'
                        onClick={handleModifyPhonesCancel}
                        secondary
                    />
                    <Button
                        label='Save'
                        onClick={handleModifyPhonesSave}
                        primary
                        disabled={isSaving}
                    />
                </div>
            )}
        >
            <div className={styles.container}>
                <p>
                    Add contact phone numbers that others can use to reach you.
                </p>

                {editedItemIndex === undefined && !addingNewItem ? (
                    <div className={classNames(styles.phonesWrap, !phones.length ? styles.noItems : '')}>
                        {
                            phones.map((phone, indx: number) => (
                                <div
                                    className={styles.phoneCardWrap}
                                    key={`${phone.type}-${phone.number}`}
                                >
                                    <PhoneCard
                                        type={phone.type}
                                        number={phone.number}
                                        isModalView
                                    />
                                    <div className={styles.actionElements}>
                                        <Button
                                            className={styles.ctaBtn}
                                            icon={IconOutline.PencilIcon}
                                            onClick={bind(handlePhoneEdit, this, indx)}
                                            size='lg'
                                        />
                                        <Button
                                            className={styles.ctaBtn}
                                            icon={IconOutline.TrashIcon}
                                            onClick={bind(handlePhoneDelete, this, indx)}
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
                        <div className={styles.row}>
                            <InputSelect
                                tabIndex={0}
                                options={PHONE_TYPE_OPTIONS}
                                value={formValues.type as string}
                                onChange={bind(handleFormValueChange, this, 'type')}
                                name='type'
                                label='Type *'
                                placeholder='Select type'
                                dirty
                                error={formErrors.type}
                            />
                            <InputText
                                name='number'
                                label='Number *'
                                error={formErrors.number}
                                placeholder='Enter phone number (e.g., +1234567890)'
                                dirty
                                tabIndex={0}
                                forceUpdateValue
                                type='text'
                                onChange={bind(handleFormValueChange, this, 'number')}
                                onBlur={handlePhoneNumberBlur}
                                value={formValues.number as string}
                            />
                        </div>
                    </form>
                ) : (
                    <Button
                        label='+ ADD PHONE'
                        secondary
                        onClick={handleAddNewItem}
                    />
                )}
            </div>
        </BaseModal>
    )
}

export default ModifyPhonesModal
