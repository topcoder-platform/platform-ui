import { FormDefinition, InputSelectOption, validatorRequired } from '~/libs/ui'

import { StandardizedSkillCategory } from '../../services'

export enum SkillFormField {
    category = 'categoryId',
    description = 'description',
    name = 'name',
}

const mapCategoryToSelectOption = (categories: StandardizedSkillCategory[]): InputSelectOption[] => (
    categories.map(c => ({ label: c.name, value: c.id }))
)

export const skillFormDef = (
    onCancelClick: () => void,
    categories?: StandardizedSkillCategory[],
): FormDefinition => ({
    buttons: {
        primaryGroup: [
            {
                buttonStyle: 'secondary',
                isSubmit: false,
                label: 'Cancel',
                onClick: onCancelClick,
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
                    label: 'Skill Name',
                    name: SkillFormField.name,
                    placeholder: 'Enter skill name',
                    type: 'text',
                    validators: [
                        {
                            validator: validatorRequired,
                        },
                    ],
                },
                {
                    label: 'Description',
                    name: SkillFormField.description,
                    type: 'textarea',
                    validators: [
                        {
                            validator: validatorRequired,
                        },
                    ],
                },
                {
                    label: 'Skill Category',
                    name: SkillFormField.category,
                    options: mapCategoryToSelectOption(categories ?? []),
                    placeholder: 'Select category',
                    type: 'select',
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
} as FormDefinition)
