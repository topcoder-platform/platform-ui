import { FormDefinition, validatorEmail, validatorRequired } from '~/libs/ui'

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
        },
    ],
    successMessage: 'Your request has been submitted.',
}

export const contactSupportPath: string = '/support'
