import DOMPurify from 'dompurify'

const SCRIPT_KEYS = new Set(['script', 'scriptexport', 'scriptprops', 'scripts', 'srcdoc'])
const UNSAFE_TAGS = new Set(['script', 'iframe', 'object', 'embed', 'base', 'link', 'meta', 'form'])
const URL_KEYS = new Set(['href', 'src', 'xlink:href', 'action', 'formaction'])

/**
 * Removes executable component project data before GrapesJS hydrates a stored visual email design.
 * @param design optional JSON project state returned by the Contact template/campaign API.
 * @returns a sanitized copy retaining newsletter layout, style, text, and safe asset properties.
 * @throws Error if nesting exceeds 40 levels or traversal exceeds 100,000 values.
 */
export function sanitizeEditorDesign(design?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!design) return undefined
    let visited = 0

    /**
     * Clones one project value, stripping script metadata, dangerous tags/attributes, and active HTML.
     * @param value current JSON value.
     * @param depth nesting level used to bound work on malformed imported designs.
     * @returns sanitized JSON-compatible value.
     * @throws Error for excessive depth or node count.
     */
    function clean(value: unknown, depth: number): unknown {
        visited += 1
        if (depth > 40 || visited > 100_000) throw new Error('The email editor design is too deeply nested or complex.')
        if (typeof value === 'string') return value.includes('<') ? DOMPurify.sanitize(value) : value
        if (Array.isArray(value)) return value.map(item => clean(item, depth + 1))
        if (!value || typeof value !== 'object') return value
        const output: Record<string, unknown> = {}
        Object.entries(value)
            .forEach(([key, item]) => {
                const normalized = key.toLowerCase()
                    .replace(/[-_]/g, '')
                if (SCRIPT_KEYS.has(normalized) || /^on/i.test(key)
                    || ['__proto__', 'constructor', 'prototype'].includes(key)) {
                    return
                }

                if ((key === 'tagName' || key === 'type') && typeof item === 'string'
                    && UNSAFE_TAGS.has(item.toLowerCase())) {
                    output[key] = key === 'tagName' ? 'div' : 'default'
                    return
                }

                if (URL_KEYS.has(key.toLowerCase()) && typeof item === 'string') {
                    // Remove control characters before checking URL schemes.
                    // eslint-disable-next-line no-control-regex
                    const url = item.replace(/[\s\u0000-\u001f]/g, '')
                    if (url.includes(':')
                        && !/^(https?:|mailto:|tel:|data:image\/(png|jpeg|gif|webp);base64,)/i.test(url)) return
                }

                output[key] = clean(item, depth + 1)
            })
        return output
    }

    return clean(design, 0) as Record<string, unknown>
}
