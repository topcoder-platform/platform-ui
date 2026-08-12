/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { readFileSync } from 'fs'
import { render, screen } from '@testing-library/react'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

import { MarkdownContent } from './MarkdownContent'

interface MarkdownRendererProps {
    children: string
    remarkPlugins: unknown[]
    skipHtml: boolean
}

const mockReactMarkdown = jest.fn()

jest.mock('react-markdown', () => ({
    __esModule: true,
    default: (props: MarkdownRendererProps): JSX.Element => {
        mockReactMarkdown(props)
        return <div data-testid='markdown-source'>{props.children}</div>
    },
}))

jest.mock('remark-breaks', () => ({
    __esModule: true,
    default: jest.fn(),
}))

jest.mock('remark-gfm', () => ({
    __esModule: true,
    default: jest.fn(),
}))

const markdownStyles = readFileSync(`${__dirname}/MarkdownContent.module.scss`, 'utf8')
const ticketDetailStyles = readFileSync(
    `${__dirname}/../../../pages/ticket-details/TicketDetailPage.module.scss`,
    'utf8',
)

describe('MarkdownContent', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('passes rich formatting and uploaded-file Markdown to the safe GFM renderer', () => {
        const markdown = [
            '# Request heading',
            '**Bold text** and *italic text*',
            '[sample.zip](https://example.test/sample.zip)',
            '- First item',
            '1. First step',
        ].join('\n\n')

        render(<MarkdownContent markdown={markdown} />)

        expect(screen.getByTestId('markdown-source').textContent)
            .toBe(markdown)
        expect(mockReactMarkdown)
            .toHaveBeenCalledWith(expect.objectContaining({
                children: markdown,
                remarkPlugins: [remarkGfm, remarkBreaks],
                skipHtml: true,
            }))
    })

    it('keeps Markdown formatting visible after the platform style reset', () => {
        expect(markdownStyles)
            .toMatch(/a,[\s\S]*a:hover \{[\s\S]*color: \$link-blue-dark;[\s\S]*text-decoration: underline;/)
        expect(markdownStyles)
            .toMatch(/strong \{[\s\S]*font-weight: \$font-weight-bold;/)
        expect(markdownStyles)
            .toMatch(/em \{[\s\S]*font-style: italic;/)
        expect(markdownStyles)
            .toMatch(/h1,[\s\S]*h2,[\s\S]*h3 \{[\s\S]*font-weight: \$font-weight-bold;/)
        expect(markdownStyles)
            .toMatch(/ol \{[\s\S]*list-style-type: decimal;/)
        expect(markdownStyles)
            .toMatch(/ul \{[\s\S]*list-style-type: disc;/)
    })

    it('limits conversation timeline styling to top-level messages', () => {
        expect(ticketDetailStyles)
            .toMatch(/\.timeline \{[\s\S]*> li \{/)
        expect(ticketDetailStyles)
            .toMatch(/\.timeline > li \{/)
        expect(ticketDetailStyles)
            .not.toMatch(/\.timeline li \{/)
    })
})
