import * as yup from 'yup'

import { PROJECT_STATUS } from '../constants'

export interface ProjectEditorSchemaData {
    billingAccountId?: string
    name: string
    description: string
    type?: string
    status?: string
    cancelReason?: string
    terms?: string
    groups?: string[]
}

export function createProjectEditorSchema(
    isEdit: boolean,
    canManage: boolean,
): yup.ObjectSchema<ProjectEditorSchemaData> {
    return yup
        .object({
            billingAccountId: yup
                .string()
                .when([], {
                    is: () => !isEdit,
                    otherwise: schema => schema.optional(),
                    then: schema => schema.required('Billing account is required'),
                }),
            cancelReason: yup
                .string()
                .when('status', {
                    is: PROJECT_STATUS.CANCELLED,
                    otherwise: schema => schema.optional(),
                    then: schema => schema.required('Cancel reason is required'),
                }),
            description: yup
                .string()
                .required('Description is required'),
            groups: yup
                .array()
                .of(yup.string()
                    .required())
                .optional(),
            name: yup
                .string()
                .max(255, 'Project name must be less than 255 characters')
                .required('Project name is required'),
            status: yup
                .string()
                .when([], {
                    is: () => isEdit && canManage,
                    otherwise: schema => schema.optional(),
                    then: schema => schema.required('Project status is required'),
                }),
            terms: yup
                .string()
                .optional(),
            type: yup
                .string()
                .when([], {
                    is: () => !isEdit,
                    otherwise: schema => schema.optional(),
                    then: schema => schema.required('Project type is required'),
                }),
        })
        .required()
}
