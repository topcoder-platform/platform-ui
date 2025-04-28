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
        <button type='button' className='borderButton'>Contact Manager</button>
        <button type='button' className='borderButton'>Forum</button>
    </div>
)

export default ChallengeLinks
