import { AnchorHTMLAttributes, FC } from 'react'
import remarkGfm from 'remark-gfm-v4'

import { MarkdownTextPrimitive } from '@assistant-ui/react-markdown'

import styles from './MarkdownText.module.scss'

// remark-gfm-v4 is aliased to remark-gfm@4 (see package.json) instead of the
// shared `remark-gfm@^3.0.1` top-level pin: @assistant-ui/react-markdown
// vendors its own react-markdown@10/unified@11 pipeline, which remark-gfm@3
// (built for unified@9/10) isn't guaranteed to parse tables correctly
// against. The alias resolves to an isolated nested install, so this
// doesn't touch the v3 pin other apps' markdown pipelines (engagements,
// profiles, support) rely on.

// Every link the agent renders (challenge titles included) should open in a
// new tab rather than navigate away from the chat.
const MarkdownLink: FC<AnchorHTMLAttributes<HTMLAnchorElement>> = props => (
    <a {...props} target='_blank' rel='noopener noreferrer'>
        {props.children}
    </a>
)

const MarkdownText: FC = () => (
    <MarkdownTextPrimitive
        className={styles.markdown}
        components={{ a: MarkdownLink }}
        remarkPlugins={[remarkGfm]}
    />
)

export default MarkdownText
