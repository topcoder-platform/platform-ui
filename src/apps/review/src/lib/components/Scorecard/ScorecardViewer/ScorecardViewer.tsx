import { FC, useCallback, useMemo, useState, Fragment } from 'react'
import { isEmpty } from 'lodash'
import classNames from 'classnames'

import { TableLoading } from '~/apps/admin/src/lib'

import {
    AiFeedbackItem,
    AppealInfo,
    FormReviews,
    MappingAppeal,
    ReviewInfo,
    ReviewItemComment,
    ReviewItemInfo,
    Scorecard,
    ScorecardInfo,
} from '../../../models'
import { useReviewForm } from './hooks/useReviewForm'
import { createReviewItemMapping } from './utils'
import { ScorecardGroup } from './ScorecardGroup'
import { ScorecardViewerContextProvider } from './ScorecardViewer.context'
import { ScorecardTotal } from './ScorecardTotal'
import { ConfirmModal } from '../../ConfirmModal'
import { IconError } from '../../../assets/icons'

import styles from './ScorecardViewer.module.scss'

interface ScorecardViewerProps {
    scorecard: Scorecard | ScorecardInfo
    aiFeedback?: AiFeedbackItem[]
    score?: number
    reviewInfo?: ReviewInfo
    isEdit?: boolean
    isManagerEdit?: boolean
    actionChallengeRole?: string
    mappingAppeals?: MappingAppeal
    isSavingReview?: boolean
    isSavingAppeal?: boolean
    isSavingAppealResponse?: boolean
    isSavingManagerComment?: boolean
    saveReviewInfo?: (
        updatedReview: FormReviews | undefined,
        fullReview: FormReviews | undefined,
        committed: boolean,
        totalScore: number,
        success: () => void,
    ) => void
    addAppeal?: (
        content: string,
        commentItem: ReviewItemComment,
        success: () => void,
    ) => void
    doDeleteAppeal?: (
        appealInfo: AppealInfo | undefined,
        success: () => void,
    ) => void
    addAppealResponse?: (
        content: string,
        updatedResponse: string,
        appeal: AppealInfo,
        reviewItem: ReviewItemInfo,
        success: () => void,
    ) => void
    addManagerComment?: (
        content: string,
        updatedResponse: string,
        reviewItem: ReviewItemInfo,
        success: () => void,
    ) => void
    onCancelEdit?: () => void
    isLoading?: boolean
    setIsChanged?: (changed: boolean) => void
}

