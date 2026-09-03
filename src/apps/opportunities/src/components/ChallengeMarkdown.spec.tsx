/* eslint-disable import/no-extraneous-dependencies */
import { render, RenderResult, screen } from '@testing-library/react'

import {
    ChallengeDescription,
    isHtmlDescriptionFormat,
} from './ChallengeMarkdown'

const mockMarkdownProps: Array<Record<string, unknown>> = []

jest.mock('react-markdown', () => function MarkdownMock(props: Record<string, unknown>) {
    mockMarkdownProps.push(props)
    return <div data-testid='markdown-renderer'>{props.children as string}</div>
})
jest.mock('rehype-raw', () => jest.fn())
jest.mock('rehype-sanitize', () => jest.fn())
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

    it('parses and sanitizes safe inline forum HTML such as underline markup', () => {
        render(<ChallengeDescription content='A <u>formatted</u> note' format='markdown' />)

        expect(mockMarkdownProps)
            .toEqual(expect.arrayContaining([expect.objectContaining({
                rehypePlugins: expect.arrayContaining([
                    expect.any(Function),
                    expect.any(Function),
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
