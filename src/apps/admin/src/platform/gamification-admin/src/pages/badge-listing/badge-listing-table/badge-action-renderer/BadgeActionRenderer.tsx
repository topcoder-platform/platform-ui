import { LinkButton } from '~/libs/ui'
import { useCheckIsMobile } from '~/libs/shared'

import { GameBadge } from '../../../../game-lib'
import { badgeDetailPath } from '../../../../gamification-admin.routes'

import styles from './BadgeActionRenderer.module.scss'

interface Props extends GameBadge {
    rootPage: string;
}

const BadgeActionRenderer: (props: Props) => JSX.Element
    = (props: Props): JSX.Element => {

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
                        to={badgeDetailPath(props.rootPage, props.id, button.view)}
                    />
                ))}
            </div>
        )
    }

export default BadgeActionRenderer
