/* eslint-disable import/no-extraneous-dependencies, no-script-url */
import { render, screen } from '@testing-library/react'

import type { MarkdownAstNode } from './CmsMarkdown'
import {
    CmsMarkdown,
    MarkdownAnchorLink,
    MarkdownThemedButton,
    preserveGenericSyntax,
} from './CmsMarkdown'

describe('CmsMarkdown', () => {
    it('renders the Marathon Match article commands with angle brackets escaped exactly once', () => {
        const { container }: { container: HTMLElement } = render(
            <CmsMarkdown>
                {[
                    '<span style="margin-left:25px;display:block">'
                        + '<code class="plaintext">javac &lt;TesterClassName&gt;.java</code></span>',
                    '<span style="margin-left:25px;display:block">'
                        + '<code class="plaintext">jar cvfe &lt;TesterJarName&gt;.jar '
                        + '&lt;TesterClassName&gt; .</code></span>',
                ].join('\n\n')}
            </CmsMarkdown>,
        )

        expect(Array.from(container.querySelectorAll('code'), code => code.textContent))
            .toEqual([
                'javac <TesterClassName>.java',
                'jar cvfe <TesterJarName>.jar <TesterClassName> .',
            ])
        expect(container.innerHTML)
            .toContain('javac &lt;TesterClassName&gt;.java')
        expect(container.innerHTML)
            .toContain('jar cvfe &lt;TesterJarName&gt;.jar &lt;TesterClassName&gt; .')
        expect(container.innerHTML)
            .not.toContain('&amp;lt;')
        expect(container.querySelector('testerclassname, testerjarname'))
            .toBeNull()
    })

    it('preserves intentional entity names and literal Markdown code', () => {
        const { container }: { container: HTMLElement } = render(
            <CmsMarkdown>
                {'1 < 2 and 3 > 2; &lt;value&gt;; &amp;lt;value&amp;gt;.\n\n'
                    + '`<TesterClassName>` and `&lt;value&gt;`\n\n'
                    + '```\njavac <TesterClassName>.java\n```'}
            </CmsMarkdown>,
        )

        expect(container.querySelector('p')?.textContent)
            .toBe('1 < 2 and 3 > 2; <value>; &lt;value&gt;.')
        expect(Array.from(container.querySelectorAll('code'), code => code.textContent))
            .toEqual(['<TesterClassName>', '&lt;value&gt;', 'javac <TesterClassName>.java\n'])
    })

    it('keeps escaped HTML examples as text and sanitizes authored HTML', () => {
        const { container }: { container: HTMLElement } = render(
            <CmsMarkdown>
                {'&lt;script&gt;alert(1)&lt;/script&gt; &lt;img src=x onerror=alert(1)&gt;\n\n'
                    + '<script>alert(2)</script>\n\n<a href="javascript:alert(3)" onclick="alert(4)">Unsafe</a>'}
            </CmsMarkdown>,
        )

        expect(container.textContent)
            .toContain('<script>alert(1)</script> <img src=x onerror=alert(1)>')
        expect(container.textContent)
            .not.toContain('alert(2)')
        expect(container.querySelector('script, img, [onclick], [href^="javascript:"]'))
            .toBeNull()
    })

    it('preserves inline and fenced generic type syntax in the Markdown AST', () => {
        const tree: MarkdownAstNode = {
            children: [{
                children: [
                    { type: 'text', value: 'Use vector' },
                    { type: 'html', value: '<int>' },
                    { type: 'text', value: ' and map<string, vector' },
                    { type: 'html', value: '<int>' },
                    { type: 'text', value: '>.' },
                    { type: 'inlineCode', value: 'vector<int>' },
                ],
                type: 'paragraph',
            }, {
                type: 'code',
                value: 'vector<vector<int>> values;',
            }],
            type: 'root',
        }

        preserveGenericSyntax(tree)

        expect(tree.children?.[0]?.children?.filter(node => node.value === '<int>'))
            .toEqual([
                { type: 'text', value: '<int>' },
                { type: 'text', value: '<int>' },
            ])
        expect(tree.children?.[0]?.children?.find(node => node.type === 'inlineCode')?.value)
            .toBe('vector<int>')
        expect(tree.children?.[1]?.value)
            .toBe('vector<vector<int>> values;')
    })

    it('renders safe legacy ThemedButton and AnchorLink extensions', () => {
        render(
            <>
                <MarkdownThemedButton theme='tc-green-md' to='/thrive'>Explore Thrive</MarkdownThemedButton>
                <MarkdownAnchorLink href='#details' offset='80'>Jump to details</MarkdownAnchorLink>
            </>,
        )

        expect(screen.getByRole('link', { name: 'Explore Thrive' })
            .getAttribute('href'))
            .toBe('/thrive')
        expect(screen.getByRole('link', { name: 'Explore Thrive' })
            .getAttribute('data-theme'))
            .toBe('tc-green-md')
        expect(screen.getByRole('link', { name: 'Jump to details' })
            .getAttribute('href'))
            .toBe('#details')
        expect(screen.getByRole('link', { name: 'Jump to details' })
            .getAttribute('data-offset'))
            .toBe('80')
    })

    it('blocks unsafe custom-component links', () => {
        render(
            <MarkdownThemedButton to='javascript:alert(1)'>Unsafe action</MarkdownThemedButton>,
        )

        expect(screen.queryByRole('link', { name: 'Unsafe action' }))
            .toBeNull()
        expect(screen.getByText('Unsafe action'))
            .toBeTruthy()
    })
})
