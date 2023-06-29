import { Dispatch, FC, SetStateAction, useState } from 'react'

import { BaseModal, Button } from '~/libs/ui'
import { UserTrait } from '~/libs/core'

import styles from './ModifyEducationModal.module.scss'

interface ModifyEducationModalProps {
    onClose: () => void
    onSave: () => void
    // profile: UserProfile
    // authProfile: UserProfile | undefined
    education: UserTrait[] | undefined
}

const ModifyEducationModal: FC<ModifyEducationModalProps> = (props: ModifyEducationModalProps) => {
    const [isSaving, setIsSaving]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [isFormChanged, setIsFormChanged]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    // const [formError, setFormError]: [
    //     string | undefined,
    //     Dispatch<SetStateAction<string | undefined>>
    // ] = useState<string | undefined>()

    function handleModifyEducationSave(): void {
        setIsSaving(true)
        // setFormError(undefined)
        props.onSave()
        console.log('handleModifyEducationSave', props.education)
        setIsFormChanged(false)
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='lg'
            title='My Education'
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
                <div className={styles.headerWrap}>
                    <h3>My Education</h3>
                </div>
            </div>
        </BaseModal>
    )
}

export default ModifyEducationModal
