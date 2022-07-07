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
import { FormFieldType } from '../../../../lib/form/form-field.model'

export const changePasswordFormTitle: string = 'Change Password'

export enum ChangePasswordFieldName {
    confirmPassword = 'confirmPassword',
    currentPassword = 'password',
    newPassword = 'newPassword',
}

export const changePasswordFormDef: FormDefinition = {
    elements: [
        {
            field: {
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
            type: FormFieldType.field,
        },
        {
            field: {
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
            type: FormFieldType.field,
        },
        {
            field: {
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
            type: FormFieldType.field,
        },
    ],
    rightButtons: [
        {
            buttonStyle: 'secondary',
            isSave: true,
            label: 'Change password',
            size: 'xl',
            type: 'submit',
        },
    ],
    shortName: 'Password',
    tabIndexStart: 3,
    title: changePasswordFormTitle,
}
