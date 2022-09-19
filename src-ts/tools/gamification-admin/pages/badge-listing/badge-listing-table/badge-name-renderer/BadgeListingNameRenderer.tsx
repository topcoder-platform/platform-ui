import { Badge } from '../../../../lib/models/badge.model'

import styles from './BadgeListingNameRenderer.module.scss'

function BadgeListingNameRenderer(badge: Badge): JSX.Element {
    return (
        <div className={styles['badge']}>
            <img src={badge.badge_image_url} alt={badge.badge_name} className={styles[badge.active ? 'badge-image' : 'badge-image-disabled']} />
            <p className={styles['badge-name']}>{badge.badge_name}</p>
        </div>
    )
}

export default BadgeListingNameRenderer
