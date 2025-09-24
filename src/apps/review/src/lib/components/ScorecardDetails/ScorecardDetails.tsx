/**
 * Scorecard Details.
 */
import {
    Dispatch,
    ElementType,
    FC,
    Fragment,
    SetStateAction,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { useForm, UseFormReturn } from 'react-hook-form'
import { NavLink, useSearchParams } from 'react-router-dom'
import { filter, forEach, isEmpty, reduce } from 'lodash'
import classNames from 'classnames'

import { yupResolver } from '@hookform/resolvers/yup'
import { TableLoading } from '~/apps/admin/src/lib'

import { useAppNavigate } from '../../hooks'
import { AppealInfo, FormReviews, MappingAppeal, ReviewInfo, ReviewItemInfo, ScorecardInfo } from '../../models'
import { ScorecardDetailsHeader } from '../ScorecardDetailsHeader'
import { ScorecardQuestionEdit } from '../ScorecardQuestionEdit'
import { ScorecardQuestionView } from '../ScorecardQuestionView'
import { formReviewsSchema, roundWith2DecimalPlaces } from '../../utils'
import { ConfirmModal } from '../ConfirmModal'
import { IconError } from '../../assets/icons'
import { ReviewItemComment } from '../../models/ReviewItemComment.model'

import styles from './ScorecardDetails.module.scss'

interface Props {
    className?: string
    isEdit: boolean
    onCancelEdit: () => void
    setIsChanged: Dispatch<SetStateAction<boolean>>
    scorecardInfo?: ScorecardInfo
    isLoading: boolean
    reviewInfo?: ReviewInfo
    isSavingReview: boolean
    isSavingAppeal: boolean
    isSavingAppealResponse: boolean
    isSavingManagerComment: boolean
    saveReviewInfo: (
        updatedReview: FormReviews | undefined,
        fullReview: FormReviews | undefined,
        committed: boolean,
        totalScore: number,
        success: () => void,
    ) => void
    mappingAppeals: MappingAppeal
    addAppeal: (
        content: string,
        commentItem: ReviewItemComment,
        success: () => void,
    ) => void
    doDeleteAppeal: (
        appealInfo: AppealInfo | undefined,
        success: () => void,
    ) => void
    addAppealResponse: (
        content: string,
        updatedResponse: string,
        appeal: AppealInfo,
        reviewItem: ReviewItemInfo,
        success: () => void,
    ) => void
    addManagerComment: (
        content: string,
        updatedResponse: string,
        reviewItem: ReviewItemInfo,
        success: () => void,
    ) => void
}

export const ScorecardDetails: FC<Props> = (props: Props) => {
    const scorecardInfo = props.scorecardInfo
    const isLoading = props.isLoading
    const reviewInfo = props.reviewInfo
    const isSavingReview = props.isSavingReview
    const isEdit = props.isEdit
    const navigate = useAppNavigate()
    const [, setSearchParams] = useSearchParams()
    const [isExpand, setIsExpand] = useState<{ [key: string]: boolean }>({})
    const [isShowSaveAsDraftModal, setIsShowSaveAsDraftModal] = useState(false)
    const mappingReviewInfo = useMemo<{
        [key: string]: {
            item: ReviewItemInfo
            index: number
        }
    }>(() => {
        const result: {
            [key: string]: {
                item: ReviewItemInfo
                index: number
            }
        } = {}
        forEach(reviewInfo?.reviewItems ?? [], (item, index) => {
            result[item.scorecardQuestionId] = {
                index,
                item,
            }
        })
        return result
    }, [reviewInfo])
    const [isTouched, setIsTouched] = useState<{ [key: string]: boolean }>({})

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
        getValues,
        trigger,
    }: UseFormReturn<FormReviews> = useForm({
        defaultValues: {
            reviews: [],
        },
        mode: 'onChange',
        resolver: yupResolver(formReviewsSchema),
    })

    const changeHandle = props.setIsChanged
    useEffect(() => {
        changeHandle(isDirty)
    }, [isDirty, changeHandle])

    const errorMessageTop
        = isEmpty(errors) || isEmpty(isTouched)
            ? ''
            : 'There were validation errors. Check below.'

    const errorMessageBottom
        = isEmpty(errors) || isEmpty(isTouched)
            ? ''
            : 'There were validation errors. Check above.'

    const touchedAllField = useCallback(() => {
        const formData = getValues()
        const isTouchedAll: { [key: string]: boolean } = {}
        forEach(formData.reviews, review => {
            isTouchedAll[`reviews.${review.index}.initialAnswer.message`] = true
            forEach(review.comments, comment => {
                isTouchedAll[
                    `reviews.${review.index}.comments.${comment.index}.content`
                ] = true
            })
        })
        setIsTouched(isTouchedAll)
    }, [getValues])

    const ContainerTag = useMemo<ElementType>(
        () => (isEdit ? 'form' : 'div'),
        [isEdit],
    )

    const [reviewProgress, setReviewProgress] = useState(0)
    const [totalScore, setTotalScore] = useState(0)

    const onSubmit = useCallback((data: FormReviews) => {
        props.saveReviewInfo(
            isDirty ? getValues() : undefined,
            getValues(),
            true,
            totalScore,
            () => {
                reset(data)
            },
        )
    }, [reset, setSearchParams, totalScore, isDirty])

    const recalculateReviewProgress = useCallback(() => {
        const reviewFormDatas = getValues().reviews
        const mapingResult: {
            [scorecardQuestionId: string]: string
        } = {}
        const newReviewProgress
            = reviewFormDatas.length > 0
                ? Math.round(
                    (filter(reviewFormDatas, review => {
                        mapingResult[review.scorecardQuestionId]
                            = review.initialAnswer
                        return !!review.initialAnswer
                    }).length
                    * 100)
                    / reviewFormDatas.length,
                )
                : 0
        setReviewProgress(newReviewProgress)

        const groupsScore = reduce(
            scorecardInfo?.scorecardGroups ?? [],
            (groupResult, group) => {
                const groupPoint
                    = (reduce(
                        group.sections ?? [],
                        (sectionResult, section) => {
                            const sectionPoint
                                = (reduce(
                                    section.questions ?? [],
                                    (questionResult, question) => {
                                        let questionPoint = 0
                                        const initialAnswer
                                            = mapingResult[question.id as string]
                                        if (
                                            question.type === 'YES_NO'
                                            && initialAnswer === 'Yes'
                                        ) {
                                            questionPoint = 100
                                        } else if (
                                            question.type === 'SCALE'
                                            && !!initialAnswer
                                        ) {
                                            const totalPoint
                                                = question.scaleMax
                                                - question.scaleMin
                                            const initialAnswerNumber
                                                = parseInt(initialAnswer, 10)
                                                - question.scaleMin
                                            questionPoint
                                                = totalPoint > 0
                                                    ? (initialAnswerNumber
                                                        * 100)
                                                        / totalPoint
                                                    : 0
                                        }

                                        return (
                                            questionResult
                                                + (questionPoint * question.weight)
                                                / 100
                                        )
                                    },
                                    0,
                                )
                                * section.weight)
                                / 100
                            return sectionResult + sectionPoint
                        },
                        0,
                    )
                    * group.weight) / 100
                return groupResult + groupPoint
            },
            0,
        )
        setTotalScore(roundWith2DecimalPlaces(groupsScore))
    }, [getValues, scorecardInfo])

    useEffect(() => {
        if (reviewInfo) {
            const newFormData = {
                reviews: reviewInfo.reviewItems.map(
                    (reviewItem, reviewItemIndex) => ({
                        comments: reviewItem.reviewItemComments.map(
                            (commentItem, commentIndex) => ({
                                content: commentItem.content ?? '',
                                id: commentItem.id,
                                index: commentIndex,
                                type: commentItem.type ?? '',
                            }),
                        ),
                        id: reviewItem.id,
                        index: reviewItemIndex,
                        initialAnswer: reviewItem.finalAnswer || reviewItem.initialAnswer,
                        scorecardQuestionId: reviewItem.scorecardQuestionId,
                    }),
                ),
            }
            reset(newFormData)
            recalculateReviewProgress()
        }
    }, [reviewInfo, recalculateReviewProgress, reset])

    const expandAll = useCallback(() => {
        setIsExpand(
            reduce(
                reviewInfo?.reviewItems ?? [],
                (result, reviewItem) => ({ ...result, [reviewItem.id]: true }),
                {},
            ),
        )
    }, [reviewInfo])

    const back = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
        navigate(-1, {
            fallback: './../../../../challenge-details',
        })
    }, [navigate])

    const closeHandel = useCallback(() => {
        setIsShowSaveAsDraftModal(false)
    }, [])

    return isLoading ? (<TableLoading />) : (
        <div className={classNames(styles.container, props.className)}>
            <ScorecardDetailsHeader
                isEdit={isEdit}
                scorecardInfo={scorecardInfo}
                reviewProgress={reviewProgress}
                expandAll={expandAll}
                collapseAll={function collapseAll() {
                    setIsExpand({})
                }}
                totalScore={totalScore}
            />
            {errorMessageTop && (
                <div
                    className={classNames(styles.textErrorTop, {
                        [styles.isEmpty]: !errorMessageTop,
                    })}
                >
                    <i>
                        <IconError />
                    </i>
                    {errorMessageTop}
                </div>
            )}

            {reviewInfo && (
                <ContainerTag
                    className={styles.blockForm}
                    onSubmit={isEdit ? handleSubmit(onSubmit) : undefined}
                >
                    <table className={styles.blockTable}>
                        <tbody>
                            {(scorecardInfo?.scorecardGroups || []).map(
                                (group, groupIndex) => (
                                    <Fragment key={group.id}>
                                        <tr className={styles.blockRowGroup}>
                                            <td colSpan={3}>
                                                {groupIndex + 1}
                                                .
                                                {group.name}
                                                (
                                                {group.weight.toFixed(1)}
                                                )
                                            </td>
                                        </tr>

                                        {group.sections.map(
                                            (section, sectionIndex) => (
                                                <Fragment key={section.id}>
                                                    <tr
                                                        className={classNames(
                                                            styles.blockRowSection,
                                                            'question',
                                                        )}
                                                    >
                                                        <td>
                                                            {section.name}
                                                            (
                                                            {section.weight.toFixed(1)}
                                                            )
                                                        </td>
                                                        <td>Weight</td>
                                                        <td>Response</td>
                                                    </tr>
                                                    {section.questions.map(
                                                        (
                                                            question,
                                                            questionIndex,
                                                        ) => {
                                                            const reviewItemInfo
                                                                = mappingReviewInfo[
                                                                    question.id as string
                                                                ]
                                                            if (
                                                                !reviewItemInfo
                                                            ) {
                                                                return undefined
                                                            }

                                                            return isEdit ? (
                                                                <ScorecardQuestionEdit
                                                                    isExpand={
                                                                        isExpand
                                                                    }
                                                                    setIsExpand={
                                                                        setIsExpand
                                                                    }
                                                                    recalculateReviewProgress={
                                                                        recalculateReviewProgress
                                                                    }
                                                                    key={
                                                                        question.id
                                                                    }
                                                                    scorecardQuestion={
                                                                        question
                                                                    }
                                                                    trigger={
                                                                        trigger
                                                                    }
                                                                    reviewItem={
                                                                        reviewItemInfo.item
                                                                    }
                                                                    groupIndex={
                                                                        groupIndex
                                                                    }
                                                                    sectionIndex={
                                                                        sectionIndex
                                                                    }
                                                                    questionIndex={
                                                                        questionIndex
                                                                    }
                                                                    fieldIndex={
                                                                        reviewItemInfo.index
                                                                    }
                                                                    control={
                                                                        control
                                                                    }
                                                                    errors={
                                                                        errors
                                                                    }
                                                                    isTouched={
                                                                        isTouched
                                                                    }
                                                                    setIsTouched={
                                                                        setIsTouched
                                                                    }
                                                                    disabled={isSavingReview}
                                                                />
                                                            ) : (
                                                                <ScorecardQuestionView
                                                                    isExpand={
                                                                        isExpand
                                                                    }
                                                                    setIsExpand={
                                                                        setIsExpand
                                                                    }
                                                                    key={
                                                                        question.id
                                                                    }
                                                                    scorecardQuestion={
                                                                        question
                                                                    }
                                                                    reviewItem={
                                                                        reviewItemInfo.item
                                                                    }
                                                                    groupIndex={
                                                                        groupIndex
                                                                    }
                                                                    sectionIndex={
                                                                        sectionIndex
                                                                    }
                                                                    questionIndex={
                                                                        questionIndex
                                                                    }
                                                                    mappingAppeals={
                                                                        props.mappingAppeals
                                                                    }
                                                                    isSavingAppeal={
                                                                        props.isSavingAppeal
                                                                    }
                                                                    isSavingAppealResponse={
                                                                        props.isSavingAppealResponse
                                                                    }
                                                                    isSavingManagerComment={
                                                                        props.isSavingManagerComment
                                                                    }
                                                                    addAppeal={
                                                                        props.addAppeal
                                                                    }
                                                                    doDeleteAppeal={
                                                                        props.doDeleteAppeal
                                                                    }
                                                                    addAppealResponse={
                                                                        props.addAppealResponse
                                                                    }
                                                                    addManagerComment={
                                                                        props.addManagerComment
                                                                    }
                                                                />
                                                            )
                                                        },
                                                    )}
                                                </Fragment>
                                            ),
                                        )}
                                    </Fragment>
                                ),
                            )}
                        </tbody>
                    </table>

                    {isEdit ? (
                        <div className={styles.blockBottomEdit}>
                            <div>
                                {errorMessageBottom && (
                                    <div className={styles.textErrorBottom}>
                                        <i>
                                            <IconError />
                                        </i>
                                        {errorMessageBottom}
                                    </div>
                                )}
                            </div>

                            <div className={styles.blockBtns}>
                                <button
                                    type='button'
                                    className='cancelButton'
                                    onClick={props.onCancelEdit}
                                >
                                    Cancel
                                </button>
                                <button
                                    type='button'
                                    className='borderButton'
                                    onClick={function onClick() {
                                        props.saveReviewInfo(
                                            isDirty ? getValues() : undefined,
                                            getValues(),
                                            false,
                                            totalScore,
                                            () => {
                                                setIsShowSaveAsDraftModal(true)
                                                reset(getValues())
                                            },
                                        )
                                    }}
                                    disabled={isSavingReview}
                                >
                                    Save as Draft
                                </button>
                                <button
                                    type='submit'
                                    className='filledButton'
                                    onClick={function onClick() {
                                        touchedAllField()
                                    }}
                                    disabled={isSavingReview}
                                >
                                    Mark as Complete
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.blockBottomView}>
                            <div className={styles.textTotalScore}>
                                <span>Total Score:</span>
                                <span>{totalScore}</span>
                            </div>
                            <div className={styles.buttons}>
                                <NavLink
                                    className='filledButton'
                                    to=''
                                    onClick={back}
                                >
                                    Back to Challenge
                                </NavLink>
                            </div>
                        </div>
                    )}
                </ContainerTag>
            )}
            <ConfirmModal
                title='Save as Draft'
                open={isShowSaveAsDraftModal}
                onConfirm={closeHandel}
                onClose={closeHandel}
                action='OK'
                withoutCancel
            >
                <div>Your draft has been successfully saved!</div>
            </ConfirmModal>
        </div>
    )
}

export default ScorecardDetails
