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
            notTabble: true,
            size: 'xl',
        },
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
            label: 'Current Password',
            name: PasswordFieldName.currentPassword,
            placeholder: 'type your current password',
            type: 'password',
            validateOnChange: [
                validatorRequired,
            ],
        },
        {
            dependentField: PasswordFieldName.currentPassword,
            label: 'New Password',
            name: PasswordFieldName.newPassword,
            placeholder: 'type your new password',
            type: 'password',
            validateOnChange: [
                validatorRequired,
                validatorDoesNotMatchOther,
                validatorPassword,
            ],
        },
        {
            dependentField: PasswordFieldName.newPassword,
            label: 'Confirm Password',
            name: PasswordFieldName.confirmPassword,
            placeholder: 're-type your new password',
            type: 'password',
            validateOnChange: [
                validatorRequired,
                validatorMatchOther,
            ],
        },
    ],
    title: passwordFormTitle,
}
