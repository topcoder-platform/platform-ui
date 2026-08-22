/* eslint-disable no-use-before-define, ordered-imports/ordered-imports, react/jsx-no-bind */
import {
    ChangeEvent,
    FC,
    useMemo,
    useState,
} from 'react'
import useSWR, { SWRResponse } from 'swr'

import { IconOutline, LoadingSpinner } from '~/libs/ui'

import {
    ChallengeOpportunity,
    ForumPost,
    ForumTopicCollection,
    ForumTopicDetail,
    ForumTopicSummary,
    MemberProfileSummary,
} from '../models'
import {
    getChallengeForumTopics,
    getForumTopicDetail,
    getMemberProfilesByUserIds,
} from '../services'
import {
    challengeForumUrl,
    memberProfileUrl,
} from '../utils'
import { ChallengeMarkdown } from './ChallengeMarkdown'
import { OpportunityPagination } from './OpportunityPagination'
import styles from './ChallengeForum.module.scss'

type ForumScope = 'all' | 'announcements' | 'discussions' | 'unread'
type ForumSort = 'active' | 'oldest' | 'recent'

interface ChallengeForumProps {
    challenge: ChallengeOpportunity
    memberId?: string
}

interface FlatForumPost {
    depth: number
    post: ForumPost
}

interface ForumParticipant {
    handle: string
    memberId: string
}

type MemberProfilesById = ReadonlyMap<string, MemberProfileSummary>

/**
 * Formats a Forums API timestamp in the authored day-month-year presentation.
 *
 * @param value optional ISO timestamp.
 * @returns formatted local date and time, or an em dash.
 * @throws Does not throw.
 */
export function formatForumDate(value?: string): string {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    const month = new Intl.DateTimeFormat('en-US', { month: 'long' })
        .format(date)
    const hour = String(date.getHours())
        .padStart(2, '0')
    const minute = String(date.getMinutes())
        .padStart(2, '0')
    return `${date.getDate()} ${month}, ${date.getFullYear()}, ${hour}:${minute}`
}

/**
 * Flattens a Forums API reply tree while retaining visual thread depth.
 *
 * @param posts nested visible posts.
 * @param depth current recursive nesting depth.
 * @returns depth-annotated posts in display order.
 * @throws Does not throw.
 */
export function flattenForumPosts(posts: ForumPost[], depth: number = 0): FlatForumPost[] {
    return posts.flatMap(post => [
        { depth, post },
        ...flattenForumPosts(post.replies ?? [], depth + 1),
    ])
}

/**
 * Resolves the last visible activity timestamp used by local sort choices.
 *
 * @param topic forum topic summary.
 * @returns epoch milliseconds, or zero for invalid dates.
 * @throws Does not throw.
 */
function activityTimestamp(topic: ForumTopicSummary): number {
    const value = topic.latestActivity?.createdAt ?? topic.updatedAt ?? topic.createdAt
    const timestamp = new Date(value)
        .getTime()
    return Number.isFinite(timestamp) ? timestamp : 0
}

/**
 * Extracts the de-duplicated participant snapshots present in a topic summary.
 *
 * @param topic forum topic summary.
 * @returns author and latest-activity participant snapshots.
 * @throws Does not throw.
 */
function topicParticipants(topic: ForumTopicSummary): ForumParticipant[] {
    return [
        { handle: topic.authorHandle, memberId: topic.authorMemberId },
        topic.latestActivity
            ? {
                handle: topic.latestActivity.authorHandle,
                memberId: topic.latestActivity.authorMemberId,
            }
            : undefined,
    ]
        .filter((participant): participant is ForumParticipant => !!participant)
        .filter((participant, index, participants) => (
            participants.findIndex(candidate => candidate.memberId === participant.memberId) === index
        ))
}

/**
 * Renders a member photo with a resilient initials fallback.
 *
 * @param props member handle and optional public profile projection.
 * @returns avatar image or initial.
 * @throws Does not throw; image failures switch to the fallback.
 */
