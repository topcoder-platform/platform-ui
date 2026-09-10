import { sanitizeEditorDesign } from './editor-design'

describe('Contact editor project hydration', () => {
    it('strips executable project scripts, handlers, unsafe tags, and encoded script URLs', () => {
        const result = sanitizeEditorDesign({ pages: [{ component: {
            attributes: { href: 'jav&#x61;script:alert(1)', onclick: 'alert(1)', title: 'Safe title' },
            components: [{ content: '<img src="x" onerror="alert(1)"><script>alert(1)</script>', tagName: 'script' }],
            script: 'fetch("/private")',
            'script-export': 'alert(1)',
            scriptProps: ['secret'],
            tagName: 'table',
        } }] })
        expect(JSON.stringify(result)).not.toMatch(/alert|fetch|script|onerror|onclick|secret/)
        expect(JSON.stringify(result))
            .toContain('Safe title')
        expect(JSON.stringify(result))
            .toContain('table')
    })

    it('preserves safe newsletter layouts, styles, merge fields, and image URLs without mutating input', () => {
        const design = { pages: [{ component: {
            components: [{ content: '<p>Hello {{firstName|there}}</p>', tagName: 'td' }],
            src: 'https://www.topcoder.com/logo.png',
            style: { color: '#087653', width: '600px' },
            tagName: 'table',
        } }] }
        expect(sanitizeEditorDesign(design))
            .toEqual(design)
        expect(sanitizeEditorDesign(design)).not.toBe(design)
    })

    it('rejects excessively nested project input before hydration', () => {
        const design: Record<string, unknown> = {}
        let node = design
        for (let index = 0; index < 45; index += 1) {
            node.child = {}
            node = node.child as Record<string, unknown>
        }

        expect(() => sanitizeEditorDesign(design))
            .toThrow('too deeply nested')
    })
})
