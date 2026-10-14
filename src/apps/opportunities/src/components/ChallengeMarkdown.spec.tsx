/* eslint-disable import/no-extraneous-dependencies */
import { render, RenderResult, screen } from '@testing-library/react'

import {
    ChallengeDescription,
    extractTableOfContents,
    isHtmlDescriptionFormat,
} from './ChallengeMarkdown'

const mockMarkdownProps: Array<Record<string, unknown>> = []

jest.mock('react-markdown', () => function MarkdownMock(props: Record<string, unknown>) {
    mockMarkdownProps.push(props)
    return <div data-testid='markdown-renderer'>{props.children as string}</div>
})
jest.mock('rehype-raw', () => jest.fn())
jest.mock('rehype-sanitize', () => ({
    __esModule: true,
    default: jest.fn(),
    defaultSchema: { tagNames: ['p'] },
}))
jest.mock('remark-breaks', () => jest.fn())
jest.mock('remark-gfm', () => jest.fn())

beforeEach(() => {
    mockMarkdownProps.length = 0
})

describe('ChallengeDescription', () => {
    it('sanitizes case-insensitive HTML descriptions and omits a Markdown interpretation', () => {
        const container = render(
            <ChallengeDescription
                content='<h2>Legacy requirements</h2><script>alert(1)</script><img src="x" onerror="alert(2)">'
                format=' HTML '
            />,
        ).container

        expect(isHtmlDescriptionFormat('HtMl'))
            .toBe(true)
        expect(screen.getByRole('heading', { name: 'Legacy requirements' }))
            .toBeTruthy()
        expect(container.querySelector('script'))
            .toBeNull()
        expect(container.querySelector('img')
            ?.getAttribute('onerror'))
            .toBeNull()
    })

    it('renders non-HTML formats as Markdown', () => {
        render(<ChallengeDescription content='## Markdown requirements' format='markdown' />)

        expect(screen.getByTestId('markdown-renderer').textContent)
            .toBe('## Markdown requirements')
    })

    it.each([1, 2, 3, 4])('preserves H%i headings and gives H1 a matching table-of-contents fragment', level => {
        const markdown = `${'#'.repeat(level)} Detailed Steps`
        render(<ChallengeDescription content={markdown} format='markdown' />)

        const headings = mockMarkdownProps[0].components as Record<
            string, (props: Record<string, unknown>) => JSX.Element
        >
        const heading = headings[`h${level}`]({
            children: 'Detailed Steps',
            level,
            node: { position: { start: { line: 1 } } },
        })

        expect(heading.type)
            .toBe(`h${level}`)
        expect(heading.props.id)
            .toBe('detailed-steps-1')
        expect(extractTableOfContents(markdown))
            .toEqual(level === 1 ? [{ id: heading.props.id, label: 'Detailed Steps', level: 1 }] : [])
    })

    it('parses and sanitizes safe inline forum HTML such as underline markup', () => {
        render(<ChallengeDescription content='A <u>formatted</u> note' format='markdown' />)

        expect(mockMarkdownProps)
            .toEqual(expect.arrayContaining([expect.objectContaining({
                rehypePlugins: expect.arrayContaining([
                    expect.any(Function),
                    [expect.any(Function), expect.objectContaining({
                        tagNames: expect.arrayContaining(['p', 'u']),
                    })],
                ]),
            })]))
    })

    it('preserves authored bold and italic elements in sanitized HTML', () => {
        const container = render(
            <ChallengeDescription
                content='<p><strong>Bold</strong> and <em>Italic</em></p>'
                format='html'
            />,
        ).container

        expect(container.querySelector('strong')?.textContent)
            .toBe('Bold')
        expect(container.querySelector('em')?.textContent)
            .toBe('Italic')
    })

    it('shows API-authorized private details and omits an empty private section', () => {
        const view: RenderResult = render(
            <ChallengeDescription
                content='Public requirements'
                privateDescription='**Private workflow**'
            />,
        )

        expect(screen.getByRole('heading', { name: 'Registered User Additional Information' }))
            .toBeTruthy()
        expect(screen.getAllByTestId('markdown-renderer')[1].textContent)
            .toBe('**Private workflow**')

        view.rerender(<ChallengeDescription content='Public requirements' privateDescription='   ' />)
        expect(screen.queryByRole('heading', { name: 'Registered User Additional Information' }))
            .toBeNull()
    })
})