const ScorecardViewer: FC<ScorecardViewerProps> = props => {
    const [isShowSaveAsDraftModal, setIsShowSaveAsDraftModal] = useState(false)
    const [shouldRedirectAfterDraft, setShouldRedirectAfterDraft] = useState(false)
    // const [isChanged, setIsChanged] = useState(false)

    const reviewItemMapping = useMemo(() => {
        if (!props.reviewInfo?.reviewItems) {
            return undefined
        }
        return createReviewItemMapping(props.reviewInfo.reviewItems)
    }, [props.reviewInfo])

    const {
        form,
        reviewProgress,
        totalScore,
        isTouched,
        setIsTouched,
        recalculateReviewProgress,
        touchedAllFields,
    } = useReviewForm({
        reviewInfo: props.reviewInfo,
        scorecardInfo: props.scorecard as ScorecardInfo,
        onFormChange: props.setIsChanged,
    })

    const { handleSubmit, getValues, formState: { errors, isDirty } } = form

    const displayedTotalScore = useMemo(() => {
        const maybeFinalScore = props.reviewInfo?.finalScore
        if (
            !props.isEdit
            && typeof maybeFinalScore === 'number'
            && Number.isFinite(maybeFinalScore)
        ) {
            return maybeFinalScore.toFixed(2)
        }

        return totalScore.toFixed(2)
    }, [props.isEdit, props.reviewInfo?.finalScore, totalScore])

    const errorMessageTop = isEmpty(errors) || isEmpty(isTouched)
        ? ''
        : 'There were validation errors. Check below.'

    const errorMessageBottom = isEmpty(errors) || isEmpty(isTouched)
        ? ''
        : 'There were validation errors. Check above.'

    const onSubmit = useCallback((data: FormReviews) => {
        if (props.saveReviewInfo) {
            props.saveReviewInfo(
                isDirty ? getValues() : undefined,
                getValues(),
                true,
                totalScore,
                () => {
                    // Success callback - could navigate or show success message
                },
            )
        }
    }, [
        getValues,
        isDirty,
        props.saveReviewInfo,
        totalScore,
    ])

    const handleSaveAsDraft = useCallback(() => {
        if (props.saveReviewInfo) {
            props.saveReviewInfo(
                isDirty ? getValues() : undefined,
                getValues(),
                false,
                totalScore,
                () => {
                    setIsShowSaveAsDraftModal(true)
                    setShouldRedirectAfterDraft(true)
                },
            )
        }
    }, [getValues, isDirty, props.saveReviewInfo, totalScore])

    const handleCloseDraftModal = useCallback(() => {
        setIsShowSaveAsDraftModal(false)
        if (shouldRedirectAfterDraft) {
            setShouldRedirectAfterDraft(false)
        }
    }, [shouldRedirectAfterDraft])

    const expandAll = useCallback(() => {
        // Expand all questions - this would need to be implemented in context
    }, [])

    const collapseAll = useCallback(() => {
        // Collapse all questions - this would need to be implemented in context
    }, [])

    const ContainerTag = props.isEdit ? 'form' : 'div'

    return (
        <div className={styles.wrap}>
            <ScorecardViewerContextProvider
                scorecard={props.scorecard as Scorecard}
                aiFeedbackItems={props.aiFeedback}
                reviewInfo={props.reviewInfo}
                isEdit={props.isEdit}
                isManagerEdit={props.isManagerEdit}
                actionChallengeRole={props.actionChallengeRole}
                mappingAppeals={props.mappingAppeals}
                isSavingReview={props.isSavingReview}
                isSavingAppeal={props.isSavingAppeal}
                isSavingAppealResponse={props.isSavingAppealResponse}
                isSavingManagerComment={props.isSavingManagerComment}
                saveReviewInfo={props.saveReviewInfo}
                addAppeal={props.addAppeal}
                doDeleteAppeal={props.doDeleteAppeal}
                addAppealResponse={props.addAppealResponse}
                addManagerComment={props.addManagerComment}
            >
                {props.isLoading ? (
                    <TableLoading />
                ) : (
                    <>
                        {/* {(props.isEdit || props.reviewInfo) && (
                            <ScorecardViewerHeader
                                scorecard={props.scorecard as Scorecard}
                                isEdit={props.isEdit}
                                reviewProgress={props.isEdit ? reviewProgress : undefined}
                                totalScore={displayedTotalScore}
                                onExpandAll={expandAll}
                                onCollapseAll={collapseAll}
                            />
                        )} */}

                        {errorMessageTop && (
                            <div className={classNames(styles.errorMessage, styles.errorTop)}>
                                <i>
                                    <IconError />
                                </i>
                                {errorMessageTop}
                            </div>
                        )}

                        {!!props.score && !props.reviewInfo && (
                            <div className={styles.conclusion}>
                                <strong>Conclusion</strong>
                                <p>
                                    Congratulations! You earned a score of
                                    {' '}
                                    <strong>
                                        {props.score.toFixed(2)}
                                    </strong>
                                    {' '}
                                    out of the maximum of
                                    {' '}
                                    <strong>
                                        {(props.scorecard as Scorecard).maxScore.toFixed(2)}
                                    </strong>
                                    .
                                    You did a good job on passing the scorecard criteria.
                                    Please check the below sections to see if there is any place for improvement.
                                </p>
                            </div>
                        )}

                        {props.reviewInfo && (
                            <ContainerTag
                                className={styles.formContainer}
                                onSubmit={props.isEdit ? handleSubmit(onSubmit) : undefined}
                            >
                                {props.scorecard.scorecardGroups.map((group, index) => (
                                    <ScorecardGroup
                                        key={group.id}
                                        group={group}
                                        index={index + 1}
                                        reviewItemMapping={reviewItemMapping}
                                        formControl={props.isEdit ? form.control : undefined}
                                        formErrors={props.isEdit ? errors : undefined}
                                        formIsTouched={props.isEdit ? isTouched : undefined}
                                        formSetIsTouched={props.isEdit ? setIsTouched : undefined}
                                        formTrigger={props.isEdit ? form.trigger : undefined}
                                        recalculateReviewProgress={props.isEdit ? recalculateReviewProgress : undefined}
                                    />
                                ))}
                            </ContainerTag>
                        )}

                        {!props.reviewInfo && props.scorecard.scorecardGroups.map((group, index) => (
                            <ScorecardGroup
                                key={group.id}
                                group={group}
                                index={index + 1}
                            />
                        ))}

                        <ScorecardTotal score={props.score} />

                        {props.isEdit && (
                            <div className={styles.footer}>
                                <div>
                                    {errorMessageBottom && (
                                        <div className={classNames(styles.errorMessage, styles.errorBottom)}>
                                            <i>
                                                <IconError />
                                            </i>
                                            {errorMessageBottom}
                                        </div>
                                    )}
                                </div>

                                <div className={styles.actions}>
                                    {props.onCancelEdit && (
                                        <button
                                            type='button'
                                            className='cancelButton'
                                            onClick={props.onCancelEdit}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    <button
                                        type='button'
                                        className='borderButton'
                                        onClick={handleSaveAsDraft}
                                        disabled={props.isSavingReview}
                                    >
                                        Save as Draft
                                    </button>
                                    <button
                                        type='submit'
                                        className='filledButton'
                                        onClick={function onClick() {
                                            touchedAllFields()
                                        }}
                                        disabled={props.isSavingReview}
                                    >
                                        Mark as Complete
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </ScorecardViewerContextProvider>

            <ConfirmModal
                title='Save as Draft'
                open={isShowSaveAsDraftModal}
                onConfirm={handleCloseDraftModal}
                onClose={handleCloseDraftModal}
                action='OK'
                withoutCancel
            >
                <div>Your draft has been successfully saved!</div>
            </ConfirmModal>
        </div>
    )
}

export default ScorecardViewer
