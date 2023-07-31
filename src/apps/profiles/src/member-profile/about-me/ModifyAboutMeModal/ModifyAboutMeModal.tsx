import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'
import { reject, trim } from 'lodash'
import { toast } from 'react-toastify'

import { BaseModal, Button, InputText, InputTextarea } from '~/libs/ui'
import {
    createMemberTraitsAsync,
    updateMemberProfileAsync,
    updateMemberTraitsAsync,
    UserProfile,
    UserTrait,
    UserTraitCategoryNames,
    UserTraitIds,
} from '~/libs/core'

import styles from './ModifyAboutMeModal.module.scss'

interface ModifyAboutMeModalProps {
    onClose: () => void
    onSave: () => void
    profile: UserProfile
    memberPersonalizationTraitsData: UserTrait[] | undefined
}

const methodsMap: { [key: string]: any } = {
    create: createMemberTraitsAsync,
    update: updateMemberTraitsAsync,
}

const ModifyAboutMeModal: FC<ModifyAboutMeModalProps> = (props: ModifyAboutMeModalProps) => {
    const [memberTitle, setMemberTitle]: [
        string | undefined,
        Dispatch<SetStateAction<string | undefined>>
    ] = useState<string | undefined>()

    const [memberDescription, setMemberDescription]: [
        string | undefined,
        Dispatch<SetStateAction<string | undefined>>
    ] = useState<string | undefined>(props.profile.description)

    const [isSaving, setIsSaving]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [isFormChanged, setIsFormChanged]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [formSaveError, setFormSaveError]: [
        string | undefined,
        Dispatch<SetStateAction<string | undefined>>
    ] = useState<string | undefined>()

    useEffect(() => {
        const profileSelfTitleData: any
            = props.memberPersonalizationTraitsData?.find(
                (trait: any) => trait.profileSelfTitle,
            )
        setMemberTitle(profileSelfTitleData?.profileSelfTitle)
    }, [props.memberPersonalizationTraitsData])

    function handleMemberTitleChange(event: React.ChangeEvent<HTMLInputElement>): void {
        setMemberTitle(event.target.value)
        setIsFormChanged(true)
    }

    function handleMemberDescriptionChange(event: React.ChangeEvent<HTMLTextAreaElement>): void {
        setMemberDescription(event.target.value)
        setIsFormChanged(true)
    }

    function handleAboutMeSave(): void {
        const updatedDescription: string = trim(memberDescription)
        const updatedTitle: string = trim(memberTitle)

        setIsSaving(true)
        setFormSaveError(undefined)

        Promise.all([
            updateMemberProfileAsync(
                props.profile.handle,
                { description: updatedDescription },
            ),
            methodsMap[!!props.memberPersonalizationTraitsData ? 'update' : 'create'](props.profile.handle, [{
                categoryName: UserTraitCategoryNames.personalization,
                traitId: UserTraitIds.personalization,
                traits: {
                    data: [
                        ...reject(
                            props.memberPersonalizationTraitsData,
                            (trait: any) => trait.profileSelfTitle,
                        ),
                        { profileSelfTitle: updatedTitle },
                    ],
                },
            }]),
        ])
            .then(() => {
                toast.success('Your profile has been updated.', { position: toast.POSITION.BOTTOM_RIGHT })
                props.onSave()
            })
            .catch((error: any) => {
                toast.error('Something went wrong. Please try again.', { position: toast.POSITION.BOTTOM_RIGHT })
                setIsSaving(false)
                setFormSaveError(error.message || error)
            })
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='lg'
            title='About Me'
            buttons={(
                <div className={styles.modalButtons}>
                    <Button
                        label='Cancel'
                        onClick={props.onClose}
                        secondary
                    />
                    <Button
                        label='Save'
                        onClick={handleAboutMeSave}
                        primary
                        disabled={isSaving || !isFormChanged}
                    />
                </div>
            )}
        >
            <p>Enter a short bio to help potential customers know you.</p>
            <form className={styles.editForm}>
                <InputText
                    label='Title'
                    placeholder='Ex: I’m a creative rockstar'
                    name='memberTitle'
                    onChange={handleMemberTitleChange}
                    value={memberTitle}
                    tabIndex={0}
                    type='text'
                />
                <InputTextarea
                    label='Description'
                    placeholder='Share something that makes you, you.'
                    name='memberDescription'
                    onChange={handleMemberDescriptionChange}
                    onBlur={handleMemberDescriptionChange}
                    value={memberDescription}
                    tabIndex={0}
                />
            </form>

            {
                formSaveError && (
                    <div className={styles.formError}>
                        {formSaveError}
                    </div>
                )
            }

        </BaseModal>
    )
}

export default ModifyAboutMeModal
