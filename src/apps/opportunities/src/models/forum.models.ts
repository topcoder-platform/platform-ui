/** Latest visible activity exposed by the Forums API topic summary. */
export interface ForumLatestActivity {
    authorHandle: string
    authorMemberId: string
    createdAt: string
    postId: string
}

/** Read-only topic summary returned by the Forums API. */
export interface ForumTopicSummary {
    authorHandle: string
    authorMemberId: string
    challengeId: string | null
    createdAt: string
    id: string
    isAnnouncement: boolean
    latestActivity: ForumLatestActivity | null
    locked: boolean
    lockedAt: string | null
    lockedBy: string | null
    parentTopicId: string | null
    postsCount: number
    roleName: string | null
    title: string
    unread: boolean
    updatedAt: string
}

/** Pagination metadata returned alongside a page of forum topics. */
export interface ForumTopicPageMeta {
    page: number
    perPage: number
    totalCount: number
    totalPages: number
}

/** Paginated Forums API topic response. */
export interface ForumTopicPage {
    data: ForumTopicSummary[]
    meta: ForumTopicPageMeta
}

/** Bounded collection assembled from every reported Forums API page. */
export interface ForumTopicCollection {
    data: ForumTopicSummary[]
    sourceTotalCount: number
    truncated: boolean
}

/** One post in the nested Forums API topic detail tree. */
export interface ForumPost {
    authorHandle: string
    authorMemberId: string
    content: string | null
    createdAt: string
    deleted: boolean
    id: string
    parentId: string
    parentType: 'POST' | 'TOPIC' | string
    replies: ForumPost[]
    topicId: string
    updatedAt: string
}

/** Read-only topic detail response with its complete post tree. */
export interface ForumTopicDetail {
    posts: ForumPost[]
    topic: ForumTopicSummary
}
