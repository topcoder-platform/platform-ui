import * as React from 'react'

import { MarkdownResult, TOC } from './markdownRenderer'
import LayoutDoc from './LayoutDoc'

interface MarkdownDocProps {
    disableToc?: boolean
    doc: MarkdownResult
    toc: TOC
}

export const MarkdownDoc: React.FC<MarkdownDocProps> = props => {
    const { doc, toc, disableToc = false }: MarkdownDocProps = props

    return (
        <LayoutDoc disableToc={disableToc} toc={toc}>
            {doc}
        </LayoutDoc>
    )
}

export default MarkdownDoc
