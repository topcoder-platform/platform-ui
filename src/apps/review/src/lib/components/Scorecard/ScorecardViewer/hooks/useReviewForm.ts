import { useCallback, useEffect, useState } from 'react'
import { useForm, UseFormReturn } from 'react-hook-form'
import { filter, forEach, reduce } from 'lodash'

import { yupResolver } from '@hookform/resolvers/yup'

import { FormReviews, ReviewInfo, Scorecard, ScorecardInfo } from '../../../../models'
import { formReviewsSchema, roundWith2DecimalPlaces } from '../../../../utils'
import { normalizeScorecardQuestionId } from '../utils'

interface UseReviewFormProps {
    reviewInfo?: ReviewInfo
    scorecardInfo?: Scorecard | ScorecardInfo
    onFormChange?: (isDirty: boolean) => void
}

export interface UseReviewForm {
    form: UseFormReturn<FormReviews>
    reviewProgress: number
    totalScore: number
    isTouched: { [key: string]: boolean }
    setIsTouched: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>
    recalculateReviewProgress: () => void
    touchedAllFields: () => void
}

export const useReviewForm = ({
    reviewInfo,
    scorecardInfo,
    onFormChange,
}: UseReviewFormProps): UseReviewForm => {
    const [reviewProgress, setReviewProgress] = useState(0)
    const [totalScore, setTotalScore] = useState(0)
    const [isTouched, setIsTouched] = useState<{ [key: string]: boolean }>({})

    const form = useForm<FormReviews>({
        defaultValues: {
            reviews: [],
        },
        mode: 'onChange',
        resolver: yupResolver(formReviewsSchema),
    })

    const { formState: { isDirty }, getValues, reset }: UseFormReturn<FormReviews> = form

    useEffect(() => {
        onFormChange?.(isDirty)
    }, [isDirty, onFormChange])

    const recalculateReviewProgress = useCallback(() => {
        const reviewFormDatas = getValues().reviews
        const mappingResult: {
            [scorecardQuestionId: string]: string
        } = {}

        const newReviewProgress = reviewFormDatas.length > 0
            ? Math.round(
                (filter(reviewFormDatas, review => {
                    const normalizedId = normalizeScorecardQuestionId(
                        review.scorecardQuestionId,
                    )
                    if (normalizedId) {
                        mappingResult[normalizedId] = review.initialAnswer
                    }

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
                const groupPoint = (reduce(
                    group.sections ?? [],
                    (sectionResult, section) => {
                        const sectionPoint = (reduce(
                            section.questions ?? [],
                            (questionResult, question) => {
                                let questionPoint = 0
                                const normalizedQuestionId = normalizeScorecardQuestionId(
                                    question.id as string,
                                )
                                const initialAnswer = normalizedQuestionId
                                    ? mappingResult[normalizedQuestionId]
                                    : undefined

                                if (
                                    question.type === 'YES_NO'
                                    && initialAnswer === 'Yes'
                                ) {
                                    questionPoint = 100
                                } else if (
                                    question.type === 'SCALE'
                                    && !!initialAnswer
                                ) {
                                    const totalPoint = question.scaleMax - question.scaleMin
                                    const initialAnswerNumber = parseInt(initialAnswer, 10) - question.scaleMin
                                    questionPoint = totalPoint > 0
                                        ? (initialAnswerNumber * 100) / totalPoint
                                        : 0
                                }

                                return (
                                    questionResult
                                        + (questionPoint * question.weight) / 100
                                )
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

    const touchedAllFields = useCallback(() => {
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

    return {
        form,
        isTouched,
        recalculateReviewProgress,
        reviewProgress,
        setIsTouched,
        totalScore,
        touchedAllFields,
    }
}
