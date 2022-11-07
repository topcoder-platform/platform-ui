// tslint:disable-next-line: no-submodule-imports
import 'highlight.js/styles/base16/tomorrow-night.css'
import _ from 'lodash'
import { marked, Renderer as MarkedRenderer } from 'marked'
import * as React from 'react'

import MarkdownAccordion from '../MarkdownAccordion'
import MarkdownCode from '../MarkdownCode'
import styles from '../MarkdownDoc.module.scss'
import MarkdownImages from '../MarkdownImages'
import MarkdownLink from '../MarkdownLink'

export type MarkdownString = string
export type MarkdownResult = React.ReactNode
export type TOC = Array<{ headingId: string; level: number; title: string }>

export enum MarkdownHeaderTag {
    h1 = 'h1',
    h2 = 'h2',
    h3 = 'h3',
    h4 = 'h4',
    h5 = 'h5',
    h6 = 'h6',
}

enum MarkdownParagraphTag {
    p = 'p',
}
export interface MarkdownRenderOptions {
    baseUrl?: string
    groupBy?: MarkdownHeaderTag
    highlightCode?: (code: string, lang: string) => string
    sanitize?: boolean
    toc?: TOC
    sanitizer?(html: string): string
}

interface MarkdownRenderer {
    render(
        markdown: MarkdownString,
        options?: MarkdownRenderOptions
    ): React.ReactNode
}

interface MarkdownTagClassName {
    code: any
    codespan: any
    heading: any
    list: any
    paragraph: any
}

export class Renderer implements MarkdownRenderer {
    static getInstance(): Renderer {
        if (!this.instance) {
            this.instance = new Renderer()
        }

        return this.instance
    }

    private renderer: MarkedRenderer

    static instance: Renderer

    constructor() {
        this.renderer = new marked.Renderer()
    }

    render(
        markdown: MarkdownString,
        options?: MarkdownRenderOptions
    ): React.ReactNode {
        markdown = markdown || ''
        if (markdown.length > 100_000) {
            markdown = `${markdown.slice(0, 100_000)}…`
        }

        const tokens: marked.TokensList = marked.lexer(markdown)
        const nodes: Array<React.ReactNode> = tokens.map((token, index) =>
            this.parseToken(token, index, options)
        )
        const children: ReturnType<typeof this.groupBy> = this.groupBy(
            nodes,
            options
        ).map((node) => {
            if (Array.isArray(node)) {
                return (
                    <MarkdownAccordion>
                        {React.Children.map(node, (child) => child)}
                    </MarkdownAccordion>
                )
            }

            return node
        })

        return (
            <div className={styles['markdown-doc']}>
                {React.Children.map(children, (child) => child)}
            </div>
        )
    }

    // Hard to avoid due to the complexity of group by
    // tslint:disable-next-line: cyclomatic-complexity
    private groupBy(
        nodes: Array<React.ReactNode>,
        options?: MarkdownRenderOptions
    ): Array<React.ReactNode | Array<React.ReactNode>> {
        const result: Array<React.ReactNode> = []
        let group: Array<React.ReactNode | []> = []
        let beginGroup: boolean = false
        let isAppending: boolean = false
        let endGroup: boolean = false

        const isH1Tag: (tagName: keyof JSX.IntrinsicElements) => boolean = (
            tagName: keyof JSX.IntrinsicElements
        ) => tagName === MarkdownHeaderTag.h1
        const isGroupByTag: (
            tagName: keyof JSX.IntrinsicElements
        ) => boolean = (tagName: keyof JSX.IntrinsicElements) => !!tagName && options?.groupBy === tagName

        for (const nodeElem of nodes) {
            if (!React.isValidElement(nodeElem)) {
                continue
            }

            const node: React.ReactElement = nodeElem as React.ReactElement
            const nodeType: React.ReactElement['type'] = node.type

            if (
                typeof nodeType === 'string' &&
                isGroupByTag(nodeType as keyof JSX.IntrinsicElements)
            ) {
                beginGroup = true
                isAppending = false
            }

            if (
                typeof nodeType === 'string' &&
                isH1Tag(nodeType as keyof JSX.IntrinsicElements)
            ) {
                endGroup = true
            }

            if (endGroup) {
                beginGroup = false
                isAppending = false
                endGroup = false
            }

            if (beginGroup) {
                if (isAppending) {
                    group.push(node)
                } else {
                    group = []
                    group.push(node)
                    result.push(group)
                }

                isAppending = true
                endGroup = false
            } else {
                result.push(node)
            }
        }

        return result
    }

