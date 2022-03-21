import { PlatformRoute } from '../../lib'

import { passwordFormTitle, PasswordReset } from './password-reset'
import { profileFormTitle, ProfileUpdate } from './profile-update'
import Settings, { utilTitle } from './Settings'

export enum SettingsPath {
    password = 'password',
    settings = '/settings',
}

export const settingsRoutes: Array<PlatformRoute> = [
    {
        children: [
            {
                children: [],
                element: <ProfileUpdate passwordPath={SettingsPath.password} />,
                enabled: true,
                route: '',
                title: profileFormTitle,
            },
            {
                children: [],
                element: <PasswordReset profilePath={SettingsPath.settings} />,
                enabled: true,
                route: SettingsPath.password,
                title: passwordFormTitle,
            },
        ],
        element: <Settings />,
        enabled: true,
        route: SettingsPath.settings,
        title: utilTitle,
    },
]
