import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
// tslint:disable-next-line no-submodule-imports
import 'highlight.js/styles/base16/tomorrow-night.css'
import { marked, Renderer as MarkedRenderer } from 'marked'
import * as React from 'react'

// tslint:disable-next-line ordered-imports
import styles from './MarkdownDoc.module.scss'
// tslint:disable-next-line ordered-imports
import MarkdownAccordion from './MarkdownAccordion'
import MarkdownCode from './MarkdownCode'
import MarkdownImages from './MarkdownImages'
import MarkdownLink from './MarkdownLink'

export type MarkdownString = string
export type MarkdownResult = React.ReactNode
export type TOC = Array<{ headingId: string, level: number, title: string, }>

interface MarkdownRenderOptions {
  baseUrl?: string
  groupBy?: 'h2'
  highlightCode?: (code: string, lang: string) => string
  sanitize?: boolean
  toc?: TOC
  sanitizer?(html: string): string
}

interface MarkdownRenderer {
  render(markdown: MarkdownString, options?: MarkdownRenderOptions): React.ReactNode
}

class Renderer implements MarkdownRenderer {
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

  render(markdown: MarkdownString, options?: MarkdownRenderOptions): React.ReactNode {
    markdown = markdown || ''
    if (markdown.length > 100_000) {
      markdown = `${markdown.slice(0, 100_000)}…`
    }

    const tokens: marked.TokensList = marked.lexer(markdown)
    const nodes: Array<React.ReactNode> = tokens.map((token) => this.parseToken(token, options))
    const children: ReturnType<typeof this.groupBy> = this.groupBy(nodes, options).map(node => {
      if (Array.isArray(node)) {
        return (
          <MarkdownAccordion>
            {React.Children.map(node, child => child)}
          </MarkdownAccordion>
        )
      }
      return node
    })

    return (
      <div className={styles['markdown-doc']}>
        {React.Children.map(children, child => child)}
      </div>
    )
  }

