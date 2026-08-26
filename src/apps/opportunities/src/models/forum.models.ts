/** Latest visible activity exposed by the Forums API topic summary. */
export interface ForumLatestActivity {
    authorHandle: string
    authorMemberId: string
    createdAt: string
    postId: string
}

/** Compact participant snapshot embedded in a Forums API topic summary. */
export interface ForumTopicParticipant {
    handle: string
    memberId: string
}

/** Topic summary returned by the Forums API for list and detail views. */
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
    participants: ForumTopicParticipant[]
    participantsCount: number
    postsCount: number
    roleName: string | null
    starterPostExcerpt: string | null
    title: string
    unread: boolean
    updatedAt: string
    viewsCount: number
    watching: boolean
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
    authorPostsCount: number
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

/** Request body used to create a challenge-scoped topic and starter post. */
export interface CreateForumTopicRequest {
    challengeId: string
    content: string
    title: string
}

/** Request body used to add a top-level post or nested reply. */
export interface CreateForumPostRequest {
    content: string
    parentId?: string
    parentType?: 'POST' | 'TOPIC'
}

/** Minimal persisted topic shape returned by forum mutation endpoints. */
export interface ForumTopicMutationResponse {
    id: string
    title: string
}

/** Minimal persisted post shape returned by forum mutation endpoints. */
export interface ForumPostMutationResponse {
    content: string | null
    id: string
    topicId: string
}

/** Transactional topic-create response containing the new topic identifier. */
export interface CreateForumTopicResponse {
    starterPost: ForumPostMutationResponse
    topic: ForumTopicMutationResponse
}

/** Watch mutation response returned after watching or unwatching a topic. */
export interface ForumWatchMutationResponse {
    memberId: string
    topicId: string
    watching?: boolean
}
