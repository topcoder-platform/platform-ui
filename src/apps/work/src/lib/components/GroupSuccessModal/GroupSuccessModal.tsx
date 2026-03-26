import {
    FC,
    MouseEvent,
    useCallback,
} from 'react'

import { Button } from '~/libs/ui'

import styles from './GroupSuccessModal.module.scss'

export interface GroupSuccessModalProps {
    groupName: string
    memberCount: number
    onClose: () => void
}

export const GroupSuccessModal: FC<GroupSuccessModalProps> = (props: GroupSuccessModalProps) => {
    const handleContainerClick = useCallback(
        (event: MouseEvent<HTMLDivElement>): void => {
            event.stopPropagation()
        },
        [],
    )

    const message = props.memberCount > 0
        ? `${props.groupName} group created successfully and ${props.memberCount} members added`
        : `${props.groupName} group created successfully`

    return (
        <div
            className={styles.overlay}
            onClick={props.onClose}
            role='presentation'
        >
            <div
                aria-modal='true'
                className={styles.container}
                onClick={handleContainerClick}
                role='dialog'
            >
                <header className={styles.header}>
                    <h4 className={styles.title}>Success</h4>
                </header>

                <div className={styles.body}>
                    <p className={styles.message}>{message}</p>
                </div>

                <footer className={styles.footer}>
                    <Button
                        label='OK'
                        onClick={props.onClose}
                        primary
                        size='lg'
                    />
                </footer>
            </div>
        </div>
    )
}

export default GroupSuccessModal