const MemberAvatar: FC<{
    handle: string
    profile?: MemberProfileSummary
}> = props => {
    const [failedPhotoURL, setFailedPhotoURL] = useState<string>()
    const photoURL = props.profile?.photoURL
    const showPhoto = !!photoURL && failedPhotoURL !== photoURL

    return (
        <span aria-hidden='true' className={styles.avatar}>
            {showPhoto
                ? (
                    <img
                        alt=''
                        onError={() => setFailedPhotoURL(photoURL)}
                        src={photoURL}
                    />
                )
                : props.handle.charAt(0)
                    .toUpperCase()}
        </span>
    )
}

/**
 * Renders a compact linked member snapshot enriched by the public Members API.
 *
 * @param props fallback handle and optional profile projection.
 * @returns profile link with avatar and canonical handle.
 * @throws Does not throw.
 */
const ForumMember: FC<{
    handle: string
    profile?: MemberProfileSummary
}> = props => {
    const handle = props.profile?.handle ?? props.handle

    return (
        <span className={styles.member}>
            <MemberAvatar handle={handle} profile={props.profile} />
            <a href={memberProfileUrl(handle)}>{handle}</a>
        </span>
    )
}

/**
 * Renders the limited participant identities provided by topic summaries.
 *
 * @param props participant snapshots and member projections keyed by ID.
 * @returns accessible linked avatar group.
 * @throws Does not throw.
 */
const ParticipantGroup: FC<{
    participants: ForumParticipant[]
    profilesByMemberId: MemberProfilesById
}> = props => {
    const labels = props.participants.map(participant => (
        props.profilesByMemberId.get(participant.memberId)?.handle ?? participant.handle
    ))

    return (
        <span aria-label={`Participants: ${labels.join(', ')}`} className={styles.participants}>
            {props.participants.map(participant => {
                const profile = props.profilesByMemberId.get(participant.memberId)
                const handle = profile?.handle ?? participant.handle

                return (
                    <a href={memberProfileUrl(handle)} key={participant.memberId} title={handle}>
                        <MemberAvatar handle={handle} profile={profile} />
                    </a>
                )
            })}
        </span>
    )
}

interface ForumFallbackProps {
    externalUrl?: string
    text: string
    title: string
}

/**
 * Preserves the external forum path when embedded reads are unavailable.
 *
 * @param props fallback copy and optional forum destination.
 * @returns forum fallback state.
 * @throws Does not throw.
 */
const ForumFallback: FC<ForumFallbackProps> = props => (
    <div className={styles.fallback}>
        <IconOutline.ChatAlt2Icon aria-hidden='true' />
        <h2>{props.title}</h2>
        <p>{props.text}</p>
        {props.externalUrl && (
            <a href={props.externalUrl} rel='noreferrer' target='_blank'>
                Open forum
                <IconOutline.ExternalLinkIcon aria-hidden='true' />
            </a>
        )}
    </div>
)

/**
 * Renders challenge forum counters and the external create action.
 *
 * @param props visible topics, source total, and optional forum destination.
 * @returns authored forum overview rail.
 * @throws Does not throw.
 */
const ForumOverview: FC<{
    externalUrl?: string
    topics: ForumTopicSummary[]
    total: number
}> = props => {
    const unread = props.topics.filter(topic => topic.unread).length
    const posts = props.topics.reduce((sum, topic) => sum + topic.postsCount, 0)
    return (
        <section className={styles.overview}>
            <h2>Challenge Forum</h2>
            <div className={styles.overviewStats}>
                <span className={styles.newCount}>
                    {unread}
                    {' '}
                    new
                    {' '}
                    {unread === 1 ? 'topic' : 'topics'}
                </span>
                <span>
                    {props.total}
                    {' '}
                    {props.total === 1 ? 'topic' : 'topics'}
                </span>
                <span>
                    {posts}
                    {' '}
                    posts
                </span>
            </div>
            {props.externalUrl && (
                <a href={props.externalUrl} rel='noreferrer' target='_blank'>
                    <IconOutline.PlusCircleIcon aria-hidden='true' />
                    Create new topic
                </a>
            )}
        </section>
    )
}

interface ForumFiltersProps {
    onReset: () => void
    onScope: (scope: ForumScope) => void
    onSearch: (search: string) => void
    onSort: (sort: ForumSort) => void
    scope: ForumScope
    search: string
    sort: ForumSort
    unread: number
}

