/**
 * Challenge Links.
 */
import { FC, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import classNames from 'classnames'

import { ConfirmModal } from '../ConfirmModal'

import styles from './ChallengeLinksForAdmin.module.scss'

interface Props {
    className?: string
}

export const ChallengeLinksForAdmin: FC<Props> = (props: Props) => {
    const [showCloseConfirmation, setShowCloseConfirmation] = useState(false)
    const navigate = useNavigate()
    const reopen = useCallback(() => {
        setShowCloseConfirmation(true)
    }, [])
    return (
        <>
            <div className={classNames(styles.container, props.className)}>
                <button type='button' className='borderButton' onClick={reopen}>
                    Reopen
                </button>
                <button type='button' className='borderButton'>Edit Scorecard</button>
            </div>
            <ConfirmModal
                title='Reopen Scorecard Confirmation'
                action='Confirm'
                onClose={function onClose() {
                    setShowCloseConfirmation(false)
                }}
                onConfirm={function onConfirm() {
                    navigate(-1)
                }}
                open={showCloseConfirmation}
                maxWidth='578px'
            >
                <div>
                    The scorecard will be reopened and the reviewer will be able
                    to edit it before submitting the scorecard again. Are you
                    sure you wnat to reopen the scorecard?
                </div>
            </ConfirmModal>
        </>
    )
}

export default ChallengeLinksForAdmin
