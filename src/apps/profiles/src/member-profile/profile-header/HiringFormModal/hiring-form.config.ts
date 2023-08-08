import { FormDefinition, validatorEmail, validatorPhone, validatorRequired } from '~/libs/ui'

export enum HiringFormField {
    email = 'email',
    first = 'firstName',
    last = 'lastName',
    phone = 'phone',
    company = 'company',
}

export const hiringFormDef: FormDefinition = {
    buttons: {
        primaryGroup: [
            {
                buttonStyle: 'primary',
                isSubmit: true,
                label: 'Send',
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
                    name: HiringFormField.first,
                    type: 'text',
                    validators: [
                        {
                            validator: validatorRequired,
                        },
                    ],
                },
                {
                    label: 'Last Name',
                    name: HiringFormField.last,
                    type: 'text',
                    validators: [
                        {
                            validator: validatorRequired,
                        },
                    ],
                },
                {
                    label: 'Email',
                    name: HiringFormField.email,
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
                    label: 'Phone',
                    name: HiringFormField.phone,
                    type: 'text',
                    validators: [
                        {
                            validator: validatorPhone,
                        },
                        {
                            validator: validatorRequired,
                        },
                    ],
                },
                {
                    label: 'Company',
                    name: HiringFormField.company,
                    type: 'text',
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