    // Hard to avoid due to the complexity of parsing markdown token.
    // tslint:disable-next-line: cyclomatic-complexity
    private parseToken(
        token: marked.Token,
        index: number,
        options?: MarkdownRenderOptions
    ): React.ReactNode {
        const isLinkBlock: (t: marked.Token) => boolean = (t: marked.Token) => {
            t = t as marked.Tokens.Paragraph
            if (
                t.type === 'paragraph' &&
                t.tokens &&
                t.tokens.length === 1 &&
                t.tokens[0].type === 'link'
            ) {
                return true
            }

            return false
        }

        const isCodeBlock: (t: marked.Token) => boolean = (t: marked.Token) => {
            t = t as marked.Tokens.Code
            if (t.type === 'code') {
                return true
            }

            return false
        }

        const isImagesBlock: (t: marked.Token) => boolean = (
            t: marked.Token
        ) => {
            const isLineBreak: (tt: marked.Token) => boolean = (
                tt: marked.Token
            ) => tt.type === 'text' && tt.text === '\n'
            t = t as marked.Tokens.Paragraph
            if (
                t.type === 'paragraph' &&
                t.tokens &&
                t.tokens.length !== 0 &&
                t.tokens
                    .filter((child) => !isLineBreak(child))
                    .every((child) => child.type === 'image') &&
                t.tokens.filter((child) => !isLineBreak(child)).length >= 1
            ) {
                return true
            }

            return false
        }

        const getClassname: (t: marked.Token) => string = (t: marked.Token) => {
            const classnameMapping: MarkdownTagClassName = {
                code: t.lang
                    ? `${styles.codeBlock} ${styles[`language-${t.lang}`]}`
                    : styles.codeBlock,
                codespan: styles.codeInline,
                heading: styles[`heading${t.depth}`],
                list: styles[`${t.ordered ? 'orderedList' : 'unorderedList'}`],
                paragraph: styles.paragraph,
            }

            return _.get(classnameMapping, t.type, '')
        }

        const stripTag: (htmlString: string, tagname: string) => string = (
            htmlString: string,
            tagname: string
        ) => {
            const tagRegExp: RegExp = new RegExp(
                `<${tagname}\\b[^>]*>((.|\\n)*?)</${tagname}>`,
                'g'
            )
            return htmlString.replace(tagRegExp, '$1')
        }

        const extractId: (htmlString: string, tagname: string, leadingIndex: number) => string = (
            htmlString: string,
            tagname: string,
            leadingIndex: number
        ) => {
            htmlString = htmlString.trim()
            const tagRegExp: RegExp = new RegExp(
                `<${tagname}\\b[^>]*id="(.*?)"[^>]*>((.|\\n)*?)</${tagname}>$`,
                'g'
            )
            const matches: RegExpExecArray | null = tagRegExp.exec(htmlString)
            const id: string = matches ? matches[1] : ''
            return `${leadingIndex}-${id}`
        }

        const extractTag: (htmlString: string) => string = (
            htmlString: string
        ) => {
            htmlString = htmlString.trim()
            const tagRegExp: RegExp =
                /^<([a-zA-Z0-9]+)\b[^>]*?>(.|n)*?<\/\1>$/g
            const matches: RegExpExecArray | null = tagRegExp.exec(htmlString)
            return matches ? matches[1] : ''
        }

        const removeLineBreak: (htmlString: string) => string = (
            htmlString: string
        ) => htmlString.replace(/\n/g, '')
        const parserOptions: marked.MarkedOptions = {
            baseUrl: options?.baseUrl,
            headerIds: true,
            headerPrefix: '',
            highlight: options?.highlightCode,
            langPrefix: '',
            renderer: this.renderer,
        }
        const createElement: (
            element: React.ElementType,
            elementProps: any
        ) => React.ReactElement = (
            element: React.ElementType,
            elementProps: any
        ) => React.createElement(element, elementProps)

        if (options && options.toc && token.type === 'heading') {
            const h: string = marked.parser([token], parserOptions)
            const level: number = token.depth
            const title: string = removeLineBreak(stripTag(h, `h${level}`))
            const headingId: string = extractId(h, `h${level}`, index).trim()

            options.toc.push({
                headingId,
                level,
                title,
            })
        }

        let html: string = marked.parser([token], parserOptions)

        if (options && options.sanitize && options.sanitizer) {
            html = options.sanitizer(html)
        }

        if (isLinkBlock(token)) {
            token = token as marked.Tokens.Paragraph
            const link: marked.Tokens.Link = token.tokens.find(
                (t) => t.type === 'link'
            ) as marked.Tokens.Link
            return (
                <MarkdownLink href={link?.href}>
                    {createElement('span', {
                        dangerouslySetInnerHTML: { __html: html },
                    })}
                </MarkdownLink>
            )
        }

        if (isCodeBlock(token)) {
            token = token as marked.Tokens.Code
            return (
                <MarkdownCode code={token.text} lang={token.lang}>
                    {createElement('div', {
                        dangerouslySetInnerHTML: { __html: html },
                    })}
                </MarkdownCode>
            )
        }

        if (isImagesBlock(token)) {
            token = token as marked.Tokens.Paragraph
            const length: number = token.tokens.filter(
                (t) => t.type === 'image'
            ).length
            const images: Array<JSX.Element> = token.tokens
                .filter((t) => t.type === 'image')
                .map((t, idx) => (
                    <img
                        src={require(`../../../${  t.href.slice(2)}`)}
                        alt=''
                        key={idx}
                    />
                ))
            return <MarkdownImages length={length}>{images}</MarkdownImages>
        }

        if (!html) {
            return undefined
        }

        const tag: string = extractTag(html)
        if (tag) {
            const isParagraphTag: boolean = tag === MarkdownParagraphTag.p
            const isHeaderTag: boolean = Object.values(MarkdownHeaderTag).indexOf(tag as MarkdownHeaderTag) !== -1
            if (isParagraphTag || isHeaderTag) {
                let id: string | undefined
                if (isHeaderTag) {
                    token = token as marked.Tokens.Heading
                    id = extractId(html, `h${token.depth}`, index).trim()
                }

                return React.createElement(tag, {
                    className: getClassname(token),
                    dangerouslySetInnerHTML: { __html: stripTag(html, tag) },
                    id,
                })
            }
        }

        return (
            <span
                className={getClassname(token)}
                dangerouslySetInnerHTML={{ __html: html }}
            />
        )
    }
}
