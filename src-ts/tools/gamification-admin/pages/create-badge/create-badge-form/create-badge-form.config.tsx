import { FormDefinition, validatorRequired, IconOutline, RadioButton } from '../../../../../lib'

export enum CreateBadgeFormField {
    badgeActive = 'badgeActive',
    badgeName = 'badgeName',
    badgeDesc = 'badgeDesc',
}

export const createBadgeFormDef: FormDefinition = {
    buttons: {
        primaryGroup: [
            {
                buttonStyle: 'primary',
                isSubmit: true,
                label: 'Save Badge',
                size: 'lg',
                type: 'submit',
            },
        ],
        secondaryGroup: [
            {
                buttonStyle: 'icon-bordered',
                size: 'lg',
                icon: IconOutline.ChevronLeftIcon,
                route: `/gamification-admin`
                
            },
        ]
    },
    groups: [
        {
            inputs: [
                {
                    label: 'Badge Name',
                    name: CreateBadgeFormField.badgeName,
                    type: 'text',
                    validators: [
                        {
                            validator: validatorRequired,
                        },
                    ],
                },
                {
                    label: 'Badge Description',
                    name: CreateBadgeFormField.badgeDesc,
                    type: 'textarea',
                    validators: [
                        {
                            validator: validatorRequired,
                        },
                    ],
                },
                {
                    label: 'Activate',
                    name: CreateBadgeFormField.badgeActive,
                    type: 'checkbox',
                    validators: [
                        {
                            validator: validatorRequired,
                        },
                    ],
                }
            ],
        },
    ],
}
