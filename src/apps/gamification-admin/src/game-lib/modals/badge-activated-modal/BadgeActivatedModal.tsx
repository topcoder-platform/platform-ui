import { FC } from 'react'

import { BaseModal, Button, PageDivider, useCheckIsMobile } from '~/libs/ui'

import { GameBadge } from '../../game-badge.model'

import styles from './BadgeActivatedModal.module.scss'

export interface BadgeActivatedModalProps {
    badge: GameBadge
    isOpen: boolean
    onClose: () => void
}

const BadgeActivatedModal: FC<BadgeActivatedModalProps> = (props: BadgeActivatedModalProps) => {

    const isMobile: boolean = useCheckIsMobile()

    function onClose(): void {
        props.onClose()
    }

    return (
        <BaseModal
            onClose={onClose}
            open={props.isOpen}
            size='md'
            title='Badge updated'
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
                        badge has been sucessfully
                        {' '}
                        {props.badge.active ? 'activated' : 'deactivated'}
                        .
                    </p>
                </div>
                <div className={styles['actions-wrap']}>
                    {
                        isMobile && <PageDivider />
                    }
                    <div className={styles.actions}>
                        <Button
                            label='Close'
                            buttonStyle='primary'
                            onClick={onClose}
                        />
                    </div>
                </div>
            </div>
        </BaseModal>
    )
}

export default BadgeActivatedModal
