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
import _ from 'lodash'
import classNames from 'classnames'

import { Button, LinkButton } from '~/libs/ui'
import { yupResolver } from '@hookform/resolvers/yup'

import { useFetchReviews, useFetchReviewsProps } from '../../hooks'
import { AppealInfo, FormReviews, ReviewItemInfo } from '../../models'
import { ScorecardDetailsHeader } from '../ScorecardDetailsHeader'
import { ScorecardQuestionEdit } from '../ScorecardQuestionEdit'
import { ScorecardQuestionView } from '../ScorecardQuestionView'
import { formReviewsSchema, roundWith2DecimalPlaces } from '../../utils'

import styles from './ScorecardDetails.module.scss'

interface Props {
    className?: string
    isEdit: boolean
    onCancelEdit: () => void
    setIsChanged: Dispatch<SetStateAction<boolean>>
}

export const ScorecardDetails: FC<Props> = (props: Props) => {
    const isEdit = props.isEdit
    const [isExpand, setIsExpand] = useState<{[key: string]: boolean}>({})
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

    useEffect(() => {
        props.setIsChanged(isDirty)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDirty])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const ContainerTag = useMemo<ElementType>(
        () => (isEdit ? 'form' : 'div'),
        [isEdit],
    )

    const onSubmit = useCallback((data: FormReviews) => {
        reset(data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const [reviewProgress, setReviewProgress] = useState(0)
    const [totalScore, setTotalScore] = useState(0)

    const recalculateReviewProgress = useCallback(
        () => {
            const reviewFormDatas = getValues().reviews
            const mapingResult: {
                [scorecardQuestionId: string]: string
            } = {}
            const newReviewProgress = reviewFormDatas.length > 0
                ? Math.round((
                    _.filter(reviewFormDatas, review => {
                        mapingResult[review.scorecardQuestionId] = review.initialAnswer
                        return !!review.initialAnswer
                    })
                        .length
                        * 100)
                        / reviewFormDatas.length)
                : 0
            setReviewProgress(newReviewProgress)

            const groupsScore = _.reduce(
                scorecardInfo?.scorecardGroups ?? [],
                (groupResult, group) => {
                    const groupPoint = (_.reduce(
                        group.sections ?? [],
                        (sectionResult, section) => {
                            const sectionPoint = (_.reduce(
                                section.questions ?? [],
                                (questionResult, question) => {
                                    let questionPoint = 0
                                    const initialAnswer = mapingResult[question.id]
                                    if (question.type === 'YES_NO' && initialAnswer === 'Yes') {
                                        questionPoint = 100
                                    } else if (question.type === 'SCALE' && !!initialAnswer) {
                                        const totalPoint = question.scaleMax - question.scaleMin
                                        const initialAnswerNumber = parseInt(initialAnswer, 10) - question.scaleMin
                                        questionPoint = totalPoint > 0 ? ((initialAnswerNumber * 100) / totalPoint) : 0
                                    }

                                    return questionResult + (questionPoint * question.weight) / 100
                                },
                                0,
                            ) * section.weight) / 100

                            return sectionResult + sectionPoint
                        },
                        0,
                    ) * group.weight) / 100

                    return groupResult + groupPoint
                },
                0,
            )
            setTotalScore(roundWith2DecimalPlaces(groupsScore))
        },
        [getValues, scorecardInfo],
    )

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reviewInfo])

    const expandAll = useCallback(
        () => {
            setIsExpand(_.reduce(
                reviewInfo?.reviewItems ?? [],
                (result, reviewItem) => ({ ...result, [reviewItem.id]: true }),
                {},
            ))
        },
        [reviewInfo],
    )

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

            <div
                className={classNames(styles.textErrorTop, {
                    [styles.isEmpty]: !errorMessageTop,
                })}
            >
                {errorMessageTop}
            </div>

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
                                                {' '}
                                                {group.name}
                                                {' '}
                                                (
                                                {group.weight.toFixed(1)}
                                                )
                                            </td>
                                        </tr>

                                        {group.sections.map(
                                            (section, sectionIndex) => (
                                                <Fragment key={section.id}>
                                                    <tr
                                                        className={
                                                            styles.blockRowSection
                                                        }
                                                    >
                                                        <td>
                                                            {section.name}
                                                            {' '}
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
                                                            = mappingReviewInfo[question.id]
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
                                                                    formFieldItemIndex={
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
                            <div className={styles.textErrorBottom}>
                                {errorMessageBottom}
                            </div>

                            <div className={styles.blockBtns}>
                                <Button
                                    label='Cancel'
                                    primary
                                    variant='danger'
                                    size='lg'
                                    onClick={props.onCancelEdit}
                                />
                                <Button
                                    label='Save as Draft'
                                    secondary
                                    size='lg'
                                    onClick={function onClick() {
                                        reset(getValues())
                                    }}
                                />
                                <Button
                                    type='submit'
                                    label='Mark as Complete'
                                    primary
                                    size='lg'
                                    onClick={function onClick() {
                                        touchedAllField()
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className={styles.blockBottomView}>
                            <div className={styles.textTotalScore}>
                                <span>Total Score:</span>
                                <span>{totalScore}</span>
                            </div>
                            <LinkButton
                                to='./../../challenge-details'
                                label='Back to Contest'
                                primary
                                size='lg'
                            />
                        </div>
                    )}
                </ContainerTag>
            )}
        </div>
    )
}

export default ScorecardDetails
