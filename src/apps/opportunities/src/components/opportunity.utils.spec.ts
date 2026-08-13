/* eslint-disable ordered-imports/ordered-imports */
import { extractTableOfContents, headingSlug } from './ChallengeMarkdown'
import { paginationWindow } from './OpportunityPagination'

jest.mock('react-markdown', () => () => undefined)
jest.mock('remark-breaks', () => jest.fn())
jest.mock('remark-gfm', () => jest.fn())
jest.mock('~/libs/ui', () => ({ IconOutline: {} }), { virtual: true })

describe('opportunity presentation utilities', () => {
    it('creates stable Markdown table-of-contents fragments including duplicate headings', () => {
        const markdown = [
            '# Challenge',
            '## [Getting Started](https://topcoder.com)',
            'Body',
            '### Getting Started',
        ].join('\n')

        expect(extractTableOfContents(markdown))
            .toEqual([
                { id: 'getting-started-2', label: 'Getting Started', level: 2 },
                { id: 'getting-started-4', label: 'Getting Started', level: 3 },
            ])
        expect(headingSlug('API & UI Requirements!'))
            .toBe('api-ui-requirements')
        expect(headingSlug('<script>alert(1)</script>'))
            .toBe('script-alert-1-script')
    })

    it('keeps short pagination complete and compacts large page ranges', () => {
        expect(paginationWindow(2, 4))
            .toEqual([1, 2, 3, 4])
        expect(paginationWindow(6, 12))
            .toEqual([1, 0, 5, 6, 7, 0, 12])
    })
})
