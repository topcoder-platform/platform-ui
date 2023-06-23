import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'
import { reject, trim } from 'lodash'
import { toast } from 'react-toastify'

import { BaseModal, Button, InputText, InputTextarea } from '~/libs/ui'
import {
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
    memberPersonalizationTraitsData: Array<UserTrait>
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

    const [formError, setFormError]: [
        string | undefined,
        Dispatch<SetStateAction<string | undefined>>
    ] = useState<string | undefined>()

    useEffect(() => {
        const profileSelfTitleData: any
            = props.memberPersonalizationTraitsData.find(
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
        setFormError(undefined)

        Promise.all([
            updateMemberProfileAsync(
                props.profile.handle,
                { description: updatedDescription },
            ),
            updateMemberTraitsAsync(props.profile.handle, [{
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
                toast.success('Your profile has been updated.')
                props.onSave()
            })
            .catch((error: any) => {
                toast.error('Something went wrong. Please try again.')
                setIsSaving(false)
                setFormError(error.message || error)
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
                        disabled={!trim(memberTitle) || !trim(memberDescription) || isSaving || !isFormChanged}
                    />
                </div>
            )}
        >
            <form className={styles.editForm}>
                <InputText
                    label='Title *'
                    name='memberTitle'
                    onChange={handleMemberTitleChange}
                    value={memberTitle}
                    tabIndex={0}
                    type='text'
                    error={!trim(memberTitle) ? 'Title is required' : undefined}
                    dirty={!trim(memberTitle)}
                />
                <InputTextarea
                    label='Description *'
                    name='memberDescription'
                    onChange={handleMemberDescriptionChange}
                    onBlur={handleMemberDescriptionChange}
                    value={memberDescription}
                    tabIndex={0}
                    error={!trim(memberDescription) ? 'Description is required' : undefined}
                    dirty={!trim(memberDescription)}
                />
            </form>

            {
                formError && (
                    <div className={styles.formError}>
                        {formError}
                    </div>
                )
            }

        </BaseModal>
    )
}

export default ModifyAboutMeModal
