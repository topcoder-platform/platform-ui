import { noop } from 'lodash'

import { FormDefinition, IconOutline, validatorRequired } from '~/libs/ui'

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
                onClick: noop,
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
                    fileConfig: {
                        acceptFileType: GamificationConfig.ACCEPTED_BADGE_MIME_TYPES,
                        maxFileSize: GamificationConfig.MAX_BADGE_IMAGE_FILE_SIZE,
                    },
                    name: CreateBadgeFormField.file,
                    type: 'image-picker',
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
                    label: 'Badge Name',
                    name: CreateBadgeFormField.badgeName,
                    placeholder: 'Enter badge name',
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
                    placeholder: 'Enter badge description, details, how to get awarded info',
                    type: 'textarea',
                    validators: [
                        {
                            validator: validatorRequired,
                        },
                    ],
                },
                {
                    checked: true,
                    label: 'Activate Badge',
                    name: CreateBadgeFormField.badgeActive,
                    type: 'checkbox',
                },
            ],
        },
    ],
    groupsOptions: {
        groupWrapStyles: {
            gridTemplateColumns: '160px 1fr',
        },
        renderGroupDividers: false,
    },
}
