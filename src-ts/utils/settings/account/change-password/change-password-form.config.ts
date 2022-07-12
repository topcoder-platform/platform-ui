import {
    FormDefinition,
    FormInputAutocompleteOption,
    FormInputTypes,
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
        left: [],
        right: [
            {
                buttonStyle: 'secondary',
                isSave: true,
                label: 'Change password',
                size: 'xl',
                type: 'submit',
            },
        ],
    },
    groups: [
        {
            fields: [
                {
                    autocomplete: FormInputAutocompleteOption.current,
                    dependentFields: [
                        ChangePasswordFieldName.newPassword,
                    ],
                    label: 'Current Password',
                    name: ChangePasswordFieldName.currentPassword,
                    placeholder: 'Enter your current password',
                    type: FormInputTypes.password,
                    validators: [
                        {
                            validator: validatorRequired,
                        },
                    ],
                },
            ],
        },
        {
            fields: [
                {
                    autocomplete: FormInputAutocompleteOption.new,
                    dependentFields: [
                        ChangePasswordFieldName.confirmPassword,
                        ChangePasswordFieldName.currentPassword,
                    ],
                    label: 'New Password',
                    name: ChangePasswordFieldName.newPassword,
                    placeholder: 'Enter your new password',
                    type: FormInputTypes.password,
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
            ],
        },
        {
            fields: [
                {
                    autocomplete: FormInputAutocompleteOption.off,
                    dependentFields: [
                         ChangePasswordFieldName.newPassword,
                    ],
                    label: 'Confirm Password',
                    name: ChangePasswordFieldName.confirmPassword,
                    placeholder: 'Re-enter your new password',
                    type: FormInputTypes.password,
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
