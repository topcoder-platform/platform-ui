import { Dispatch, FC, SetStateAction, useState } from 'react'
import { toast } from 'react-toastify'

import { BaseModal, Button } from '~/libs/ui'

import { SkillEditor, useSkillEditor } from '../skills-editor'
import { LearnCourse, TCACertification } from '../../data-providers'

import styles from './ModifySkillsModal.module.scss'

interface ModifySkillsModalProps {
    certification?: TCACertification
    course?: LearnCourse
    onClose: () => void
    onSave: () => void
}

const ModifySkillsModal: FC<ModifySkillsModalProps> = (props: ModifySkillsModalProps) => {
    const [isSaving, setIsSaving]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const editor: SkillEditor = useSkillEditor(
        props.certification ? { certification: props.certification } : { course: props.course },
    )

    function handleModifySkillsSave(): void {
        setIsSaving(true)

        editor.saveSkills()
            .then(() => {
                toast.success('Skills updated successfully.', { position: toast.POSITION.BOTTOM_RIGHT })
                props.onSave()
            })
            .catch(() => {
                toast.error('Failed to update TCA skills.', { position: toast.POSITION.BOTTOM_RIGHT })
                setIsSaving(false)
                props.onClose()
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
            title='TCA Skills'
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
                <p>
                    Members will earn verified skills upon completion of TCA courses & certifications.
                </p>
                <div className={styles.skillPicker}>
                    {editor.formInput}
                </div>
            </div>
        </BaseModal>
    )
}

export default ModifySkillsModal
