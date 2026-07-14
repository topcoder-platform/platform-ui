import {
    renderRichTextToHtml,
    renderRichTextToPlainText,
    sanitizeRichTextSource,
} from './rich-text'

describe('rich-text utils', () => {
    it('renders markdown as sanitized html', () => {
        const rendered = renderRichTextToHtml('## Heading\n\n- Item 1\n- Item 2')

        expect(rendered)
            .toContain('<h2>Heading</h2>')
        expect(rendered)
            .toContain('<li>Item 1</li>')
        expect(rendered)
            .toContain('<li>Item 2</li>')
    })

    it('preserves safe html and removes unsafe tags', () => {
        const sanitized = sanitizeRichTextSource('<p>Safe</p><script>alert(1)</script>')

        expect(sanitized)
            .toContain('<p>Safe</p>')
        expect(sanitized)
            .not
            .toContain('<script>')
    })

    it('extracts readable plain text from html lists', () => {
        const plainText = renderRichTextToPlainText('<ul><li>First</li><li>Second</li></ul>')

        expect(plainText)
            .toContain('- First')
        expect(plainText)
            .toContain('- Second')
    })

    it('renders links with target blank and noopener noreferrer rel', () => {
        const rendered = renderRichTextToHtml('[Visit example](https://example.com)')

        expect(rendered)
            .toContain('target="_blank"')
        expect(rendered)
            .toContain('rel="noopener noreferrer"')
    })

    it('supports markdown strikethrough markup', () => {
        const rendered = renderRichTextToHtml('~~deleted~~')

        expect(rendered)
            .toContain('<del>deleted</del>')
    })
})
