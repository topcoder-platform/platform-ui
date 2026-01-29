import * as yup from 'yup'

export const feedbackFormSchema = yup.object({
    feedbackText: yup
        .string()
        .trim()
        .required('Feedback is required')
        .max(2000, 'Feedback must be 2000 characters or less'),
    rating: yup
        .number()
        .min(1, 'Rating must be between 1 and 5')
        .max(5, 'Rating must be between 1 and 5')
        .optional(),
})
