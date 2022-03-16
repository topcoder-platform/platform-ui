import { emailValidator, FormDefinition, requiredValidator } from '../../lib'

export enum FieldNames {
    confirmPassword = 'confirmPassword',
    currentPassword = 'password',
    email = 'email',
    firstName = 'firstName',
    handle = 'handle',
    lastName = 'lastName',
    newPassword = 'newPassword',
}

export const profileFormDef: FormDefinition = {
    confirmPassword: {
        label: 'Confirm Password',
        name: FieldNames.confirmPassword,
        placeholder: 're-type your new password',
        type: 'password',
        validators: [],
    },
    email: {
        label: 'Email',
        name: FieldNames.email,
        type: 'text',
        validators: [
            requiredValidator,
            emailValidator,
        ],
    },
    firstName: {
        label: 'First Name',
        name: FieldNames.firstName,
        type: 'text',
        validators: [
            requiredValidator,
        ],
    },
    handle: {
        disabled: true,
        label: 'Username',
        name: FieldNames.handle,
        type: 'text',
        validators: [],
    },
    lastName: {
        label: 'Last Name',
        name: FieldNames.lastName,
        type: 'text',
        validators: [
            requiredValidator,
        ],
    },
    newPassword: {
        label: 'Password',
        name: FieldNames.newPassword,
        placeholder: 'type your new password',
        type: 'password',
        validators: [],
    },
    password: {
        label: 'Current Password',
        name: FieldNames.currentPassword,
        placeholder: 'type your current password',
        type: 'password',
        validators: [],
    },
}
