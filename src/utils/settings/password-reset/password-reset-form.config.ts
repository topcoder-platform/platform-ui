import { FormDefinition, validatorRequired } from '../../../lib'

export enum PasswordFieldName {
    confirmPassword = 'confirmPassword',
    currentPassword = 'password',
    newPassword = 'newPassword',
}

export const passwordFormDef: FormDefinition = {
    confirmPassword: {
        label: 'Confirm Password',
        name: PasswordFieldName.confirmPassword,
        placeholder: 're-type your new password',
        requiredIfField: PasswordFieldName.newPassword,
        tabIndex: 3,
        type: 'password',
        validators: [
            validatorRequired,
            // TODO: match validator
        ],
    },
    newPassword: {
        hint: 'At least 8 characters in length with lowercase, uppercase, and number(s)',
        label: 'New Password',
        name: PasswordFieldName.newPassword,
        placeholder: 'type your new password',
        tabIndex: 2,
        type: 'password',
        validators: [
            validatorRequired,
            // TODO: password validator
        ],
    },
    [PasswordFieldName.currentPassword]: {
        label: 'Current Password',
        name: PasswordFieldName.currentPassword,
        placeholder: 'type your current password',
        requiredIfField: PasswordFieldName.newPassword,
        tabIndex: 1,
        type: 'password',
        validators: [
            validatorRequired,
        ],
    },
}
