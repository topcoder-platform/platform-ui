/* eslint-disable complexity */

import { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { isEmpty } from 'lodash'
import classNames from 'classnames'

import { TableLoading } from '~/apps/admin/src/lib'

import {
    AiFeedbackItem,
    AppealInfo,
    FormReviews,
    MappingAppeal,
    ReviewCtxStatus,
    ReviewInfo,
    ReviewItemComment,
    ReviewItemInfo,
    Scorecard,
    ScorecardInfo,
} from '../../../models'
import { IconError } from '../../../assets/icons'
import { ConfirmModal } from '../../ConfirmModal'

import {
    ScorecardViewerContextProvider,
    ScorecardViewerContextValue,
    useScorecardViewerContext,
} from './ScorecardViewer.context'
import { ScorecardGroup } from './ScorecardGroup'
import { ScorecardTotal } from './ScorecardTotal'
import { createReviewItemMapping } from './utils'
import styles from './ScorecardViewer.module.scss'

interface ScorecardViewerProps {
    scorecard: Scorecard | ScorecardInfo
    aiFeedback?: AiFeedbackItem[]
    reviewInfo?: ReviewInfo
    isEdit?: boolean
    isManagerEdit?: boolean
    actionChallengeRole?: string
    mappingAppeals?: MappingAppeal
    isSavingReview?: boolean
    isSavingAppeal?: boolean
    isSavingAppealResponse?: boolean
    isSavingManagerComment?: boolean
    setReviewStatus?: (status: ReviewCtxStatus) => void
    setActionButtons?: (buttons?: ReactNode) => void
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
    navigateBack?: (e?: React.MouseEvent<HTMLAnchorElement>) => void
    isLoading?: boolean
    setIsChanged?: (changed: boolean) => void
}

const ScorecardViewerContent: FC<ScorecardViewerProps> = props => {
    const [isShowSaveAsDraftModal, setIsShowSaveAsDraftModal] = useState(false)
    const [shouldRedirectAfterDraft, setShouldRedirectAfterDraft] = useState(false)

    const reviewItemMapping = useMemo(() => {
        if (!props.reviewInfo?.reviewItems) {
            return undefined
        }

        return createReviewItemMapping(props.reviewInfo.reviewItems)
    }, [props.reviewInfo])

    const {
        form,
        totalScore,
        isTouched,
        touchedAllFields,
        formErrors,
    }: ScorecardViewerContextValue = useScorecardViewerContext()

    const isDirty = form?.formState?.isDirty || false
    const errors = formErrors || {}

    const errorMessage = isEmpty(errors) || isEmpty(isTouched)
        ? ''
        : 'There were validation errors.'

    const onSubmit = useCallback(() => {
        if (props.saveReviewInfo) {
            props.saveReviewInfo(
                isDirty ? form?.getValues() : undefined,
                form?.getValues(),
                true,
                totalScore,
                () => props.navigateBack?.(),
            )
        }
    }, [
        form,
        isDirty,
        props.saveReviewInfo,
        totalScore,
    ])

    const handleSaveAsDraft = useCallback(() => {
        if (props.saveReviewInfo) {
            props.saveReviewInfo(
                isDirty ? form?.getValues() : undefined,
                form?.getValues(),
                false,
                totalScore,
                () => {
                    setIsShowSaveAsDraftModal(true)
                    setShouldRedirectAfterDraft(true)
                },
            )
        }
    }, [form, isDirty, props.saveReviewInfo, totalScore])

    const handleCloseDraftModal = useCallback(() => {
        setIsShowSaveAsDraftModal(false)
        if (shouldRedirectAfterDraft) {
            setShouldRedirectAfterDraft(false)
        }
    }, [shouldRedirectAfterDraft])

    const ContainerTag = props.isEdit ? 'form' : 'div'

    useEffect(() => {
        if (props.setReviewStatus && props.scorecard) {
            const isCompleted = props.reviewInfo?.status === 'COMPLETED'
            const score = isCompleted ? props.reviewInfo!.finalScore! : totalScore
            let status: 'passed' |'failed-score' |'pending' = (
                score >= (props.scorecard.minimumPassingScore ?? 50) ? 'passed' : 'failed-score'
            )

            if (!isCompleted) {
                status = 'pending'
            }

            props.setReviewStatus({
                score,
                status,
            })
        }
    }, [totalScore, props.scorecard])

    const actionButtons = useMemo(() => (
        <div className={styles.actions}>
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
                    form?.handleSubmit(onSubmit)()
                }}
                disabled={props.isSavingReview}
            >
                Mark as Complete
            </button>
        </div>
    ), [props.isEdit, handleSaveAsDraft, touchedAllFields, props.isSavingReview])

    useEffect(() => {
        props.setActionButtons?.(props.isEdit ? actionButtons : (
            <>
                <Link
                    type='button'
                    className='borderButton'
                    to='../challenge-details'
                >
                    Back to Challenge
                </Link>
            </>
        ))
    }, [actionButtons, props.setActionButtons])

    if (props.isLoading) {
        return <TableLoading />
    }

    return (
        <div className={styles.wrap}>
            {errorMessage && (
                <div className={classNames(styles.errorMessage, styles.errorTop)}>
                    <i>
                        <IconError />
                    </i>
                    {errorMessage}
                    {' '}
                    Check bellow.
                </div>
            )}

            {!!totalScore && !!props.aiFeedback && (
                <div className={styles.conclusion}>
                    <strong>Conclusion</strong>
                    <p>
                        {(totalScore > (props.scorecard.minimumPassingScore ?? 0)) && 'Congratulations!'}
                        You earned a score of
                        {' '}
                        <strong>
                            {totalScore.toFixed(2)}
                        </strong>
                        {' '}
                        out of the maximum of
                        {' '}
                        <strong>
                            {(props.scorecard as Scorecard).maxScore?.toFixed(2)}
                        </strong>
                        .
                        {(totalScore > (props.scorecard.minimumPassingScore ?? 0))
                            ? 'You did a good job on passing the scorecard criteria.'
                            : 'You did not pass the scorecard criteria.'}
                        Please check the below sections to see if there is any place for improvement.
                    </p>
                </div>
            )}

            <ContainerTag
                className={styles.formContainer}
                {...((props.isEdit && form) ? { onSubmit: form.handleSubmit(onSubmit) ?? undefined } : {})}
            >
                {props.reviewInfo && (
                    props.scorecard.scorecardGroups.map((group, index) => (
                        <ScorecardGroup
                            key={group.id}
                            group={group}
                            index={index + 1}
                            reviewItemMapping={reviewItemMapping}
                        />
                    ))
                )}

                {!props.reviewInfo && props.scorecard.scorecardGroups.map((group, index) => (
                    <ScorecardGroup
                        key={group.id}
                        group={group}
                        index={index + 1}
                    />
                ))}

                <ScorecardTotal score={totalScore} />

                {props.isEdit ? (
                    <div className={styles.footer}>
                        <div>
                            {errorMessage && (
                                <div className={classNames(styles.errorMessage, styles.errorBottom)}>
                                    <i>
                                        <IconError />
                                    </i>
                                    {errorMessage}
                                    {' '}
                                    Check above.
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
                            {actionButtons}
                        </div>
                    </div>
                ) : (props.navigateBack && (
                    <div className={styles.footer}>
                        <div className={styles.actions}>
                            <NavLink
                                className='filledButton'
                                to=''
                                onClick={props.navigateBack}
                            >
                                Back to Challenge
                            </NavLink>
                        </div>
                    </div>
                ))}
            </ContainerTag>

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

const ScorecardViewer: FC<ScorecardViewerProps> = props => (
    <ScorecardViewerContextProvider
        scorecard={props.scorecard}
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
        onFormChange={props.setIsChanged}
        setReviewStatus={props.setReviewStatus}
    >
        <ScorecardViewerContent {...props} />
    </ScorecardViewerContextProvider>
)

export default ScorecardViewer
