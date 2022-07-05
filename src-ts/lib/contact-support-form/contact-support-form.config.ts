import { FormDefinition, validatorEmail, validatorRequired } from '../form'

export enum ContactSupportFormField {
    email = 'email',
    first = 'firstName',
    last = 'lastName',
    question = 'question',
}

export const contactSupportFormDef: FormDefinition = {
    rightButtons: [
        {
            buttonStyle: 'secondary',
            isSave: true,
            label: 'Submit',
            size: 'lg',
            type: 'submit',
        },
    ],
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
    inputs: [
        {
            label: 'First Name',
            name: ContactSupportFormField.first,
            type: 'text',
            validators: [
                {
                    validator: validatorRequired,
                },
            ],
        },
        {
            label: 'Last Name',
            name: ContactSupportFormField.last,
            type: 'text',
            validators: [
                {
                    validator: validatorRequired,
                },
            ],
        },
        {
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
        {
            label: 'How can we help you?',
            name: ContactSupportFormField.question,
            type: 'textarea',
            validators: [
                {
                    validator: validatorRequired,
                },
            ],
        },
    ],
    successMessage: 'Your request has been submitted.',
}
