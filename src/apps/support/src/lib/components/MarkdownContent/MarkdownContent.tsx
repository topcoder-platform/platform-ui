/** Safe Markdown renderer for user-authored support content. */
import type { FC } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

import styles from './MarkdownContent.module.scss'

export interface MarkdownContentProps {
    markdown: string
}

const markdownComponents: Components = {
    /**
     * Renders a Markdown link in a new tab without exposing the opener page.
     *
     * @param props anchor attributes and AST metadata produced by ReactMarkdown.
     * @returns a safely targeted anchor used for links in support conversations.
     * @throws Does not throw.
     */
    a: props => (
        <a
            href={props.href}
            rel='noopener noreferrer'
            target='_blank'
            title={props.title}
        >
            {props.children}
        </a>
    ),
}

/**
 * Renders GFM and line breaks with links opening in new tabs while dropping raw HTML.
 *
 * @param props untrusted Markdown source.
 * @returns safely rendered Markdown.
 * @throws Does not throw.
 */
export const MarkdownContent: FC<MarkdownContentProps> = props => (
    <div className={styles.markdown}>
        <ReactMarkdown
            components={markdownComponents}
            remarkPlugins={[remarkGfm, remarkBreaks]}
            skipHtml
        >
            {props.markdown}
        </ReactMarkdown>
    </div>
)
