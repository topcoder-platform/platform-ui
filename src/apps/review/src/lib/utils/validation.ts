/**
 * Util for form validation
 */

import * as Yup from 'yup'

import { FormAppealResponse, FormContactManager, FormManagerComment, FormReviews } from '../models'
import { FormFeedbackReply } from '../models/FormFeedbackReply.model'

/**
 * Validation schema for form appeal response
 */
export const formAppealResponseSchema: Yup.ObjectSchema<FormAppealResponse>
    = Yup.object({
        response: Yup.string()
            .required('Response is mandatory'),
    })

export const formManagerCommentSchema: Yup.ObjectSchema<FormManagerComment>
    = Yup.object({
        finalScore: Yup.string()
            .required('Answer is mandatory'),
        response: Yup.string()
            .required('Response is mandatory'),
    })

/**
 * Validation schema for form appeal response
 */
export const formFeedbackReplySchema: Yup.ObjectSchema<FormFeedbackReply>
    = Yup.object({
        reply: Yup.string()
            .required('Reply text is mandatory'),
    })

/**
 * validation schema for form reviews
 */
export const formReviewsSchema: Yup.ObjectSchema<FormReviews> = Yup.object({
    reviews: Yup.array()
        .of(
            Yup.object()
                .shape({
                    comments: Yup.array()
                        .of(
                            Yup.object()
                                .shape({
                                    content: Yup.string()
                                        .when(
                                            'type',
                                            (type, schema) => {
                                                if (type[0] === 'COMMENT' || !type[0]) {
                                                    return schema.optional()
                                                }

                                                return schema
                                                    .required(
                                                        'Comment is mandatory',
                                                    )
                                            },
                                        ),
                                    id: Yup.string()
                                        .optional(),
                                    index: Yup.number()
                                        .required('Index is mandatory'),
                                    type: Yup.string()
                                        .optional(),
                                }),
                        )
                        .required('Comments is mandatory'),
                    id: Yup.string()
                        .required('Id is mandatory'),
                    index: Yup.number()
                        .required('Index is mandatory'),
                    initialAnswer: Yup.string()
                        .required('Answer is mandatory'),
                    scorecardQuestionId: Yup.string()
                        .required(
                            'ScorecardQuestionId is mandatory',
                        ),
                }),
        )
        .required('Reviews is mandatory'),
})

/**
 * validation schema for contact manager form
 */
export const formContactManagerSchema: Yup.ObjectSchema<FormContactManager>
    = Yup.object({
        category: Yup.string()
            .trim()
            .optional(),
        message: Yup.string()
            .trim()
            .required('Message is required.'),
    })
