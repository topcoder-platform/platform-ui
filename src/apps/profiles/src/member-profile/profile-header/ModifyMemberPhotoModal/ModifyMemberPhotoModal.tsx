import { Dispatch, FC, SetStateAction, useState } from 'react'

import { BaseModal, Button } from '~/libs/ui'
import { UserProfile } from '~/libs/core'

import styles from './ModifyMemberPhotoModal.module.scss'

interface ModifyMemberPhotoModalProps {
    onClose: () => void
    onSave: () => void
    profile: UserProfile
}

const ModifyMemberPhotoModal: FC<ModifyMemberPhotoModalProps> = (props: ModifyMemberPhotoModalProps) => {
    const [isSaving, setIsSaving]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [isFormChanged, setIsFormChanged]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    function handleModifyPhotoSave(): void {
        setIsSaving(true)
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
            title='Your Photo'
            buttons={(
                <div className={styles.modalButtons}>
                    <Button
                        label='Cancel'
                        onClick={props.onClose}
                        secondary
                    />
                    <Button
                        label='Save'
                        onClick={handleModifyPhotoSave}
                        primary
                        disabled={isSaving || !isFormChanged}
                    />
                </div>
            )}
        >
            <div className={styles.modalBody}>
                <p>Show the community who you are. Don&apos;t worry, you look great.</p>
            </div>
        </BaseModal>
    )
}

export default ModifyMemberPhotoModal
