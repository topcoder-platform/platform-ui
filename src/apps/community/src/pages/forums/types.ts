export type ForumRole = 'admin' | 'copilot' | 'member'
export type ForumTopicKind = 'announcement' | 'discussion'
export type ForumAuthorRole = 'Administrator' | 'Author' | 'Copilot' | 'Member'

export interface ForumAuthor {
    avatarTone: 'blue' | 'gold' | 'green' | 'orange' | 'red'
    handle: string
    role: ForumAuthorRole
}

export interface ForumPost {
    author: ForumAuthor
    body: string
    createdAt: string
    downVotes: number
    id: string
    isEditable?: boolean
    upVotes: number
}

export interface ForumTopic {
    author: ForumAuthor
    body: string
    createdAt: string
    id: string
    kind: ForumTopicKind
    lastPostAt: string
    postCount: number
    title: string
    unread?: boolean
    viewCount: number
}

export interface ForumChallenge {
    currentDeadline: string
    name: string
    nextDeadline: string
    prizes: ReadonlyArray<{
        amount: string
        label: string
        tone: 'bronze' | 'gold' | 'silver' | 'turquoise'
    }>
    registrantCount: number
    submissionCount: number
    tags: string[]
}
