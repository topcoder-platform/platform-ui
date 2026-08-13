/* eslint-disable ordered-imports/ordered-imports */

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
    groupThriveCategories,
    parseThriveFilters,
} from './thrive.utils'

jest.mock('~/libs/cms', () => ({
    getCmsResourceAssetUrl: jest.fn(),
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
