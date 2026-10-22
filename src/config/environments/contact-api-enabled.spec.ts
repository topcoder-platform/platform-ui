const originalEnv = process.env

type ContactConfig = { CONTACT_API_ENABLED: boolean }

/**
 * Loads one environment config module in isolation so its defaults are read fresh.
 * @param load Requires the environment module under test.
 * @returns The module's CONTACT_API_ENABLED value.
 */
function loadContactApiEnabled(load: () => ContactConfig): boolean {
    let enabled = false
    jest.isolateModules(() => {
        enabled = load().CONTACT_API_ENABLED
    })
    return enabled
}

/* eslint-disable @typescript-eslint/no-var-requires, global-require */
const loadDefault = (): ContactConfig => require('./default.env')
const loadProd = (): ContactConfig => require('./prod.env')
/* eslint-enable @typescript-eslint/no-var-requires, global-require */

describe('CONTACT_API_ENABLED', () => {
    beforeEach(() => {
        process.env = { ...originalEnv }
        delete process.env.REACT_APP_CONTACT_API_ENABLED
    })

    afterAll(() => {
        process.env = originalEnv
    })

    it('is enabled by default where the Contact API is deployed', () => {
        expect(loadContactApiEnabled(loadDefault))
            .toBe(true)
    })

    it('is disabled by default in production, where the Contact API is not deployed', () => {
        expect(loadContactApiEnabled(loadProd))
            .toBe(false)
    })

    it('can be enabled for production once the Contact API is live', () => {
        process.env.REACT_APP_CONTACT_API_ENABLED = 'true'

        expect(loadContactApiEnabled(loadProd))
            .toBe(true)
    })
})
