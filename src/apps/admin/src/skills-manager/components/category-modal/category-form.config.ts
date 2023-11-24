import { FormDefinition, validatorRequired } from '~/libs/ui'

export enum CategoryFormField {
    name = 'name',
    description = 'description',
}

export const categoryFormDef: FormDefinition = {
    buttons: {
        primaryGroup: [
            {
                buttonStyle: 'secondary',
                isSubmit: false,
                label: 'Cancel',
                size: 'lg',
                type: 'button',
            },
            {
                buttonStyle: 'primary',
                isSubmit: true,
                label: 'Save',
                size: 'lg',
                type: 'submit',
            },
        ],
    },
    groups: [
        {
            inputs: [
                {
                    label: 'Name',
                    name: CategoryFormField.name,
                    placeholder: 'Enter category name',
                    type: 'text',
                    validators: [
                        {
                            validator: validatorRequired,
                        },
                    ],
                },
                {
                    label: 'Description',
                    name: CategoryFormField.description,
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
    successMessage: false,
}
