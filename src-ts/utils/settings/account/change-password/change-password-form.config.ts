import {
    FormDefinition,
    FormInputAutocompleteOption,
    validatorDoesNotMatchOther,
    validatorMatchOther,
    validatorPassword,
    validatorRequired,
    validatorRequiredIfOther,
} from '../../../../lib'

export const changePasswordFormTitle: string = 'Change Password'

export enum ChangePasswordFieldName {
    confirmPassword = 'confirmPassword',
    currentPassword = 'password',
    newPassword = 'newPassword',
}

export const changePasswordFormDef: FormDefinition = {
    buttons: {
        primaryGroup: [
            {
                buttonStyle: 'secondary',
                isSubmit: true,
                label: 'Change password',
                size: 'xl',
                type: 'submit',
            },
        ],
    },
    groups: [
        {
            inputs: [
                {
                    autocomplete: FormInputAutocompleteOption.current,
                    dependentFields: [
                        ChangePasswordFieldName.newPassword,
                    ],
                    label: 'Current Password',
                    name: ChangePasswordFieldName.currentPassword,
                    placeholder: 'Enter your current password',
                    type: 'password',
                    validators: [
                        {
                            validator: validatorRequired,
                        },
                    ],
                },
                {
                    autocomplete: FormInputAutocompleteOption.new,
                    dependentFields: [
                        ChangePasswordFieldName.confirmPassword,
                        ChangePasswordFieldName.currentPassword,
                    ],
                    label: 'New Password',
                    name: ChangePasswordFieldName.newPassword,
                    placeholder: 'Enter your new password',
                    type: 'password',
                    validators: [
                        {
                            validator: validatorRequired,
                        },
                        {
                            dependentField: ChangePasswordFieldName.currentPassword,
                            validator: validatorDoesNotMatchOther,
                        },
                        {
                            validator: validatorPassword,
                        },
                    ],
                },
                {
                    autocomplete: FormInputAutocompleteOption.off,
                    dependentFields: [
                        ChangePasswordFieldName.newPassword,
                    ],
                    label: 'Confirm Password',
                    name: ChangePasswordFieldName.confirmPassword,
                    placeholder: 'Re-enter your new password',
                    type: 'password',
                    validators: [
                        {
                            dependentField: ChangePasswordFieldName.newPassword,
                            validator: validatorRequiredIfOther,
                        },
                        {
                            dependentField: ChangePasswordFieldName.newPassword,
                            validator: validatorMatchOther,
                        },
                    ],
                },
            ],
        },
    ],
    shortName: 'Password',
    tabIndexStart: 3,
    title: changePasswordFormTitle,
}
