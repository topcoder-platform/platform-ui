/**
 * Challenge Links for Admin/Copilot.
 */
import {
    FC,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react'
import classNames from 'classnames'

import { ConfirmModal } from '../ConfirmModal'
import { useAppNavigate } from '../../hooks'
import {
    ChallengeDetailContext,
} from '../../contexts'
import {
    ChallengeDetailContextModel,
    FormReviews,
    ReviewInfo,
} from '../../models'
import { DialogContactManager } from '../DialogContactManager'
import { filterResources } from '../../utils'
import {
    ADMIN,
    COPILOT,
    REVIEWER,
    SUBMITTER,
} from '../../../config/index.config'

import styles from './ChallengeLinksForAdmin.module.scss'

interface Props {
    className?: string
    isSavingReview: boolean
    reviewInfo?: ReviewInfo
    saveReviewInfo: (
        updatedReview: FormReviews | undefined,
        fullReview: FormReviews | undefined,
        committed: boolean,
        totalScore: number,
        success: () => void,
    ) => void
    canEditScorecard?: boolean
    isManagerEdit?: boolean
    onToggleManagerEdit?: () => void
}

export const ChallengeLinksForAdmin: FC<Props> = (props: Props) => {
    const [showCloseConfirmation, setShowCloseConfirmation] = useState(false)
    const [showContactManager, setShowContactManager] = useState(false)
    const navigate = useAppNavigate()
    const {
        challengeInfo,
        myResources,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)

    const canShowContactManagerButton = useMemo(
        () => filterResources(
            [SUBMITTER, REVIEWER, COPILOT, ADMIN],
            myResources,
        ).length > 0,
        [myResources],
    )

    const reopen = useCallback(() => {
        setShowCloseConfirmation(true)
    }, [])

    return (
        <>
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

                {challengeInfo?.discussionsUrl && (
                    <a
                        href={challengeInfo.discussionsUrl}
                        className='borderButton'
                        target='_blank'
                        rel='noreferrer'
                    >
                        Forum
                    </a>
                )}

                {props.canEditScorecard && (
                    <button
                        type='button'
                        className='borderButton'
                        onClick={props.onToggleManagerEdit}
                    >
                        {props.isManagerEdit ? 'Exit Edit Mode' : 'Edit Scorecard'}
                    </button>
                )}

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
            </div>

            {showContactManager && (
                <DialogContactManager
                    open
                    setOpen={function setOpen(open: boolean) {
                        setShowContactManager(open)
                    }}
                />
            )}

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
