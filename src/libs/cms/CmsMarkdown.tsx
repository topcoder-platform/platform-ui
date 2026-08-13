import type { Components, Options as ReactMarkdownOptions } from 'react-markdown'
import type { FC, ReactNode } from 'react'
import DOMPurify from 'dompurify'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

import { getPayloadAssetUrl, getSafeCmsLink } from './cms.client'

const Markdown = ReactMarkdown as unknown as FC<ReactMarkdownOptions>

const CMS_MARKDOWN_SANITIZE_OPTIONS = {
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'loading', 'target'],
    ADD_TAGS: ['iframe'],
} as const

interface CmsMarkdownProps {
    children: string
    className?: string
}

interface MarkdownLinkProps {
    children?: ReactNode
    href?: string
}

interface MarkdownImageProps {
    alt?: string
    src?: string
}

interface MarkdownIframeProps {
    src?: string
    title?: string
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
    return href ? (
        <a href={href} rel='noopener noreferrer' target='_blank'>{props.children}</a>
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

const markdownComponents: Components = {
    a: MarkdownLink as Components['a'],
    iframe: MarkdownIframe as Components['iframe'],
    img: MarkdownImage as Components['img'],
}

/**
 * Renders trusted Payload-authored markdown with safe HTML and approved asset origins.
 *
 * @param props markdown source and optional wrapper class.
 * @returns sanitized, GitHub-flavored markdown content.
 * @throws Does not throw; invalid embedded media is omitted.
 */
export const CmsMarkdown: FC<CmsMarkdownProps> = (props: CmsMarkdownProps) => {
    const sanitized = String(DOMPurify.sanitize(
        props.children || '',
        CMS_MARKDOWN_SANITIZE_OPTIONS as any,
    ))
    return (
        <div className={props.className}>
            <Markdown
                components={markdownComponents}
                rehypePlugins={[rehypeRaw as any]}
                remarkPlugins={[
                    [remarkGfm, { singleTilde: false }],
                    remarkBreaks,
                ]}
            >
                {sanitized}
            </Markdown>
        </div>
    )
}
