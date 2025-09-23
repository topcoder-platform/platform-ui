/**
 * Challenge Links.
 */
import { FC, useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import { ConfirmModal } from '../ConfirmModal'
import { useAppNavigate } from '../../hooks'
import { rootRoute, scorecardRouteId } from '../../../config/routes.config'
import { FormReviews, ReviewInfo } from '../../models'

import styles from './ChallengeLinksForAdmin.module.scss'

interface Props {
    className?: string
    scorecardId: string
    isSavingReview: boolean
    reviewInfo?: ReviewInfo
    saveReviewInfo: (
        updatedReview: FormReviews | undefined,
        fullReview: FormReviews | undefined,
        committed: boolean,
        totalScore: number,
        success: () => void,
    ) => void
}

export const ChallengeLinksForAdmin: FC<Props> = (props: Props) => {
    const [showCloseConfirmation, setShowCloseConfirmation] = useState(false)
    const navigate = useAppNavigate()
    const reopen = useCallback(() => {
        setShowCloseConfirmation(true)
    }, [])
    return (
        <>
            <div className={classNames(styles.container, props.className)}>
                {props.reviewInfo?.id && (
                    <button
                        disabled={props.isSavingReview}
                        type='button'
                        className='borderButton'
                        onClick={reopen}
                    >
                        Reopen
                    </button>
                )}
                <Link
                    to={`${rootRoute}/${scorecardRouteId}/${props.scorecardId}/edit`}
                    type='button'
                    className='borderButton'
                >
                    Edit Scorecard
                </Link>
            </div>
            <ConfirmModal
                title='Reopen Scorecard Confirmation'
                action='Confirm'
                onClose={function onClose() {
                    setShowCloseConfirmation(false)
                }}
                onConfirm={function onConfirm() {
                    props.saveReviewInfo(
                        undefined,
                        undefined,
                        false,
                        props.reviewInfo?.initialScore ?? 0,
                        () => {
                            navigate(-1, {
                                fallback: './../../../../challenge-details',
                            })
                        },
                    )
                }}
                open={showCloseConfirmation}
                maxWidth='578px'
            >
                <div>
                    The scorecard will be reopened and the reviewer will be able
                    to edit it before submitting the scorecard again. Are you
                    sure you want to reopen the scorecard?
                </div>
            </ConfirmModal>
        </>
    )
}

export default ChallengeLinksForAdmin
