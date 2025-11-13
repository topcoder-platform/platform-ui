import * as Yup from 'yup'

import { FormAddDefaultReviewer, FormSearchDefaultReviewers } from '../models'

export const formSearchDefaultReviewersSchema: Yup.ObjectSchema<FormSearchDefaultReviewers>
    = Yup.object({
        phaseName: Yup.string()
            .optional(),
        scorecardId: Yup.string()
            .optional(),
        searchKey: Yup.string()
            .optional(),
        timelineTemplateId: Yup.string()
            .optional(),
        trackId: Yup.string()
            .optional(),
        typeId: Yup.string()
            .optional(),
    })

export const formAddDefaultReviewerSchema: Yup.ObjectSchema<FormAddDefaultReviewer>
    = Yup.object({
        aiWorkflowId: Yup.string()
            .optional(),
        baseCoefficient: Yup.number()
            .optional()
            .min(0, 'Must be non-negative')
            .transform((value, originalValue) => {
                if (typeof originalValue === 'string') {
                    // Replace comma with dot for decimal separator
                    const normalized = originalValue.replace(',', '.')
                    return parseFloat(normalized)
                }

                return value
            })
            .typeError('Please enter a valid number'),
        fixedAmount: Yup.number()
            .optional()
            .min(0, 'Must be non-negative'),
        incrementalCoefficient: Yup.number()
            .optional()
            .min(0, 'Must be non-negative'),
        isMemberReview: Yup.boolean()
            .required(),
        memberReviewerCount: Yup.number()
            .optional()
            .when('isMemberReview', {
                is: true,
                otherwise: schema => schema.optional(),
                then: schema => schema
                    .required('Member Reviewer Count is required when Is Member Review is checked')
                    .min(1, 'Must be at least 1'),
            }),
        opportunityType: Yup.string()
            .optional(),
        phaseId: Yup.string()
            .optional(),
        phaseName: Yup.string()
            .required('Phase Name is required'),
        scorecardId: Yup.string()
            .required('Scorecard is required'),
        shouldOpenOpportunity: Yup.boolean()
            .required(),
        timelineTemplateId: Yup.string()
            .optional(),
        trackId: Yup.string()
            .required('Challenge Track is required'),
        typeId: Yup.string()
            .required('Challenge Type is required'),
    })
