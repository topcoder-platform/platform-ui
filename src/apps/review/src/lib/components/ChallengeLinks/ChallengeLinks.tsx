/**
 * Challenge Links.
 */
import { FC } from 'react'
import classNames from 'classnames'

import styles from './ChallengeLinks.module.scss'

interface Props {
    className?: string
}

export const ChallengeLinks: FC<Props> = (props: Props) => (
    <div className={classNames(styles.container, props.className)}>
        <button type='button' className={styles.blockLink}>Contact Manager</button>
        <button type='button' className={styles.blockLink}>Forum</button>
    </div>
)

export default ChallengeLinks
