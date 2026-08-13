/* eslint-disable ordered-imports/ordered-imports */
import {
    FC,
    isValidElement,
    ReactNode,
    useEffect,
    useMemo,
} from 'react'
import ReactMarkdown, { Components, Options as ReactMarkdownOptions } from 'react-markdown'
import type { HeadingProps } from 'react-markdown/lib/ast-to-react'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

import styles from './ChallengeMarkdown.module.scss'

const Markdown = ReactMarkdown as unknown as FC<ReactMarkdownOptions>

export interface ChallengeTocItem {
    id: string
    label: string
    level: 2 | 3
}

interface ChallengeMarkdownProps {
    markdown: string
    onTableOfContents?: (items: ChallengeTocItem[]) => void
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
                remarkPlugins={[
                    [remarkGfm, { singleTilde: false }],
                    remarkBreaks,
                ]}
            >
                {props.markdown}
            </Markdown>
        </article>
    )
}
