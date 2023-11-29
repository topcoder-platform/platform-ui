import { find } from 'lodash'

import { customValidatorRequired, FormDefinition, InputValue } from '~/libs/ui'

import { StandardizedSkillCategory } from '../../services'

export enum CategoryFormField {
    name = 'name',
    description = 'description',
}

type ValidatorType = (value: InputValue) => string | undefined

export const validateUniqueCategoryName = (
    categories: StandardizedSkillCategory[],
    category: StandardizedSkillCategory,
) => (
    (value: InputValue): string | undefined => {
        const match = find(categories, { name: value }) as StandardizedSkillCategory | undefined
        return match && match.id !== category.id
            ? 'A category with the same name already exists!' : undefined
    }
)

export const categoryFormDef = (
    onClose: () => void,
    nameValidator: ValidatorType,
    onArchive?: () => void,
): FormDefinition => ({
    buttons: {
        primaryGroup: [
            {
                buttonStyle: 'secondary',
                isSubmit: false,
                label: 'Cancel',
                onClick: onClose,
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
        secondaryGroup: onArchive ? [
            {
                buttonStyle: 'secondary',
                isSubmit: false,
                label: 'Archive',
                onClick: onArchive,
                size: 'lg',
                type: 'button',
                variant: 'danger',
            },
        ] : undefined,
    },
    groups: [
        {
            inputs: [
                {
                    label: 'Category Name',
                    name: CategoryFormField.name,
                    placeholder: 'Enter category name',
                    type: 'text',
                    validators: [
                        {
                            validator: customValidatorRequired('Category name is required!'),
                        },
                        {
                            validator: nameValidator,
                        },
                    ],
                },
                {
                    label: 'Description',
                    name: CategoryFormField.description,
                    type: 'textarea',
                    validators: [
                        {
                            validator: customValidatorRequired('Category description is required!'),
                        },
                    ],
                },
            ],
        },
    ],
    successMessage: false,
})
