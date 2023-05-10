import { FC } from 'react'

import { BaseModal, Button, PageDivider } from '~/libs/ui'
import { useCheckIsMobile } from '~/libs/shared'

import { GameBadge } from '../../game-badge.model'

import styles from './BadgeAssignedModal.module.scss'

export interface BadgeAssignedModalProps {
    badge: GameBadge
    isOpen: boolean
    onClose: () => void
}

const BadgeAssignedModal: FC<BadgeAssignedModalProps> = (props: BadgeAssignedModalProps) => {

    const isMobile: boolean = useCheckIsMobile()

    function onClose(): void {
        props.onClose()
    }

    return (
        <BaseModal
            onClose={onClose}
            open={props.isOpen}
            size='md'
            title='Badge awarded'
            closeOnOverlayClick={false}
        >
            <div className={styles.wrapper}>
                <div className={styles.badge}>
                    <img
                        alt={props.badge.badge_name}
                        className={styles[props.badge.active ? 'badge-image' : 'badge-image-disabled']}
                        src={props.badge.badge_image_url}
                    />
                    <p className={styles['badge-name']}>
                        {props.badge.badge_name}
                        {' '}
                        badge has been sucessfully awarded.
                    </p>
                </div>
                <div className={styles['actions-wrap']}>
                    {
                        isMobile && <PageDivider />
                    }
                    <div className={styles.actions}>
                        <Button
                            label='Close'
                            size='lg'
                            primary
                            onClick={onClose}
                        />
                    </div>
                </div>
            </div>
        </BaseModal>
    )
}

export default BadgeAssignedModal
