import { FormDefinition, validatorEmail, validatorRequired } from '../form'

export enum ContactSupportFormField {
    email = 'email',
    first = 'firstName',
    last = 'lastName',
    question = 'question',
}

export const contactSupportFormDef: FormDefinition = {
    buttons: {
        primaryGroup: [
            {
                buttonStyle: 'secondary',
                isSave: true,
                label: 'Submit',
                size: 'lg',
                type: 'submit',
            },
        ],
    },
    groups: [
        {
            fields: [
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
            ],
        },
        {
            fields: [
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
            ],
        },
        {
            fields: [
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
            ],
        },
        {
            fields: [
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
        },
    ],
    successMessage: 'Your request has been submitted.',
}
