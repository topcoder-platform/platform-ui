import { FormDefinition, validatorEmail, validatorRequired, validatorRequiredIfOther } from '../../lib'

export enum FieldName {
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
        name: FieldName.confirmPassword,
        placeholder: 're-type your new password',
        requiredIfField: FieldName.newPassword,
        type: 'password',
        validators: [
            validatorRequiredIfOther,
        ],
    },
    email: {
        label: 'Email',
        name: FieldName.email,
        type: 'text',
        validators: [
            validatorRequired,
            validatorEmail,
        ],
    },
    firstName: {
        label: 'First Name',
        name: FieldName.firstName,
        type: 'text',
        validators: [
            validatorRequired,
        ],
    },
    handle: {
        disabled: true,
        label: 'Username',
        name: FieldName.handle,
        type: 'text',
        validators: [],
    },
    lastName: {
        label: 'Last Name',
        name: FieldName.lastName,
        type: 'text',
        validators: [
            validatorRequired,
        ],
    },
    newPassword: {
        dependentFields: [
            FieldName.confirmPassword,
            FieldName.currentPassword,
        ],
        hint: 'At least 8 characters in length with lowercase, uppercase, and number(s)',
        label: 'New Password',
        name: FieldName.newPassword,
        placeholder: 'type your new password',
        type: 'password',
        validators: [],
    },
    [FieldName.currentPassword]: {
        label: 'Current Password',
        name: FieldName.currentPassword,
        placeholder: 'type your current password',
        requiredIfField: FieldName.newPassword,
        type: 'password',
        validators: [
            validatorRequiredIfOther,
        ],
    },
}
