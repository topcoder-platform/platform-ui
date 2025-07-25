import { FC } from 'react'

import { BaseModal, Button, LinkButton, PageDivider } from '~/libs/ui'
import { useCheckIsMobile } from '~/libs/shared'

import { badgeDetailPath } from '../../../gamification-admin.routes'
import { GameBadge } from '../../game-badge.model'

import styles from './BadgeCreatedModal.module.scss'

export interface BadgeCreatedModalProps {
    badge: GameBadge
    isOpen: boolean
    onClose: () => void
    rootPage: string;
}

const BadgeCreatedModal: FC<BadgeCreatedModalProps> = (props: BadgeCreatedModalProps) => {

    const isMobile: boolean = useCheckIsMobile()

    function onClose(): void {
        props.onClose()
    }

    return (
        <BaseModal
            onClose={onClose}
            open={props.isOpen}
            size='md'
            title='Badge created'
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
                        badge has been sucessfully created.
                    </p>
                </div>
                <div className={styles['actions-wrap']}>
                    {
                        isMobile && <PageDivider />
                    }
                    <div className={styles.actions}>
                        <LinkButton
                            label='View'
                            primary
                            size='lg'
                            to={badgeDetailPath(props.rootPage, props.badge.id)}
                        />
                        <Button
                            label='Create a new badge'
                            secondary
                            size='lg'
                            onClick={onClose}
                        />
                    </div>
                </div>
            </div>
        </BaseModal>
    )
}

export default BadgeCreatedModal
