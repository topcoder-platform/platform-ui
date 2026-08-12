/** Safe Markdown renderer for user-authored support content. */
import { FC } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

import styles from './MarkdownContent.module.scss'

export interface MarkdownContentProps {
    markdown: string
}

/**
 * Renders GFM and line breaks while dropping raw HTML.
 *
 * @param props untrusted Markdown source.
 * @returns safely rendered Markdown.
 * @throws Does not throw.
 */
export const MarkdownContent: FC<MarkdownContentProps> = props => (
    <div className={styles.markdown}>
        <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            skipHtml
        >
            {props.markdown}
        </ReactMarkdown>
    </div>
)
