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
            label: 'Save',
            order: 1,
            size: 'xl',
            tabIndex: 4,
            type: 'submit',
        },
    ],
    inputs: [
        {
            label: 'Email',
            name: ProfileFieldName.email,
            order: 3,
            tabIndex: 3,
            type: 'text',
            validators: [
                validatorRequired,
                validatorEmail,
            ],
        },
        {
            label: 'First Name',
            name: ProfileFieldName.firstName,
            order: 1,
            tabIndex: 1,
            type: 'text',
            validators: [
                validatorRequired,
            ],
        },
        {
            disabled: true,
            label: 'Username',
            name: ProfileFieldName.handle,
            order: 4,
            tabIndex: -1,
            type: 'text',
            validators: [],
        },
        {
            label: 'Last Name',
            name: ProfileFieldName.lastName,
            order: 2,
            tabIndex: 2,
            type: 'text',
            validators: [
                validatorRequired,
            ],
        },
    ],
    title: profileFormTitle,
}
