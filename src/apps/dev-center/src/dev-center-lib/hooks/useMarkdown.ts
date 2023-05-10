import * as React from 'react'
import { noop } from 'lodash'

import {
    MarkdownResult,
    MarkdownString,
    renderMarkdown,
    TOC,
} from '../MarkdownDoc/markdownRenderer'

export interface UseMarkdownProps {
    uri: string
}

export default function useMarkdown({ uri }: UseMarkdownProps): {
    doc: MarkdownResult;
    title: string;
    toc: TOC;
} {
    const [markdown, setMarkdown]: [
        MarkdownString,
        React.Dispatch<React.SetStateAction<MarkdownString>>
    ] = React.useState<MarkdownString>('')
    const [doc, setDoc]: [
        MarkdownResult,
        React.Dispatch<React.SetStateAction<MarkdownResult>>
    ] = React.useState<MarkdownResult>()
    const [toc, setToc]: [TOC, React.Dispatch<React.SetStateAction<TOC>>]
        = React.useState<TOC>([])
    const [title, setTitle]: [
        string,
        React.Dispatch<React.SetStateAction<string>>
    ] = React.useState('')

    React.useEffect(() => {
        setMarkdown('')
        setDoc(undefined)
        setToc([])
        setTitle('')

        fetch(uri)
            .then(response => response.text())
            .then(text => {
                setMarkdown(text)
            })
            .catch(noop)
    }, [uri])

    React.useEffect(() => {
        if (markdown) {
            const result: ReturnType<typeof renderMarkdown>
                = renderMarkdown(markdown)
            setDoc(result.doc)
            setToc(result.toc)
            setTitle(result.title)
        }
    }, [markdown])

    return { doc, title, toc }
}
