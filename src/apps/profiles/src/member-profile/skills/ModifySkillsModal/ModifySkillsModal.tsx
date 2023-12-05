import { Dispatch, FC, SetStateAction, useState } from 'react'
import { toast } from 'react-toastify'

import { BaseModal, Button } from '~/libs/ui'
import { MemberSkillEditor, useMemberSkillEditor } from '~/libs/shared'

import styles from './ModifySkillsModal.module.scss'

interface ModifySkillsModalProps {
    onClose: () => void
    onSave: () => void
    showPrincipalIntroModal: () => void
}

const ModifySkillsModal: FC<ModifySkillsModalProps> = (props: ModifySkillsModalProps) => {
    const [isSaving, setIsSaving]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const editor: MemberSkillEditor = useMemberSkillEditor()

    function handleModifySkillsSave(): void {
        setIsSaving(true)

        editor.saveSkills()
            .then(() => {
                toast.success('Skills updated successfully.', { position: toast.POSITION.BOTTOM_RIGHT })
                props.onSave()
            })
            .catch(() => {
                toast.error('Failed to update your skills.', { position: toast.POSITION.BOTTOM_RIGHT })
                setIsSaving(false)
            })
    }

    return (
        <BaseModal
            bodyClassName={styles.skillsModalBody}
            classNames={{
                modal: styles.skillsModal,
            }}
            onClose={props.onClose}
            open
            size='lg'
            title={(
                <div className={styles.skillsModalHeader}>
                    <h3>Your skills</h3>
                    <p className='body-main-normal'>
                        We use your skills to connect you to the best opportunities.
                    </p>
                </div>
            )}
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
        >
            <div className={styles.container}>
                <div className={styles.skillPicker}>
                    {editor.formInput}
                </div>
                <div
                    className={styles.principalIntroLink}
                    onClick={props.showPrincipalIntroModal}
                >
                    <span className='body-main-link'>
                        See what Principal Skills are
                    </span>
                </div>
            </div>
        </BaseModal>
    )
}

export default ModifySkillsModal
