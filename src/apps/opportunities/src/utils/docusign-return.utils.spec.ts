/* eslint-disable import/no-extraneous-dependencies */
import { buildDocuSignReturnMessage, buildDocuSignReturnUrl } from './docusign-return.utils'

const mockConfig = { SUBDOMAIN: 'platform-ui' }

jest.mock('~/config', () => ({
    AppSubdomain: { opportunities: 'opportunities' },
    get EnvironmentConfig(): { SUBDOMAIN: string } {
        return mockConfig
    },
}), { virtual: true })

describe('DocuSign return utilities', () => {
    afterEach(() => {
        mockConfig.SUBDOMAIN = 'platform-ui'
    })

    it('builds a same-origin return URL below the Opportunities path', () => {
        expect(buildDocuSignReturnUrl('https://www.topcoder-dev.com/'))
            .toBe('https://www.topcoder-dev.com/opportunities/terms/docusign-return')
        expect(buildDocuSignReturnUrl())
            .toBe(`${window.location.origin}/opportunities/terms/docusign-return`)
    })

    it('omits the Opportunities path on the dedicated subdomain', () => {
        mockConfig.SUBDOMAIN = 'opportunities'
        expect(buildDocuSignReturnUrl('https://opportunities.topcoder-dev.com'))
            .toBe('https://opportunities.topcoder-dev.com/terms/docusign-return')
    })

    it('forwards DocuSign query values and fixes the message type', () => {
        expect(buildDocuSignReturnMessage('?event=signing_complete&envelopeId=abc&type=forged'))
            .toEqual({ envelopeId: 'abc', event: 'signing_complete', type: 'DocuSign' })
        expect(buildDocuSignReturnMessage(''))
            .toEqual({ type: 'DocuSign' })
    })
})
