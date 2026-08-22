/* eslint-disable import/no-extraneous-dependencies, no-script-url */
import { render, screen } from '@testing-library/react'

import type { MarkdownAstNode } from './CmsMarkdown'
import {
    MarkdownAnchorLink,
    MarkdownThemedButton,
    preserveGenericSyntax,
} from './CmsMarkdown'

jest.mock('react-markdown', () => () => undefined)
jest.mock('rehype-raw', () => jest.fn())
jest.mock('rehype-sanitize', () => ({
    __esModule: true,
    default: jest.fn(),
    defaultSchema: { attributes: {}, tagNames: ['a', 'code', 'p', 'pre', 'script'] },
}))
jest.mock('remark-breaks', () => jest.fn())
jest.mock('remark-gfm', () => jest.fn())

describe('CmsMarkdown', () => {
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
