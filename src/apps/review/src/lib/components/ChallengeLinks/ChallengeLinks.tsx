/**
 * Challenge Links.
 */
import { FC, useContext, useMemo, useState } from 'react'
import classNames from 'classnames'

import {
    ADMIN,
    COPILOT,
    REVIEWER,
    SUBMITTER,
} from '../../../config/index.config'
import { DialogContactManager } from '../DialogContactManager'
import { DialogPayments } from '../DialogPayments'
import { ChallengeDetailContextModel } from '../../models'
import { ChallengeDetailContext } from '../../contexts'
import { filterResources } from '../../utils'
import { useRole, useRoleProps } from '../../hooks'

import styles from './ChallengeLinks.module.scss'

interface Props {
    className?: string
}

export const ChallengeLinks: FC<Props> = (props: Props) => {
    const { challengeInfo, myResources }: ChallengeDetailContextModel
        = useContext(ChallengeDetailContext)
    const { actionChallengeRole }: useRoleProps = useRole()
    // Show/hide contact manager dialog
    const [showContactManager, setShowContactManager] = useState(false)
    // Show/hide payments dialog
    const [showPayments, setShowPayments] = useState(false)

    // Show/hide contact manager button
    const canShowContactManagerButton = useMemo(
        () => filterResources([SUBMITTER, REVIEWER], myResources).length > 0,
        [myResources],
    )

    // Payments button visibility: only copilots and admins
    const canShowPaymentsButton = useMemo(
        () => [ADMIN, COPILOT].includes(actionChallengeRole as any),
        [actionChallengeRole],
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
            {challengeInfo && canShowPaymentsButton && (
                <button
                    type='button'
                    className='borderButton'
                    onClick={function onClick() {
                        setShowPayments(true)
                    }}
                >
                    Payments
                </button>
            )}

            {showContactManager && (
                <DialogContactManager
                    open
                    setOpen={function setOpen(open: boolean) {
                        setShowContactManager(open)
                    }}
                />
            )}
            {showPayments && (
                <DialogPayments
                    open
                    setOpen={function setOpen(open: boolean) {
                        setShowPayments(open)
                    }}
                />
            )}
        </div>
    )
}

export default ChallengeLinks
