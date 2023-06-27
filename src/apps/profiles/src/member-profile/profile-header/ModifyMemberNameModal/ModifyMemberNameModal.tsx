import { Dispatch, FC, SetStateAction, useState } from 'react'
import { trim } from 'lodash'
import { toast } from 'react-toastify'

import { updateMemberProfileAsync, UserProfile } from '~/libs/core'
import { BaseModal, Button, InputText } from '~/libs/ui'

import styles from './ModifyMemberNameModal.module.scss'

interface ModifyMemberNameModalProps {
    profile: UserProfile
    onClose: () => void
    onSave: () => void
}

const ModifyMemberNameModal: FC<ModifyMemberNameModalProps> = (props: ModifyMemberNameModalProps) => {
    const [isSaving, setIsSaving]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [isFormChanged, setIsFormChanged]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [formErrors, setFormErrors]: [
        { [key: string]: string },
        Dispatch<SetStateAction<{ [key: string]: string }>>
    ]
        = useState<{ [key: string]: string }>({})

    const [currentFirstName, setCurrentFirstName]: [string, Dispatch<SetStateAction<string>>]
        = useState<string>(props.profile.firstName)

    const [currentLastName, setCurrentLastName]: [string, Dispatch<SetStateAction<string>>]
        = useState<string>(props.profile.lastName)

    function handleFirstNameChange(e: React.ChangeEvent<HTMLInputElement>): void {
        setCurrentFirstName(e.target.value)
        setIsFormChanged(true)
    }

    function handleLastNameChange(e: React.ChangeEvent<HTMLInputElement>): void {
        setCurrentLastName(e.target.value)
        setIsFormChanged(true)
    }

    function handleModifyNameSave(): void {
        setFormErrors({})

        const updatedFirstName: string = trim(currentFirstName)
        const updatedLastName: string = trim(currentLastName)

        if (!updatedFirstName) {
            setFormErrors({
                firstName: 'First name is required',
            })
            return
        }

        if (!updatedLastName) {
            setFormErrors({
                lastName: 'Last name is required',
            })
            return
        }

        setIsSaving(true)

        updateMemberProfileAsync(
            props.profile.handle,
            { firstName: updatedFirstName, lastName: updatedLastName },
        )
            .then(() => {
                toast.success('Your profile has been updated.')
                props.onSave()
            })
            .catch(() => {
                toast.error('Something went wrong. Please try again.')
                setIsSaving(false)
            })
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
            title='My Name'
            buttons={(
                <div className={styles.modalButtons}>
                    <Button
                        label='Cancel'
                        onClick={props.onClose}
                        secondary
                    />
                    <Button
                        label='Save'
                        onClick={handleModifyNameSave}
                        primary
                        disabled={isSaving || !isFormChanged}
                    />
                </div>
            )}
        >
            <div className={styles.modalContent}>
                <InputText
                    name='firstName'
                    label='First Name *'
                    error={formErrors.firstName}
                    placeholder='Enter your first name'
                    dirty
                    tabIndex={0}
                    type='text'
                    onChange={handleFirstNameChange}
                    value={currentFirstName}
                />
                <InputText
                    name='lastName'
                    label='Last Name *'
                    error={formErrors.lastName}
                    placeholder='Enter your last name'
                    dirty
                    tabIndex={-1}
                    type='text'
                    onChange={handleLastNameChange}
                    value={currentLastName}
                />
            </div>
        </BaseModal>
    )
}

export default ModifyMemberNameModal
