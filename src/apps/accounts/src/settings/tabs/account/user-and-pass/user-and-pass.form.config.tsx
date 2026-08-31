import { MouseEvent } from 'react'
import { noop } from 'lodash'

import { Button, FormDefinition, validatorRequired } from '~/libs/ui'

import PasswordTips from './password-tips'
import styles from './UserAndPassword.module.scss'

/**
 * Builds the username/password form and attaches the email-change action.
 *
 * @param onChangeEmail callback that starts current-email ownership verification.
 * @param isChangeEmailLoading whether the ownership-code request is in progress.
 * @returns the account form definition used by the shared Form component.
 */
export function createUserAndPassFormConfig(
    onChangeEmail: () => void,
    isChangeEmailLoading: boolean,
): FormDefinition {
    return {
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
                        actionElement: (
                            <Button
                                className={styles.changeEmailLink}
                                label='Change Email'
                                link
                                loading={isChangeEmailLoading}
                                noCaps
                                disabled={isChangeEmailLoading}
                                onClick={function handleChangeEmailClick(
                                    event: MouseEvent<HTMLButtonElement>,
                                ): void {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    onChangeEmail()
                                }}
                            />
                        ),
                        label: 'Primary Email',
                        name: 'email',
                        readonly: true,
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
                        tooltip: {
                            className: 'passTooltip',
                            content: <PasswordTips
                                infoText='Your password must have:'
                                tips={[
                                    { text: 'At least 8 characters', valid: true },
                                    { text: 'At least one letter', valid: true },
                                    { text: 'At least one number or symbol', valid: true },
                                    { text: 'Should not be the same as old password', valid: true },
                                ]}
                            />,
                            place: 'bottom',
                        },
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
                        tooltip: {
                            className: 'passTooltip',
                            content: <PasswordTips
                                infoText='Your Re-typed password must:'
                                tips={[
                                    { text: 'Match the new password entered', valid: true },
                                ]}
                            />,
                            place: 'bottom',
                        },
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
}
