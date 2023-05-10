import * as React from 'react'

import { MarkdownResult, TOC } from './markdownRenderer'
import LayoutDoc from './LayoutDoc'

interface MarkdownDocProps {
    disableToc?: boolean
    doc: MarkdownResult
    toc: TOC
}

const MarkdownDoc: React.FC<MarkdownDocProps> = props => (
    <LayoutDoc disableToc={props.disableToc ?? false} toc={props.toc}>
        {props.doc}
    </LayoutDoc>
)

export default MarkdownDoc
