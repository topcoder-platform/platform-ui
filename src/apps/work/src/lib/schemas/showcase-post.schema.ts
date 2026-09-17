import * as yup from 'yup'

import { SHOWCASE_CURRENT_STATUS_VALUES, SHOWCASE_TYPE_VALUES } from '../constants/showcase.constants'

import { projectMetadataSchemaFields } from './project-metadata.schema'

export const showcasePostSchema = yup.object({
    ...projectMetadataSchemaFields(true),
    categoryIds: yup.array()
        .of(yup.string())
        .min(1, 'Select at least one category.'),
    content: yup.string()
        .trim()
        .required('The Solution is required.'),
    currentStatus: yup.string()
        .oneOf([...SHOWCASE_CURRENT_STATUS_VALUES, '']),
    industryIds: yup.array()
        .of(yup.string())
        .min(1, 'Select at least one industry.'),
    keyWin: yup.string()
        .trim()
        .max(255),
    owner: yup.string()
        .trim()
        .max(255),
    title: yup.string()
        .trim()
        .required('Title is required.'),
    type: yup.string()
        .oneOf(SHOWCASE_TYPE_VALUES)
        .required('Type is required.'),
})
