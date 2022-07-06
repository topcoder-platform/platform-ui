import { FormDefinition, validatorEmail, validatorRequired } from '../form'

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
                label: 'First Name',
                name: ContactSupportFormField.first,
                type: 'text',
                validators: [
                    {
                        validator: validatorRequired,
                    },
                ],
            },
            type: 'field',
        },
        {
            field: {
                label: 'Last Name',
                name: ContactSupportFormField.last,
                type: 'text',
                validators: [
                    {
                        validator: validatorRequired,
                    },
                ],
            },
            type: 'field',
        },
        {
            field: {
                label: 'Email',
                name: ContactSupportFormField.email,
                type: 'text',
                validators: [
                    {
                        validator: validatorEmail,
                    },
                    {
                        validator: validatorRequired,
                    },
                ],
            },
            type: 'field',
        },
        {
            field: {
                label: 'How can we help you?',
                name: ContactSupportFormField.question,
                type: 'textarea',
                validators: [
                    {
                        validator: validatorRequired,
                    },
                ],
            },
            type: 'field',
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
