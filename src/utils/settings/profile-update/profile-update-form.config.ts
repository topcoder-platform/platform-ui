import { FormDefinition, validatorEmail, validatorRequired } from '../../../lib'

export enum ProfileFieldName {
    email = 'email',
    firstName = 'firstName',
    handle = 'handle',
    lastName = 'lastName',
}

export const profileFormDef: FormDefinition = {
    email: {
        label: 'Email',
        name: ProfileFieldName.email,
        tabIndex: 3,
        type: 'text',
        validators: [
            validatorRequired,
            validatorEmail,
        ],
    },
    firstName: {
        label: 'First Name',
        name: ProfileFieldName.firstName,
        tabIndex: 1,
        type: 'text',
        validators: [
            validatorRequired,
        ],
    },
    handle: {
        disabled: true,
        label: 'Username',
        name: ProfileFieldName.handle,
        tabIndex: -1,
        type: 'text',
        validators: [],
    },
    lastName: {
        label: 'Last Name',
        name: ProfileFieldName.lastName,
        tabIndex: 2,
        type: 'text',
        validators: [
            validatorRequired,
        ],
    },
}
