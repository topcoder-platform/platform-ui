import { FormDefinition, validatorEmail, validatorRequired } from '../../../lib'

export const profileFormTitle: string = 'Profile'

export enum ProfileFieldName {
    email = 'email',
    firstName = 'firstName',
    handle = 'handle',
    lastName = 'lastName',
}

export const profileFormDef: FormDefinition = {
    buttons: [
        {
            buttonStyle: 'secondary',
            isSave: true,
            label: 'Save',
            size: 'xl',
            type: 'submit',
        },
    ],
    inputs: [
        {
            label: 'First Name',
            name: ProfileFieldName.firstName,
            type: 'text',
            validateOnChange: [
                validatorRequired,
            ],
        },
        {
            label: 'Last Name',
            name: ProfileFieldName.lastName,
            type: 'text',
            validateOnChange: [
                validatorRequired,
            ],
        },
        {
            label: 'Email',
            name: ProfileFieldName.email,
            type: 'text',
            validateOnChange: [
                validatorRequired,
                validatorEmail,
            ],
        },
        {
            disabled: true,
            label: 'Username',
            name: ProfileFieldName.handle,
            notTabbable: true,
            type: 'text',
        },
    ],
    title: profileFormTitle,
}
