import { FormDefinition, IconOutline, validatorRequired } from '../../../../../lib'
import { GamificationConfig } from '../../../game-config'

export enum CreateBadgeFormField {
    badgeActive = 'badgeActive',
    badgeName = 'badgeName',
    badgeDesc = 'badgeDesc',
    file = 'file',
}

export const createBadgeFormDef: FormDefinition = {
    buttons: {
        primaryGroup: [
            {
                buttonStyle: 'primary',
                isSubmit: true,
                label: 'Save Badge',
                onClick: (e) => { },
                size: 'lg',
                type: 'submit',
            },
        ],
        secondaryGroup: [
            {
                buttonStyle: 'icon-bordered',
                icon: IconOutline.ChevronLeftIcon,
                route: '/gamification-admin',
                size: 'lg',
            },
        ],
    },
    groups: [
        {
            inputs: [
                {
                    accept: GamificationConfig.ACCEPTED_BADGE_MIME_TYPES,
                    name: CreateBadgeFormField.file,
                    size: GamificationConfig.MAX_BADGE_IMAGE_FILE_SIZE,
                    type: 'image-picker',
                    // validators: [
                    //     {
                    //         validator: validatorRequired,
                    //     },
                    // ],
                },
                {
                    checked: true,
                    label: 'Activate Badge',
                    name: CreateBadgeFormField.badgeActive,
                    type: 'checkbox',
                },
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
            ],
        },
    ],
}
