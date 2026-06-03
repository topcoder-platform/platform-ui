import { marked } from 'marked'
import DOMPurify from 'dompurify'

const RICH_TEXT_ALLOWED_ATTRIBUTES = [
    'align',
    'alt',
    'border',
    'cellpadding',
    'cellspacing',
    'class',
    'colspan',
    'height',
    'href',
    'rel',
    'rowspan',
    'src',
    'style',
    'target',
    'title',
    'type',
    'width',
]

const RICH_TEXT_ALLOWED_TAGS = [
    'a',
    'blockquote',
    'br',
    'code',
    'div',
    'em',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hr',
    'img',
    'li',
    'ol',
    'p',
    'pre',
    's',
    'span',
    'strike',
    'strong',
    'table',
    'tbody',
    'td',
    'th',
    'thead',
    'tr',
    'u',
    'ul',
]

const RICH_TEXT_SANITIZE_OPTIONS = {
    ALLOWED_ATTR: RICH_TEXT_ALLOWED_ATTRIBUTES,
    ALLOWED_TAGS: RICH_TEXT_ALLOWED_TAGS,
} as const

/**
 * Sanitizes a mixed markdown/HTML string before it is rendered with a markdown parser that
 * accepts embedded HTML.
 *
 * @param value - Mixed markdown and HTML source content.
 * @returns Sanitized source string with unsupported HTML removed.
 */
export function sanitizeRichTextSource(value: string): string {
    const normalizedValue = String(value || '')

    if (!normalizedValue.trim()) {
        return ''
    }

    return String(DOMPurify.sanitize(normalizedValue, RICH_TEXT_SANITIZE_OPTIONS as any))
}

/**
 * Converts markdown or HTML content into sanitized HTML suitable for rich text editors and
 * rendered detail views.
 *
 * @param value - Mixed markdown and HTML source content.
 * @returns Sanitized HTML representation of the source content.
 */
export function renderRichTextToHtml(value: string): string {
    const sanitizedSource = sanitizeRichTextSource(value)

    if (!sanitizedSource) {
        return ''
    }

    const renderedHtml = marked.parse(sanitizedSource, {
        breaks: true,
        gfm: true,
    }) as string

    return String(DOMPurify.sanitize(renderedHtml, RICH_TEXT_SANITIZE_OPTIONS as any))
        .trim()
}

/**
 * Converts markdown or HTML content into plain text while preserving basic list and paragraph
 * spacing for downstream AI workflows and compact previews.
 *
 * @param value - Mixed markdown and HTML source content.
 * @returns Plain-text representation of the source content.
 */
export function renderRichTextToPlainText(value: string): string {
    const renderedHtml = renderRichTextToHtml(value)

    if (!renderedHtml) {
        return ''
    }

    const htmlWithTextSpacing = renderedHtml
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<li\b[^>]*>/gi, '\n- ')
        .replace(/<\/(blockquote|div|h1|h2|h3|h4|h5|h6|li|p|pre|tr)>/gi, '\n')
        .replace(/<\/(ol|table|tbody|thead|ul)>/gi, '\n')

    if (typeof document === 'undefined') {
        return htmlWithTextSpacing
            .replace(/<[^>]+>/g, ' ')
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n[ \t]+/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/[ \t]{2,}/g, ' ')
            .trim()
    }

    const container = document.createElement('div')
    container.innerHTML = htmlWithTextSpacing

    return String(container.textContent || '')
        .replace(/\u00a0/g, ' ')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n[ \t]+/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]{2,}/g, ' ')
        .trim()
}
