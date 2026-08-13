/* eslint-disable ordered-imports/ordered-imports */
import type { CmsCollection, CmsResource } from '~/libs/cms'

import type { BlogArticleFields, BlogPageFields } from '../models'
import {
    BLOG_ARTICLE_CONTENT_TYPE,
    BLOG_PAGE_SIZE,
    buildBlogArticleQuery,
    buildBlogDetailQuery,
    buildBlogPageLookupQuery,
    formatBlogDate,
    getBlogCardsPerRow,
    getBlogLimitedTotal,
    getBlogPageCardFilters,
    getBlogPageSize,
    getBlogPostHref,
    getBlogRichTextPlainText,
    joinBlogArticlesToPages,
    normalizeBlogPage,
    selectBlogArticlePage,
} from './blog.utils'

jest.mock('~/libs/cms', () => ({
    getCmsResourceAssetUrl: jest.fn(),
}), { virtual: true })

/** Creates a minimal Blog article resource for query/join tests. */
function article(id: string, title: string = id): CmsResource<BlogArticleFields> {
    return {
        fields: { title },
        sys: {
            contentType: {
                sys: { id: BLOG_ARTICLE_CONTENT_TYPE, linkType: 'ContentType', type: 'Link' },
            },
            id,
            type: 'Entry',
        },
    }
}

/** Creates a Page whose retained content link points at one Blog article. */
function page(id: string, articleId: string, url: string): CmsResource<BlogPageFields> {
    return {
        fields: {
            content: { sys: { id: articleId, linkType: 'Entry', type: 'Link' } },
            url,
        },
        sys: { id, type: 'Entry' },
    }
}

