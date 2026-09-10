/* eslint-disable ordered-imports/ordered-imports */
import {
    FC,
    isValidElement,
    ReactNode,
    useEffect,
    useMemo,
} from 'react'
import DOMPurify from 'dompurify'
import ReactMarkdown, {
    Components,
    Options as ReactMarkdownOptions,
    uriTransformer,
} from 'react-markdown'
import type { HeadingProps } from 'react-markdown/lib/ast-to-react'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

import { AppSubdomain, EnvironmentConfig } from '~/config'

import styles from './ChallengeMarkdown.module.scss'

const Markdown = ReactMarkdown as unknown as FC<ReactMarkdownOptions>
const ABSOLUTE_HTTP_LINK_PATTERN = /^https?:\/\//i
const LEGACY_CHALLENGE_PATH_PATTERN = /^\/challenges\/([^/]+)\/?$/
const PROTOCOL_RELATIVE_LINK_PATTERN = /^\/\//
const ROOT_RELATIVE_LINK_PATTERN = /^\/(?!\/)/

export interface ChallengeTocItem {
    id: string
    label: string
    level: 2 | 3
}

interface ChallengeMarkdownProps {
    markdown: string
    onTableOfContents?: (items: ChallengeTocItem[]) => void
}

interface ChallengeDescriptionProps {
    content: string
    format?: string
    privateDescription?: string
}

/**
 * Detects the legacy Challenge API HTML description format.
 *
 * @param format Challenge API description format.
 * @returns true only for a case-insensitive `html` value.
 * @throws Does not throw.
 */
export function isHtmlDescriptionFormat(format?: string): boolean {
    return format?.trim()
        .toLowerCase() === 'html'
}

/**
 * Creates a stable fragment identifier from a Markdown heading.
 *
 * @param value heading text.
 * @returns URL-safe lowercase fragment.
 * @throws Does not throw.
 */
export function headingSlug(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        || 'section'
}

/**
 * Extracts second- and third-level Markdown headings for the challenge table of contents.
 * Source line numbers keep duplicate heading fragments stable and unique.
 *
 * @param markdown challenge specification Markdown.
 * @returns ordered table-of-contents entries.
 * @throws Does not throw.
 */
