import { emailValidator, FormDefinition, requiredIfOtherValidator, requiredValidator } from '../../lib'

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
            requiredIfOtherValidator,
        ],
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
        dependentFields: [
            FieldNames.confirmPassword,
            FieldNames.currentPassword,
        ],
        label: 'New Password',
        name: FieldNames.newPassword,
        placeholder: 'type your new password',
        type: 'password',
        validators: [],
    },
    password: {
        label: 'Current Password',
        name: FieldNames.currentPassword,
        placeholder: 'type your current password',
        requiredIfField: FieldNames.newPassword,
        type: 'password',
        validators: [
            requiredIfOtherValidator,
        ],
    },
}
