/* eslint-disable no-use-before-define, ordered-imports/ordered-imports, react/jsx-no-bind */
import {
    ChangeEvent,
    FC,
    FormEvent,
    KeyboardEvent,
    useMemo,
    useRef,
    useState,
} from 'react'
import useSWR, { SWRResponse } from 'swr'

import { BaseModal, ConfirmModal, IconOutline } from '~/libs/ui'

import {
    ChallengeOpportunity,
    ForumPost,
    ForumPostReaction,
    ForumTopicCollection,
    ForumTopicDetail,
    ForumTopicSummary,
    MemberProfileSummary,
} from '../models'
import {
    createForumPost,
    createForumTopic,
    deleteForumPost,
    deleteForumTopic,
    getChallengeForumTopics,
    getForumTopicDetail,
    getMemberProfilesByUserIds,
    markForumTopicRead,
    setForumPostReaction,
    setForumTopicWatching,
    updateForumPost,
    updateForumTopic,
} from '../services'

import { OpportunityTabLoading } from './OpportunityTabLoading'
import {
    challengeForumUrl,
    memberProfileUrl,
} from '../utils'
import { ChallengeMarkdown } from './ChallengeMarkdown'
import { OpportunityPagination } from './OpportunityPagination'
import styles from './ChallengeForum.module.scss'

type ForumScope = 'all' | 'announcements' | 'discussions' | 'unread'
type ForumSort = 'active' | 'oldest' | 'recent'
type ForumRatingClass = 'ratingBlue' | 'ratingGray' | 'ratingGreen' | 'ratingRed' | 'ratingYellow'

