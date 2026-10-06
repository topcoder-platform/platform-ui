/* eslint-disable react/jsx-no-bind */
import { FC, FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import useSWR from 'swr'

import { authUrlLogin, useProfileContext } from '~/libs/core'
import { ConfirmModal } from '~/libs/ui'
import {
    flattenForumPosts,
    formatForumDate,
    forumErrorMessage,
    ForumMember,
    ForumTopicCard,
    ForumTopicEditModal,
    ForumTopicView,
    MarkdownEditor,
    ParticipantGroup,
} from '~/apps/opportunities/src/components/ChallengeForum'
import { OpportunityPagination } from '~/apps/opportunities/src/components/OpportunityPagination'
import {
    ForumTopicDetail,
    ForumTopicSummary,
    MemberProfileSummary,
} from '~/apps/opportunities/src/models'
import {
    createForumTopic,
    deleteForumTopic,
    getForumTopicDetail,
    getMemberProfilesByUserIds,
    markForumTopicRead,
    setForumTopicWatching,
    updateForumPost,
    updateForumTopic,
} from '~/apps/opportunities/src/services'
import authorIcon from '~/apps/opportunities/src/assets/forums/1bd8b.svg'
import backIcon from '~/apps/opportunities/src/assets/forums/ce6d4.svg'
import chevronIcon from '~/apps/opportunities/src/assets/forums/36954.svg'
import forwardIcon from '~/apps/opportunities/src/assets/forums/6292b.svg'
import helpIcon from '~/apps/opportunities/src/assets/forums/78d47.svg'
import infoIcon from '~/apps/opportunities/src/assets/forums/3faa9.svg'
import plusIcon from '~/apps/opportunities/src/assets/forums/f8147.svg'
import postsIcon from '~/apps/opportunities/src/assets/forums/bfe3c.svg'
import searchIcon from '~/apps/opportunities/src/assets/forums/a02e3.svg'
import topicsIcon from '~/apps/opportunities/src/assets/forums/171f8.svg'
import viewsIcon from '~/apps/opportunities/src/assets/forums/0a628.svg'
import watchIcon from '~/apps/opportunities/src/assets/forums/74494.svg'

import { forumsRoot } from './forums.routes'
import { getPublicForumCategories, getPublicForumTopics, PublicForumCategory } from './forums.service'
import styles from './ForumsPage.module.scss'
import './forums.scss'

/** Sends a guest to the shared login flow and returns them to their current forum URL.
 * @returns Nothing. @throws Does not throw.
 */
function signIn(): void {
    window.location.assign(authUrlLogin(window.location.href))
}

/** Public category index, paginated topic listing, and shared interactive thread view.
 * Auth-sensitive cache keys prevent a previously authenticated response being reused by guests.
 * @returns Figma desktop/mobile forum pages. @throws None; failures are rendered with retry controls.
 */
const ForumsPage: FC = () => {
    const profileContext = useProfileContext()
    const profile = profileContext.profile
    const initialized = profileContext.initialized
    const memberId = profile?.userId === undefined ? '' : String(profile.userId)
    const identity = `${memberId}:${(profile?.roles ?? []).join(',')}`
    const isAdmin = profile?.roles?.some(role => role.toLowerCase() === 'administrator') ?? false
    const routeParams = useParams<{ categoryId: string; threadId: string }>()
    const categoryId = routeParams.categoryId
    const threadId = routeParams.threadId
    const navigate = useNavigate()
    const [query, setQuery] = useSearchParams()
    const watching = query.get('watching') === 'true'
    const search = query.get('search') ?? ''
    const page = Math.max(1, Number(query.get('page')) || 1)
    const perPage = Math.min(100, Math.max(1, Number(query.get('perPage')) || 20))
    const [searchInput, setSearchInput] = useState(search)
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
    const [creating, setCreating] = useState(false)
    const [titleInput, setTitleInput] = useState('')
    const [content, setContent] = useState('')
    const [preview, setPreview] = useState(false)
    const [busy, setBusy] = useState<string>()
    const [actionError, setActionError] = useState<string>()
    const [deleteTarget, setDeleteTarget] = useState<ForumTopicSummary>()
    const [editTarget, setEditTarget] = useState<ForumTopicDetail>()
    const categoryResponse = useSWR(
        initialized ? ['public-forums:categories', identity] : undefined,
        getPublicForumCategories,
    )
    const categories = useMemo(() => categoryResponse.data ?? [], [categoryResponse.data])
    const detailResponse = useSWR(
        initialized && threadId ? ['public-forums:thread', threadId, identity] : undefined,
        () => getForumTopicDetail(threadId as string),
    )
    const detail = detailResponse.data
    const category = categories.find(item => item.id === (categoryId ?? detail?.topic.parentTopicId))
    const listQuery = new URLSearchParams({ page: String(page), perPage: String(perPage) })
    if (categoryId) listQuery.set('categoryId', categoryId)
    if (search) listQuery.set('search', search)
    if (watching) listQuery.set('watching', 'true')
    const listing = !!categoryId || !!search || watching
    const listResponse = useSWR(
        initialized && listing && !threadId
            ? ['public-forums:topics', listQuery.toString(), identity]
            : undefined,
        () => getPublicForumTopics(listQuery.toString()),
    )
    const watchedResponse = useSWR(
        initialized && memberId ? ['public-forums:watch-count', identity] : undefined,
        () => getPublicForumTopics('watching=true&perPage=1'),
    )
    const topics = useMemo(() => listResponse.data?.data ?? [], [listResponse.data])
    const members = useMemo(
        () => [
            ...new Set([
                ...categories.flatMap(item => [
                    item.authorMemberId,
                    ...item.participants.map(person => person.memberId),
                ]),
                ...topics.flatMap(item => [
                    item.authorMemberId,
                    ...item.participants.map(person => person.memberId),
                ]),
                ...(detail
                    ? flattenForumPosts(detail.posts)
                        .map(item => item.post.authorMemberId)
                    : []),
            ]),
        ].filter(id => /^\d+$/.test(id))
            .sort(),
        [categories, topics, detail],
    )
    const profileResponse = useSWR(
        members.length ? ['public-forums:profiles', ...members] : undefined,
        () => getMemberProfilesByUserIds(members),
        { revalidateOnFocus: false },
    )
    const profiles = useMemo(
        () => new Map<string, MemberProfileSummary>(
            (profileResponse.data ?? []).map(item => [item.userId, item]),
        ),
        [profileResponse.data],
    )

    useEffect(() => {
        document.body.classList.add('forums-page')
        return () => document.body.classList.remove('forums-page')
    }, [])
    useEffect(() => {
        setSearchInput(search)
    }, [search])
    useEffect(() => {
        setCreating(false)
        setActionError(undefined)
        window.scrollTo?.(0, 0)
    }, [categoryId, threadId])
    const mutateCategories = categoryResponse.mutate
    useEffect(() => {
        if (!detail || !memberId || !detail.topic.unread) return
        markForumTopicRead(detail.topic.id)
            .then(() => mutateCategories())
            .catch(() => undefined)
    }, [memberId, detail, mutateCategories])

    /** Refreshes data after a shared forum mutation. @returns Completion. @throws API errors. */
    const refresh = async (): Promise<void> => {
        await Promise.all([
            categoryResponse.mutate(),
            detailResponse.mutate(),
            listResponse.mutate(),
            watchedResponse.mutate(),
        ])
    }

    /** Applies list URL parameters, retaining shareable navigation and browser history.
     * @param name Query key. @param value New value. @returns Nothing. @throws Never.
     */
    const setFilter = (name: string, value: string): void => {
        const next = new URLSearchParams(query)
        if (value) next.set(name, value)
        else next.delete(name)
        if (name !== 'page') next.delete('page')
        setQuery(next)
    }

    /** Updates the member's category/thread watch. @param topic Target. @returns Completion. @throws
     * None; displays errors. */
    const watch = async (topic: ForumTopicSummary): Promise<void> => {
        if (!memberId) {
            signIn()
            return
        }

        setBusy(`watch:${topic.id}`)
        setActionError(undefined)
        try {
            await setForumTopicWatching(topic.id, !topic.watching)
            await refresh()
        } catch (error) {
            setActionError(forumErrorMessage(error))
        } finally {
            setBusy(undefined)
        }
    }

    /** Loads the shared owner editor. @param topic Selected thread. @returns Completion. @throws None;
     * displays errors. */
    const edit = async (topic: ForumTopicSummary): Promise<void> => {
        try {
            setEditTarget(await getForumTopicDetail(topic.id))
        } catch (error) {
            setActionError(forumErrorMessage(error))
        }
    }

    /** Soft-deletes a confirmed thread. @returns Completion. @throws None; displays errors. */
    const remove = async (): Promise<void> => {
        if (!deleteTarget) return
        setBusy('delete')
        try {
            await deleteForumTopic(deleteTarget.id)
            setDeleteTarget(undefined)
            await refresh()
        } catch (error) {
            setActionError(forumErrorMessage(error))
        } finally {
            setBusy(undefined)
        }
    }

    /** Creates a thread under its existing public category. @param event Form submission. @returns
     * Completion. @throws None. */
    const create = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault()
        if (!category || !titleInput.trim() || !content.trim()) {
            setActionError('Enter a title and a message.')
            return
        }

        setBusy('create')
        setActionError(undefined)
        try {
            const created = await createForumTopic({
                content: content.trim(),
                parentTopicId: category.id,
                title: titleInput.trim(),
            })
            setCreating(false)
            setTitleInput('')
            setContent('')
            await categoryResponse.mutate()
            navigate(`${forumsRoot}/thread/${created.topic.id}`)
        } catch (error) {
            setActionError(forumErrorMessage(error))
        } finally {
            setBusy(undefined)
        }
    }

    /** Opens category or thread routes for watched results. @param id Target ID. @returns Nothing. @throws Never. */
    const openTopic = (id: string): void => {
        navigate(
            `${forumsRoot}/${categories.some(item => item.id === id) ? 'category' : 'thread'}/${id}`,
        )
    }

    /** Toggles a category disclosure. @param id Category ID. @returns Nothing. @throws Never. */
    const toggle = (id: string): void => {
        setCollapsed(current => {
            const next = new Set(current)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const error = categoryResponse.error ?? detailResponse.error ?? listResponse.error
    const loading
        = !initialized
        || !categoryResponse.data
        || (!!threadId && !detail)
        || (listing && !threadId && !listResponse.data)
    const heading = creating
        ? 'Create new topic'
        : (detail?.topic.title ?? category?.title ?? (watching ? 'Watching' : 'Public Forums'))
    const breadcrumb = category && categories.find(item => item.id === category.parentTopicId)

    /** Renders a category row with shared rated identities and participant avatars.
     * @param item Category metadata. @returns Figma category row. @throws Never.
     */
    const categoryRow = (item: PublicForumCategory): JSX.Element => (
        <article className={styles.categoryRow} key={item.id}>
            <div className={styles.rowContent}>
                <div className={styles.rowHeader}>
                    <Link className={styles.topicTitle} to={`${forumsRoot}/category/${item.id}`}>
                        {item.title}
                    </Link>
                    <div className={styles.byline}>
                        <span>Created by</span>
                        <ForumMember
                            handle={item.authorHandle}
                            profile={profiles.get(item.authorMemberId)}
                        />
                        <time dateTime={item.createdAt}>{`at ${formatForumDate(item.createdAt)}`}</time>
                    </div>
                </div>
                {!!item.description && <p>{item.description}</p>}
                <div className={styles.rowFooter}>
                    <span>
                        {item.latestActivity
                            ? `Last post at ${formatForumDate(item.latestActivity.createdAt)}`
                            : 'No posts yet'}
                    </span>
                    <button
                        disabled={busy === `watch:${item.id}`}
                        onClick={() => watch(item)}
                        type='button'
                    >
                        <img alt='' src={watchIcon} />
                        {item.watching ? 'Watched' : 'Watch'}
                    </button>
                </div>
            </div>
            <div className={styles.metrics}>
                <p>
                    <img alt='' src={topicsIcon} />
                    <strong>Topics:</strong>
                    {item.topicsCount}
                </p>
                <p>
                    <img alt='' src={postsIcon} />
                    <strong>Posts:</strong>
                    {item.postsCount}
                </p>
                <div>
                    <strong>Participants</strong>
                    <ParticipantGroup
                        participants={item.participants}
                        profilesByMemberId={profiles}
                        total={item.participantsCount}
                    />
                </div>
            </div>
        </article>
    )
    /** Renders nested categories without assuming Vanilla has only two levels.
     * @param item Category container. @returns Accessible disclosure. @throws Never.
     */
    const categoryGroup = (item: PublicForumCategory): JSX.Element => {
        const children = categories.filter(candidate => candidate.parentTopicId === item.id)
        return (
            <section className={styles.categoryGroup} key={item.id}>
                <button
                    aria-expanded={!collapsed.has(item.id)}
                    className={styles.categoryHeader}
                    onClick={() => toggle(item.id)}
                    type='button'
                >
                    <span>{item.title}</span>
                    <img
                        alt=''
                        className={collapsed.has(item.id) ? styles.collapsed : undefined}
                        src={chevronIcon}
                    />
                </button>
                {!collapsed.has(item.id)
                    && (children.length
                        ? children.map(child => (child.displayAs === 'Categories'
                            ? categoryGroup(child)
                            : categoryRow(child)))
                        : categoryRow(item))}
            </section>
        )
    }

    return (
        <div className={`forums-app tc-2026 ${styles.page}`}>
            <header className={styles.header}>
                <nav aria-label='Breadcrumb' className={styles.breadcrumb}>
                    <Link to={forumsRoot || '/'}>Forums</Link>
                    {breadcrumb && (
                        <>
                            <span>/</span>
                            <Link to={`${forumsRoot}/category/${breadcrumb.id}`}>
                                {breadcrumb.title}
                            </Link>
                        </>
                    )}
                    {category && (
                        <>
                            <span>/</span>
                            <Link to={`${forumsRoot}/category/${category.id}`}>{category.title}</Link>
                        </>
                    )}
                    {detail && (
                        <>
                            <span>/</span>
                            <span>{detail.topic.title}</span>
                        </>
                    )}
                </nav>
                <div className={styles.titleRow}>
                    {(category || threadId) && (
                        <button
                            aria-label='Back to forums'
                            onClick={() => navigate(
                                threadId && category
                                    ? `${forumsRoot}/category/${category.id}`
                                    : forumsRoot || '/',
                            )}
                            type='button'
                        >
                            <img alt='' src={backIcon} />
                        </button>
                    )}
                    <h1>{heading}</h1>
                </div>
                {threadId && <div className={styles.emptySubtitle} />}
                {(!category || threadId) && (
                    <p className={threadId ? styles.mobileOnly : undefined}>
                        Explore community conversations, find answers, and join discussions with Topcoder
                        members around the world.
                    </p>
                )}
                {category && !threadId && category.description && <p>{category.description}</p>}
            </header>
            <div className={styles.layout}>
                <aside className={styles.sidebar}>
                    <form
                        className={styles.search}
                        onSubmit={event => {
                            event.preventDefault()
                            if (threadId) navigate(`${forumsRoot}?search=${encodeURIComponent(searchInput)}`)
                            else setFilter('search', searchInput.trim())
                        }}
                    >
                        <img alt='' src={searchIcon} />
                        <input
                            aria-label='Search forums'
                            onChange={event => setSearchInput(event.target.value)}
                            placeholder='Search'
                            value={searchInput}
                        />
                    </form>
                    <nav className={styles.navigation} aria-label='Forum navigation'>
                        <Link aria-current={!watching ? 'page' : undefined} to={forumsRoot || '/'}>
                            Public Forums
                        </Link>
                        <Link
                            aria-current={watching ? 'page' : undefined}
                            onClick={event => {
                                if (!memberId) {
                                    event.preventDefault()
                                    signIn()
                                }
                            }}
                            to={`${forumsRoot}?watching=true`}
                        >
                            Watching
                            {memberId && <span>{watchedResponse.data?.meta.totalCount ?? 0}</span>}
                        </Link>
                    </nav>
                    {category && (
                        <>
                            <section className={`${styles.sideCard} ${detail ? styles.mobileOnly : ''}`}>
                                <div className={styles.tags}>
                                    {category.unread && (
                                        <span className={styles.newTag}>New posts</span>
                                    )}
                                    <span>{`${category.topicsCount} topics`}</span>
                                    <span>{`${category.postsCount} posts`}</span>
                                </div>
                                {(category.canCreate || !memberId) && (
                                    <button
                                        className={styles.primary}
                                        onClick={() => {
                                            if (!memberId) signIn()
                                            else setCreating(true)
                                        }}
                                        type='button'
                                    >
                                        <img alt='' src={plusIcon} />
                                        Create new topic
                                    </button>
                                )}
                            </section>
                            <section className={`${styles.sideCard} ${styles.infoCard}`}>
                                <h2>
                                    <img alt='' src={infoIcon} />
                                    {detail ? 'Topic info' : 'Discussion info'}
                                </h2>
                                <div className={styles.infoAuthor}>
                                    <ForumMember
                                        handle={(detail?.topic ?? category).authorHandle}
                                        profile={profiles.get(
                                            (detail?.topic ?? category).authorMemberId,
                                        )}
                                    />
                                    <span className={styles.authorFlag}>
                                        <img alt='' src={authorIcon} />
                                        Author
                                    </span>
                                </div>
                                <dl>
                                    <div>
                                        <dt>Last post</dt>
                                        <dd>
                                            {formatForumDate(
                                                (detail?.topic ?? category).latestActivity?.createdAt,
                                            )}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Created</dt>
                                        <dd>{formatForumDate((detail?.topic ?? category).createdAt)}</dd>
                                    </div>
                                </dl>
                                {detail && (
                                    <div className={styles.infoMetrics}>
                                        <p>
                                            <img alt='' src={postsIcon} />
                                            <strong>Posts:</strong>
                                            {' '}
                                            {detail.topic.postsCount}
                                        </p>
                                        <p>
                                            <img alt='' src={viewsIcon} />
                                            <strong>Views:</strong>
                                            {' '}
                                            {detail.topic.viewsCount ?? 0}
                                        </p>
                                        <strong>Participants</strong>
                                        <ParticipantGroup
                                            participants={detail.topic.participants}
                                            profilesByMemberId={profiles}
                                            total={detail.topic.participantsCount}
                                        />
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                    <section className={styles.sideCard}>
                        <h2>
                            <img alt='' src={helpIcon} />
                            Forum guidelines
                        </h2>
                        <p>
                            Be respectful, stay on topic, and search for an answer before starting a new
                            discussion.
                        </p>
                        <a href='https://www.topcoder.com/community/topcoder-forums-code-of-conduct/'>
                            Read Code of Conduct
                            <img alt='' src={forwardIcon} />
                        </a>
                    </section>
                </aside>
                <main className={styles.content} aria-busy={loading || !!busy}>
                    {actionError && (
                        <p className={styles.error} role='alert'>
                            {actionError}
                        </p>
                    )}
                    {error ? (
                        <div className={styles.sideCard} role='alert'>
                            <h2>Forums could not be loaded</h2>
                            <p>{forumErrorMessage(error)}</p>
                            <button onClick={() => refresh()} type='button'>
                                Try again
                            </button>
                        </div>
                    ) : loading ? (
                        <p role='status'>Loading forums…</p>
                    ) : creating ? (
                        <form className={styles.composer} onSubmit={create}>
                            <label htmlFor='public-topic-title'>Topic Title</label>
                            <input
                                id='public-topic-title'
                                maxLength={255}
                                onChange={event => setTitleInput(event.target.value)}
                                required
                                value={titleInput}
                            />
                            <MarkdownEditor
                                id='public-topic-content'
                                label='Topic Content'
                                maxLength={16000}
                                onChange={setContent}
                                placeholder='Start a discussion…'
                                preview={preview}
                                value={content}
                            />
                            <div className={styles.actions}>
                                <button
                                    className={styles.primary}
                                    disabled={busy === 'create'}
                                    type='submit'
                                >
                                    {busy === 'create' ? 'Creating…' : 'Create topic'}
                                </button>
                                <button onClick={() => setPreview(!preview)} type='button'>
                                    {preview ? 'Write' : 'Preview'}
                                </button>
                                <button onClick={() => setCreating(false)} type='button'>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : detail ? (
                        <ForumTopicView
                            canDeletePosts={isAdmin}
                            contentOnly
                            detail={detail}
                            memberId={memberId}
                            onBack={() => navigate(`${forumsRoot}/category/${category?.id ?? ''}`)}
                            onChanged={refresh}
                            onSignIn={signIn}
                            onWatch={() => watch(detail.topic)}
                            profilesByMemberId={profiles}
                        />
                    ) : listing ? (
                        <>
                            {category?.displayAs === 'Categories'
                                && categories
                                    .filter(item => item.parentTopicId === category.id)
                                    .map(item => (item.displayAs === 'Categories'
                                        ? categoryGroup(item)
                                        : categoryRow(item)))}
                            {topics.map(topic => (
                                <ForumTopicCard
                                    canDelete={isAdmin}
                                    key={topic.id}
                                    memberId={memberId}
                                    onDelete={setDeleteTarget}
                                    onEdit={edit}
                                    onSelect={openTopic}
                                    onWatch={watch}
                                    pendingAction={busy}
                                    profilesByMemberId={profiles}
                                    topic={topic}
                                />
                            ))}
                            {!topics.length && category?.displayAs !== 'Categories' && (
                                <section className={styles.sideCard}>
                                    <h2>{watching ? 'No watched discussions' : 'No topics found'}</h2>
                                    <p>
                                        {watching
                                            ? 'Watch a category or thread to find it here.'
                                            : 'Try another search or start a new conversation.'}
                                    </p>
                                </section>
                            )}
                            {!!listResponse.data?.meta.totalCount && (
                                <OpportunityPagination
                                    onPageChange={value => setFilter('page', String(value))}
                                    onPerPageChange={value => setFilter('perPage', String(value))}
                                    page={page}
                                    perPage={perPage}
                                    total={listResponse.data.meta.totalCount}
                                    totalPages={listResponse.data.meta.totalPages}
                                />
                            )}
                        </>
                    ) : (
                        <>
                            {categories.filter(item => !item.parentTopicId)
                                .map(categoryGroup)}
                            {!categories.length && <p>No public forums are available yet.</p>}
                        </>
                    )}
                </main>
            </div>
            {editTarget && (
                <ForumTopicEditModal
                    detail={editTarget}
                    onClose={() => setEditTarget(undefined)}
                    onSave={async (title, body, starter) => {
                        await updateForumTopic(editTarget.topic.id, title)
                        if (starter && starter.content !== body) await updateForumPost(starter.id, body)
                        await refresh()
                    }}
                />
            )}
            <ConfirmModal
                action='Delete topic'
                isLoading={busy === 'delete'}
                isProcessing={busy === 'delete'}
                onClose={() => setDeleteTarget(undefined)}
                onConfirm={remove}
                open={!!deleteTarget}
                title='Delete topic?'
            >
                <p>The topic will be hidden from the forums.</p>
            </ConfirmModal>
        </div>
    )
}

export default ForumsPage
