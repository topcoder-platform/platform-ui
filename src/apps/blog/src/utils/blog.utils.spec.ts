import { formatBlogDate, normalizeBlogPage } from './blog.utils'

jest.mock('~/libs/cms', () => ({
    getCmsResourceAssetUrl: jest.fn(),
}), { virtual: true })

describe('Blog utilities', () => {
    it('normalizes page segments to the available one-based range', () => {
        expect(normalizeBlogPage('3', 51, 10))
            .toBe(3)
        expect(normalizeBlogPage('99', 21, 10))
            .toBe(3)
        expect(normalizeBlogPage('post-slug', 21, 10))
            .toBe(1)
    })

    it('formats valid dates and suppresses invalid metadata', () => {
        expect(formatBlogDate('not-a-date'))
            .toBe('')
        expect(formatBlogDate('2026-08-13T00:00:00.000Z'))
            .toContain('2026')
    })
})
