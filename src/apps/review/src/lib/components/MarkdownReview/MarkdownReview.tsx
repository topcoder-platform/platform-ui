/**
 * Markdown Review.
 */
import { FC } from 'react'
import ReactMarkdown from 'react-markdown'
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

export const MarkdownReview: FC<Props> = (props: Props) => (
    <div className={classNames(styles.container, props.className)}>
        {/* @ts-expect-error: TS2786: ReactMarkdown cannot be used as a JSX component */}
        <ReactMarkdown
            remarkPlugins={[
                remarkFrontmatter,
                remarkParse as any,
                [remarkGfm, { singleTilde: false }],
                remarkBreaks,
            ]}
            rehypePlugins={[rehypeStringify as any, rehypeRaw as any]}
        >
            {props.value}
        </ReactMarkdown>
    </div>
)

export default MarkdownReview