interface ChallengeForumProps {
    canCreateAnnouncements?: boolean
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

export interface MarkdownSelectionResult {
    selectionEnd: number
    selectionStart: number
    value: string
}

/**
 * Continues the Markdown list marker on the current line when Enter is pressed.
 * An empty marker exits the list, matching conventional Markdown editors.
 *
 * @param value complete editor value.
 * @param selectionStart inclusive selection start.
 * @param selectionEnd exclusive selection end.
 * @returns updated value/caret, or undefined when the current line is not a list item.
 * @throws Does not throw; selection bounds are clamped to the input length.
 */
export function continueMarkdownList(
    value: string,
    selectionStart: number,
    selectionEnd: number,
): MarkdownSelectionResult | undefined {
    const start = Math.max(0, Math.min(selectionStart, value.length))
    const end = Math.max(start, Math.min(selectionEnd, value.length))
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const lineBeforeCaret = value.slice(lineStart, start)
    const unordered = /^(\s*)([-+*])\s+(.*)$/.exec(lineBeforeCaret)
    const ordered = /^(\s*)(\d+)\.\s+(.*)$/.exec(lineBeforeCaret)
    const match = unordered ?? ordered
    if (!match) return undefined

    if (!match[3].trim()) {
        const nextValue = `${value.slice(0, lineStart)}${value.slice(end)}`
        return {
            selectionEnd: lineStart,
            selectionStart: lineStart,
            value: nextValue,
        }
    }

    const marker = unordered ? match[2] : `${Number(match[2]) + 1}.`
    const insertion = `\n${match[1]}${marker} `
    const nextSelection = start + insertion.length
    return {
        selectionEnd: nextSelection,
        selectionStart: nextSelection,
        value: `${value.slice(0, start)}${insertion}${value.slice(end)}`,
    }
}

type MemberProfilesById = ReadonlyMap<string, MemberProfileSummary>

const COMMENT_CHARACTER_LIMIT = 500
const TOPIC_CHARACTER_LIMIT = 16000

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
 * Produces compact plain list-card copy from a bounded markdown excerpt.
 *
 * @param value optional starter-post excerpt.
 * @returns whitespace-normalized copy with common markdown markers removed.
 * @throws Does not throw.
 */
export function plainForumExcerpt(value?: string | null): string {
    return (value ?? '')
        .replace(/!?(\[([^\]]+)\])\([^)]+\)/g, '$2')
        .replace(/[`*_>#~]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
}

/**
 * Wraps the selected editor range with a markdown prefix and suffix.
 *
 * @param value complete editor value.
 * @param selectionStart inclusive selection start.
 * @param selectionEnd exclusive selection end.
 * @param prefix markdown inserted before the selection.
 * @param suffix markdown inserted after the selection.
 * @returns updated value and the range to reselect after rendering.
 * @throws Does not throw; selection bounds are clamped to the input length.
 */
export function wrapMarkdownSelection(
    value: string,
    selectionStart: number,
    selectionEnd: number,
    prefix: string,
    suffix: string,
): MarkdownSelectionResult {
    const start = Math.max(0, Math.min(selectionStart, value.length))
    const end = Math.max(start, Math.min(selectionEnd, value.length))
    return {
        selectionEnd: end + prefix.length,
        selectionStart: start + prefix.length,
        value: `${value.slice(0, start)}${prefix}${value.slice(start, end)}${suffix}${value.slice(end)}`,
    }
}

/**
 * Resolves the August 2026 design-system handle color for a member rating.
 *
 * @param maxRating optional public maximum rating.
 * @returns CSS module rating class name.
 * @throws Does not throw.
 */
export function forumRatingClass(maxRating?: number): ForumRatingClass {
    if (maxRating === undefined || maxRating < 900) return 'ratingGray'
    if (maxRating < 1200) return 'ratingGreen'
    if (maxRating < 1500) return 'ratingBlue'
    if (maxRating < 2200) return 'ratingYellow'
    return 'ratingRed'
}

/**
 * Resolves human-readable API error copy without exposing transport internals.
 *
 * @param error unknown rejection from an authenticated forum mutation.
 * @returns server validation copy when available, otherwise a stable fallback.
 * @throws Does not throw.
 */
export function forumErrorMessage(error: unknown): string {
    const responseMessage = (error as {
        response?: { data?: { message?: string | string[] } }
    })?.response?.data?.message
    if (Array.isArray(responseMessage)) return responseMessage.join(' ')
    if (typeof responseMessage === 'string' && responseMessage.trim()) return responseMessage
    if (error instanceof Error && error.message.trim()) return error.message
    return 'The forum action could not be completed. Please try again.'
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
 * Extracts participant snapshots from the enriched summary with a legacy fallback.
 *
 * @param topic forum topic summary.
 * @returns de-duplicated participant snapshots in API activity order.
 * @throws Does not throw.
 */
function topicParticipants(topic: ForumTopicSummary): ForumParticipant[] {
    const snapshots = topic.participants ?? []
    const participants = snapshots.length
        ? snapshots
        : [
            { handle: topic.authorHandle, memberId: topic.authorMemberId },
            topic.latestActivity
                ? {
                    handle: topic.latestActivity.authorHandle,
                    memberId: topic.latestActivity.authorMemberId,
                }
                : undefined,
        ].filter((participant): participant is ForumParticipant => !!participant)

    return participants.filter((participant, index) => (
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
 * @returns profile link with avatar and rating-colored canonical handle.
 * @throws Does not throw.
 */
const ForumMember: FC<{
    handle: string
    profile?: MemberProfileSummary
}> = props => {
    const handle = props.profile?.handle ?? props.handle
    const ratingClass = forumRatingClass(props.profile?.maxRating)

    return (
        <span className={styles.member}>
            <MemberAvatar handle={handle} profile={props.profile} />
            <a className={styles[ratingClass]} href={memberProfileUrl(handle)}>{handle}</a>
        </span>
    )
}

/**
 * Renders topic participant identities and any bounded overflow count.
 *
 * @param props participant snapshots, complete count, and member projections.
 * @returns accessible linked avatar group.
 * @throws Does not throw.
 */
const ParticipantGroup: FC<{
    participants: ForumParticipant[]
    profilesByMemberId: MemberProfilesById
    total: number
}> = props => {
    const labels = props.participants.map(participant => (
        props.profilesByMemberId.get(participant.memberId)?.handle ?? participant.handle
    ))
    const overflow = Math.max(0, props.total - props.participants.length)

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
            {overflow > 0 && (
                <span className={styles.participantOverflow}>
                    +
                    {overflow}
                </span>
            )}
        </span>
    )
}

interface ForumFallbackProps {
    externalUrl?: string
    text: string
    title: string
}

/**
 * Preserves a safe recovery path when embedded API access is unavailable.
 *
 * @param props fallback copy and optional legacy destination.
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
                Open legacy forum
                <IconOutline.ExternalLinkIcon aria-hidden='true' />
            </a>
        )}
    </div>
)

/**
 * Renders challenge forum counters and the in-page create-topic action.
 *
 * @param props visible topics, source total, and create callback.
 * @returns authored forum overview rail.
 * @throws Does not throw.
 */
const ForumOverview: FC<{
    onCreate: () => void
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
            <button onClick={props.onCreate} type='button'>
                <IconOutline.PlusCircleIcon aria-hidden='true' />
                Create new topic
            </button>
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
            <small>Search topic, comment</small>
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
 * Renders one topic summary card with watch and owner mutation actions.
 *
 * @param props topic data, current member, projections, and mutation callbacks.
 * @returns Figma-aligned topic card.
 * @throws Does not throw; callbacks own API error handling.
 */
const ForumTopicCard: FC<{
    memberId: string
    onDelete: (topic: ForumTopicSummary) => void
    onEdit: (topic: ForumTopicSummary) => void
    onSelect: (topicId: string) => void
    onWatch: (topic: ForumTopicSummary) => void
    pendingAction?: string
    profilesByMemberId: MemberProfilesById
    topic: ForumTopicSummary
}> = props => {
    const participants = topicParticipants(props.topic)
    const excerpt = props.topic.starterPostExcerpt?.trim()
    const owner = props.topic.authorMemberId === props.memberId
    const cardClass = props.topic.isAnnouncement
        ? `${styles.topicCard} ${styles.announcementCard}`
        : styles.topicCard
    return (
        <article className={cardClass}>
            <div className={styles.topicMain}>
                <div className={styles.tags}>
                    {props.topic.isAnnouncement && <span className={styles.announcement}>Announcement</span>}
                    {props.topic.unread && (
                        <>
                            {props.topic.postsCount <= 1 && <span className={styles.newTopic}>New topic</span>}
                            <span className={styles.newPost}>New post</span>
                        </>
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
                {excerpt && (
                    <div className={styles.topicExcerpt}>
                        <ChallengeMarkdown markdown={excerpt} />
                    </div>
                )}
                <div className={styles.topicFooter}>
                    <span>
                        Last post at
                        {' '}
                        {formatForumDate(props.topic.latestActivity?.createdAt)}
                    </span>
                    <div className={styles.topicActions}>
                        {owner && !props.topic.locked && (
                            <>
                                <button onClick={() => props.onEdit(props.topic)} type='button'>
                                    <IconOutline.PencilIcon aria-hidden='true' />
                                    Edit
                                </button>
                                <button onClick={() => props.onDelete(props.topic)} type='button'>
                                    <IconOutline.TrashIcon aria-hidden='true' />
                                    Delete
                                </button>
                            </>
                        )}
                        <button
                            disabled={props.pendingAction === `watch:${props.topic.id}`}
                            onClick={() => props.onWatch(props.topic)}
                            type='button'
                        >
                            <IconOutline.EyeIcon aria-hidden='true' />
                            {props.topic.watching ? 'Watched' : 'Watch'}
                        </button>
                    </div>
                </div>
            </div>
            <aside className={styles.topicMetrics}>
                <p>
                    <IconOutline.ChatAlt2Icon aria-hidden='true' />
                    <strong>Posts:</strong>
                    {' '}
                    {props.topic.postsCount}
                </p>
                <p>
                    <IconOutline.EyeIcon aria-hidden='true' />
                    <strong>Views:</strong>
                    {' '}
                    {props.topic.viewsCount ?? 0}
                </p>
                <strong>Participants</strong>
                <ParticipantGroup
                    participants={participants}
                    profilesByMemberId={props.profilesByMemberId}
                    total={props.topic.participantsCount ?? participants.length}
                />
            </aside>
        </article>
    )
}

interface MarkdownEditorProps {
    id: string
    label: string
    maxLength: number
    onChange: (value: string) => void
    placeholder: string
    preview: boolean
    value: string
}

/**
 * Renders the shared Markdown toolbar, textarea, preview, and character count.
 *
 * @param props controlled editor state and authored field metadata.
 * @returns accessible Markdown authoring control.
 * @throws Does not throw.
 */
const MarkdownEditor: FC<MarkdownEditorProps> = props => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    /** Applies one toolbar token to the active textarea selection. */
    const format = (prefix: string, suffix: string = ''): void => {
        const textarea = textareaRef.current
        const result = wrapMarkdownSelection(
            props.value,
            textarea?.selectionStart ?? props.value.length,
            textarea?.selectionEnd ?? props.value.length,
            prefix,
            suffix,
        )
        props.onChange(result.value.slice(0, props.maxLength))
        window.setTimeout(() => {
            textarea?.focus()
            textarea?.setSelectionRange(result.selectionStart, result.selectionEnd)
        })
    }

    const toolbarItems: Array<[string, string, string]> = [
        ['Bold', '**', '**'],
        ['Italic', '_', '_'],
        ['Underline', '<u>', '</u>'],
        ['Heading 1', '# ', ''],
        ['Heading 2', '## ', ''],
        ['Heading 3', '### ', ''],
        ['Bulleted list', '- ', ''],
        ['Numbered list', '1. ', ''],
        ['Link', '[', '](https://)'],
        ['Inline code', '`', '`'],
        ['Quote', '> ', ''],
    ]

    /** Continues or exits the active Markdown list without a toolbar round trip. */
    const continueList = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
        if (event.key !== 'Enter' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
        const result = continueMarkdownList(
            props.value,
            event.currentTarget.selectionStart,
            event.currentTarget.selectionEnd,
        )
        if (!result) return
        event.preventDefault()
        const value = result.value.slice(0, props.maxLength)
        const selection = Math.min(result.selectionStart, value.length)
        props.onChange(value)
        window.setTimeout(() => {
            textareaRef.current?.focus()
            textareaRef.current?.setSelectionRange(selection, selection)
        })
    }

    return (
        <div className={styles.markdownField}>
            <label htmlFor={props.id}>{props.label}</label>
            <div className={styles.editorShell}>
                <div aria-label='Markdown formatting' className={styles.editorToolbar} role='toolbar'>
                    {toolbarItems.map(([label, prefix, suffix]) => (
                        <button
                            aria-label={label}
                            key={label}
                            onClick={() => format(prefix, suffix)}
                            tabIndex={props.preview ? -1 : 0}
                            type='button'
                        >
                            {label === 'Bold' && <strong>B</strong>}
                            {label === 'Italic' && <em>I</em>}
                            {label === 'Underline' && <u>U</u>}
                            {label.startsWith('Heading') && `H${label.slice(-1)}`}
                            {label === 'Bulleted list' && '• ≡'}
                            {label === 'Numbered list' && '1. ≡'}
                            {label === 'Link' && <IconOutline.LinkIcon aria-hidden='true' />}
                            {label === 'Inline code' && <IconOutline.CodeIcon aria-hidden='true' />}
                            {label === 'Quote' && '❞'}
                        </button>
                    ))}
                </div>
                {props.preview
                    ? (
                        <div aria-label={`${props.label} preview`} className={styles.editorPreview}>
                            {props.value.trim()
                                ? <ChallengeMarkdown markdown={props.value} />
                                : <p>Nothing to preview yet.</p>}
                        </div>
                    )
                    : (
                        <textarea
                            id={props.id}
                            maxLength={props.maxLength}
                            onChange={event => props.onChange(event.target.value)}
                            onKeyDown={continueList}
                            placeholder={props.placeholder}
                            ref={textareaRef}
                            value={props.value}
                        />
                    )}
            </div>
            <div className={styles.editorHelp}>
                <span>You can use Markdown formatting.</span>
                <span>
                    {props.maxLength - props.value.length}
                    {' '}
                    characters left
                </span>
            </div>
        </div>
    )
}

/**
 * Renders the in-page topic creation workflow for the current challenge.
 *
 * @param props challenge context, navigation callback, and async create command.
 * @returns discussion guidance and controlled topic form.
 * @throws Does not throw; command errors render in the form.
 */
const ForumCreateTopicView: FC<{
    canCreateAnnouncements: boolean
    challenge: ChallengeOpportunity
    onBack: () => void
    onCreate: (title: string, content: string, isAnnouncement: boolean) => Promise<boolean>
}> = props => {
    const [content, setContent] = useState('')
    const [error, setError] = useState<string>()
    const [isAnnouncement, setIsAnnouncement] = useState(false)
    const [pending, setPending] = useState(false)
    const [preview, setPreview] = useState(false)
    const [title, setTitle] = useState('')

    /** Validates and submits the controlled topic fields. */
    const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault()
        if (!title.trim() || !content.trim()) {
            setError('Add a topic title and description before creating the topic.')
            return
        }

        setError(undefined)
        setPending(true)
        const created = await props.onCreate(title.trim(), content.trim(), isAnnouncement)
        setPending(false)
        if (!created) setError('The topic could not be created. Review the message above and try again.')
    }

    return (
        <div className={styles.createView}>
            <button className={styles.back} onClick={props.onBack} type='button'>
                <IconOutline.ArrowLeftIcon aria-hidden='true' />
                Discussions
            </button>
            <div className={styles.createBreadcrumb}>Discussions / New discussion</div>
            <div className={styles.createLayout}>
                <aside className={styles.createRail}>
                    <section>
                        <h2>Start New Discussion</h2>
                        <p>
                            Create a new topic in
                            {' '}
                            <strong>{props.challenge.name}</strong>
                        </p>
                    </section>
                    <section>
                        <h3>Discussion Guidelines</h3>
                        <ul>
                            <li>Be clear and specific in your topic title</li>
                            <li>Provide context and details in your description</li>
                            <li>Search existing topics before creating duplicates</li>
                            <li>Use formatting to make your post readable</li>
                            <li>Be respectful and constructive</li>
                        </ul>
                    </section>
                </aside>
                <form className={styles.createForm} onSubmit={submit}>
                    <label className={styles.titleField}>
                        <span>Topic Title</span>
                        <input
                            maxLength={255}
                            onChange={event => setTitle(event.target.value)}
                            placeholder='Enter a clear, descriptive title about your topic ...'
                            value={title}
                        />
                    </label>
                    <MarkdownEditor
                        id='forum-topic-content'
                        label='Topic Content'
                        maxLength={TOPIC_CHARACTER_LIMIT}
                        onChange={setContent}
                        placeholder={'Describe your question, share insights, or start a discussion '
                            + 'about the challenge...'}
                        preview={preview}
                        value={content}
                    />
                    {props.canCreateAnnouncements && (
                        <label className={styles.announcementOption}>
                            <input
                                checked={isAnnouncement}
                                onChange={event => setIsAnnouncement(event.target.checked)}
                                type='checkbox'
                            />
                            <span>
                                <strong>Post as announcement</strong>
                                <small>
                                    Highlight this topic as an official challenge update for every participant.
                                </small>
                            </span>
                        </label>
                    )}
                    {error && <p className={styles.actionError} role='alert'>{error}</p>}
                    <div className={styles.formActions}>
                        <button disabled={pending} type='submit'>
                            {pending ? 'Creating…' : 'Create topic'}
                        </button>
                        <button onClick={() => setPreview(value => !value)} type='button'>
                            {preview ? 'Write' : 'Preview'}
                        </button>
                        <span>Your topic will be visible to all challenge participants</span>
                    </div>
                </form>
            </div>
        </div>
    )
}

interface ForumTopicEditModalProps {
    detail: ForumTopicDetail
    onClose: () => void
    onSave: (title: string, content: string, starterPost: ForumPost) => Promise<void>
}

/**
 * Renders an in-app topic editor for both the title and starter-post content.
 *
 * @param props loaded topic detail and controlled save/close actions.
 * @returns modal Markdown form for an owned discussion.
 * @throws Does not throw; mutation failures remain visible inside the modal.
 */
const ForumTopicEditModal: FC<ForumTopicEditModalProps> = props => {
    const starterPost = props.detail.posts.find(post => (
        post.parentType === 'TOPIC' && post.parentId === props.detail.topic.id
    )) ?? props.detail.posts[0]
    const [content, setContent] = useState(starterPost?.content ?? '')
    const [error, setError] = useState<string>()
    const [pending, setPending] = useState(false)
    const [preview, setPreview] = useState(false)
    const [title, setTitle] = useState(props.detail.topic.title)

    /** Validates and saves both editable topic fields. */
    const save = async (): Promise<void> => {
        if (!title.trim() || !content.trim() || !starterPost) {
            setError('Add a topic title and description before saving your changes.')
            return
        }

        setError(undefined)
        setPending(true)
        try {
            await props.onSave(title.trim(), content.trim(), starterPost)
            props.onClose()
        } catch (mutationError) {
            setError(forumErrorMessage(mutationError))
        } finally {
            setPending(false)
        }
    }

    return (
        <BaseModal
            ariaLabelledby='forum-edit-topic-title'
            buttons={(
                <>
                    <button
                        className={styles.modalSecondary}
                        disabled={pending}
                        onClick={props.onClose}
                        type='button'
                    >
                        Cancel
                    </button>
                    <button
                        className={styles.modalPrimary}
                        disabled={pending}
                        onClick={save}
                        type='button'
                    >
                        {pending ? 'Saving…' : 'Save changes'}
                    </button>
                </>
            )}
            center
            classNames={{ modal: styles.editModal }}
            onClose={props.onClose}
            open
            showCloseIcon={!pending}
            size='md'
            spacer={false}
            title={<h2 className={styles.modalTitle} id='forum-edit-topic-title'>Edit topic</h2>}
        >
            <div className={styles.editModalBody}>
                <label className={styles.titleField}>
                    <span>Topic Title</span>
                    <input
                        disabled={pending}
                        maxLength={255}
                        onChange={event => setTitle(event.target.value)}
                        value={title}
                    />
                </label>
                <MarkdownEditor
                    id='forum-edit-topic-content'
                    label='Topic Content'
                    maxLength={TOPIC_CHARACTER_LIMIT}
                    onChange={setContent}
                    placeholder='Describe your topic'
                    preview={preview}
                    value={content}
                />
                <button
                    className={styles.previewButton}
                    disabled={pending}
                    onClick={() => setPreview(value => !value)}
                    type='button'
                >
                    {preview ? 'Write' : 'Preview'}
                </button>
                {error && <p className={styles.actionError} role='alert'>{error}</p>}
            </div>
        </BaseModal>
    )
}

interface ForumPostEditModalProps {
    onClose: () => void
    onSave: (content: string) => Promise<void>
    post: ForumPost
}

/**
 * Renders an in-app Markdown editor for an owned forum post.
 *
 * @param props selected post and controlled save/close actions.
 * @returns modal comment editor.
 * @throws Does not throw; mutation failures remain visible inside the modal.
 */
const ForumPostEditModal: FC<ForumPostEditModalProps> = props => {
    const [content, setContent] = useState(props.post.content ?? '')
    const [error, setError] = useState<string>()
    const [pending, setPending] = useState(false)
    const [preview, setPreview] = useState(false)

    /** Validates and saves the replacement post content. */
    const save = async (): Promise<void> => {
        if (!content.trim()) {
            setError('Add comment text before saving your changes.')
            return
        }

        setError(undefined)
        setPending(true)
        try {
            await props.onSave(content.trim())
            props.onClose()
        } catch (mutationError) {
            setError(forumErrorMessage(mutationError))
        } finally {
            setPending(false)
        }
    }

    return (
        <BaseModal
            ariaLabelledby='forum-edit-post-title'
            buttons={(
                <>
                    <button
                        className={styles.modalSecondary}
                        disabled={pending}
                        onClick={props.onClose}
                        type='button'
                    >
                        Cancel
                    </button>
                    <button
                        className={styles.modalPrimary}
                        disabled={pending}
                        onClick={save}
                        type='button'
                    >
                        {pending ? 'Saving…' : 'Save changes'}
                    </button>
                </>
            )}
            center
            classNames={{ modal: styles.editModal }}
            onClose={props.onClose}
            open
            showCloseIcon={!pending}
            size='md'
            spacer={false}
            title={<h2 className={styles.modalTitle} id='forum-edit-post-title'>Edit comment</h2>}
        >
            <div className={styles.editModalBody}>
                <MarkdownEditor
                    id='forum-edit-post-content'
                    label='Comment'
                    maxLength={COMMENT_CHARACTER_LIMIT}
                    onChange={setContent}
                    placeholder='Type here'
                    preview={preview}
                    value={content}
                />
                <button
                    className={styles.previewButton}
                    disabled={pending}
                    onClick={() => setPreview(value => !value)}
                    type='button'
                >
                    {preview ? 'Write' : 'Preview'}
                </button>
                {error && <p className={styles.actionError} role='alert'>{error}</p>}
            </div>
        </BaseModal>
    )
}

/**
 * Builds a bounded Markdown quote for a selected post.
 *
 * @param post visible forum post being quoted.
 * @returns attributed blockquote suitable for the comment editor.
 * @throws Does not throw.
 */
function quoteForumPost(post: ForumPost): string {
    const content = (post.content ?? '')
        .trim()
        .slice(0, 220)
        .split('\n')
        .map(line => `> ${line}`)
        .join('\n')
    return `> ${post.authorHandle} wrote:\n${content}\n\n`
}

/**
 * Renders one detail post with author context and in-page communication actions.
 *
 * @param props post thread context, current member, and mutation callbacks.
 * @returns Figma-aligned post card.
 * @throws Does not throw; mutation callbacks own API error handling.
 */
const ForumPostCard: FC<{
    detail: ForumTopicDetail
    item: FlatForumPost
    memberId: string
    onDelete: (post: ForumPost) => void
    onEdit: (post: ForumPost) => void
    onQuote: (post: ForumPost) => void
    onReact: (post: ForumPost, reaction: ForumPostReaction) => void
    onReply: (post: ForumPost) => void
    parent?: ForumPost
    profilesByMemberId: MemberProfilesById
    reactionPending: boolean
}> = props => {
    const post = props.item.post
    const owner = post.authorMemberId === props.memberId
    const postClass = props.item.depth > 0 ? styles.replyPost : styles.post
    return (
        <article className={postClass}>
            <header>
                {post.id === props.detail.topic.latestActivity?.postId
                    && props.detail.topic.unread && <span className={styles.newPost}>New post</span>}
                <div className={styles.postIdentity}>
                    <ForumMember
                        handle={post.authorHandle}
                        profile={props.profilesByMemberId.get(post.authorMemberId)}
                    />
                    {post.authorMemberId === props.detail.topic.authorMemberId && (
                        <span className={styles.authorBadge}>
                            <IconOutline.PencilIcon aria-hidden='true' />
                            Author
                        </span>
                    )}
                    <span>
                        {post.authorPostsCount ?? 0}
                        {' '}
                        posts
                    </span>
                </div>
                <div className={styles.postMeta}>
                    <time dateTime={post.createdAt}>
                        Posted:
                        {' '}
                        {formatForumDate(post.createdAt)}
                    </time>
                    {props.parent && (
                        <span>
                            Replying to
                            {' '}
                            {props.parent.authorHandle}
                            {'’s post of '}
                            {formatForumDate(props.parent.createdAt)}
                        </span>
                    )}
                </div>
            </header>
            <div className={styles.postContent}>
                {post.deleted || !post.content
                    ? <p className={styles.deleted}>This post has been deleted.</p>
                    : <ChallengeMarkdown markdown={post.content} />}
            </div>
            {!post.deleted && (
                <footer className={styles.postActions}>
                    <button
                        aria-label={`${post.viewerReaction === 'THUMBS_UP'
                            ? 'Remove'
                            : 'Add'} thumbs up (${post.thumbsUpCount ?? 0})`}
                        aria-pressed={post.viewerReaction === 'THUMBS_UP'}
                        className={post.viewerReaction === 'THUMBS_UP' ? styles.reactionActive : undefined}
                        disabled={props.reactionPending}
                        onClick={() => props.onReact(post, 'THUMBS_UP')}
                        type='button'
                    >
                        <IconOutline.ThumbUpIcon aria-hidden='true' />
                        {post.thumbsUpCount ?? 0}
                    </button>
                    <button
                        aria-label={`${post.viewerReaction === 'THUMBS_DOWN'
                            ? 'Remove'
                            : 'Add'} thumbs down (${post.thumbsDownCount ?? 0})`}
                        aria-pressed={post.viewerReaction === 'THUMBS_DOWN'}
                        className={post.viewerReaction === 'THUMBS_DOWN' ? styles.reactionActive : undefined}
                        disabled={props.reactionPending}
                        onClick={() => props.onReact(post, 'THUMBS_DOWN')}
                        type='button'
                    >
                        <IconOutline.ThumbDownIcon aria-hidden='true' />
                        {post.thumbsDownCount ?? 0}
                    </button>
                    {!props.detail.topic.locked && (
                        <>
                            <button onClick={() => props.onReply(post)} type='button'>
                                <IconOutline.ReplyIcon aria-hidden='true' />
                                Reply
                            </button>
                            <button onClick={() => props.onQuote(post)} type='button'>
                                ❞
                                Quote
                            </button>
                        </>
                    )}
                    {owner && !props.detail.topic.locked && (
                        <>
                            <button onClick={() => props.onEdit(post)} type='button'>
                                <IconOutline.PencilIcon aria-hidden='true' />
                                Edit
                            </button>
                            <button onClick={() => props.onDelete(post)} type='button'>
                                <IconOutline.TrashIcon aria-hidden='true' />
                                Delete
                            </button>
                        </>
                    )}
                </footer>
            )}
        </article>
    )
}

/**
 * Renders interactive topic detail with nested posts, per-member reactions,
 * and an in-page Markdown composer.
 *
 * @param props topic detail, current member, projections, navigation, and refresh callback.
 * @returns topic information, post cards, and comment workflow.
 * @throws Does not throw; API failures render beside the affected workflow.
 */
const ForumTopicView: FC<{
    detail: ForumTopicDetail
    memberId: string
    onBack: () => void
    onChanged: () => Promise<void>
    profilesByMemberId: MemberProfilesById
}> = props => {
    const [comment, setComment] = useState('')
    const [error, setError] = useState<string>()
    const [pending, setPending] = useState(false)
    const [preview, setPreview] = useState(false)
    const [reactionPendingPostId, setReactionPendingPostId] = useState<string>()
    const [replyTarget, setReplyTarget] = useState<ForumPost>()
    const [postToDelete, setPostToDelete] = useState<ForumPost>()
    const [postToEdit, setPostToEdit] = useState<ForumPost>()
    const flatPosts = flattenForumPosts(props.detail.posts)
    const postById = new Map(flatPosts.map(item => [item.post.id, item.post]))
    const participants = topicParticipants(props.detail.topic)

    /** Focuses the detail composer after selecting a reply or quote action. */
    const focusComposer = (): void => {
        window.setTimeout(() => document.getElementById('forum-comment')
            ?.focus())
    }

    /** Selects a post as the nested reply target. */
    const reply = (post: ForumPost): void => {
        setReplyTarget(post)
        setPreview(false)
        focusComposer()
    }

    /** Adds an attributed bounded quote and selects the quoted post as parent. */
    const quote = (post: ForumPost): void => {
        setReplyTarget(post)
        setComment(value => `${value}${value ? '\n\n' : ''}${quoteForumPost(post)}`.slice(0, COMMENT_CHARACTER_LIMIT))
        setPreview(false)
        focusComposer()
    }

    /** Opens the in-app editor for an owned post. */
    const editPost = (post: ForumPost): void => setPostToEdit(post)

    /** Persists replacement content from the in-app post editor. */
    const savePost = async (content: string): Promise<void> => {
        if (!postToEdit || content === postToEdit.content) return
        setError(undefined)
        await updateForumPost(postToEdit.id, content)
        await props.onChanged()
    }

    /** Opens the in-app delete confirmation for an owned post. */
    const removePost = (post: ForumPost): void => setPostToDelete(post)

    /** Soft-deletes the selected owned post after in-app confirmation. */
    const confirmRemovePost = async (): Promise<void> => {
        if (!postToDelete) return
        setError(undefined)
        setPending(true)
        try {
            await deleteForumPost(postToDelete.id)
            await props.onChanged()
            setPostToDelete(undefined)
        } catch (mutationError) {
            setError(forumErrorMessage(mutationError))
        } finally {
            setPending(false)
        }
    }

    /** Adds, switches, or removes the current member's post reaction. */
    const reactToPost = async (
        post: ForumPost,
        reaction: ForumPostReaction,
    ): Promise<void> => {
        setError(undefined)
        setReactionPendingPostId(post.id)
        try {
            await setForumPostReaction(
                post.id,
                post.viewerReaction === reaction ? undefined : reaction,
            )
            await props.onChanged()
        } catch (mutationError) {
            setError(forumErrorMessage(mutationError))
        } finally {
            setReactionPendingPostId(undefined)
        }
    }

    /** Creates a top-level comment or nested reply from the controlled composer. */
    const submitComment = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault()
        if (!comment.trim()) {
            setError('Write a comment before posting.')
            return
        }

        setError(undefined)
        setPending(true)
        try {
            await createForumPost(props.detail.topic.id, replyTarget
                ? {
                    content: comment.trim(),
                    parentId: replyTarget.id,
                    parentType: 'POST',
                }
                : { content: comment.trim() })
            setComment('')
            setReplyTarget(undefined)
            setPreview(false)
            await props.onChanged()
        } catch (mutationError) {
            setError(forumErrorMessage(mutationError))
        } finally {
            setPending(false)
        }
    }

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
                    <div className={styles.topicInfoAuthor}>
                        <ForumMember
                            handle={props.detail.topic.authorHandle}
                            profile={props.profilesByMemberId.get(props.detail.topic.authorMemberId)}
                        />
                        <span className={styles.authorBadge}>
                            <IconOutline.PencilIcon aria-hidden='true' />
                            Author
                        </span>
                    </div>
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
                        <p>
                            <IconOutline.EyeIcon aria-hidden='true' />
                            Views:
                            {' '}
                            {props.detail.topic.viewsCount ?? 0}
                        </p>
                        <strong>Participants</strong>
                        <ParticipantGroup
                            participants={participants}
                            profilesByMemberId={props.profilesByMemberId}
                            total={props.detail.topic.participantsCount ?? participants.length}
                        />
                    </div>
                </aside>
                <div className={styles.posts} aria-busy={pending || !!reactionPendingPostId}>
                    {error && <p className={styles.actionError} role='alert'>{error}</p>}
                    {flatPosts.map(item => (
                        <ForumPostCard
                            detail={props.detail}
                            item={item}
                            key={item.post.id}
                            memberId={props.memberId}
                            onDelete={removePost}
                            onEdit={editPost}
                            onQuote={quote}
                            onReact={reactToPost}
                            onReply={reply}
                            parent={item.post.parentType === 'POST'
                                ? postById.get(item.post.parentId)
                                : undefined}
                            profilesByMemberId={props.profilesByMemberId}
                            reactionPending={reactionPendingPostId === item.post.id}
                        />
                    ))}
                    {!flatPosts.length && (
                        <div className={styles.noPosts}>
                            <h2>No comments yet</h2>
                            <p>Start the conversation below.</p>
                        </div>
                    )}
                    {!props.detail.topic.locked && (
                        <form className={styles.commentForm} onSubmit={submitComment}>
                            <h2>Leave a comment</h2>
                            {replyTarget && (
                                <div className={styles.replyingTo}>
                                    Replying to
                                    {' '}
                                    <strong>{replyTarget.authorHandle}</strong>
                                    <button onClick={() => setReplyTarget(undefined)} type='button'>
                                        Cancel reply
                                    </button>
                                </div>
                            )}
                            <MarkdownEditor
                                id='forum-comment'
                                label='Comment'
                                maxLength={COMMENT_CHARACTER_LIMIT}
                                onChange={setComment}
                                placeholder='Type here'
                                preview={preview}
                                value={comment}
                            />
                            <div className={styles.formActions}>
                                <button disabled={pending} type='submit'>
                                    {pending ? 'Posting…' : 'Post comment'}
                                </button>
                                <button onClick={() => setPreview(value => !value)} type='button'>
                                    {preview ? 'Write' : 'Preview'}
                                </button>
                            </div>
                        </form>
                    )}
                    {props.detail.topic.locked && (
                        <p className={styles.lockedNotice}>This topic is locked and no longer accepts comments.</p>
                    )}
                </div>
            </div>
            {postToEdit && (
                <ForumPostEditModal
                    key={postToEdit.id}
                    onClose={() => setPostToEdit(undefined)}
                    onSave={savePost}
                    post={postToEdit}
                />
            )}
            <ConfirmModal
                action='Delete comment'
                isLoading={pending}
                isProcessing={pending}
                onClose={() => setPostToDelete(undefined)}
                onConfirm={confirmRemovePost}
                open={!!postToDelete}
                title='Delete comment?'
            >
                <p>Replies will remain in the discussion. This action cannot be undone.</p>
            </ConfirmModal>
        </div>
    )
}

/**
 * Renders the authenticated Challenge Discussion experience against forums-api-v6.
 *
 * The component keeps every communication workflow inside Opportunities:
 * topic create/edit/delete, nested replies, post edit/delete, reaction toggles,
 * watch state, and read state. A legacy link is retained only as recovery when
 * the v6 API cannot be reached or the member is signed out.
 *
 * @param props challenge context, optional authenticated member ID, and administrator announcement access.
 * @returns embedded topic list, creation form, detail discussion, or recovery state.
 * @throws Does not throw; API failures render stable, actionable UI states.
 */
export const ChallengeForum: FC<ChallengeForumProps> = props => {
    const externalUrl = challengeForumUrl(props.challenge)
    const [creatingTopic, setCreatingTopic] = useState(false)
    const [editingTopicDetail, setEditingTopicDetail] = useState<ForumTopicDetail>()
    const [mutationError, setMutationError] = useState<string>()
    const [page, setPage] = useState(1)
    const [pendingAction, setPendingAction] = useState<string>()
    const [perPage, setPerPage] = useState(10)
    const [scope, setScope] = useState<ForumScope>('all')
    const [search, setSearch] = useState('')
    const [selectedTopicId, setSelectedTopicId] = useState<string>()
    const [sort, setSort] = useState<ForumSort>('recent')
    const [topicToDelete, setTopicToDelete] = useState<ForumTopicSummary>()
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
                topic.starterPostExcerpt,
                topic.authorHandle,
                topic.latestActivity?.authorHandle,
                topic.roleName,
            ].some(value => value?.toLowerCase()
                .includes(query))
        })
        return [...result].sort((a, b) => {
            if (sort === 'active') {
                return b.postsCount - a.postsCount || activityTimestamp(b) - activityTimestamp(a)
            }

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
            ...(topic.participants ?? []).map(participant => participant.memberId),
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

    /** Revalidates list and selected detail after a successful write. */
    const refreshForum = async (): Promise<void> => {
        await Promise.all([
            response.mutate(),
            selectedTopicId ? detailResponse.mutate() : Promise.resolve(),
        ])
    }

    /** Opens a topic and records its current activity as read without blocking navigation. */
    const openTopic = (topicId: string): void => {
        setCreatingTopic(false)
        setSelectedTopicId(topicId)
        setMutationError(undefined)
        markForumTopicRead(topicId)
            .then(() => response.mutate())
            .catch(() => undefined)
    }

    /** Creates a challenge topic and opens its new detail view. */
    const createTopic = async (
        title: string,
        content: string,
        isAnnouncement: boolean,
    ): Promise<boolean> => {
        setMutationError(undefined)
        try {
            const created = await createForumTopic({
                challengeId: props.challenge.id,
                content,
                ...(isAnnouncement ? { isAnnouncement: true } : {}),
                title,
            })
            await response.mutate()
            setCreatingTopic(false)
            setSelectedTopicId(created.topic.id)
            return true
        } catch (error) {
            setMutationError(forumErrorMessage(error))
            return false
        }
    }

    /** Loads an owned topic into the in-app title and Markdown editor. */
    const editTopic = async (topic: ForumTopicSummary): Promise<void> => {
        setPendingAction(`edit:${topic.id}`)
        setMutationError(undefined)
        try {
            setEditingTopicDetail(await getForumTopicDetail(topic.id))
        } catch (error) {
            setMutationError(forumErrorMessage(error))
        } finally {
            setPendingAction(undefined)
        }
    }

    /** Saves the editable topic title and starter-post body through their owning endpoints. */
    const saveTopic = async (
        title: string,
        content: string,
        starterPost: ForumPost,
    ): Promise<void> => {
        if (!editingTopicDetail) return

        if (title !== editingTopicDetail.topic.title) {
            await updateForumTopic(editingTopicDetail.topic.id, title)
        }

        if (content !== starterPost.content) {
            await updateForumPost(starterPost.id, content)
        }

        await refreshForum()
    }

    /** Opens the in-app delete confirmation for an owned topic. */
    const removeTopic = (topic: ForumTopicSummary): void => setTopicToDelete(topic)

    /** Soft-deletes the selected owned topic after in-app confirmation. */
    const confirmRemoveTopic = async (): Promise<void> => {
        if (!topicToDelete) return
        setPendingAction(`delete:${topicToDelete.id}`)
        setMutationError(undefined)
        try {
            await deleteForumTopic(topicToDelete.id)
            if (selectedTopicId === topicToDelete.id) setSelectedTopicId(undefined)
            await response.mutate()
            setTopicToDelete(undefined)
        } catch (error) {
            setMutationError(forumErrorMessage(error))
        } finally {
            setPendingAction(undefined)
        }
    }

    /** Toggles the current member's explicit topic watch. */
    const toggleWatch = async (topic: ForumTopicSummary): Promise<void> => {
        setPendingAction(`watch:${topic.id}`)
        setMutationError(undefined)
        try {
            await setForumTopicWatching(topic.id, !topic.watching)
            await refreshForum()
        } catch (error) {
            setMutationError(forumErrorMessage(error))
        } finally {
            setPendingAction(undefined)
        }
    }

    if (!props.memberId) {
        return (
            <ForumFallback
                externalUrl={externalUrl}
                text='Sign in to read and join this challenge discussion.'
                title='Challenge Forum'
            />
        )
    }

    if (response.isValidating && !response.data) {
        return <OpportunityTabLoading label='Loading challenge forum' />
    }

    if (response.error) {
        return (
            <ForumFallback
                externalUrl={externalUrl}
                text='The embedded discussion could not be loaded. No communication action was attempted.'
                title='Forum temporarily unavailable'
            />
        )
    }

    if (creatingTopic) {
        return (
            <>
                {mutationError && <p className={styles.actionError} role='alert'>{mutationError}</p>}
                <ForumCreateTopicView
                    canCreateAnnouncements={!!props.canCreateAnnouncements}
                    challenge={props.challenge}
                    onBack={() => setCreatingTopic(false)}
                    onCreate={createTopic}
                />
            </>
        )
    }

    if (selectedTopicId) {
        if (detailResponse.isValidating && !detailResponse.data) {
            return <OpportunityTabLoading label='Loading forum topic' />
        }

        if (detailResponse.error || !detailResponse.data) {
            return (
                <div className={styles.detailError}>
                    <button onClick={() => setSelectedTopicId(undefined)} type='button'>Back to topics</button>
                    <ForumFallback
                        externalUrl={externalUrl}
                        text='This topic could not be loaded from the v6 Forums API.'
                        title='Topic unavailable'
                    />
                </div>
            )
        }

        return (
            <ForumTopicView
                detail={detailResponse.data}
                memberId={props.memberId}
                onBack={() => setSelectedTopicId(undefined)}
                onChanged={refreshForum}
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
                    onCreate={() => {
                        setMutationError(undefined)
                        setCreatingTopic(true)
                    }}
                    topics={topics}
                    total={response.data?.sourceTotalCount ?? topics.length}
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
                {mutationError && <p className={styles.actionError} role='alert'>{mutationError}</p>}
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
                        topics. Refine the filters to narrow the loaded discussion set.
                    </p>
                )}
                {visibleTopics.map(topic => (
                    <ForumTopicCard
                        key={topic.id}
                        memberId={props.memberId as string}
                        onDelete={removeTopic}
                        onEdit={editTopic}
                        onSelect={openTopic}
                        onWatch={toggleWatch}
                        pendingAction={pendingAction}
                        profilesByMemberId={profilesByMemberId}
                        topic={topic}
                    />
                ))}
                {!visibleTopics.length && (
                    <div className={styles.noResults}>
                        <IconOutline.SearchIcon aria-hidden='true' />
                        <h2>{topics.length ? 'No topics found' : 'No topics yet'}</h2>
                        <p>
                            {topics.length
                                ? 'Try another search or reset the forum filters.'
                                : 'Create the first topic to start the challenge discussion.'}
                        </p>
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
            {editingTopicDetail && (
                <ForumTopicEditModal
                    detail={editingTopicDetail}
                    key={editingTopicDetail.topic.id}
                    onClose={() => setEditingTopicDetail(undefined)}
                    onSave={saveTopic}
                />
            )}
            <ConfirmModal
                action='Delete topic'
                isLoading={pendingAction === `delete:${topicToDelete?.id}`}
                isProcessing={pendingAction === `delete:${topicToDelete?.id}`}
                onClose={() => setTopicToDelete(undefined)}
                onConfirm={confirmRemoveTopic}
                open={!!topicToDelete}
                title='Delete topic?'
            >
                <p>
                    <span>Delete “</span>
                    <strong>{topicToDelete?.title}</strong>
                    <span>” and its discussion? This action cannot be undone.</span>
                </p>
            </ConfirmModal>
        </div>
    )
}
