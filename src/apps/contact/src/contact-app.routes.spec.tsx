import { UserRole } from '~/libs/core'

import { contactRoutes } from './contact-app.routes'

jest.mock('~/config', () => ({
    AppSubdomain: { contact: 'contact' },
    EnvironmentConfig: { SUBDOMAIN: 'contact' },
    ToolTitle: { contact: 'Contact' },
}), { virtual: true })
jest.mock('~/libs/core', () => ({
    lazyLoad: () => function LazyContact(): JSX.Element {
        return <div />
    },
    UserRole: { administrator: 'administrator' },
}), { virtual: true })

describe('Contact administrative route', () => {
    it('requires an authenticated administrator on the dedicated contact host', () => {
        expect(contactRoutes)
            .toHaveLength(1)
        expect(contactRoutes[0])
            .toMatchObject({
                authRequired: true,
                domain: 'contact',
                rolesRequired: [UserRole.administrator],
                route: '',
            })
    })
})
