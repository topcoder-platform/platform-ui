/**
 * Helpers for turning API-authored rich text into plain text for card excerpts
 * and other places where markup must not be rendered.
 *
 * Opportunity descriptions come back from the owning APIs as HTML, so stripping
 * the tags on its own leaves character references such as `&ndash;` or `&nbsp;`
 * visible as literal text. These helpers resolve those references without
 * handing the markup to the DOM parser.
 */

/** Named character references that appear in authored opportunity copy. */
const NAMED_ENTITIES: Record<string, string> = {
    amp: '&',
    apos: '\'',
    bull: '•',
    copy: '©',
    deg: '°',
    gt: '>',
    hellip: '…',
    laquo: '«',
    ldquo: '“',
    lsquo: '‘',
    lt: '<',
    mdash: '—',
    middot: '·',
    nbsp: '\u00a0',
    ndash: '–',
    quot: '"',
    raquo: '»',
    rdquo: '”',
    reg: '®',
    rsquo: '’',
    trade: '™',
}

const ENTITY_PATTERN = /&(#[Xx][0-9A-Fa-f]+|#\d+|[A-Za-z][A-Za-z0-9]*);/g

/**
 * Resolves HTML character references to the characters they stand for.
 *
 * Named references are limited to the set listed above; numeric references
 * (decimal and hexadecimal) are resolved for any valid code point. `&amp;` is
 * resolved last within a single pass, so double-encoded input such as
 * `&amp;ndash;` decodes to the literal text `&ndash;` rather than to `–`.
 * Unknown references are left untouched.
 *
 * Used by the opportunity list cards and the engagement detail page to render
 * authored descriptions as plain text.
 *
 * @param value rich text from the API, or `undefined`.
 * @returns the input with character references resolved, or an empty string when no input is given.
 * @throws Does not throw; unresolvable references are returned unchanged.
 */
export function decodeHtmlEntities(value?: string): string {
    if (!value) return ''

    return value.replace(ENTITY_PATTERN, (match, reference: string) => {
        if (reference.startsWith('#')) {
            const hex = reference[1] === 'x' || reference[1] === 'X'
            const codePoint = Number.parseInt(hex ? reference.slice(2) : reference.slice(1), hex ? 16 : 10)
            if (!Number.isFinite(codePoint) || codePoint <= 0 || codePoint > 0x10FFFF) return match

            try {
                return String.fromCodePoint(codePoint)
            } catch {
                return match
            }
        }

        return NAMED_ENTITIES[reference.toLowerCase()] ?? match
    })
}

/**
 * Converts Markdown or HTML rich text to a single line of plain text.
 *
 * Tags are replaced with a space, character references are resolved, the
 * Markdown punctuation that would otherwise read as noise is removed, and
 * runs of whitespace are collapsed.
 *
 * @param value rich text from the API, or `undefined`.
 * @returns collapsed plain text, or an empty string when no input is given.
 * @throws Does not throw.
 */
export function htmlToPlainText(value?: string): string {
    if (!value) return ''

    return decodeHtmlEntities(value.replace(/<[^>]*>/g, ' '))
        .replace(/[#*_>`~()]/g, '')
        .replace(/\[/g, '')
        .replace(/]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
}
