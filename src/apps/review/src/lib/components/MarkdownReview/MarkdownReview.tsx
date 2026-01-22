/**
 * Markdown Review.
 */
import { FC } from 'react'
import ReactMarkdown, { type Options as ReactMarkdownOptions } from 'react-markdown'
import classNames from 'classnames'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import remarkBreaks from 'remark-breaks'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'

import styles from './MarkdownReview.module.scss'

interface Props {
    className?: string
    value: string
}

const Markdown = ReactMarkdown as unknown as FC<ReactMarkdownOptions>

export const MarkdownReview: FC<Props> = (props: Props) => (
    <div className={classNames(styles.container, props.className)}>
        <Markdown
            remarkPlugins={[
                remarkFrontmatter,
                remarkParse as any,
                [remarkGfm, { singleTilde: false }],
                remarkBreaks,
            ]}
            rehypePlugins={[rehypeStringify as any, rehypeRaw as any]}
        >
            {props.value}
        </Markdown>
    </div>
)

export default MarkdownReview