export function extractTableOfContents(markdown: string): ChallengeTocItem[] {
    return markdown.split('\n')
        .map((line, index) => ({
            line: index + 1,
            match: /^(#{2,3})\s+(.+?)\s*#*$/.exec(line.trim()),
        }))
        .filter((entry): entry is { line: number, match: RegExpExecArray } => !!entry.match)
        .map(entry => {
            const label = entry.match[2]
                .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
                .replace(/[*_`~]/g, '')
                .trim()
            return {
                id: `${headingSlug(label)}-${entry.line}`,
                label,
                level: entry.match[1].length as 2 | 3,
            }
        })
}

/**
 * Converts nested Markdown children to plain text for heading fragment generation.
 *
 * @param children rendered heading children.
 * @returns concatenated plain text.
 * @throws Does not throw.
 */
export function markdownHeadingText(children: ReactNode): string {
    if (typeof children === 'string' || typeof children === 'number') return String(children)
    if (Array.isArray(children)) {
        return children.map(markdownHeadingText)
            .join('')
    }

    if (isValidElement<{ children?: ReactNode }>(children)) {
        return markdownHeadingText(children.props.children)
    }

    return ''
}

/**
 * Canonicalizes a first-party legacy challenge-detail link without depending on
 * application route modules. Callers supply the active Topcoder domain and the
 * route prefix used by their host so this helper remains deterministic and
 * reusable in tests.
 *
 * @param href safe candidate link from rendered Markdown.
 * @param currentDomain active environment domain, such as `topcoder-dev.com`.
 * @param routePrefix Opportunities route prefix, either `/opportunities` or an empty string.
 * @returns canonical internal challenge link, or the original value when it is not an exact legacy detail URL.
 * @throws Does not throw for malformed links.
 */
export function canonicalizeLegacyChallengeLink(
    href: string,
    currentDomain: string,
    routePrefix: string,
): string {
    const candidate = href.trim()
    const protocolRelative = PROTOCOL_RELATIVE_LINK_PATTERN.test(candidate)
    const rootRelative = ROOT_RELATIVE_LINK_PATTERN.test(candidate)
    const absoluteHttp = ABSOLUTE_HTTP_LINK_PATTERN.test(candidate)

    if (!candidate || (!absoluteHttp && !protocolRelative && !rootRelative)) return href

    const normalizedDomain = currentDomain.trim()
        .toLowerCase()
    if (!normalizedDomain) return href

    try {
        const url = new URL(
            protocolRelative ? `https:${candidate}` : candidate,
            `https://${normalizedDomain}`,
        )
        const trustedHost = url.hostname === normalizedDomain
            || url.hostname === `www.${normalizedDomain}`
        if (!rootRelative && (!['http:', 'https:'].includes(url.protocol) || !trustedHost)) return href

        const pathMatch = LEGACY_CHALLENGE_PATH_PATTERN.exec(url.pathname)
        if (!pathMatch) return href

        const normalizedRoutePrefix = routePrefix.replace(/\/+$/, '')
        return `${normalizedRoutePrefix}/challenge/${pathMatch[1]}${url.search}${url.hash}`
    } catch (error) {
        return href
    }
}

/**
 * Applies React Markdown's URI safety policy before canonicalizing legacy
 * first-party challenge links for the active application host.
 *
 * @param href authored Markdown link.
 * @returns safe link, with exact legacy challenge-detail URLs made canonical.
 * @throws Does not throw for malformed links.
 */
export function transformChallengeMarkdownLink(href: string): string {
    const safeHref = uriTransformer(href)
    const routePrefix = EnvironmentConfig.SUBDOMAIN === AppSubdomain.opportunities
        ? ''
        : `/${AppSubdomain.opportunities}`
    return canonicalizeLegacyChallengeLink(safeHref, EnvironmentConfig.TC_DOMAIN, routePrefix)
}

/**
 * Renders a Markdown heading whose stable fragment matches the generated TOC.
 *
 * @param props heading level, source location, and rendered children from React Markdown.
 * @returns an H2 or H3 with a stable source-line fragment identifier.
 * @throws Does not throw.
 */
const MarkdownHeading: FC<HeadingProps> = props => {
    const label = markdownHeadingText(props.children)
    const line = props.node?.position?.start.line ?? 0
    const id = `${headingSlug(label)}-${line}`
    return props.level === 3
        ? <h3 id={id}>{props.children}</h3>
        : <h2 id={id}>{props.children}</h2>
}

const MARKDOWN_COMPONENTS: Components = {
    h2: MarkdownHeading,
    h3: MarkdownHeading,
}

const MARKDOWN_SANITIZE_SCHEMA = {
    ...defaultSchema,
    tagNames: [...(defaultSchema.tagNames ?? []), 'u'],
}

/**
 * Renders a challenge Markdown specification with fragment-addressable headings.
 *
 * @param props specification Markdown and optional TOC observer.
 * @returns safe Markdown presentation supporting GFM tables and hard breaks.
 * @throws Does not throw.
 */
export const ChallengeMarkdown: FC<ChallengeMarkdownProps> = props => {
    const tableOfContents = useMemo(() => extractTableOfContents(props.markdown), [props.markdown])
    const onTableOfContents = props.onTableOfContents

    useEffect(() => {
        onTableOfContents?.(tableOfContents)
    }, [onTableOfContents, tableOfContents])

    return (
        <article className={styles.markdown}>
            <Markdown
                components={MARKDOWN_COMPONENTS}
                rehypePlugins={[
                    rehypeRaw as any,
                    [rehypeSanitize, MARKDOWN_SANITIZE_SCHEMA] as any,
                ]}
                remarkPlugins={[
                    [remarkGfm, { singleTilde: false }],
                    remarkBreaks,
                ]}
                transformLinkUri={transformChallengeMarkdownLink}
            >
                {props.markdown}
            </Markdown>
        </article>
    )
}

/**
 * Renders Challenge API description fields using their declared format.
 * HTML is sanitized after receipt; every other format uses safe Markdown.
 * When the API returns private details, they are appended without applying a
 * second UI authorization check because Challenge API is authoritative for
 * field visibility.
 *
 * @param props public content, optional private content, and description format.
 * @returns safe formatted challenge requirements.
 * @throws Does not throw.
 */
export const ChallengeDescription: FC<ChallengeDescriptionProps> = props => {
    const htmlFormat = isHtmlDescriptionFormat(props.format)
    const privateDescription = props.privateDescription?.trim()
    /**
     * Selects the safe renderer matching the challenge's declared format.
     *
     * @param content public or API-authorized private description content.
     * @returns sanitized HTML or safe Markdown React content.
     * @throws Does not throw.
     */
    const renderContent = (content: string): ReactNode => (htmlFormat ? (
        <article
            className={styles.markdown}
            dangerouslySetInnerHTML={{ __html: String(DOMPurify.sanitize(content)) }}
        />
    ) : <ChallengeMarkdown markdown={content} />)

    return (
        <>
            {renderContent(props.content)}
            {privateDescription && (
                <section className={styles.privateDetails}>
                    <h2>Registered User Additional Information</h2>
                    {renderContent(privateDescription)}
                </section>
            )}
        </>
    )
}
