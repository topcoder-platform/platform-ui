import { FC } from 'react'

import { getRatingColor } from '~/libs/core'
import { BaseModal } from '~/libs/ui'

import { numberToFixed } from '../../../../lib'

import styles from './MemberRatingInfoModal.module.scss'

interface MemberRatingInfoModalProps {
    audienceLabel: string
    onClose: () => void
    percentile?: number
    rating?: number
}

/**
 * Returns the Topcoder rating tier name for the provided rating.
 *
 * @param {number | undefined} rating - The member rating value.
 * @returns {string} The tier label displayed in the rating info modal.
 */
const getRatingTierName = (rating?: number): string => {
    if (!rating) {
        return 'Unrated'
    }

    if (rating >= 2200) {
        return 'Elite Tier'
    }

    if (rating >= 1500) {
        return 'Advanced Tier'
    }

    if (rating >= 1200) {
        return 'Intermediate Tier'
    }

    if (rating >= 900) {
        return 'Beginner Tier'
    }

    return 'Unrated'
}

const MemberRatingInfoModal: FC<MemberRatingInfoModalProps> = (props: MemberRatingInfoModalProps) => (
    <BaseModal
        bodyClassName={styles.body}
        onClose={props.onClose}
        open
        title='What are ratings and percentiles'
        size='sm'
    >
        <div className={styles.content}>
            <p>
                Ratings come from head-to-head competitions and measure demonstrated skill across challenge types.
            </p>

            {props.rating !== undefined && (
                <div className={styles.ratingPanel}>
                    <span className={styles.panelLabel}>Overall Rating</span>
                    <span className={styles.ratingValue} style={{ color: getRatingColor(props.rating) }}>
                        {props.rating}
                    </span>
                    <span className={styles.panelMeta}>{getRatingTierName(props.rating)}</span>
                </div>
            )}

            {props.percentile !== undefined && (
                <div className={styles.positionPanel}>
                    <span className={styles.panelLabel}>Position</span>
                    <span className={styles.ratingValue} style={{ color: getRatingColor(props.rating) }}>
                        Top
                        {' '}
                        {numberToFixed(props.percentile, Number.isInteger(props.percentile) ? 0 : 2)}
                        %
                    </span>
                    <span className={styles.panelMeta}>
                        of
                        {' '}
                        {props.audienceLabel.toLowerCase()}
                    </span>
                </div>
            )}

            <p>
                Higher ratings and stronger top-percentile positions indicate better competitive results.
            </p>
        </div>
    </BaseModal>
)

export default MemberRatingInfoModal
