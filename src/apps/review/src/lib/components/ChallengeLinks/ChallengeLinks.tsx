/**
 * Challenge Links.
 */
import { FC } from 'react'
import { includes } from 'lodash'
import classNames from 'classnames'

import { ADMIN, COPILOT } from '../../../config/index.config'
import { useRole } from '../../hooks'

import styles from './ChallengeLinks.module.scss'

interface Props {
    className?: string
}

export const ChallengeLinks: FC<Props> = (props: Props) => {
    const { role }: {role: string} = useRole()
    return (
        <div className={classNames(styles.container, props.className)}>
            {!includes([ADMIN, COPILOT], role) && (
                <button type='button' className='borderButton'>
                    Contact Manager
                </button>
            )}
            <button type='button' className='borderButton'>Forum</button>
        </div>
    )
}

export default ChallengeLinks
