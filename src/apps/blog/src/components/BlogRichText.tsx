import type { FC, ReactNode } from 'react'
import { Fragment } from 'react'

import type { CmsAssetFields, CmsResource } from '~/libs/cms'
import { getCmsResourceAssetUrl, getSafeCmsLink } from '~/libs/cms'

import type { BlogRichTextDocument, BlogRichTextNode } from '../models'

interface BlogRichTextProps {
    className?: string
    document?: BlogRichTextDocument | string
}

/**
 * Identifies a resolved CMS Entry embedded in Rich Text node data.
 *
 * @param value possible retained link or resolved CMS record.
 * @returns true when the value has Entry metadata and a fields object.
 * @throws Does not throw.
 */
function isEmbeddedEntry(value: unknown): value is CmsResource {
    if (!value || typeof value !== 'object') {
        return false
    }

    const resource = value as Partial<CmsResource>
    return resource.sys?.type === 'Entry' && Boolean(resource.fields)
}

/**
 * Reads the first non-empty text field from a resolved embedded Entry.
 *
 * @param entry resolved CMS Entry.
 * @param names ordered candidate field names.
 * @returns the first string value, or an empty string.
 * @throws Does not throw.
 */
function embeddedEntryText(entry: CmsResource, ...names: string[]): string {
    return names.map(name => entry.fields[name])
        .find((value): value is string => typeof value === 'string' && Boolean(value.trim())) || ''
}

/**
 * Resolves a safe destination from a Page, external link, or nested Entry relationship.
 *
 * @param value resolved Entry containing a URL, href, slug, or linked destination.
 * @param visited retained IDs already followed while resolving nested links.
 * @returns a safe root-relative or approved external URL, or undefined.
 * @throws Does not throw for malformed and cyclic relationships.
 */
export function getBlogEmbeddedEntryHref(
    value: unknown,
    visited: ReadonlySet<string> = new Set(),
): string | undefined {
    if (!isEmbeddedEntry(value) || visited.has(value.sys.id)) {
        return undefined
    }

    const nextVisited = new Set(visited)
    nextVisited.add(value.sys.id)
    const direct = embeddedEntryText(value, 'url', 'href')
    if (direct) {
        return getSafeCmsLink(direct)
    }

    const slug = embeddedEntryText(value, 'slug')
    if (slug) {
        return getSafeCmsLink(`/${slug.replace(/^\/+/, '')}`)
    }

    return ['link', 'target', 'page']
        .map(name => getBlogEmbeddedEntryHref(value.fields[name], nextVisited))
        .find(Boolean)
}

/**
 * Parses a possible serialized Rich Text document without accepting arbitrary HTML or Markdown.
 *
 * @param value Payload Rich Text object or JSON string.
 * @returns a structurally valid Rich Text document, or undefined for malformed values.
 * @throws Does not throw; invalid JSON is treated as unavailable content.
 */
export function normalizeBlogRichTextDocument(
    value: BlogRichTextDocument | string | undefined,
): BlogRichTextDocument | undefined {
    let parsed: unknown = value
    if (typeof value === 'string') {
        try {
            parsed = JSON.parse(value)
        } catch (error) {
            return undefined
        }
    }

    if (!parsed || typeof parsed !== 'object') {
        return undefined
    }

    const document = parsed as Partial<BlogRichTextDocument>
    return document.nodeType === 'document' && Array.isArray(document.content)
        ? document as BlogRichTextDocument
        : undefined
}

/**
 * Applies the supported Rich Text marks to a React-escaped text value.
 *
 * @param node Rich Text text node containing value and marks.
 * @param key stable render key for nested marked elements.
 * @returns safely escaped text wrapped by supported semantic elements.
 * @throws Does not throw; unsupported marks are ignored.
 */