/**
 * Renders local search, sort, and scope controls for loaded topic summaries.
 *
 * @param props controlled filter values and update callbacks.
 * @returns accessible forum filter panel.
 * @throws Does not throw.
 */
const ForumFilters: FC<ForumFiltersProps> = props => {
    const onSearch = (event: ChangeEvent<HTMLInputElement>): void => props.onSearch(event.target.value)
    const onSort = (event: ChangeEvent<HTMLSelectElement>): void => props.onSort(event.target.value as ForumSort)
    return (
        <section className={styles.filters}>
            <header>
                <h2>Filters</h2>
                <button onClick={props.onReset} type='button'>Reset all</button>
            </header>
            <label className={styles.searchField}>
                <span className={styles.visuallyHidden}>Search forum topics</span>
                <IconOutline.SearchIcon aria-hidden='true' />
                <input
                    onChange={onSearch}
                    placeholder='Search'
                    type='search'
                    value={props.search}
                />
            </label>
            <small>Search topics or member handles</small>
            <label className={styles.sortField}>
                <span>Sort by</span>
                <select onChange={onSort} value={props.sort}>
                    <option value='recent'>Most recent</option>
                    <option value='oldest'>Oldest</option>
                    <option value='active'>Most active</option>
                </select>
            </label>
            <fieldset>
                <legend className={styles.visuallyHidden}>Topic type</legend>
                {([
                    ['all', 'All topics'],
                    ['unread', 'Unread'],
                    ['announcements', 'Announcements'],
                    ['discussions', 'Discussions'],
                ] as Array<[ForumScope, string]>).map(([value, label]) => (
                    <label key={value}>
                        <input
                            checked={props.scope === value}
                            name='forum-scope'
                            onChange={() => props.onScope(value)}
                            type='radio'
                        />
                        <span aria-hidden='true' className={styles.radio} />
                        {label}
                        {value === 'unread' && props.unread > 0 && <em>{props.unread}</em>}
                    </label>
                ))}
            </fieldset>
        </section>
    )
}

/**
 * Renders forum creator and activity context beneath the filters.
 *
 * @param props visible topics and member profiles keyed by ID.
 * @returns discussion information panel, or an empty fragment.
 * @throws Does not throw.
 */
const DiscussionInfo: FC<{
    profilesByMemberId: MemberProfilesById
    topics: ForumTopicSummary[]
}> = props => {
    if (!props.topics.length) return <></>
    const creator = props.topics.find(topic => topic.isAnnouncement) ?? props.topics[props.topics.length - 1]
    const lastActivity = [...props.topics].sort((a, b) => activityTimestamp(b) - activityTimestamp(a))[0]
    return (
        <section className={styles.discussionInfo}>
            <h2>
                <IconOutline.InformationCircleIcon aria-hidden='true' />
                Discussion info
            </h2>
            <ForumMember
                handle={creator.authorHandle}
                profile={props.profilesByMemberId.get(creator.authorMemberId)}
            />
            <dl>
                <div>
                    <dt>Last post</dt>
                    <dd>{formatForumDate(lastActivity.latestActivity?.createdAt)}</dd>
                </div>
                <div>
                    <dt>Created</dt>
                    <dd>{formatForumDate(creator.createdAt)}</dd>
                </div>
            </dl>
        </section>
    )
}

/**
 * Renders one topic summary card that can open embedded detail.
 *
 * @param props topic, member projections, and selection callback.
 * @returns authored topic card.
 * @throws Does not throw.
 */
