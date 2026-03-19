import * as yup from 'yup'

export interface GroupsFormSchemaData {
    groupDescription: string
    groupName: string
    privateGroup: boolean
    selfRegister: boolean
}

export const groupsFormSchema: yup.ObjectSchema<GroupsFormSchemaData> = yup
    .object({
        groupDescription: yup
            .string()
            .trim()
            .min(1, 'Description is required')
            .required('Description is required'),
        groupName: yup
            .string()
            .trim()
            .max(255, 'Group name must be 255 characters or less')
            .min(1, 'Group name is required')
            .required('Group name is required'),
        privateGroup: yup
            .boolean()
            .default(true),
        selfRegister: yup
            .boolean()
            .default(false),
    })
    .required()
