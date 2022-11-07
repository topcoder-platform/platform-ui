import DOMPurify from 'dompurify'
import hljs from 'highlight.js'

import { MarkdownHeaderTag, MarkdownRenderOptions, MarkdownString, Renderer, TOC } from './renderer'

export function renderMarkdown(
    markdown: MarkdownString,
    options?: MarkdownRenderOptions
): { doc: React.ReactNode; title: string; toc: TOC } {
    const renderer: Renderer = Renderer.getInstance()
    const defaultOptions: MarkdownRenderOptions = {
        baseUrl: '/',
        groupBy: MarkdownHeaderTag.h3,
        highlightCode(code: string, lang: string): string {
            const language: string = hljs.getLanguage(lang) ? lang : ''
            return language ? hljs.highlight(code, { language }).value : code
        },
        sanitize: true,
        sanitizer(html: string): string {
            return DOMPurify.sanitize(html)
        },
        toc: [],
    }
    const getTitle: (fromStr: MarkdownString) => {
        s: MarkdownString;
        title: string;
    } = (fromStr: MarkdownString) => {
        const titleRegExp: RegExp = /#[^#].*[\r\n]/
        const matches: RegExpMatchArray | null = fromStr.match(titleRegExp)
        const matchStr: string = matches ? matches[0] : ''
        return matchStr
            ? {
                s: fromStr.replace(matchStr, '').trimStart(),
                title: matchStr.replace(/^#/, '').replace(/`/g, '').trim(),
            }
            : { title, s }
    }

    const { title, s }: ReturnType<typeof getTitle> = getTitle(markdown)
    markdown = title ? s : markdown

    const opts: MarkdownRenderOptions = { ...defaultOptions, ...options }
    const result: ReturnType<Renderer['render']> = renderer.render(
        markdown,
        opts
    )
    const { toc }: { toc: NonNullable<MarkdownRenderOptions['toc']> } =
        opts as { toc: NonNullable<MarkdownRenderOptions['toc']> }

    return { doc: result, toc, title }
}
