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

    it('preserves safe image markup and removes unsafe image handlers', () => {
        const rendered = renderRichTextToHtml('![Preview](https://example.com/preview.png "Preview")')
        const unsafeRendered = renderRichTextToHtml(
            '<img src="https://example.com/preview.png" alt="Preview" onerror="alert(1)">',
        )

        expect(rendered)
            .toContain('<img')
        expect(rendered)
            .toContain('src="https://example.com/preview.png"')
        expect(rendered)
            .toContain('alt="Preview"')
        expect(rendered)
            .toContain('title="Preview"')
        expect(unsafeRendered)
            .not
            .toContain('onerror')
    })

    it('extracts readable plain text from html lists', () => {
        const plainText = renderRichTextToPlainText('<ul><li>First</li><li>Second</li></ul>')

        expect(plainText)
            .toContain('- First')
        expect(plainText)
            .toContain('- Second')
    })
})
