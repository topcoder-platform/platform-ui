import { FormDefinition, FormInputTypes, validatorEmail, validatorRequired } from '../form'
import { FormFieldType } from '../form/form-field.model'

export enum ContactSupportFormField {
    email = 'email',
    first = 'firstName',
    last = 'lastName',
    question = 'question',
}

export const contactSupportFormDef: FormDefinition = {
    elements: [
        {
            field: {
                isStatic: false,
                label: 'First Name',
                name: ContactSupportFormField.first,
                type: FormInputTypes.text,
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
                isStatic: false,
                label: 'Last Name',
                name: ContactSupportFormField.last,
                type: FormInputTypes.text,
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
                isStatic: false,
                label: 'Email',
                name: ContactSupportFormField.email,
                type: FormInputTypes.text,
                validators: [
                    {
                        validator: validatorEmail,
                    },
                    {
                        validator: validatorRequired,
                    },
                ],
            },
            type: FormFieldType.field,
        },
        {
            field: {
                isStatic: false,
                label: 'How can we help you?',
                name: ContactSupportFormField.question,
                type: FormInputTypes.textarea,
                validators: [
                    {
                        validator: validatorRequired,
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
            label: 'Submit',
            size: 'lg',
            type: 'submit',
        },
    ],
    successMessage: 'Your request has been submitted.',
}
