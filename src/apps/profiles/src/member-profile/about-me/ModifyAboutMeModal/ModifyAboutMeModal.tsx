import { Dispatch, FC, SetStateAction, useState } from 'react'
import { trim } from 'lodash'

import { BaseModal, Button, InputText, InputTextarea } from '~/libs/ui'
import { UserProfile } from '~/libs/core'

import styles from './ModifyAboutMeModal.module.scss'

interface ModifyAboutMeModalProps {
    onClose: () => void
    profile: UserProfile
    refreshProfile: () => void
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

    function handleMemberTitleChange(event: React.ChangeEvent<HTMLInputElement>): void {
        setMemberTitle(event.target.value)
    }

    function handleMemberDescriptionChange(event: React.ChangeEvent<HTMLTextAreaElement>): void {
        setMemberDescription(event.target.value)
    }

    function handleAboutMeSave(): void {
        console.log('handleAboutMeSave', memberTitle, memberDescription)
        // props.onClose()
        props.refreshProfile()
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
                        disabled={!trim(memberTitle) || !trim(memberDescription)}
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
                />
                <InputTextarea
                    label='Description *'
                    name='memberDescription'
                    onChange={handleMemberDescriptionChange}
                    onBlur={handleMemberDescriptionChange}
                    value={memberDescription}
                    tabIndex={0}
                />
            </form>

        </BaseModal>
    )
}

export default ModifyAboutMeModal
