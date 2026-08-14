/* eslint-disable no-script-url */
import {
    getPayloadAssetUrl,
    getSafeCmsLink,
    PayloadCmsClient,
    PAYLOAD_CMS_ORIGIN,
    serializeCmsQuery,
} from './cms.client'

describe('Payload CMS client', () => {
    it('serializes stable compatibility query parameters', () => {
        expect(serializeCmsQuery({
            limit: 5,
            query: 'design systems',
            tags: ['figma', 'ux'],
        }))
            .toBe('limit=5&query=design+systems&tags=figma%2Cux')
    })

    it('accepts only migrated Payload asset URLs', () => {
        expect(getPayloadAssetUrl('//assets.topcoder-dev.com/media/example.png'))
            .toBe('https://assets.topcoder-dev.com/media/example.png')
        expect(getPayloadAssetUrl('https://images.ctfassets.net/example.png'))
            .toBeUndefined()
        expect(getPayloadAssetUrl('https://assets.topcoder-dev.com.evil.test/example.png'))
            .toBeUndefined()
    })

    it('blocks links to retired CMS providers and executable URL schemes', () => {
        expect(getSafeCmsLink('https://contentful.com/spaces/example'))
            .toBeUndefined()
        expect(getSafeCmsLink('https://cdn.contentful.com/spaces/example'))
            .toBeUndefined()
        expect(getSafeCmsLink('https://ctfassets.net/example.png'))
            .toBeUndefined()
        expect(getSafeCmsLink('https://docs.octana.example/article'))
            .toBeUndefined()
        expect(getSafeCmsLink('/thrive'))
            .toBe('/thrive')
        expect(getSafeCmsLink('#article-details'))
            .toBe('#article-details')
        expect(getSafeCmsLink('javascript:alert(1)'))
            .toBeUndefined()
        expect(getSafeCmsLink('data:text/html,<script>alert(1)</script>'))
            .toBeUndefined()
    })

    it('uses the fixed Payload origin and resolves included relationships', async () => {
        const fetcher = jest.fn() as jest.MockedFunction<typeof fetch>
        fetcher.mockResolvedValue({
            json: async () => ({
                includes: {
                    Entry: [{
                        fields: { name: 'Ada' },
                        sys: { id: 'author', type: 'Entry' },
                    }],
                },
                items: [{
                    fields: {
                        author: {
                            sys: { id: 'author', linkType: 'Entry', type: 'Link' },
                        },
                    },
                    sys: { id: 'post', type: 'Entry' },
                }],
                limit: 1,
                skip: 0,
                sys: { type: 'Array' },
                total: 1,
            }),
            ok: true,
            status: 200,
        } as Response)
        const client = new PayloadCmsClient({
            accessTokens: { edu: 'delivery-token' },
            fetcher,
        })
        const result = await client.queryEntries<{ author: unknown }>('edu', { limit: 1 })
        const [requestUrl, requestOptions] = fetcher.mock.calls[0]

        expect(String(requestUrl))
            .toBe(
                `${PAYLOAD_CMS_ORIGIN}/spaces/piwi0eufbb2g/environments/master/entries?limit=1`,
            )
        expect(requestOptions?.headers)
            .toEqual({ Authorization: 'Bearer delivery-token' })
        expect(result.items[0].fields.author)
            .toMatchObject({ fields: { name: 'Ada' } })
    })

    it('refuses to issue a request without the selected space credential', async () => {
        const fetcher = jest.fn() as jest.MockedFunction<typeof fetch>
        const client = new PayloadCmsClient({
            accessTokens: { edu: '' },
            fetcher,
        })

        await expect(client.queryEntries('edu')).rejects.toMatchObject({ status: 0 })
        expect(fetcher).not.toHaveBeenCalled()
    })
})
