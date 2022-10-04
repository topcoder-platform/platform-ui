import { Button, ButtonProps, useCheckIsMobile } from '../../../../../../lib'
import { GameBadge } from '../../../../game-lib'
import { badgeDetailPath } from '../../../../gamification-admin.routes'

import styles from './BadgeActionRenderer.module.scss'

function BadgeActionRenderer(badge: GameBadge): JSX.Element {

    const isMobile: boolean = useCheckIsMobile()

    const buttonProps: ButtonProps = {
        buttonStyle: 'secondary',
        size: isMobile ? 'xs' : 'sm',
    }

    const actionButtons: Array<{
        label: string
        view?: 'edit' | 'award'
    }> = [
            {
                label: 'View',
            },
            {
                label: 'Edit',
                view: 'edit',
            },
            {
                label: 'Award',
                view: 'award',
            },
        ]

    return (
        <div className={styles['badge-actions']}>
            {actionButtons.map((button, index) => {
                return (
                    <Button
                        {...buttonProps}
                        key={index}
                        label={button.label}
                        route={badgeDetailPath(badge.id, button.view)}
                    />
                )
            })}
        </div>
    )
}

export default BadgeActionRenderer