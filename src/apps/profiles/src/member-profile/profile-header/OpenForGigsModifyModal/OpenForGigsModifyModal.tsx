import { Dispatch, FC, SetStateAction, useState } from 'react'
import { toast } from 'react-toastify'

import { BaseModal, Button } from '~/libs/ui'
import { updateMemberProfileAsync, UserProfile } from '~/libs/core'
import { OpenToWorkData } from '~/libs/shared/lib/components/modify-open-to-work-modal'
import OpenToWorkForm from '~/libs/shared/lib/components/modify-open-to-work-modal/ModifyOpenToWorkModal'

import styles from './OpenForGigsModifyModal.module.scss'

interface OpenForGigsModifyModalProps {
    onClose: () => void
    onSave: () => void
    profile: UserProfile
}

const OpenForGigsModifyModal: FC<OpenForGigsModifyModalProps> = (props: OpenForGigsModifyModalProps) => {
    const [isSaving, setIsSaving]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [formValue, setFormValue] = useState<OpenToWorkData>({
        availability: props.profile.availability ?? 'FULL_TIME',
        availableForGigs: !!props.profile.availableForGigs,
        preferredRoles: props.profile.preferredRoles ?? [],
    })

    function handleOpenForWorkSave(): void {
        setIsSaving(true)

        updateMemberProfileAsync(
            props.profile.handle,
            formValue,
        )
            .then(() => {
                toast.success('Work availability updated successfully.', { position: toast.POSITION.BOTTOM_RIGHT })
                props.onSave()
            })
            .catch(() => {
                toast.error('Failed to update your work availability', { position: toast.POSITION.BOTTOM_RIGHT })
                setIsSaving(false)
            })

        props.onSave()
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
            title='Don’t miss gig and work opportunities.'
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
                        onClick={handleOpenForWorkSave}
                        primary
                        disabled={isSaving}
                    />
                </div>
            )}
        >
            <div className={styles.modalBody}>
                <p>
                    By selecting “Open to Work” our customers will know that you are available for job opportunities.
                </p>
            </div>

            <OpenToWorkForm
                value={formValue}
                onChange={setFormValue}
                disabled={isSaving}
            />
        </BaseModal>
    )
}

export default OpenForGigsModifyModal
