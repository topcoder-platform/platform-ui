import type { Components, Options as ReactMarkdownOptions } from 'react-markdown'
import type { FC, ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

import { getPayloadAssetUrl, getSafeCmsLink } from './cms.client'
import styles from './CmsMarkdown.module.scss'

const Markdown = ReactMarkdown as unknown as FC<ReactMarkdownOptions>

const CUSTOM_MARKDOWN_TAGS = ['anchorlink', 'iframe', 'themedbutton']

const CMS_MARKDOWN_SCHEMA = {
    ...defaultSchema,
    attributes: {
        ...defaultSchema.attributes,
        anchorlink: ['href', 'offset', 'rel', 'target', 'title'],
        iframe: ['allow', 'allowFullScreen', 'frameBorder', 'loading', 'src', 'title'],
        themedbutton: ['href', 'rel', 'target', 'theme', 'title', 'to'],
    },
    tagNames: [
        ...(defaultSchema.tagNames || []),
        ...CUSTOM_MARKDOWN_TAGS,
    ],
}

const RAW_HTML_TAGS = new Set([
    ...(defaultSchema.tagNames || []),
    ...CUSTOM_MARKDOWN_TAGS,
    'applet',
    'base',
    'embed',
    'form',
    'frame',
    'frameset',
    'link',
    'marquee',
    'math',
    'meta',
    'object',
    'script',
    'style',
    'svg',
])

interface CmsMarkdownProps {
    children: string
    className?: string
}

/* eslint-disable react/no-unused-prop-types */
interface MarkdownLinkProps {
    children?: ReactNode
    href?: string
    rel?: string
    target?: string
    title?: string
}

interface MarkdownImageProps {
    alt?: string
    src?: string
}

interface MarkdownIframeProps {
    src?: string
    title?: string
}

interface MarkdownCustomLinkProps extends MarkdownLinkProps {
    offset?: string | number
    theme?: string
    to?: string
}

export interface MarkdownAstNode {
    children?: MarkdownAstNode[]
    type?: string
    value?: string
}

/**
 * Determines whether a Markdown HTML token represents authored markup rather
 * than a generic type such as `<int>`.
 *
 * @param value raw MDAST HTML token.
 * @returns true for known HTML/custom elements and HTML declarations.
 * @throws Does not throw.
 */
function isAuthoredHtml(value: string): boolean {
    if (/^\s*<[!?]/.test(value)) return true
    const match = value.match(/^\s*<\/?\s*([A-Za-z][\w-]*)/)
    return !!match && RAW_HTML_TAGS.has(match[1].toLowerCase())
}

/**
 * Converts unknown HTML-shaped MDAST tokens back to text before raw HTML is
 * parsed. Markdown treats `vector<int>` as an `int` element; restoring that
 * token to text preserves generic syntax while known markup continues through
 * the HTML sanitizer.
 *
 * @param tree Markdown abstract syntax tree.
 * @returns void after updating generic tokens in place for the unified pipeline.
 * @throws Does not throw.
 */
export function preserveGenericSyntax(tree: MarkdownAstNode): void {
    if (tree.type === 'html' && tree.value && !isAuthoredHtml(tree.value)) {
        tree.type = 'text'
    }

    tree.children?.forEach(preserveGenericSyntax)
}

/**
 * Unified remark plugin that preserves angle-bracket generic type expressions.
 *
 * @returns a Markdown AST transformer used before rehype-raw.
 * @throws Does not throw.
 */
function remarkPreserveGenericSyntax(): (tree: MarkdownAstNode) => void {
    return preserveGenericSyntax
}

/**
 * Returns the safe target behavior for an authored CMS link.
 *
 * @param href sanitized link destination.
 * @param requestedTarget optional authored target value.
 * @returns `_blank` for explicit new-window links, otherwise no target.
 * @throws Does not throw.
 */
function safeLinkTarget(href: string, requestedTarget?: string): '_blank' | undefined {
    if (requestedTarget === '_blank') return '_blank'
    if (/^https?:\/\//i.test(href)) return '_blank'
    return undefined
}

/**
 * Renders a CMS-authored link while blocking retired Contentful and Octana hosts.
 *
 * @param props markdown link target and children.
 * @returns safe anchor content, or plain content when the target is blocked.
 * @throws Does not throw.
 */
const MarkdownLink: FC<MarkdownLinkProps> = (props: MarkdownLinkProps) => {
    const href = getSafeCmsLink(props.href)
    const target = href ? safeLinkTarget(href, props.target) : undefined
    return href ? (
        <a
            href={href}
            rel={target === '_blank' ? 'noopener noreferrer' : props.rel}
            target={target}
            title={props.title}
        >
            {props.children}
        </a>
    ) : <span>{props.children}</span>
}

/**
 * Renders only images that Payload has migrated to assets.topcoder-dev.com.
 *
 * @param props markdown image source and alternative text.
 * @returns an image for the approved media origin, or no element for legacy origins.
 * @throws Does not throw.
 */
const MarkdownImage: FC<MarkdownImageProps> = (props: MarkdownImageProps) => {
    const src = getPayloadAssetUrl(props.src)
    return src ? <img alt={props.alt || ''} loading='lazy' src={src} /> : <></>
}

/**
 * Renders CMS video embeds only for YouTube's HTTPS player origin.
 *
 * @param props iframe source and accessible title.
 * @returns an allow-listed iframe, or no element for an unsupported source.
 * @throws Does not throw for malformed URLs.
 */
const MarkdownIframe: FC<MarkdownIframeProps> = (props: MarkdownIframeProps) => {
    try {
        const src = new URL(props.src || '')
        if (src.protocol !== 'https:' || !['www.youtube.com', 'youtube.com'].includes(src.hostname)) {
            return <></>
        }

        return (
            <iframe
                allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                allowFullScreen
                src={src.toString()}
                title={props.title || 'Embedded video'}
            />
        )
    } catch (error) {
        return <></>
    }
}

/**
 * Renders the legacy `ThemedButton` Markdown extension as a safe link styled
 * like a call-to-action.
 *
 * @param props legacy theme, destination, and link content.
 * @returns a themed anchor, or plain content when its destination is unsafe.
 * @throws Does not throw.
 */
export const MarkdownThemedButton: FC<MarkdownCustomLinkProps> = (props: MarkdownCustomLinkProps) => {
    const href = getSafeCmsLink(props.to || props.href)
    if (!href) return <span>{props.children}</span>

    const target = safeLinkTarget(href, props.target)
    return (
        <a
            className={styles.themedButton}
            data-theme={props.theme}
            href={href}
            rel={target === '_blank' ? 'noopener noreferrer' : props.rel}
            target={target}
            title={props.title}
        >
            {props.children}
        </a>
    )
}

/**
 * Renders the legacy `AnchorLink` Markdown extension as a safe fragment link.
 * Native fragment navigation retains keyboard and no-JavaScript behavior; the
 * wrapper stylesheet enables smooth scrolling in supporting browsers.
 *
 * @param props authored fragment destination and link content.
 * @returns a safe anchor, or plain content for a non-fragment/unsafe target.
 * @throws Does not throw.
 */
export const MarkdownAnchorLink: FC<MarkdownCustomLinkProps> = (props: MarkdownCustomLinkProps) => {
    const href = getSafeCmsLink(props.href)
    return href?.startsWith('#') ? (
        <a className={styles.anchorLink} data-offset={props.offset} href={href} title={props.title}>
            {props.children}
        </a>
    ) : <span>{props.children}</span>
}

const markdownComponents = {
    a: MarkdownLink as Components['a'],
    anchorlink: MarkdownAnchorLink,
    iframe: MarkdownIframe as Components['iframe'],
    img: MarkdownImage as Components['img'],
    themedbutton: MarkdownThemedButton,
} as Components

/**
 * Renders trusted Payload-authored markdown with safe HTML and approved asset origins.
 *
 * @param props markdown source and optional wrapper class.
 * @returns sanitized, GitHub-flavored markdown content.
 * @throws Does not throw; invalid embedded media is omitted.
 */
export const CmsMarkdown: FC<CmsMarkdownProps> = (props: CmsMarkdownProps) => (
    <div className={[styles.markdown, props.className].filter(Boolean)
        .join(' ')}
    >
        <Markdown
            components={markdownComponents}
            rehypePlugins={[
                rehypeRaw as any,
                [rehypeSanitize, CMS_MARKDOWN_SCHEMA] as any,
            ]}
            remarkPlugins={[
                [remarkGfm, { singleTilde: false }],
                remarkBreaks,
                remarkPreserveGenericSyntax,
            ]}
        >
            {props.children || ''}
        </Markdown>
    </div>
)
