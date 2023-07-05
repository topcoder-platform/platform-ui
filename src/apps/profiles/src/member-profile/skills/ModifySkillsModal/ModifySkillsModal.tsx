import { Dispatch, FC, SetStateAction, useState } from 'react'

// import { UserProfile } from '~/libs/core'
import { BaseModal, Button } from '~/libs/ui'

import styles from './ModifySkillsModal.module.scss'

interface ModifySkillsModalProps {
    // profile: UserProfile
    onClose: () => void
}

const ModifySkillsModal: FC<ModifySkillsModalProps> = (props: ModifySkillsModalProps) => {
    const [isSaving, setIsSaving]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    function handleModifySkillsSave(): void {
        setIsSaving(true)
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='lg'
            title='My Skills'
            buttons={(
                <div className={styles.modalButtons}>
                    <Button
                        label='Cancel'
                        onClick={props.onClose}
                        secondary
                    />
                    <Button
                        label='Save'
                        onClick={handleModifySkillsSave}
                        primary
                        disabled={isSaving}
                    />
                </div>
            )}
        />
    )
}

export default ModifySkillsModal
