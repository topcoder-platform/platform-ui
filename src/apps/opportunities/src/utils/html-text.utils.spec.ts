import { decodeHtmlEntities, htmlToPlainText } from './html-text.utils'

describe('html-text.utils', () => {
    describe('decodeHtmlEntities', () => {
        it('returns an empty string for missing input', () => {
            expect(decodeHtmlEntities())
                .toBe('')
            expect(decodeHtmlEntities(''))
                .toBe('')
        })

        it('resolves the named references used in authored copy', () => {
            expect(decodeHtmlEntities('3&ndash;4 years'))
                .toBe('3–4 years')
            expect(decodeHtmlEntities('Variable Pay .&nbsp; Key'))
                .toBe('Variable Pay .  Key')
            expect(decodeHtmlEntities('T&amp;M'))
                .toBe('T&M')
        })

        it('resolves decimal and hexadecimal references', () => {
            expect(decodeHtmlEntities('&#8211;&#x2014;'))
                .toBe('–—')
        })

        it('leaves unknown and malformed references untouched', () => {
            expect(decodeHtmlEntities('&notareference; &#0; &#x110000;'))
                .toBe('&notareference; &#0; &#x110000;')
        })

        it('does not double-decode', () => {
            expect(decodeHtmlEntities('&amp;ndash;'))
                .toBe('&ndash;')
        })
    })

    describe('htmlToPlainText', () => {
        it('returns an empty string for missing input', () => {
            expect(htmlToPlainText())
                .toBe('')
        })

        it('strips tags, resolves references and collapses whitespace', () => {
            expect(htmlToPlainText('<p>We are seeking a developer with 3&ndash;4 years</p>'))
                .toBe('We are seeking a developer with 3–4 years')
        })

        it('removes markdown punctuation', () => {
            expect(htmlToPlainText('## **Role** [link](url)'))
                .toBe('Role linkurl')
        })
    })
})
