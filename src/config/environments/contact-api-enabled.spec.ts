const originalEnv = process.env

describe('CONTACT_API_ENABLED', () => {
    beforeEach(() => {
        process.env = { ...originalEnv }
        delete process.env.REACT_APP_CONTACT_API_ENABLED
    })

    afterEach(() => {
        process.env = originalEnv
    })

    it.each([
        ['dev', undefined, true],
        ['qa', undefined, true],
        ['prod', undefined, false],
        ['prod', '', false],
        ['prod', 'true', true],
        ['prod', 'false', false],
        ['dev', 'false', false],
    ])('uses %s with override %s to set the flag to %s', (env, override, expected) => {
        process.env.REACT_APP_HOST_ENV = env as string
        if (override !== undefined) {
            process.env.REACT_APP_CONTACT_API_ENABLED = override as string
        }

        jest.isolateModules(() => {
            // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
            const config = require('./index').default

            expect(config.CONTACT_API_ENABLED)
                .toBe(expected)
        })
    })
})