function renderMarkedText(node: BlogRichTextNode, key: string): ReactNode {
    let rendered: ReactNode = node.value || ''
    const marks = node.marks || []
    marks.forEach((mark, index) => {
        const markKey = `${key}-mark-${index}`
        switch (mark.type) {
            case 'bold':
                rendered = <strong key={markKey}>{rendered}</strong>
                break
            case 'italic':
                rendered = <em key={markKey}>{rendered}</em>
                break
            case 'underline':
                rendered = <u key={markKey}>{rendered}</u>
                break
            case 'code':
                rendered = <code key={markKey}>{rendered}</code>
                break
            case 'superscript':
                rendered = <sup key={markKey}>{rendered}</sup>
                break
            case 'subscript':
                rendered = <sub key={markKey}>{rendered}</sub>
                break
            case 'strikethrough':
                rendered = <s key={markKey}>{rendered}</s>
                break
            default:
                break
        }
    })
    return rendered
}

/**
 * Reads an approved Payload asset from an embedded Rich Text target.
 *
 * @param target target resource supplied in a Rich Text node's data.
 * @returns image URL and accessible label, or undefined for unresolved/non-approved assets.
 * @throws Does not throw.
 */
function getEmbeddedAsset(target: unknown): { alt: string; url: string } | undefined {
    const resource = target as CmsResource<CmsAssetFields> | undefined
    const url = getCmsResourceAssetUrl(resource)
    if (!url) {
        return undefined
    }

    return {
        alt: resource?.fields?.description || resource?.fields?.title || '',
        url,
    }
}

/**
 * Renders a resolved Rich Text Entry through a small, safe set of website article components.
 *
 * Component images retain their approved Payload Asset and optional link/caption. Text and inline
 * records recursively render Rich Text, while links and anchors retain their authored semantics.
 * Unknown records fall back to safe Rich Text or text fields so known article copy is not discarded.
 *
 * @param target resolved Entry stored under a Rich Text node's `data.target`.
 * @param key stable render key for the embedded component.
 * @returns safe semantic React content, or undefined for unresolved/empty Entries.
 * @throws Does not throw for malformed Entry fields.
 */
