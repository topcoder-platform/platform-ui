import { validatorEmail, FormDefinition, validatorRequiredIfOther, validatorRequired } from '../../lib'

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
        requiredIfField: FieldNames.newPassword,
        type: 'password',
        validators: [
            validatorRequiredIfOther,
        ],
    },
    email: {
        label: 'Email',
        name: FieldNames.email,
        type: 'text',
        validators: [
            validatorRequired,
            validatorEmail,
        ],
    },
    firstName: {
        label: 'First Name',
        name: FieldNames.firstName,
        type: 'text',
        validators: [
            validatorRequired,
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
            validatorRequired,
        ],
    },
    newPassword: {
        dependentFields: [
            FieldNames.confirmPassword,
            FieldNames.currentPassword,
        ],
        hint: 'At least 8 characters in length with lowercase, uppercase, and number(s)',
        label: 'New Password',
        name: FieldNames.newPassword,
        placeholder: 'type your new password',
        type: 'password',
        validators: [],
    },
    [FieldNames.currentPassword]: {
        label: 'Current Password',
        name: FieldNames.currentPassword,
        placeholder: 'type your current password',
        requiredIfField: FieldNames.newPassword,
        type: 'password',
        validators: [
            validatorRequiredIfOther,
        ],
    },
}
