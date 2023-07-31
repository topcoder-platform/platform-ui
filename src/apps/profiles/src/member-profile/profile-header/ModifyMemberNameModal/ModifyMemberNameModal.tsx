import { Dispatch, FC, FocusEvent, SetStateAction, useState } from 'react'
import { reject, trim } from 'lodash'
import { toast } from 'react-toastify'

import {
    createMemberTraitsAsync,
    updateMemberProfileAsync,
    updateMemberTraitsAsync,
    UserProfile,
    UserTrait,
    UserTraitCategoryNames,
    UserTraitIds,
} from '~/libs/core'
import { BaseModal, Button, InputRadio, InputText } from '~/libs/ui'

import { NamesAndHandleAppearance } from '../ProfileHeader'

import styles from './ModifyMemberNameModal.module.scss'

interface ModifyMemberNameModalProps {
    profile: UserProfile
    onClose: () => void
    onSave: () => void
    memberPersonalizationTraitsData: UserTrait[] | undefined
    namesAndHandleAppearance: NamesAndHandleAppearance | undefined
}

const methodsMap: { [key: string]: any } = {
    create: createMemberTraitsAsync,
    update: updateMemberTraitsAsync,
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

    const [namesAndHandleAppearance, setNamesAndHandleAppearance]: [
        NamesAndHandleAppearance | undefined, Dispatch<SetStateAction<NamesAndHandleAppearance | undefined>>
    ]
        = useState<NamesAndHandleAppearance | undefined>(props.namesAndHandleAppearance)

    function handleFirstNameChange(e: React.ChangeEvent<HTMLInputElement>): void {
        setCurrentFirstName(e.target.value)
        setIsFormChanged(true)
    }

    function handleLastNameChange(e: React.ChangeEvent<HTMLInputElement>): void {
        setCurrentLastName(e.target.value)
        setIsFormChanged(true)
    }

    function handleShowMyNameInProfileToggle(event: FocusEvent<HTMLInputElement>): void {
        setNamesAndHandleAppearance(event.target.value as NamesAndHandleAppearance)
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

        Promise.all([
            updateMemberProfileAsync(
                props.profile.handle,
                { firstName: updatedFirstName, lastName: updatedLastName },
            ),
            methodsMap[!!props.memberPersonalizationTraitsData ? 'update' : 'create'](props.profile.handle, [{
                categoryName: UserTraitCategoryNames.personalization,
                traitId: UserTraitIds.personalization,
                traits: {
                    data: [
                        ...reject(
                            props.memberPersonalizationTraitsData,
                            (trait: any) => trait.namesAndHandleAppearance,
                        ),
                        { namesAndHandleAppearance },
                    ],
                },
            }]),
        ])
            .then(() => {
                toast.success('Your profile has been updated.', { position: toast.POSITION.BOTTOM_RIGHT })
                props.onSave()
            })
            .catch(() => {
                toast.error('Something went wrong. Please try again.', { position: toast.POSITION.BOTTOM_RIGHT })
                setIsSaving(false)
            })
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
            title='My Name'
            size='lg'
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
                <p className='body-main-bold'>Choose a combination to show:</p>
                <div className={styles.radioButtons}>
                    <InputRadio
                        name='showMyNameInProfile'
                        label='First and Last Name Only'
                        value='namesOnly'
                        checked={namesAndHandleAppearance === 'namesOnly'}
                        onChange={handleShowMyNameInProfileToggle}
                        id='namesOnly'
                    />
                    <InputRadio
                        name='showMyNameInProfile'
                        label='Handle Only'
                        value='handleOnly'
                        checked={namesAndHandleAppearance === 'handleOnly'}
                        onChange={handleShowMyNameInProfileToggle}
                        id='handleOnly'
                    />
                    <InputRadio
                        name='showMyNameInProfile'
                        label='Both'
                        value='namesAndHandle'
                        checked={namesAndHandleAppearance === 'namesAndHandle'}
                        onChange={handleShowMyNameInProfileToggle}
                        id='namesAndHandle'
                    />
                </div>
            </div>
        </BaseModal>
    )
}

export default ModifyMemberNameModal
