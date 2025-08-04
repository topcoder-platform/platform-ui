/**
 * Challenge Links.
 */
import { FC, useContext, useMemo, useState } from 'react'
import classNames from 'classnames'

import {
    REVIEWER,
    SUBMITTER,
} from '../../../config/index.config'
import { DialogContactManager } from '../DialogContactManager'
import { ChallengeDetailContextModel } from '../../models'
import { ChallengeDetailContext } from '../../contexts'
import { filterResources } from '../../utils'

import styles from './ChallengeLinks.module.scss'

interface Props {
    className?: string
}

export const ChallengeLinks: FC<Props> = (props: Props) => {
    const { challengeInfo, myResources }: ChallengeDetailContextModel
        = useContext(ChallengeDetailContext)
    // Show/hide contact manager dialog
    const [showContactManager, setShowContactManager] = useState(false)

    // Show/hide contact manager button
    const canShowContactManagerButton = useMemo(
        () => filterResources([SUBMITTER, REVIEWER], myResources).length > 0,
        [myResources],
    )

    return (
        <div className={classNames(styles.container, props.className)}>
            {canShowContactManagerButton && (
                <button
                    type='button'
                    className='borderButton'
                    onClick={function onClick() {
                        setShowContactManager(true)
                    }}
                >
                    Contact Manager
                </button>
            )}
            {challengeInfo && challengeInfo.discussionsUrl && (
                <a
                    href={challengeInfo?.discussionsUrl}
                    className='borderButton'
                    target='_blank'
                    rel='noreferrer'
                >
                    Forum
                </a>
            )}

            {showContactManager && (
                <DialogContactManager
                    open
                    setOpen={function setOpen(open: boolean) {
                        setShowContactManager(open)
                    }}
                />
            )}
        </div>
    )
}

export default ChallengeLinks
