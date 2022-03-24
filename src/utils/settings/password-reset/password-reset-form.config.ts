import {
    FormDefinition,
    validatorDoesNotMatchOther,
    validatorMatchOther,
    validatorPassword,
    validatorRequired,
} from '../../../lib'

export const passwordFormTitle: string = 'Reset Password'

export enum PasswordFieldName {
    confirmPassword = 'confirmPassword',
    currentPassword = 'password',
    newPassword = 'newPassword',
}

export const passwordFormDef: FormDefinition = {
    buttons: [
        {
            buttonStyle: 'tertiary',
            isReset: true,
            label: 'Back',
            order: 1,
            route: '', // TODO
            size: 'xl',
            tabIndex: - 1,
        },
        {
            buttonStyle: 'secondary',
            label: 'Save',
            order: 2,
            size: 'xl',
            tabIndex: 4,
            type: 'submit',
        },
    ],
    inputs: [
        {
            dependentField: PasswordFieldName.newPassword,
            label: 'Confirm Password',
            name: PasswordFieldName.confirmPassword,
            order: 3,
            placeholder: 're-type your new password',
            tabIndex: 3,
            type: 'password',
            validators: [
                validatorRequired,
                validatorMatchOther,
            ],
        },
        {
            dependentField: PasswordFieldName.currentPassword,
            label: 'New Password',
            name: PasswordFieldName.newPassword,
            order: 2,
            placeholder: 'type your new password',
            tabIndex: 2,
            type: 'password',
            validators: [
                validatorRequired,
                validatorDoesNotMatchOther,
                validatorPassword,
            ],
        },
        {
            label: 'Current Password',
            name: PasswordFieldName.currentPassword,
            order: 1,
            placeholder: 'type your current password',
            tabIndex: 1,
            type: 'password',
            validators: [
                validatorRequired,
            ],
        },
    ],
    title: passwordFormTitle,
}