  // tslint:disable-next-line cyclomatic-complexity
  private groupBy(nodes: Array<React.ReactNode>, options?: MarkdownRenderOptions): Array<React.ReactNode|Array<React.ReactNode>> {
    const result: Array<React.ReactNode> = []
    let group: Array<React.ReactNode | []> = []
    let beginGroup: boolean = false
    let isAppending: boolean = false
    let endGroup: boolean = false

    const isH1Tag: (h1: string) => boolean = (h1: string) => {
      return h1 === 'h1'
    }
    const isGroupByTag: (h: string) => boolean = (h: string) => {
      return !!(options && options.groupBy && options.groupBy === h)
    }

    // tslint:disable-next-line prefer-for-of
    for (let i: number = 0; i < nodes.length; i++) {
      if (!React.isValidElement(nodes[i])) {
        continue
      }

      const node: React.ReactElement = nodes[i] as React.ReactElement
      const nodeType: React.ReactElement['type'] = node.type

      if (typeof nodeType === 'string' && isGroupByTag(nodeType)) {
        beginGroup = true
        isAppending = false
      }

      if (typeof nodeType === 'string' && isH1Tag(nodeType)) {
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

  private parseToken(token: marked.Token, options?: MarkdownRenderOptions): React.ReactNode {
    const isLinkBlock: (t: marked.Token) => boolean = (t: marked.Token) => {
      t = t as marked.Tokens.Paragraph
      if (t.type === 'paragraph'
        && t.tokens
        && t.tokens.length === 1
        && t.tokens[0].type === 'link'
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
    const isImagesBlock: (t: marked.Token) => boolean = (t: marked.Token) => {
      const isLineBreak: (tt: marked.Token) => boolean = (tt: marked.Token) => tt.type === 'text' && tt.text === '\n'
      t = t as marked.Tokens.Paragraph
      if (t.type === 'paragraph'
        && t.tokens
        && t.tokens.length !== 0
        && t.tokens
          .filter(child => !isLineBreak(child))
          .every(child => child.type === 'image')
        && t.tokens
          .filter(child => !isLineBreak(child))
          .length >= 2
      ) {
        return true
      }
      return false
    }
    // tslint:disable-next-line cyclomatic-complexity
    const getClassname: (t: marked.Token) => string = (t: marked.Token) => {
      let cn: string

      switch (t.type) {
      case 'paragraph':
        t = t as marked.Tokens.Paragraph
        cn = styles['paragraph']
        break
      case 'heading':
        t = t as marked.Tokens.Heading
        cn = styles[`heading${t.depth}`]
        break
      case 'list':
        t = t as marked.Tokens.List
        cn = styles[`${t.ordered ? 'orderedList' : 'unorderedList'}`]
        break
      case 'codespan':
        cn = styles['codeInline']
        break
      case 'code':
        t = t as marked.Tokens.Code
        cn = t.lang ? `${styles['codeBlock']} ${styles[`language-${t.lang}`]}` : styles['codeBlock']
        break
      default:
        cn = ''
        break
      }

      return cn
    }
    const stripTag: (htmlString: string, tagname: string) => string = (htmlString: string, tagname: string) => {
      const tagRegExp: RegExp = new RegExp(`<${tagname}\\b[^>]*>((.|\\n)*?)</${tagname}>`, 'g')
      return htmlString.replace(tagRegExp, '$1')
    }
    const extractId: (htmlString: string, tagname: string) => string = (htmlString: string, tagname: string) => {
      htmlString = htmlString.trim()
      const tagRegExp: RegExp = new RegExp(`<${tagname}\\b[^>]*id="(.*?)"[^>]*>((.|\\n)*?)</${tagname}>$`, 'g')
      const matches: RegExpExecArray | null = tagRegExp.exec(htmlString)
      return matches ? matches[1] : ''
    }
    const extractTag: (htmlString: string) => string = (htmlString: string) => {
      htmlString = htmlString.trim()
      const tagRegExp: RegExp = /^<([a-zA-Z0-9]+)\b[^>]*?>(.|n)*?<\/\1>$/g
      const matches: RegExpExecArray | null = tagRegExp.exec(htmlString)
      return matches ? matches[1] : ''
    }
    const removeLineBreak: (htmlString: string) => string = (htmlString: string) => {
      return htmlString.replace(/\n/g, '')
    }
    const parserOptions: marked.MarkedOptions = {
      baseUrl: options?.baseUrl,
      headerIds: true,
      headerPrefix: '',
      highlight: options?.highlightCode,
      langPrefix: '',
      renderer: this.renderer,
    }
    const createElement: (element: React.ElementType, elementProps: any) => React.ReactElement = (element: React.ElementType, elementProps: any) => {
      return React.createElement(element, elementProps)
    }

    if (options && options.toc && token.type === 'heading') {
      const h: string = marked.parser([token], parserOptions)
      const level: number = token.depth
      const title: string = removeLineBreak(stripTag(h, `h${level}`))
      const headingId: string = extractId(h, `h${level}`).trim()

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
      const link: marked.Tokens.Link = token.tokens.find(t => t.type === 'link') as marked.Tokens.Link
      return (
        <MarkdownLink href={link?.href}>
          {createElement('span', { dangerouslySetInnerHTML: { __html: html } })}
        </MarkdownLink>
      )
    } else if (isCodeBlock(token)) {
      token = token as marked.Tokens.Code
      return (
        <MarkdownCode code={token.text} lang={token.lang}>
          {createElement('div', { dangerouslySetInnerHTML: { __html: html } })}
        </MarkdownCode>
      )
    } else if (isImagesBlock(token)) {
      token = token as marked.Tokens.Paragraph
      const length: number = token.tokens.filter(t => t.type === 'image').length
      const images: Array<JSX.Element> = token.tokens.filter(t => t.type === 'image').map((t, idx) => {
        return <img src={require('../../' + t.href.slice(2))} alt='' key={idx}></img>
      })
      return (
        <MarkdownImages length={length}>
          {images}
        </MarkdownImages>
      )
    }

    if (!html) {
      return undefined
    }

    const tag: string = extractTag(html)
    if (tag && ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].indexOf(tag) !== -1) {
      let id: string | undefined
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].indexOf(tag) !== -1) {
        token = token as marked.Tokens.Heading
        id = extractId(html, `h${token.depth}`).trim()
      }
      return React.createElement(tag, { id, className: getClassname(token), dangerouslySetInnerHTML: { __html: stripTag(html, tag) } })
    }

    return <span className={getClassname(token)} dangerouslySetInnerHTML={{ __html: html }} />
  }
}

export default function renderMarkdown (markdown: MarkdownString, options?: MarkdownRenderOptions): { doc: React.ReactNode, title: string, toc: TOC, } {
  const renderer: Renderer = Renderer.getInstance()
  const defaultOptions: MarkdownRenderOptions = {
    baseUrl: '/',
    groupBy: 'h2',
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
  const getTitle: (fromStr: MarkdownString) => { s: MarkdownString, title: string } = (fromStr: MarkdownString) => {
    const titleRegExp: RegExp = /#[^#].*[\r\n]/
    const matches: RegExpMatchArray | null = fromStr.match(titleRegExp)
    const matchStr: string = matches ? matches[0] : ''
    return matchStr
      ? { title: matchStr.replace(/^#/, '').replace(/`/g, '').trim(), s: fromStr.replace(matchStr, '').trimStart() }
      : { title, s }
  }

  const { title, s }: ReturnType<typeof getTitle> = getTitle(markdown)
  markdown = title ? s : markdown

  const opts: MarkdownRenderOptions = {...defaultOptions, ...options}
  const result: ReturnType<Renderer['render']> = renderer.render(markdown, opts)
  const { toc }: { toc: NonNullable<MarkdownRenderOptions['toc']> } = opts as { toc: NonNullable<MarkdownRenderOptions['toc']> }

  return { doc: result, toc, title }
}
