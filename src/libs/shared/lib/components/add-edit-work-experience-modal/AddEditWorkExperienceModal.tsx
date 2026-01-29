import { FC, useRef } from 'react'

import { BaseModal, Button } from '~/libs/ui'
import { UserTrait } from '~/libs/core'

import { AddEditWorkExperienceForm } from '../add-edit-work-experience-form'
import type { AddEditWorkExperienceFormRef } from '../add-edit-work-experience-form'

import styles from './AddEditWorkExperienceModal.module.scss'

export interface AddEditWorkExperienceModalProps {
    open: boolean
    onClose: () => void
    initialWork?: UserTrait
    onSave: (work: UserTrait) => void
    isSaving?: boolean
}

const AddEditWorkExperienceModal: FC<AddEditWorkExperienceModalProps> = (props: AddEditWorkExperienceModalProps) => {
    const formRef = useRef<AddEditWorkExperienceFormRef>(null)

    const title = props.initialWork ? 'Edit Experience' : 'Add Experience'

    function handleSaveClick(): void {
        formRef.current?.submit()
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open={props.open}
            size='lg'
            title={title}
            buttons={(
                <div className={styles.modalButtons}>
                    <Button
                        label='Cancel'
                        onClick={props.onClose}
                        secondary
                    />
                    <Button
                        label='Save'
                        onClick={handleSaveClick}
                        primary
                        disabled={props.isSaving}
                    />
                </div>
            )}
        >
            <AddEditWorkExperienceForm
                ref={formRef}
                initialWork={props.initialWork}
                onSave={function (work: UserTrait): void {
                    props.onSave(work)
                    props.onClose()
                }}
            />
        </BaseModal>
    )
}

export default AddEditWorkExperienceModal
