import { UserRole } from '~/libs/core'

import { salesRoutes } from './sales.routes'

jest.mock('~/config', () => ({
    AppSubdomain: { sales: 'sales' },
    EnvironmentConfig: { SUBDOMAIN: 'platform-ui' },
    ToolTitle: { sales: 'Sales' },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    lazyLoad: () => (): JSX.Element => <div />,
    UserRole: { administrator: 'administrator', talentManager: 'Talent Manager' },
}), { virtual: true })

describe('Sales routes', () => {
    it('restricts combined-host and dedicated sales access to the two authorized roles', () => {
        expect(salesRoutes[0])
            .toMatchObject({
                authRequired: true,
                domain: 'sales',
                rolesRequired: [UserRole.administrator, UserRole.talentManager],
                route: '/sales',
            })
    })
})
