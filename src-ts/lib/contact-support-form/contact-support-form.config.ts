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
                isSubmit: true,
                label: 'Submit',
                size: 'lg',
                type: 'submit',
            },
        ],
    },
    groups: [
        {
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
            ],
        },
        {
            inputs: [
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
            inputs: [
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
            inputs: [
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
