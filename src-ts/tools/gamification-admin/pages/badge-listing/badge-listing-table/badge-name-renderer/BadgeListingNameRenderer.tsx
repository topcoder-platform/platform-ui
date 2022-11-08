import { GameBadge } from '../../../../game-lib'

import styles from './BadgeListingNameRenderer.module.scss'

function BadgeListingNameRenderer(badge: GameBadge): JSX.Element {
    return (
        <div className={styles.badge}>
            <img
                alt={badge.badge_name}
                className={styles[badge.active ? 'badge-image' : 'badge-image-disabled']}
                src={badge.badge_image_url}
            />
            <p className={styles['badge-name']}>{badge.badge_name}</p>
        </div>
    )
}

export default BadgeListingNameRenderer
