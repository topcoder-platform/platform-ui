/** Minimal Markdown HTML tree used to transform text without touching authored links or code. */
export interface ForumMentionNode {
    children?: ForumMentionNode[]
    properties?: Record<string, unknown>
    tagName?: string
    type: string
    value?: string
}

export interface ForumMentionToken {
    handle: string
    index: number
    text: string
}

/**
 * Finds bare, braced, straight-quoted, or curly-quoted Topcoder mentions in text.
 * @param value plain text from a forum post or topic excerpt.
 * @returns mention tokens with their original offsets; email addresses are excluded.
 * @throws Does not throw.
 */
export function forumMentionTokens(value: string): ForumMentionToken[] {
    const pattern = /(^|[^\w@.+-])@(?:["“”]\{?([\w.+-]+)\}?["“”]|\{([\w.+-]+)\}|([\w+-]+(?:\.[\w+-]+)*))/g
    return Array.from(value.matchAll(pattern))
        .map(match => ({
            handle: match[2] ?? match[3] ?? match[4],
            index: (match.index ?? 0) + match[1].length,
            text: match[0].slice(match[1].length),
        }))
}

/**
 * Adds trusted mention markers after HTML sanitization for the forum Markdown renderer.
 * @returns transformer replacing text mentions with link nodes, preserving code and links.
 * @throws Does not throw.
 */
export function rehypeForumMentions(): (tree: ForumMentionNode) => void {
    /**
     * Visits rendered HTML text, skipping existing links and literal code elements.
     * @param node current HTML tree node.
     * @returns Nothing; replaces matching child text nodes in place.
     * @throws Does not throw.
     */
    function visit(node: ForumMentionNode): void {
        if (['a', 'code', 'pre', 'script', 'style'].includes(node.tagName ?? '') || !node.children) return
        node.children = node.children.flatMap(child => {
            if (child.type !== 'text' || !child.value) {
                visit(child)
                return [child]
            }

            const tokens = forumMentionTokens(child.value)
            if (!tokens.length) return [child]
            const nodes: ForumMentionNode[] = []
            let offset = 0
            tokens.forEach(token => {
                nodes.push({ type: 'text', value: child.value?.slice(offset, token.index) })
                nodes.push({
                    children: [{ type: 'text', value: `@${token.handle}` }],
                    properties: { 'data-forum-mention': token.handle },
                    tagName: 'a',
                    type: 'element',
                })
                offset = token.index + token.text.length
            })
            nodes.push({ type: 'text', value: child.value.slice(offset) })
            return nodes
        })
    }

    return visit
}

/**
 * Resolves the mention prefix immediately before the editor caret.
 * @param value full authored Markdown.
 * @param caret current collapsed selection offset.
 * @returns replacement start and handle prefix, or undefined outside a mention.
 * @throws Does not throw.
 */
export function forumMentionQuery(value: string, caret: number): { start: number; term: string } | undefined {
    const match = /(^|[\s(])@(?:["“”]\{?|\{)?([\w.+-]*)$/.exec(value.slice(0, caret))
    return match ? { start: (match.index ?? 0) + match[1].length, term: match[2] } : undefined
}
