import * as yup from 'yup'

import { PROJECT_STATUS } from '../constants'
import { ProjectMetadata } from '../models/Project.model'

import { projectMetadataSchemaFields } from './project-metadata.schema'

export interface ProjectEditorSchemaData extends ProjectMetadata {
    billingAccountId?: string
    name: string
    description: string
    displayMemberPaymentDetailsToCopilots?: boolean
    type?: string
    status?: string
    cancelReason?: string
    terms?: string
    groups?: string[]
}

/**
 * Validates project edits and creation, including optional shared showcase metadata.
 * @param isEdit Whether an existing project is being edited.
 * @param canManage Whether the user can change project status.
 * @returns The project form schema; validation rejects invalid or missing required values.
 * @throws Does not throw when constructing the schema.
 */
export function createProjectEditorSchema(
    isEdit: boolean,
    canManage: boolean,
): yup.ObjectSchema<ProjectEditorSchemaData> {
    return yup
        .object({
            ...projectMetadataSchemaFields(false),
            billingAccountId: yup
                .string()
                .optional(),
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
            displayMemberPaymentDetailsToCopilots: yup
                .boolean()
                .optional(),
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
