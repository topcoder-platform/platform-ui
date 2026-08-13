/* eslint-disable import/no-extraneous-dependencies, no-script-url, ordered-imports/ordered-imports */
import { render, screen } from '@testing-library/react'

import type { BlogRichTextDocument } from '../models'
import { BlogRichText, normalizeBlogRichTextDocument } from './BlogRichText'

jest.mock('~/libs/cms', () => ({
    getCmsResourceAssetUrl: (value: unknown) => {
        const resource = value as { fields?: { file?: { url?: unknown } } }
        const url = resource.fields?.file?.url
        return typeof url === 'string' && url.startsWith('https://assets.topcoder-dev.com/')
            ? url
            : undefined
    },
    getSafeCmsLink: (value: string | undefined) => (
        value?.startsWith('javascript:') ? undefined : value
    ),
}), { virtual: true })

describe('BlogRichText', () => {
    it('renders Rich Text JSON as semantic escaped React content', () => {
        const document: BlogRichTextDocument = {
            content: [{
                content: [{
                    marks: [{ type: 'bold' }],
                    nodeType: 'text',
                    value: '<script>alert(1)</script>',
                }],
                data: {},
                nodeType: 'paragraph',
            }],
            data: {},
            nodeType: 'document',
        }
        const container: HTMLElement = render(<BlogRichText document={document} />).container

        expect(screen.getByText('<script>alert(1)</script>'))
            .toBeTruthy()
        expect(container.querySelector('strong'))
            .toBeTruthy()
        expect(container.querySelector('script'))
            .toBeNull()
    })

    it('accepts serialized Rich Text JSON and ignores malformed strings', () => {
        const serialized = JSON.stringify({
            content: [{ content: [{ nodeType: 'text', value: 'Serialized' }], nodeType: 'paragraph' }],
            nodeType: 'document',
        })
        expect(normalizeBlogRichTextDocument(serialized)?.nodeType)
            .toBe('document')
        expect(normalizeBlogRichTextDocument('{not-json'))
            .toBeUndefined()
    })

    it('removes unsafe hyperlinks while retaining their authored text', () => {
        const document: BlogRichTextDocument = {
            content: [{
                content: [{
                    content: [{ marks: [], nodeType: 'text', value: 'Unsafe link' }],
                    data: { uri: 'javascript:alert(1)' },
                    nodeType: 'hyperlink',
                }],
                data: {},
                nodeType: 'paragraph',
            }],
            data: {},
            nodeType: 'document',
        }
        render(<BlogRichText document={document} />)

        expect(screen.getByText('Unsafe link')
            .closest('a'))
            .toBeNull()
    })

    it('resolves Entry hyperlinks and safely renders embedded website article components', () => {
        const pageTarget = {
            fields: { url: '/blog/resolved-post' },
            sys: {
                contentType: { sys: { id: 'page', linkType: 'ContentType', type: 'Link' } },
                id: 'page-entry',
                type: 'Entry',
            },
        }
        const imageTarget = {
            fields: {
                caption: 'Diagram caption',
                image: {
                    fields: {
                        description: 'Architecture diagram',
                        file: { url: 'https://assets.topcoder-dev.com/diagram.png' },
                    },
                    sys: { id: 'asset', type: 'Asset' },
                },
            },
            sys: {
                contentType: { sys: { id: 'componentImage', linkType: 'ContentType', type: 'Link' } },
                id: 'image-entry',
                type: 'Entry',
            },
        }
        const inlineTarget = {
            fields: {
                body: {
                    content: [{ content: [{ nodeType: 'text', value: 'Inline copy' }], nodeType: 'paragraph' }],
                    nodeType: 'document',
                },
            },
            sys: {
                contentType: { sys: { id: 'componentInlineElement', linkType: 'ContentType', type: 'Link' } },
                id: 'inline-entry',
                type: 'Entry',
            },
        }
        const document: BlogRichTextDocument = {
            content: [{
                content: [{
                    content: [{ marks: [], nodeType: 'text', value: 'Resolved post' }],
                    data: { target: pageTarget },
                    nodeType: 'entry-hyperlink',
                }],
                nodeType: 'paragraph',
            }, {
                data: { target: imageTarget },
                nodeType: 'embedded-entry-block',
            }, {
                data: { target: inlineTarget },
                nodeType: 'embedded-entry-inline',
            }],
            nodeType: 'document',
        }
        render(<BlogRichText document={document} />)

        expect(screen.getByText('Resolved post')
            .closest('a')
            ?.getAttribute('href'))
            .toBe('/blog/resolved-post')
        expect(screen.getByAltText('Architecture diagram')
            .getAttribute('src'))
            .toBe('https://assets.topcoder-dev.com/diagram.png')
        expect(screen.getByText('Diagram caption'))
            .toBeTruthy()
        expect(screen.getByText('Inline copy'))
            .toBeTruthy()
    })
})