describe('Blog utilities', () => {
    it('builds the exact ordered, projected, and filtered list query', () => {
        expect(buildBlogArticleQuery(2, {
            authorIds: ['author-1'],
            categoryIds: ['category-1'],
            topicIds: ['topic-1', 'topic-2'],
        }))
            .toEqual(expect.objectContaining({
                content_type: 'pageContentArticle',
                'fields.authors.sys.id[in]': 'author-1',
                'fields.category.sys.id[in]': 'category-1',
                'fields.topics.sys.id[in]': 'topic-1,topic-2',
                include: 5,
                limit: 12,
                order: '-fields.publishedDate',
                skip: BLOG_PAGE_SIZE,
            }))
        expect(String(buildBlogArticleQuery(1).select))
            .toBe('sys,fields.name,fields.title,fields.cardImage,fields.snippet,fields.publishedDate,'
                + 'fields.category,fields.topics,fields.authors')

        expect(buildBlogArticleQuery(3, {
            articleIds: ['featured-1', 'featured-2'],
            limit: 5,
            pageSize: 2,
        }))
            .toEqual(expect.objectContaining({
                limit: 5,
                skip: 0,
                'sys.id[in]': 'featured-1,featured-2',
            }))
        expect(buildBlogArticleQuery(2, { pageSize: 4 }))
            .toEqual(expect.objectContaining({ limit: 4, skip: 4 }))
    })

    it('honors authored Page Cards selection, pagination, visibility, and responsive layout', () => {
        const root: CmsResource = {
            fields: {
                content: [{
                    fields: {
                        articles: [article('direct-article'), {
                            fields: { content: article('wrapped-article') },
                            sys: { id: 'article-page', type: 'Entry' },
                        }],
                        cardsPerRow: { lg: 4, md: 2, xs: 1 },
                        hideSnippet: true,
                        limit: 7,
                        pageSize: 5,
                    },
                    sys: { id: 'xGSJ2gbb4NTY7wQUoZgdf', type: 'Entry' },
                }],
            },
            sys: { id: 'iz7zIybJoja037o8NM676', type: 'Entry' },
        }
        const filters = getBlogPageCardFilters(root)

        expect(filters)
            .toEqual(expect.objectContaining({
                articleIds: ['direct-article', 'wrapped-article'],
                cardsPerRow: { lg: 4, md: 2, xs: 1 },
                hideSnippet: true,
                limit: 7,
                pageSize: 5,
            }))
        expect(getBlogPageSize(filters))
            .toBe(7)
        expect(getBlogLimitedTotal(20, filters))
            .toBe(7)
        expect(getBlogCardsPerRow(filters))
            .toEqual({ lg: 4, md: 2, xs: 1 })
    })

    it('uses an authored total limit as the unpaginated request size ahead of pageSize', () => {
        expect(getBlogPageSize({ limit: 20, pageSize: 5 }))
            .toBe(20)
        expect(buildBlogArticleQuery(3, { limit: 20, pageSize: 5 }))
            .toEqual(expect.objectContaining({ limit: 20, skip: 0 }))
    })

    it('builds batched Page and two-path detail lookups', () => {
        expect(buildBlogPageLookupQuery(['article-1', 'article-2']))
            .toEqual({
                content_type: 'page',
                'fields.content.sys.id[in]': 'article-1,article-2',
                include: 0,
                select: 'sys,fields.url,fields.content',
            })
        expect(buildBlogDetailQuery('/post-name/'))
            .toEqual({
                content_type: 'page',
                'fields.url[in]': '/blog/post-name,/post-name',
                include: 10,
                limit: 2,
            })
    })

    it('joins Page URLs without changing article order or total metadata', () => {
        const collection: CmsCollection<BlogArticleFields> = {
            items: [article('article-2'), article('article-1'), article('article-3')],
            limit: 12,
            skip: 12,
            sys: { type: 'Array' },
            total: 27,
        }
        const joined = joinBlogArticlesToPages(collection, [
            page('page-1', 'article-1', '/first'),
            page('page-2', 'article-2', '/blog/second'),
        ])

        expect(joined.total)
            .toBe(27)
        expect(joined.skip)
            .toBe(12)
        expect(joined.items.map(item => [item.article.sys.id, item.pageUrl]))
            .toEqual([
                ['article-2', '/blog/second'],
                ['article-1', '/first'],
                ['article-3', undefined],
            ])
    })

    it('prefers the /blog Page and rejects content that is not a resolved article', () => {
        const fallback = page('page-fallback', 'article-1', '/post-name')
        fallback.fields.content = article('article-1')
        const preferred = page('page-preferred', 'article-2', '/blog/post-name')
        preferred.fields.content = article('article-2')

        expect(selectBlogArticlePage([fallback, preferred], 'post-name')?.article.sys.id)
            .toBe('article-2')

        const wrongType = article('article-3')
        if (wrongType.sys.contentType) {
            wrongType.sys.contentType.sys.id = 'componentImage'
        }

        const wrongPage = page('wrong-page', 'article-3', '/blog/wrong')
        wrongPage.fields.content = wrongType
        expect(selectBlogArticlePage([wrongPage], 'wrong'))
            .toBeUndefined()
    })

    it('canonicalizes only safe rooted Page paths', () => {
        expect(getBlogPostHref('/blog/post-name'))
            .toBe('/blog/post-name')
        expect(getBlogPostHref('/post-name'))
            .toBe('/blog/post-name')
        expect(getBlogPostHref('https://example.com/post-name'))
            .toBeUndefined()
        expect(getBlogPostHref('//example.com/post-name'))
            .toBeUndefined()
    })

    it('extracts escaped metadata text from Rich Text nodes', () => {
        expect(getBlogRichTextPlainText({
            content: [{ marks: [], nodeType: 'text', value: '<script>alert(1)</script>' }],
            data: {},
            nodeType: 'paragraph',
        }))
            .toBe('<script>alert(1)</script>')
    })

    it('normalizes page segments to the available one-based range', () => {
        expect(normalizeBlogPage('3', 51, 12))
            .toBe(3)
        expect(normalizeBlogPage('99', 21, 12))
            .toBe(2)
        expect(normalizeBlogPage('post-slug', 21, 12))
            .toBe(1)
    })

    it('formats valid dates and suppresses invalid metadata', () => {
        expect(formatBlogDate('not-a-date'))
            .toBe('')
        expect(formatBlogDate('2026-08-13T00:00:00.000Z'))
            .toContain('2026')
    })
})
