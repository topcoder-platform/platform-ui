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
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import _ from 'lodash'
import classNames from 'classnames'

import { yupResolver } from '@hookform/resolvers/yup'

import { useFetchReviews, useFetchReviewsProps } from '../../hooks'
import { AppealInfo, FormReviews, ReviewItemInfo } from '../../models'
import { ScorecardDetailsHeader } from '../ScorecardDetailsHeader'
import { ScorecardQuestionEdit } from '../ScorecardQuestionEdit'
import { ScorecardQuestionView } from '../ScorecardQuestionView'
import { formReviewsSchema, roundWith2DecimalPlaces } from '../../utils'
import { ConfirmModal } from '../ConfirmModal'
import { IconError } from '../../assets/icons'

import styles from './ScorecardDetails.module.scss'

interface Props {
    className?: string
    isEdit: boolean
    onCancelEdit: () => void
    setIsChanged: Dispatch<SetStateAction<boolean>>
}

export const ScorecardDetails: FC<Props> = (props: Props) => {
    const isEdit = props.isEdit
    const navigate = useNavigate()
    const [, setSearchParams] = useSearchParams()
    const [isExpand, setIsExpand] = useState<{ [key: string]: boolean }>({})
    const [isShowSaveAsDraftModal, setIsShowSaveAsDraftModal] = useState(false)
    const { scorecardInfo, appeals, reviewInfo }: useFetchReviewsProps
        = useFetchReviews(isEdit)
    const mappingAppeals = useMemo<{
        [reviewItemCommentId: string]: AppealInfo
    }>(() => {
        const result: { [key: string]: AppealInfo } = {}
        _.forEach(appeals, item => {
            result[item.reviewItemCommentId] = item
        })
        return result
    }, [appeals])
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
        _.forEach(reviewInfo?.reviewItems ?? [], (item, index) => {
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
        = _.isEmpty(errors) || _.isEmpty(isTouched)
            ? ''
            : 'There were validation errors. Check below.'

    const errorMessageBottom
        = _.isEmpty(errors) || _.isEmpty(isTouched)
            ? ''
            : 'There were validation errors. Check above.'

    const touchedAllField = useCallback(() => {
        const formData = getValues()
        const isTouchedAll: { [key: string]: boolean } = {}
        _.forEach(formData.reviews, review => {
            isTouchedAll[`reviews.${review.index}.initialAnswer.message`] = true
            _.forEach(review.comments, comment => {
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

    const onSubmit = useCallback((data: FormReviews) => {
        reset(data)
        setSearchParams({ viewMode: 'true' }, { replace: true })
    }, [reset, setSearchParams])

    const [reviewProgress, setReviewProgress] = useState(0)
    const [totalScore, setTotalScore] = useState(0)

    const recalculateReviewProgress = useCallback(() => {
        const reviewFormDatas = getValues().reviews
        const mapingResult: {
            [scorecardQuestionId: string]: string
        } = {}
        const newReviewProgress
            = reviewFormDatas.length > 0
                ? Math.round(
                    (_.filter(reviewFormDatas, review => {
                        mapingResult[review.scorecardQuestionId]
                            = review.initialAnswer
                        return !!review.initialAnswer
                    }).length
                    * 100)
                    / reviewFormDatas.length,
                )
                : 0
        setReviewProgress(newReviewProgress)

        const groupsScore = _.reduce(
            scorecardInfo?.scorecardGroups ?? [],
            (groupResult, group) => {
                const groupPoint
                    = (_.reduce(
                        group.sections ?? [],
                        (sectionResult, section) => {
                            const sectionPoint
                                = (_.reduce(
                                    section.questions ?? [],
                                    (questionResult, question) => {
                                        let questionPoint = 0
                                        const initialAnswer
                                            = mapingResult[question.id]
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
            reset({
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
                        initialAnswer: reviewItem.initialAnswer,
                        scorecardQuestionId: reviewItem.scorecardQuestionId,
                    }),
                ),
            })
            recalculateReviewProgress()
        }
    }, [reviewInfo, recalculateReviewProgress, reset])

    const expandAll = useCallback(() => {
        setIsExpand(
            _.reduce(
                reviewInfo?.reviewItems ?? [],
                (result, reviewItem) => ({ ...result, [reviewItem.id]: true }),
                {},
            ),
        )
    }, [reviewInfo])

    const back = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
        navigate(-1)
    }, [navigate])

    const closeHandel = useCallback(() => {
        setIsShowSaveAsDraftModal(false)
    }, [])

    return (
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
                                                                    question.id
                                                                ]
                                                            if (
                                                                !reviewItemInfo
                                                            ) {
                                                                return <></>
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
                                                                        mappingAppeals
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
                                        setIsShowSaveAsDraftModal(true)
                                        reset(getValues())
                                    }}
                                >
                                    Save as Draft
                                </button>
                                <button
                                    type='submit'
                                    className='filledButton'
                                    onClick={function onClick() {
                                        touchedAllField()
                                    }}
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
