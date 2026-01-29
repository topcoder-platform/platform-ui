import { FC } from 'react'

import { IdentityVerifiedBadgeIcon } from '~/libs/ui'

import styles from './IdentityVerifiedBadge.module.scss'

interface IdentityVerifiedBadgeProps {
    identityVerified?: boolean
}

const IdentityVerifiedBadge: FC<IdentityVerifiedBadgeProps> = (props: IdentityVerifiedBadgeProps) => {
    if (!props.identityVerified) {
        // eslint-disable-next-line unicorn/no-null
        return null
    }

    return (
        <div className={styles.badgeContainer}>
            <div className={styles.badge}>
                <IdentityVerifiedBadgeIcon />
            </div>
            <span className={styles.tooltip}>Identity Verified</span>
        </div>
    )
}

export default IdentityVerifiedBadge
