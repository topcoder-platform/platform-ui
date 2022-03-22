import {
    FormDefinition,
    validatorDoesNotMatchOther,
    validatorMatchOther,
    validatorPassword,
    validatorRequired,
} from '../../../lib'

export enum PasswordFieldName {
    confirmPassword = 'confirmPassword',
    currentPassword = 'password',
    newPassword = 'newPassword',
}

export const passwordFormDef: FormDefinition = {
    confirmPassword: {
        dependentField: PasswordFieldName.newPassword,
        label: 'Confirm Password',
        name: PasswordFieldName.confirmPassword,
        placeholder: 're-type your new password',
        tabIndex: 3,
        type: 'password',
        validators: [
            validatorRequired,
            validatorMatchOther,
        ],
    },
    newPassword: {
        dependentField: PasswordFieldName.currentPassword,
        label: 'New Password',
        name: PasswordFieldName.newPassword,
        placeholder: 'type your new password',
        tabIndex: 2,
        type: 'password',
        validators: [
            validatorRequired,
            validatorDoesNotMatchOther,
            validatorPassword,
        ],
    },
    [PasswordFieldName.currentPassword]: {
        label: 'Current Password',
        name: PasswordFieldName.currentPassword,
        placeholder: 'type your current password',
        tabIndex: 1,
        type: 'password',
        validators: [
            validatorRequired,
        ],
    },
}
