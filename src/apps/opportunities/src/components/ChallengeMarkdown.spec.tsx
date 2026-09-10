/* eslint-disable import/no-extraneous-dependencies */
import { render, RenderResult, screen } from '@testing-library/react'

import {
    canonicalizeLegacyChallengeLink,
    ChallengeDescription,
    isHtmlDescriptionFormat,
    transformChallengeMarkdownLink,
} from './ChallengeMarkdown'

const mockMarkdownProps: Array<Record<string, unknown>> = []

jest.mock('react-markdown', () => ({
    __esModule: true,
    default: function MarkdownMock(props: Record<string, unknown>) {
        mockMarkdownProps.push(props)
        return <div data-testid='markdown-renderer'>{props.children as string}</div>
    },
    uriTransformer: (href: string): string => {
        const candidate = href.trim()
        const firstCharacter = candidate.charAt(0)
        if (firstCharacter === '#' || firstCharacter === '/') return candidate

        const colonIndex = candidate.indexOf(':')
        if (colonIndex === -1) return candidate

        const safeScheme = ['http', 'https', 'mailto', 'tel'].some(scheme => (
            colonIndex === scheme.length
            && candidate.slice(0, scheme.length)
                .toLowerCase() === scheme
        ))
        if (safeScheme) return candidate

        const queryIndex = candidate.indexOf('?')
        const fragmentIndex = candidate.indexOf('#')
        if ((queryIndex !== -1 && colonIndex > queryIndex)
            || (fragmentIndex !== -1 && colonIndex > fragmentIndex)) return candidate

        return ['java', 'script:void(0)'].join('')
    },
}))
jest.mock('rehype-raw', () => jest.fn())
jest.mock('rehype-sanitize', () => ({
    __esModule: true,
    default: jest.fn(),
    defaultSchema: { tagNames: ['p'] },
}))
jest.mock('remark-breaks', () => jest.fn())
jest.mock('remark-gfm', () => jest.fn())
jest.mock('~/config', () => ({
    AppSubdomain: { opportunities: 'opportunities' },
    EnvironmentConfig: {
        SUBDOMAIN: 'www',
        TC_DOMAIN: 'topcoder-dev.com',
    },
}), { virtual: true })

beforeEach(() => {
    mockMarkdownProps.length = 0
})

describe('canonicalizeLegacyChallengeLink', () => {
    const domain = 'topcoder-dev.com'
    const routePrefix = '/opportunities'

    it('canonicalizes naked, www, and root-relative legacy challenge detail links', () => {
        expect(canonicalizeLegacyChallengeLink(
            'https://topcoder-dev.com/challenges/d8dc1e2f-3aed-4a16-a895-ddc7cd69f055',
            domain,
            routePrefix,
        ))
            .toBe('/opportunities/challenge/d8dc1e2f-3aed-4a16-a895-ddc7cd69f055')
        expect(canonicalizeLegacyChallengeLink(
            'http://www.topcoder-dev.com/challenges/30012345/',
            domain,
            routePrefix,
        ))
            .toBe('/opportunities/challenge/30012345')
        expect(canonicalizeLegacyChallengeLink(
            '/challenges/challenge-id/?tab=forum&tab=posts#latest',
            domain,
            '',
        ))
            .toBe('/challenge/challenge-id?tab=forum&tab=posts#latest')
    })

    it('canonicalizes protocol-relative links while retaining query and hash values', () => {
        expect(canonicalizeLegacyChallengeLink(
            '//www.topcoder-dev.com/challenges/challenge-id?tab=forum#post-1',
            domain,
            routePrefix,
        ))
            .toBe('/opportunities/challenge/challenge-id?tab=forum#post-1')
    })

    it('leaves unsafe, external, lookalike, and cross-environment links unchanged', () => {
        const unchangedLinks = [
            ['java', 'script:alert(1)'].join(''),
            'mailto:help@topcoder.com',
            'https://example.com/challenges/challenge-id',
            'https://topcoder-dev.com.evil.example/challenges/challenge-id',
            'https://evil-topcoder-dev.com/challenges/challenge-id',
            'https://vanilla.topcoder-dev.com/challenges/challenge-id',
            'https://topcoder.com/challenges/challenge-id',
            'https://[invalid/challenges/challenge-id',
        ]

        unchangedLinks.forEach(link => {
            expect(canonicalizeLegacyChallengeLink(link, domain, routePrefix))
                .toBe(link)
        })
    })

    it('leaves non-detail challenge routes and canonical Opportunities routes unchanged', () => {
        const unchangedLinks = [
            '/challenges',
            '/challenges/challenge-id/review-opportunities',
            '/challenges/terms/detail/challenge-id',
            '/challenges/challenge-id/submit',
            '/challenges/challenge-id/my-submissions',
            '/opportunities/challenge/challenge-id',
        ]

        unchangedLinks.forEach(link => {
            expect(canonicalizeLegacyChallengeLink(link, domain, routePrefix))
                .toBe(link)
        })
    })
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

    it('configures a safe canonicalizer for Markdown and sanitized raw HTML anchor destinations', () => {
        render(<ChallengeDescription content='[Challenge](https://topcoder-dev.com/challenges/challenge-id)' />)
        const transformLinkUri = mockMarkdownProps[0].transformLinkUri as (href: string) => string

        expect(transformLinkUri)
            .toBe(transformChallengeMarkdownLink)
        expect(transformLinkUri('https://topcoder-dev.com/challenges/challenge-id'))
            .toBe('/opportunities/challenge/challenge-id')
        expect(transformLinkUri(
            'https://www.topcoder-dev.com/challenges/challenge-id?tab=forum#latest',
        ))
            .toBe('/opportunities/challenge/challenge-id?tab=forum#latest')
        expect(transformLinkUri(['java', 'script:alert(1)'].join('')))
            .toBe(['java', 'script:void(0)'].join(''))
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