const ForumTopicCard: FC<{
    onSelect: (topicId: string) => void
    profilesByMemberId: MemberProfilesById
    topic: ForumTopicSummary
}> = props => {
    const participants = topicParticipants(props.topic)
    const latestActivityLabel = props.topic.latestActivity
        ? `Last post by ${props.topic.latestActivity.authorHandle}`
            + ` at ${formatForumDate(props.topic.latestActivity.createdAt)}`
        : 'No visible posts'
    return (
        <article className={styles.topicCard}>
            <div className={styles.topicMain}>
                <div className={styles.tags}>
                    {props.topic.isAnnouncement && <span className={styles.announcement}>Announcement</span>}
                    {props.topic.unread && (
                        <span className={styles.newPost}>
                            {props.topic.postsCount <= 1 ? 'New topic' : 'New post'}
                        </span>
                    )}
                    {props.topic.locked && <span className={styles.locked}>Locked</span>}
                </div>
                <button className={styles.topicTitle} onClick={() => props.onSelect(props.topic.id)} type='button'>
                    {props.topic.title}
                </button>
                <div className={styles.createdBy}>
                    <span>Created by</span>
                    <ForumMember
                        handle={props.topic.authorHandle}
                        profile={props.profilesByMemberId.get(props.topic.authorMemberId)}
                    />
                    <span>
                        at
                        {' '}
                        {formatForumDate(props.topic.createdAt)}
                    </span>
                </div>
                <p className={styles.activity}>
                    {latestActivityLabel}
                </p>
                <button className={styles.viewTopic} onClick={() => props.onSelect(props.topic.id)} type='button'>
                    View topic
                </button>
            </div>
            <aside className={styles.topicMetrics}>
                <p>
                    <IconOutline.ChatAlt2Icon aria-hidden='true' />
                    <strong>Posts:</strong>
                    {' '}
                    {props.topic.postsCount}
                </p>
                <strong>Participants</strong>
                <ParticipantGroup
                    participants={participants}
                    profilesByMemberId={props.profilesByMemberId}
                />
            </aside>
        </article>
    )
}

/**
 * Renders read-only topic detail with nested post threading.
 *
 * @param props topic detail, member projections, navigation callback, and external URL.
 * @returns topic information and visible post cards.
 * @throws Does not throw.
 */
