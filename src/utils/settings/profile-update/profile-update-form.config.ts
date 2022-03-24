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
            validators: [
                validatorRequired,
            ],
        },
        {
            label: 'Last Name',
            name: ProfileFieldName.lastName,
            type: 'text',
            validators: [
                validatorRequired,
            ],
        },
        {
            label: 'Email',
            name: ProfileFieldName.email,
            type: 'text',
            validators: [
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
            validators: [],
        },
    ],
    title: profileFormTitle,
}
