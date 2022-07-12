import { FormDefinition, FormInputTypes, validatorEmail, validatorRequired } from '../form'

export enum ContactSupportFormField {
    email = 'email',
    first = 'firstName',
    last = 'lastName',
    question = 'question',
}

export const contactSupportFormDef: FormDefinition = {
    buttons: {
        left: [],
        right: [
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
                    type: FormInputTypes.text,
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
                    type: FormInputTypes.text,
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
            ],
        },
        {
            fields: [
                {
                    label: 'How can we help you?',
                    name: ContactSupportFormField.question,
                    type: FormInputTypes.textarea,
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
