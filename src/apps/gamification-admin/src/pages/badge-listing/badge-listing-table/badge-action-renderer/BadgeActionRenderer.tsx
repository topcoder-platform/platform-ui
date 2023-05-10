import { LinkButton } from '~/libs/ui'
import { useCheckIsMobile } from '~/libs/shared'

import { GameBadge } from '../../../../game-lib'
import { badgeDetailPath } from '../../../../gamification-admin.routes'

import styles from './BadgeActionRenderer.module.scss'

const BadgeActionRenderer: (badge: GameBadge) => JSX.Element
    = (badge: GameBadge): JSX.Element => {

        const isMobile: boolean = useCheckIsMobile()

        const actionButtons: Array<{
            label: string
            view?: 'edit' | 'award'
        }>
            = [
                {
                    label: 'View',
                },
                {
                    label: 'Award',
                    view: 'award',
                },
            ]

        return (
            <div className={styles['badge-actions']}>
                {actionButtons.map(button => (
                    <LinkButton
                        secondary
                        size={isMobile ? 'sm' : 'md'}
                        key={button.label}
                        label={button.label}
                        to={badgeDetailPath(badge.id, button.view)}
                    />
                ))}
            </div>
        )
    }

export default BadgeActionRenderer