const ForumTopicView: FC<{
    detail: ForumTopicDetail
    externalUrl?: string
    onBack: () => void
    profilesByMemberId: MemberProfilesById
}> = props => {
    const flatPosts = flattenForumPosts(props.detail.posts)
    const participants = [
        {
            handle: props.detail.topic.authorHandle,
            memberId: props.detail.topic.authorMemberId,
        },
        ...flatPosts.map(item => ({
            handle: item.post.authorHandle,
            memberId: item.post.authorMemberId,
        })),
    ].filter((participant, index, allParticipants) => (
        allParticipants.findIndex(candidate => candidate.memberId === participant.memberId) === index
    ))
    return (
        <div className={styles.detailView}>
            <button className={styles.back} onClick={props.onBack} type='button'>
                <IconOutline.ArrowLeftIcon aria-hidden='true' />
                {props.detail.topic.title}
            </button>
            <div className={styles.detailLayout}>
                <aside className={styles.topicInfo}>
                    <h2>
                        <IconOutline.InformationCircleIcon aria-hidden='true' />
                        Topic info
                    </h2>
                    <ForumMember
                        handle={props.detail.topic.authorHandle}
                        profile={props.profilesByMemberId.get(props.detail.topic.authorMemberId)}
                    />
                    <dl>
                        <div>
                            <dt>Last post</dt>
                            <dd>{formatForumDate(props.detail.topic.latestActivity?.createdAt)}</dd>
                        </div>
                        <div>
                            <dt>Created</dt>
                            <dd>{formatForumDate(props.detail.topic.createdAt)}</dd>
                        </div>
                    </dl>
                    <div className={styles.topicInfoMetrics}>
                        <p>
                            <IconOutline.ChatAlt2Icon aria-hidden='true' />
                            Posts:
                            {' '}
                            {props.detail.topic.postsCount}
                        </p>
                        <strong>Participants</strong>
                        <ParticipantGroup
                            participants={participants}
                            profilesByMemberId={props.profilesByMemberId}
                        />
                    </div>
                </aside>
                <div className={styles.posts}>
                    {flatPosts.map((item, index) => (
                        <article
                            className={item.depth > 0 ? styles.replyPost : styles.post}
                            key={item.post.id}
                        >
                            <header>
                                <ForumMember
                                    handle={item.post.authorHandle}
                                    profile={props.profilesByMemberId.get(item.post.authorMemberId)}
                                />
                                {item.post.authorMemberId === props.detail.topic.authorMemberId && <span>Author</span>}
                                {index === 0 && props.detail.topic.isAnnouncement && <span>Announcement</span>}
                                {item.post.id === props.detail.topic.latestActivity?.postId
                                    && props.detail.topic.unread && <span className={styles.newPost}>New post</span>}
                                <time dateTime={item.post.createdAt}>
                                    Posted:
                                    {formatForumDate(item.post.createdAt)}
                                </time>
                            </header>
                            {item.post.deleted || !item.post.content
                                ? <p className={styles.deleted}>This post has been deleted.</p>
                                : <ChallengeMarkdown markdown={item.post.content} />}
                            {props.externalUrl && !props.detail.topic.locked && (
                                <footer>
                                    <a href={props.externalUrl} rel='noreferrer' target='_blank'>
                                        <IconOutline.ReplyIcon aria-hidden='true' />
                                        Reply in forum
                                    </a>
                                </footer>
                            )}
                        </article>
                    ))}
                    {!flatPosts.length && (
                        <ForumFallback
                            externalUrl={props.externalUrl}
                            text='This topic has no visible posts.'
                            title='No posts yet'
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

/**
 * Renders authenticated Forums API reads, with legacy forum links retained for
 * unsupported writes and for deployments without migrated forum data.
 *
 * @param props challenge context and optional authenticated member ID.
 * @returns embedded topic list/detail or an authenticated fallback state.
 * @throws Does not throw; API failures render an external-forum fallback.
 */
export const ChallengeForum: FC<ChallengeForumProps> = props => {
    const externalUrl = challengeForumUrl(props.challenge)
    const [search, setSearch] = useState('')
    const [scope, setScope] = useState<ForumScope>('all')
    const [sort, setSort] = useState<ForumSort>('recent')
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(10)
    const [selectedTopicId, setSelectedTopicId] = useState<string>()
    const response: SWRResponse<ForumTopicCollection, Error> = useSWR(
        props.memberId ? ['opportunities:forum-topics', props.challenge.id] : undefined,
        () => getChallengeForumTopics(props.challenge.id),
        { revalidateOnFocus: false },
    )
    const detailResponse: SWRResponse<ForumTopicDetail, Error> = useSWR(
        selectedTopicId ? ['opportunities:forum-topic', selectedTopicId] : undefined,
        () => getForumTopicDetail(selectedTopicId as string),
        { revalidateOnFocus: false },
    )
    const topics = useMemo(() => response.data?.data ?? [], [response.data?.data])
    const unread = topics.filter(topic => topic.unread).length
    const filteredTopics = useMemo(() => {
        const query = search.trim()
            .toLowerCase()
        const result = topics.filter(topic => {
            if (scope === 'unread' && !topic.unread) return false
            if (scope === 'announcements' && !topic.isAnnouncement) return false
            if (scope === 'discussions' && topic.isAnnouncement) return false
            if (!query) return true
            return [
                topic.title,
                topic.authorHandle,
                topic.latestActivity?.authorHandle,
                topic.roleName,
            ].some(value => value?.toLowerCase()
                .includes(query))
        })
        return [...result].sort((a, b) => {
            if (sort === 'active') return b.postsCount - a.postsCount || activityTimestamp(b) - activityTimestamp(a)
            if (sort === 'oldest') {
                return new Date(a.createdAt)
                    .getTime() - new Date(b.createdAt)
                    .getTime()
            }

            return activityTimestamp(b) - activityTimestamp(a)
        })
    }, [scope, search, sort, topics])
    const totalPages = Math.ceil(filteredTopics.length / perPage)
    const visibleTopics = filteredTopics.slice((page - 1) * perPage, page * perPage)
    const detailPosts = useMemo(
        () => flattenForumPosts(detailResponse.data?.posts ?? []),
        [detailResponse.data?.posts],
    )
    const discussionCreator = topics.find(topic => topic.isAnnouncement) ?? topics[topics.length - 1]
    const memberIds = useMemo(() => Array.from(new Set([
        ...visibleTopics.flatMap(topic => [
            topic.authorMemberId,
            topic.latestActivity?.authorMemberId,
        ]),
        discussionCreator?.authorMemberId,
        detailResponse.data?.topic.authorMemberId,
        ...detailPosts.map(item => item.post.authorMemberId),
    ].filter((memberId): memberId is string => !!memberId))), [
        detailPosts,
        detailResponse.data?.topic.authorMemberId,
        discussionCreator?.authorMemberId,
        visibleTopics,
    ])
    const profileResponse: SWRResponse<MemberProfileSummary[], Error> = useSWR(
        props.memberId && memberIds.length
            ? ['opportunities:forum-members', memberIds]
            : undefined,
        () => getMemberProfilesByUserIds(memberIds),
        { revalidateOnFocus: false },
    )
    const profilesByMemberId = useMemo<MemberProfilesById>(
        () => new Map((profileResponse.data ?? []).map(profile => [profile.userId, profile])),
        [profileResponse.data],
    )

    if (!props.memberId) {
        return (
            <ForumFallback
                externalUrl={externalUrl}
                text='Sign in to read challenge discussions here, or continue in the established Topcoder forum.'
                title='Challenge Forum'
            />
        )
    }

    if (response.isValidating && !response.data) return <LoadingSpinner />
    if (response.error) {
        return (
            <ForumFallback
                externalUrl={externalUrl}
                text='The embedded forum could not be loaded. You can continue the discussion in the Topcoder forum.'
                title='Forum temporarily unavailable'
            />
        )
    }

    if (!topics.length) {
        return (
            <ForumFallback
                externalUrl={externalUrl}
                text='No migrated discussions are available for this challenge yet.'
                title='No forum topics yet'
            />
        )
    }

    if (selectedTopicId) {
        if (detailResponse.isValidating && !detailResponse.data) return <LoadingSpinner />
        if (detailResponse.error || !detailResponse.data) {
            return (
                <div className={styles.detailError}>
                    <button onClick={() => setSelectedTopicId(undefined)} type='button'>Back to topics</button>
                    <ForumFallback
                        externalUrl={externalUrl}
                        text='This topic could not be loaded. You can open the external forum instead.'
                        title='Topic unavailable'
                    />
                </div>
            )
        }

        return (
            <ForumTopicView
                detail={detailResponse.data}
                externalUrl={externalUrl}
                onBack={() => setSelectedTopicId(undefined)}
                profilesByMemberId={profilesByMemberId}
            />
        )
    }

    /** Resets every authored filter and returns to the first client-side page. */
    const resetFilters = (): void => {
        setSearch('')
        setScope('all')
        setSort('recent')
        setPage(1)
    }

    return (
        <div className={styles.forumLayout}>
            <aside className={styles.leftPanel}>
                <ForumOverview
                    externalUrl={externalUrl}
                    topics={topics}
                    total={topics.length}
                />
                <ForumFilters
                    onReset={resetFilters}
                    onScope={value => {
                        setScope(value)
                        setPage(1)
                    }}
                    onSearch={value => {
                        setSearch(value)
                        setPage(1)
                    }}
                    onSort={value => {
                        setSort(value)
                        setPage(1)
                    }}
                    scope={scope}
                    search={search}
                    sort={sort}
                    unread={unread}
                />
                <DiscussionInfo profilesByMemberId={profilesByMemberId} topics={topics} />
            </aside>
            <section aria-label='Forum topics' className={styles.topicList}>
                {response.data?.truncated && (
                    <p className={styles.limitNotice}>
                        Showing the first
                        {' '}
                        {topics.length}
                        {' '}
                        of
                        {' '}
                        {response.data.sourceTotalCount}
                        {' '}
                        topics. Open the external forum to find older discussions.
                    </p>
                )}
                {visibleTopics.map(topic => (
                    <ForumTopicCard
                        key={topic.id}
                        onSelect={setSelectedTopicId}
                        profilesByMemberId={profilesByMemberId}
                        topic={topic}
                    />
                ))}
                {!visibleTopics.length && (
                    <div className={styles.noResults}>
                        <IconOutline.SearchIcon aria-hidden='true' />
                        <h2>No topics found</h2>
                        <p>Try another search or reset the forum filters.</p>
                    </div>
                )}
                {filteredTopics.length > perPage && (
                    <OpportunityPagination
                        onPageChange={setPage}
                        onPerPageChange={value => {
                            setPerPage(value)
                            setPage(1)
                        }}
                        page={page}
                        perPage={perPage}
                        total={filteredTopics.length}
                        totalPages={totalPages}
                    />
                )}
            </section>
        </div>
    )
}