export function renderEmbeddedBlogEntry(target: unknown, key: string): ReactNode {
    if (!isEmbeddedEntry(target)) {
        return undefined
    }

    const type = target.sys.contentType?.sys.id || ''
    if (type === 'componentImage') {
        const asset = getEmbeddedAsset(target.fields.image)
        if (!asset) {
            return undefined
        }

        const caption = embeddedEntryText(target, 'caption', 'title', 'name')
        const image = (
            <figure key={`${key}-figure`}>
                <img alt={asset.alt || caption} loading='lazy' src={asset.url} />
                {caption && <figcaption>{caption}</figcaption>}
            </figure>
        )
        const href = getBlogEmbeddedEntryHref(target.fields.link)
        return href ? <a href={href} key={key}>{image}</a> : image
    }

    if (type === 'componentAnchor') {
        const fragment = embeddedEntryText(target, 'fragment', 'name')
            .replace(/^#/u, '')
            .replace(/[^a-zA-Z0-9_-]/gu, '-')
        return fragment ? <span className='blog-rich-text-anchor' id={fragment} key={key} /> : undefined
    }

    if (['componentLinkButton', 'componentRegisterButton', 'externalLink', 'page'].includes(type)) {
        const label = embeddedEntryText(target, 'label', 'navigationTitle', 'title', 'name')
        const href = getBlogEmbeddedEntryHref(target)
        return label && href ? <a href={href} key={key}>{label}</a> : label
    }

    const richValue = ['body', 'content', 'text', 'description']
        .map(name => target.fields[name])
        .find(value => Boolean(normalizeBlogRichTextDocument(value as BlogRichTextDocument | string | undefined)))
    const document = normalizeBlogRichTextDocument(richValue as BlogRichTextDocument | string | undefined)
    if (document) {
        const content = renderBlogRichTextNode(document, `${key}-content`)
        return type === 'componentInlineElement'
            ? <span key={key}>{content}</span>
            : <div key={key}>{content}</div>
    }

    const label = embeddedEntryText(target, 'title', 'header', 'label', 'name')
    return label || undefined
}

/**
 * Renders one Payload Rich Text node using a fixed allowlist of semantic React elements.
 *
 * @param node Rich Text node to render.
 * @param key stable key identifying the node's position in the document.
 * @returns escaped React content; unsupported nodes retain only safe child content.
 * @throws Does not throw for malformed node data.
 */
export function renderBlogRichTextNode(node: BlogRichTextNode, key: string): ReactNode {
    if (!node || typeof node !== 'object' || typeof node.nodeType !== 'string') {
        return undefined
    }

    if (node.nodeType === 'text') {
        return renderMarkedText(node, key)
    }

    const children = (Array.isArray(node.content) ? node.content : [])
        .map((child, index) => renderBlogRichTextNode(child, `${key}-${index}`))
    switch (node.nodeType) {
        case 'document':
            return <Fragment key={key}>{children}</Fragment>
        case 'paragraph':
            return <p key={key}>{children}</p>
        case 'heading-1':
            return <h1 key={key}>{children}</h1>
        case 'heading-2':
            return <h2 key={key}>{children}</h2>
        case 'heading-3':
            return <h3 key={key}>{children}</h3>
        case 'heading-4':
            return <h4 key={key}>{children}</h4>
        case 'heading-5':
            return <h5 key={key}>{children}</h5>
        case 'heading-6':
            return <h6 key={key}>{children}</h6>
        case 'unordered-list':
            return <ul key={key}>{children}</ul>
        case 'ordered-list':
            return <ol key={key}>{children}</ol>
        case 'list-item':
            return <li key={key}>{children}</li>
        case 'blockquote':
            return <blockquote key={key}>{children}</blockquote>
        case 'hr':
            return <hr key={key} />
        case 'table':
            return <table key={key}><tbody>{children}</tbody></table>
        case 'table-row':
            return <tr key={key}>{children}</tr>
        case 'table-cell':
            return <td key={key}>{children}</td>
        case 'table-header-cell':
            return <th key={key}>{children}</th>
        case 'hyperlink': {
            const uri = typeof node.data?.uri === 'string' ? node.data.uri : undefined
            const href = getSafeCmsLink(uri)
            return href
                ? <a href={href} key={key}>{children}</a>
                : <Fragment key={key}>{children}</Fragment>
        }

        case 'entry-hyperlink': {
            const href = getBlogEmbeddedEntryHref(node.data?.target)
            return href
                ? <a href={href} key={key}>{children}</a>
                : <Fragment key={key}>{children}</Fragment>
        }

        case 'asset-hyperlink': {
            const asset = getEmbeddedAsset(node.data?.target)
            return asset
                ? <a href={asset.url} key={key}>{children}</a>
                : <Fragment key={key}>{children}</Fragment>
        }

        case 'embedded-asset-block': {
            const asset = getEmbeddedAsset(node.data?.target)
            return asset ? <img alt={asset.alt} key={key} loading='lazy' src={asset.url} /> : undefined
        }

        case 'embedded-entry-block':
        case 'embedded-entry-inline':
            return renderEmbeddedBlogEntry(node.data?.target, key)

        default:
            return <Fragment key={key}>{children}</Fragment>
    }
}

/**
 * Renders Payload's Contentful-compatible Rich Text JSON without raw HTML injection.
 *
 * @param props Rich Text document and optional wrapper class.
 * @returns an allowlisted semantic rendering, or null for malformed content.
 * @throws Does not throw; serialized JSON parse failures render no content.
 */
export const BlogRichText: FC<BlogRichTextProps> = (props: BlogRichTextProps) => {
    const document = normalizeBlogRichTextDocument(props.document)
    return document
        ? <div className={props.className}>{renderBlogRichTextNode(document, 'blog-rich-text')}</div>
        : null // eslint-disable-line unicorn/no-null
}
