import {
    ChangeEvent,
    FC,
    useCallback,
    useState,
} from 'react'

import { ConfirmationModal } from '../ConfirmationModal'

import styles from './CreateEngagementFromLeadModal.module.scss'

export interface CreateEngagementFromLeadModalProps {
    accountName: string
    isOpen: boolean
    leadId: string
    onCancel: () => void
    onConfirm: (projectId: string) => void
    roleTitle: string
}

export const CreateEngagementFromLeadModal: FC<CreateEngagementFromLeadModalProps> = (
    props: CreateEngagementFromLeadModalProps,
) => {
    const [projectId, setProjectId] = useState<string>('')

    const handleConfirm = useCallback((): void => {
        props.onConfirm(projectId.trim())
    }, [projectId, props])

    const handleProjectIdChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        setProjectId(event.target.value)
    }, [])

    if (!props.isOpen) {
        return undefined
    }

    return (
        <ConfirmationModal
            confirmDisabled={!projectId.trim()}
            confirmText='Create Engagement'
            message={
                `Create an engagement for "${props.roleTitle}" at ${props.accountName}. `
                + 'Enter the project ID where this engagement should be created.'
            }
            onCancel={props.onCancel}
            onConfirm={handleConfirm}
            title='Create Engagement from Lead'
        >
            <label className={styles.field}>
                <span className={styles.label}>Project ID</span>
                <input
                    className={styles.input}
                    placeholder='Enter project ID'
                    value={projectId}
                    onChange={handleProjectIdChange}
                />
            </label>
            <p className={styles.hint}>
                Lead ID:
                {' '}
                {props.leadId}
            </p>
        </ConfirmationModal>
    )
}

export default CreateEngagementFromLeadModal
