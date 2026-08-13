/* eslint-disable no-script-url, ordered-imports/ordered-imports */

import type { CmsResource } from '~/libs/cms'

import type { ThriveCategoryFields, ThriveFilters } from '../models'
import {
    buildThriveContentQuery,
    buildThriveTaxonomyRootQuery,
    buildThriveTrackCardQuery,
    collectThriveArticles,
    getMarkdownPreview,
    getRootThriveCategories,
    getThriveArticleUrl,
    getThriveExternalUrl,
    groupThriveCategories,
    parseThriveFilters,
} from './thrive.utils'

jest.mock('~/libs/cms', () => ({
    getCmsResourceAssetUrl: jest.fn(),
    getSafeCmsLink: (value?: string) => {
        if (!value) return undefined
        try {
            const url = new URL(value, 'https://topcoder-dev.com')
            const safeProtocol = ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)
                || value.startsWith('#')
            const retiredHost = url.hostname === 'contentful.com'
                || url.hostname.endsWith('.contentful.com')
                || url.hostname === 'ctfassets.net'
                || url.hostname.endsWith('.ctfassets.net')
                || url.hostname.includes('octana')
            return safeProtocol && !retiredHost ? value : undefined
        } catch (error) {
            return undefined
        }
    },
}), { virtual: true })

describe('Thrive utilities', () => {
    it('normalizes repeated route filters and caps search terms', () => {
        const filters = parseThriveFilters(
            `?tags=ux,figma&tags[]=design&sortBy=Likes&phrase=${'a'.repeat(130)}`,
        )

        expect(filters.tags)
            .toEqual(['ux', 'figma', 'design'])
        expect(filters.sortBy)
            .toBe('Likes')
        expect(filters.phrase)
            .toHaveLength(115)
    })

    it('maps taxonomy names and the resolved author to compatibility filters', () => {
        const filters: ThriveFilters = {
            sortBy: 'Content Publish Date',
            tags: ['react'],
            tax: ['Frontend'],
            track: 'Development',
        }
        const categories: Array<CmsResource<ThriveCategoryFields>> = [{
            fields: { name: 'Frontend', trackParent: 'Development' },
            sys: { id: 'frontend-id', type: 'Entry' },
        }]

        expect(buildThriveContentQuery('Article', filters, categories, 'author-id', 5, 0))
            .toMatchObject({
                'fields.contentAuthor.sys.id': 'author-id',
                'fields.contentCategory.sys.id[in]': 'frontend-id',
                'fields.tags[all]': 'react',
                'fields.trackCategory': 'Development',
                'fields.type': 'Article',
            })
    })

    it('uses the curated root and source-compatible mixed-content home cards', () => {
        expect(buildThriveTaxonomyRootQuery())
            .toEqual({
                include: 10,
                limit: 1,
                'sys.id': '15caxocitaxyK65K9oSd91',
            })
        expect(buildThriveTrackCardQuery('Development'))
            .toMatchObject({
                'fields.trackCategory': 'Development',
                limit: 3,
                order: '-sys.createdAt',
            })
        expect(buildThriveTrackCardQuery('Development'))
            .not.toHaveProperty('fields.type')
    })

    it('builds local and external article destinations', () => {
        expect(getThriveArticleUrl({
            content: '',
            slug: 'payload-migration',
            title: 'Payload migration',
            type: 'Article',
        }))
            .toBe('/thrive/articles/payload-migration')
        expect(getThriveArticleUrl({
            content: '',
            contentUrl: 'https://www.topcoder.com/article',
            externalArticle: true,
            title: 'External',
            type: 'Article',
        }))
            .toBe('https://www.topcoder.com/article')
    })

    it.each([
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox(1)',
        'mailto:member@example.com',
        'tel:+15555555555',
        '#article-section',
        '/thrive/articles/local-article',
        'https://images.ctfassets.net/legacy/image.png',
        'https://cdn.contentful.com/legacy/article',
        'https://api.octana.io/article',
    ])('fails closed to the local article route for unsafe external URL %s', contentUrl => {
        const article = {
            content: '',
            contentUrl,
            externalArticle: true,
            slug: 'safe-local-fallback',
            title: 'External',
            type: 'Article' as const,
        }

        expect(getThriveExternalUrl(article))
            .toBeUndefined()
        expect(getThriveArticleUrl(article))
            .toBe('/thrive/articles/safe-local-fallback')
    })

    it('creates plain compact previews from markdown', () => {
        expect(getMarkdownPreview('## Hello [Topcoder](https://topcoder.com) **members**', 20))
            .toBe('Hello Topcoder membe…')
    })

    it('finds unique articles nested in an editable home viewport', () => {
        const article: CmsResource<any> = {
            fields: {
                content: 'Featured body',
                title: 'Featured',
                type: 'Article',
            },
            sys: { id: 'featured', type: 'Entry' },
        }

        expect(collectThriveArticles({ fields: { content: [article, article] } }))
            .toEqual([article])
    })

    it('keeps the Thrive taxonomy rooted and ignores malformed or orphan categories', () => {
        const curated: CmsResource<ThriveCategoryFields> = {
            fields: { name: 'Frontend', trackParent: 'Development' },
            sys: { id: 'curated', type: 'Entry' },
        }
        const malformed = {
            fields: { trackParent: 'Development' },
            sys: { id: 'missing-name', type: 'Entry' },
        } as CmsResource<ThriveCategoryFields>
        const orphan: CmsResource<ThriveCategoryFields> = {
            fields: { name: 'Orphan', trackParent: 'Development' },
            sys: { id: 'orphan', type: 'Entry' },
        }
        const categories = getRootThriveCategories({
            development: [curated, curated, malformed],
            unrelatedField: [orphan],
        })

        expect(categories.map(category => category.sys.id))
            .toEqual(['curated'])
        expect(groupThriveCategories(categories))
            .toEqual({ Development: [curated] })
        expect(() => groupThriveCategories([malformed, orphan]))
            .not.toThrow()
    })
})
