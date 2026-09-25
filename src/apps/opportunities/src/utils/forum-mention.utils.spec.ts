import { ForumMentionNode, forumMentionQuery, forumMentionTokens, rehypeForumMentions } from './forum-mention.utils'

describe('forum mentions', () => {
    it('recognizes existing quoted handles, braces, curly quotes, and bare mentions', () => {
        expect(forumMentionTokens('Hi @"Harshit.Chudasama", @{tourist} @“{member}” @coder+one.')
            .map(t => t.handle))
            .toEqual(['Harshit.Chudasama', 'tourist', 'member', 'coder+one'])
        expect(forumMentionTokens('user@example.com https://example.com/@user'))
            .toHaveLength(1)
        expect(forumMentionTokens('user@example.com'))
            .toHaveLength(0)
    })

    it('preserves code, existing links, and surrounding text', () => {
        const tree: ForumMentionNode = {
            children: [
                { type: 'text', value: 'Hi @"member.name"!' },
                { children: [{ type: 'text', value: '@code' }], tagName: 'code', type: 'element' },
                { children: [{ type: 'text', value: '@linked' }], tagName: 'a', type: 'element' },
            ],
            type: 'root',
        }
        rehypeForumMentions()(tree)
        expect(tree.children?.slice(0, 3))
            .toEqual([
                { type: 'text', value: 'Hi ' },
                {
                    children: [{ type: 'text', value: '@member.name' }],
                    properties: { 'data-forum-mention': 'member.name' },
                    tagName: 'a',
                    type: 'element',
                },
                { type: 'text', value: '!' },
            ])
        expect(tree.children?.[3].children?.[0].value)
            .toBe('@code')
        expect(tree.children?.[4].children?.[0].value)
            .toBe('@linked')
    })

    it('finds the active caret token without treating email addresses as mentions', () => {
        expect(forumMentionQuery('Hello @"mem', 11))
            .toEqual({ start: 6, term: 'mem' })
        expect(forumMentionQuery('Hello @', 7))
            .toEqual({ start: 6, term: '' })
        expect(forumMentionQuery('user@example.com', 16))
            .toBeUndefined()
        expect(forumMentionQuery('@"member" ', 10))
            .toBeUndefined()
    })
})
