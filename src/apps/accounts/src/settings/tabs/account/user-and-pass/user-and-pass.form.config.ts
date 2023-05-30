import { noop } from 'lodash'

import { FormDefinition, validatorRequired } from '~/libs/ui'

export const UserAndPassFromConfig: FormDefinition = {
    buttons: {
        primaryGroup: [],
        secondaryGroup: [
            {
                buttonStyle: 'secondary',
                label: 'Change Password',
                onClick: noop,
                type: 'submit',
            },
        ],
    },
    groups: [
        {
            inputs: [
                {
                    disabled: true,
                    label: 'Username',
                    name: 'handle',
                    type: 'text',
                },
                {
                    disabled: true,
                    label: 'Primary Email',
                    name: 'email',
                    type: 'text',
                },
                {
                    hideInlineErrors: true,
                    label: 'Current Password',
                    name: 'currentPassword',
                    placeholder: 'Type your current password',
                    type: 'password',
                    validators: [
                        {
                            validator: validatorRequired,
                        },
                    ],
                },
                {
                    hideInlineErrors: true,
                    label: 'New Password',
                    name: 'newPassword',
                    placeholder: 'Type your new password',
                    type: 'password',
                    validators: [
                        {
                            validator: validatorRequired,
                        },
                    ],
                },
                {
                    hideInlineErrors: true,
                    label: 'Re-Type New Password',
                    name: 'reTypeNewPassword',
                    placeholder: 'Re-Type New password',
                    type: 'password',
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
