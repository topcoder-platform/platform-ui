import { useCallback, useEffect, useState } from 'react'
import { useForm, UseFormReturn } from 'react-hook-form'
import { forEach } from 'lodash'

import { yupResolver } from '@hookform/resolvers/yup'

import { AiFeedbackItem, FormReviews, ReviewInfo, Scorecard, ScorecardInfo } from '../../../../models'
import { formReviewsSchema } from '../../../../utils'

interface UseReviewFormProps {
    reviewItems?: ReviewInfo['reviewItems'] | AiFeedbackItem[]
    scorecardInfo?: Scorecard | ScorecardInfo
    onFormChange?: (isDirty: boolean) => void
}

export interface UseReviewForm {
    form: UseFormReturn<FormReviews>
    isTouched: { [key: string]: boolean }
    setIsTouched: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>
    touchedAllFields: () => void
}

export const useReviewForm = ({
    reviewItems,
    onFormChange,
}: UseReviewFormProps): UseReviewForm => {
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

    useEffect(() => {
        if (reviewItems?.length) {
            const newFormData = {
                reviews: reviewItems.map(
                    (reviewItem, reviewItemIndex) => ({
                        comments: 'reviewItemComments' in reviewItem ? reviewItem.reviewItemComments?.map(
                            (commentItem, commentIndex) => ({
                                content: commentItem.content ?? '',
                                id: commentItem.id,
                                index: commentIndex,
                                type: commentItem.type ?? '',
                            }),
                        ) : [],
                        id: reviewItem.id,
                        index: reviewItemIndex,
                        initialAnswer: (
                            ('finalAnswer' in reviewItem && reviewItem.finalAnswer)
                            || ('initialAnswer' in reviewItem && reviewItem.initialAnswer)
                            || ('questionScore' in reviewItem && reviewItem.questionScore)
                            || undefined
                        ) as string,
                        scorecardQuestionId: reviewItem.scorecardQuestionId,
                    }),
                ),
            }
            reset(newFormData)
        }
    }, [reviewItems, reset])

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
        setIsTouched,
        touchedAllFields,
    }
}
