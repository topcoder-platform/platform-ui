/* eslint-disable complexity */
import {
    ChangeEvent,
    FC,
    ReactNode,
    useCallback,
    useMemo,
    useState,
} from 'react'
import {
    generatePath,
    Link,
    useNavigate,
    useParams,
    useSearchParams,
} from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import classNames from 'classnames'

import {
    Button,
    IconOutline,
    LogoIcon,
    SocialIconInstagram,
    SocialIconLinkedIn,
    SocialIconTwitter,
    SocialIconYoutube,
    TCLogoSvg,
} from '~/libs/ui'

import {
    forumCreateTopicRouteId,
    forumListingRouteId,
    forumTopicRouteId,
    rootRoute,
} from '../../config/routes.config'

import {
    sampleForumChallenge,
    sampleForumPosts,
    sampleForumTopics,
} from './sample-data'
import {
    ForumAuthor,
    ForumPost,
    ForumRole,
    ForumTopic,
    ForumTopicKind,
} from './types'
import styles from './ForumsPage.module.scss'

export enum ForumsPageMode {
    create = 'create',
    detail = 'detail',
    list = 'list',
}

interface ForumsPageProps {
    mode: ForumsPageMode
}

interface RoleAwareProps {
    role: ForumRole
}

interface TopicPathOptions {
    role: ForumRole
    topicId: string
}

interface MarkdownEditorProps {
    minHeight?: number
    onChange?: (value: string) => void
    placeholder: string
    value: string
}

interface TopicCardProps extends RoleAwareProps {
    topic: ForumTopic
}

interface PostCardProps extends RoleAwareProps {
    onDeleteClick: (postId: string) => void
    post: ForumPost
}

interface DeleteConfirmationProps {
    onCancel: () => void
    onDelete: () => void
}

const topicKindLabel: Record<ForumTopicKind, string> = {
    announcement: 'Announcement',
    discussion: 'Discussion',
}

/**
 * Builds a normalized app path from a community route fragment.
 *
 * @param route Route fragment from the community route config.
 * @param role Current sample role to preserve in navigation.
 * @returns Absolute route path with the role query string when needed.
 */
function getRoutePath(route: string, role: ForumRole): string {
    const path = `/${`${rootRoute}/${route}`
        .replace(/\/{2,}/g, '/')
        .replace(/^\/+/, '')}`

    return role === 'member'
        ? path
        : `${path}?role=${role}`
}

/**
 * Builds a topic-detail path for the selected sample role.
 *
 * @param options Topic id and current sample role.
 * @returns Absolute route path for the topic detail screen.
 */
function getTopicPath(options: TopicPathOptions): string {
    const route = generatePath(forumTopicRouteId, { topicId: options.topicId })

    return getRoutePath(route, options.role)
}

/**
 * Reads the supported forum role from URL search params.
 *
 * @param searchParams Current URL search params.
 * @returns Supported role, defaulting to member.
 */
function getRoleFromSearchParams(searchParams: URLSearchParams): ForumRole {
    const role = searchParams.get('role')

    if (role === 'admin' || role === 'copilot') {
        return role
    }

    return 'member'
}

/**
 * Returns the first letters used for the sample avatar fallback.
 *
 * @param author Forum author data.
 * @returns Uppercase avatar initials.
 */
function getAuthorInitials(author: ForumAuthor): string {
    return author.handle
        .split('.')
        .map(part => part.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase()
}

/**
 * Renders the Figma-style public header used by the sample forum screens.
 *
 * @returns Header element for desktop and mobile layouts.
 */
const ForumTopBar: FC = () => (
    <header className={styles.topBar}>
        <div className={styles.logoWrap}>
            <LogoIcon className={styles.logoMark} viewBox='0 0 56 20' />
            <span className={styles.logoType}>
                <span className={styles.logoText}>topcoder</span>
                <span className={styles.wipro}>a wipro company</span>
            </span>
        </div>
        <nav className={styles.desktopNav}>
            <span className={styles.navDivider} />
            <a href='/community/challenges'>Opportunities</a>
        </nav>
        <div className={styles.topActions}>
            <IconOutline.ViewGridIcon className={styles.headerIcon} />
            <span className={styles.headerAvatar}>JG</span>
            <IconOutline.MenuIcon className={styles.mobileMenuIcon} />
        </div>
    </header>
)

/**
 * Renders the dark Topcoder footer from the forum design.
 *
 * @returns Footer element with grouped navigation and social links.
 */
const ForumFooter: FC = () => (
    <footer className={styles.footer}>
        <div className={styles.footerInner}>
            <TCLogoSvg className={styles.footerLogo} />
            <div className={styles.footerRule} />
            <div className={styles.footerColumns}>
                <section className={styles.footerAbout}>
                    <h2>About Topcoder</h2>
                    <p>
                        Over 25 years ago, Topcoder pioneered competitive coding, transforming coding into a sport by
                        providing a platform for top developers worldwide to compete, enhance skills, and connect within
                        a global community.
                    </p>
                    <p>
                        Today, Topcoder enables businesses to access this vast pool of elite talent, harnessing the
                        skills and expertise of our global community to solve complex problems, drive innovation, and
                        deliver high-quality results faster.
                    </p>
                </section>
                <section className={styles.footerLinks}>
                    <h2>For Clients</h2>
                    <a href='/'>How it Works</a>
                    <a href='/'>The Talent</a>
                    <a href='/'>Case Studies</a>
                </section>
                <section className={styles.footerLinks}>
                    <h2>For Freelancers</h2>
                    <a href='/'>I&apos;m a Freelancer</a>
                    <a href='/'>Blogs</a>
                </section>
                <section className={styles.footerLinks}>
                    <h2>Resources</h2>
                    <button className={styles.expertButton} type='button'>Talk to an expert</button>
                    <div className={styles.socials} aria-label='Social links'>
                        <SocialIconLinkedIn />
                        <span>dc</span>
                        <SocialIconInstagram />
                        <SocialIconTwitter />
                        <SocialIconYoutube />
                    </div>
                    <a href='/'>Support</a>
                    <a href='/'>Terms and Conditions</a>
                    <a href='/'>Privacy Policy</a>
                </section>
            </div>
            <div className={styles.footerRule} />
            <p className={styles.copyright}>Copyright (c) 2025 Topcoder. All Rights Reserved.</p>
        </div>
    </footer>
)

/**
 * Renders the shared challenge heading, prize summary, deadline bar and tabs.
 *
 * @param props Current role used to preserve navigation state.
 * @returns Challenge context header for forum screens.
 */
const ForumChallengeHeader: FC<RoleAwareProps> = (props: RoleAwareProps) => (
    <section className={styles.challengeHeader}>
        <div className={styles.challengeTitleRow}>
            <span className={styles.backCircle} aria-hidden='true'>
                <IconOutline.ChevronDownIcon />
            </span>
            <div>
                <h1>{sampleForumChallenge.name}</h1>
                <div className={styles.tagRow}>
                    {sampleForumChallenge.tags.map(tag => (
                        <span className={styles.smallTag} key={tag}>{tag}</span>
                    ))}
                </div>
            </div>
        </div>
        <div className={styles.keyInformation}>
            <div className={styles.keyTitle}>Key information</div>
            <div className={styles.prizeRow}>
                <div className={styles.prizes}>
                    {sampleForumChallenge.prizes.map(prize => (
                        <div className={styles.prize} key={prize.label}>
                            <span className={classNames(styles.prizeBadge, styles[prize.tone])}>
                                {prize.label}
                            </span>
                            <strong>{prize.amount}</strong>
                        </div>
                    ))}
                </div>
                <div className={styles.challengeActions}>
                    <Button className={styles.outlinePill} secondary size='lg'>Unregister</Button>
                    <Button className={styles.primaryPill} primary size='lg'>
                        <IconOutline.UploadIcon />
                        Submit a solution
                    </Button>
                </div>
            </div>
            <p className={styles.bonus}>
                <span>Bonus:</span>
                {' '}
                5 Checkpoints Awarded Worth $50 Each
            </p>
            <div className={styles.deadlineBar}>
                <span>
                    Next Deadline:
                    {' '}
                    <strong>{sampleForumChallenge.nextDeadline}</strong>
                </span>
                <span className={styles.deadlineDivider} />
                <span>
                    Current Deadline Ends:
                    {' '}
                    <strong>{sampleForumChallenge.currentDeadline}</strong>
                </span>
                <IconOutline.ChevronDownIcon className={styles.deadlineIcon} />
            </div>
        </div>
        <nav className={styles.challengeTabs} aria-label='Challenge sections'>
            <a href='/'>Details</a>
            <a href='/'>
                Registrants
                <span>{sampleForumChallenge.registrantCount}</span>
            </a>
            <a href='/'>
                Submissions
                <span>{sampleForumChallenge.submissionCount}</span>
            </a>
            <Link className={styles.activeTab} to={getRoutePath(forumListingRouteId, props.role)}>
                Challenge Discussion
            </Link>
        </nav>
    </section>
)

/**
 * Renders a compact forum author avatar and role chip.
 *
 * @param props Author data and optional compact layout flag.
 * @returns Author identity row.
 */
const AuthorLine: FC<{ author: ForumAuthor; compact?: boolean }> = (
    props: { author: ForumAuthor; compact?: boolean },
) => (
    <div className={classNames(styles.authorLine, props.compact && styles.compactAuthor)}>
        <span className={classNames(styles.avatar, styles[props.author.avatarTone])}>
            {getAuthorInitials(props.author)}
        </span>
        <strong className={styles.handle}>{props.author.handle}</strong>
        <span className={styles.roleChip}>{props.author.role}</span>
    </div>
)

/**
 * Renders the discussion metadata, search and filter sidebar.
 *
 * @param props Current sample role.
 * @returns Sidebar cards for list and detail screens.
 */
const ForumSidebar: FC<RoleAwareProps> = (props: RoleAwareProps) => (
    <aside className={styles.sidebar}>
        <section className={styles.sidebarCard}>
            <h2>React Component Library Development Discussion</h2>
            <p>
                {sampleForumTopics.length}
                {' '}
                topics
                <span aria-hidden='true'> | </span>
                {sampleForumTopics.reduce((total: number, topic: ForumTopic) => total + topic.postCount, 0)}
                {' '}
                posts
            </p>
            <h3>Links:</h3>
            <a href='/'>General Forums</a>
            <Link className={styles.newTopicButton} to={getRoutePath(forumCreateTopicRouteId, props.role)}>
                <IconOutline.PlusIcon />
                New Topic
            </Link>
        </section>
        <section className={styles.sidebarCard}>
            <label className={styles.searchField}>
                <IconOutline.SearchIcon />
                <input placeholder='Search Topic' type='search' />
            </label>
            <label className={styles.selectField}>
                <span>Sort by</span>
                <select defaultValue='Most Recent'>
                    <option>Most Recent</option>
                    <option>Most Active</option>
                    <option>Oldest</option>
                </select>
            </label>
            <div className={styles.radioGroup}>
                {['All Topics', 'Unread', 'Announcements', 'Discussions'].map((label: string) => (
                    <label key={label}>
                        <input defaultChecked={label === 'All Topics'} name='topic-filter' type='radio' />
                        {label}
                    </label>
                ))}
            </div>
        </section>
        <section className={styles.sidebarCard}>
            <h3>Discussion Info:</h3>
            <AuthorLine author={sampleForumTopics[0].author} compact />
            <div className={styles.cardRule} />
            <p>
                Last post:
                {' '}
                {sampleForumTopics[0].lastPostAt}
            </p>
            <p>
                Created:
                {' '}
                {sampleForumTopics[0].createdAt}
            </p>
        </section>
    </aside>
)

/**
 * Renders a topic summary card.
 *
 * @param props Topic data and current sample role.
 * @returns Linkable topic card.
 */
const TopicCard: FC<TopicCardProps> = (props: TopicCardProps) => (
    <article className={styles.topicCard}>
        <div className={styles.topicMain}>
            <Link to={getTopicPath({ role: props.role, topicId: props.topic.id })}>
                <h2>{props.topic.title}</h2>
            </Link>
            <div className={styles.topicMeta}>
                <span className={classNames(styles.kindChip, styles[props.topic.kind])}>
                    {topicKindLabel[props.topic.kind]}
                </span>
                <span>
                    {props.topic.postCount}
                    {' '}
                    posts
                </span>
                <span>|</span>
                <span>
                    {props.topic.viewCount}
                    {' '}
                    views
                </span>
            </div>
        </div>
        <p>{props.topic.body}</p>
        <div className={styles.cardRule} />
        <div className={styles.topicFooter}>
            <div className={styles.topicAuthorGroup}>
                <AuthorLine author={props.topic.author} compact />
                <span>
                    Last post:
                    {' '}
                    {props.topic.lastPostAt}
                </span>
            </div>
            <span>
                Created:
                {' '}
                {props.topic.createdAt}
            </span>
        </div>
    </article>
)

/**
 * Renders the topic-list screen from sample data.
 *
 * @param props Current sample role.
 * @returns Topic list layout.
 */
const TopicListView: FC<RoleAwareProps> = (props: RoleAwareProps) => (
    <div className={styles.forumGrid}>
        <ForumSidebar role={props.role} />
        <main className={styles.topicList}>
            {sampleForumTopics.map(topic => (
                <TopicCard key={topic.id} role={props.role} topic={topic} />
            ))}
            <div className={styles.listDivider} />
            <Link className={styles.centerNewTopicButton} to={getRoutePath(forumCreateTopicRouteId, props.role)}>
                <IconOutline.PlusIcon />
                New Topic
            </Link>
        </main>
    </div>
)

/**
 * Renders one markdown toolbar button.
 *
 * @param props Button label or icon node.
 * @returns Toolbar button.
 */
const ToolbarButton: FC<{ children: ReactNode; title: string }> = (
    props: { children: ReactNode; title: string },
) => (
    <button className={styles.toolbarButton} title={props.title} type='button'>
        {props.children}
    </button>
)

/**
 * Renders the markdown editor control used by forum compose flows.
 *
 * @param props Placeholder, value and optional minimum height.
 * @returns Markdown editor surface.
 */
const MarkdownEditor: FC<MarkdownEditorProps> = (props: MarkdownEditorProps) => {
    const [preview, setPreview] = useState(false)
    const handlePreviewToggle = useCallback((): void => {
        setPreview(previous => !previous)
    }, [])
    const handleChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>): void => {
        props.onChange?.(event.target.value)
    }, [props])

    return (
        <div className={styles.markdownWrap}>
            <div className={styles.toolbar}>
                <ToolbarButton title='Bold'>B</ToolbarButton>
                <ToolbarButton title='Italic'><em>I</em></ToolbarButton>
                <ToolbarButton title='Underline'><u>U</u></ToolbarButton>
                <ToolbarButton title='Heading 1'>H1</ToolbarButton>
                <ToolbarButton title='Heading 2'>H2</ToolbarButton>
                <ToolbarButton title='Heading 3'>H3</ToolbarButton>
                <ToolbarButton title='Font size'>
                    16
                    <IconOutline.ChevronDownIcon />
                </ToolbarButton>
                <ToolbarButton title='Align left'>L</ToolbarButton>
                <ToolbarButton title='Align center'>C</ToolbarButton>
                <ToolbarButton title='Align right'>R</ToolbarButton>
                <ToolbarButton title='Numbered list'>1.</ToolbarButton>
                <ToolbarButton title='Bulleted list'>-</ToolbarButton>
                <ToolbarButton title='Link'><IconOutline.LinkIcon /></ToolbarButton>
                <ToolbarButton title='Image'><IconOutline.PhotographIcon /></ToolbarButton>
                <ToolbarButton title='Code'><IconOutline.CodeIcon /></ToolbarButton>
                <ToolbarButton title='Table'><IconOutline.TableIcon /></ToolbarButton>
                <ToolbarButton title='Preview'>
                    <IconOutline.DocumentSearchIcon />
                </ToolbarButton>
                <ToolbarButton title='Fullscreen'>
                    <IconOutline.ExternalLinkIcon />
                </ToolbarButton>
            </div>
            <div className={styles.editorBody} style={{ minHeight: props.minHeight ?? 248 }}>
                {preview ? (
                    <ReactMarkdown>{props.value || props.placeholder}</ReactMarkdown>
                ) : (
                    <textarea onChange={handleChange} placeholder={props.placeholder} value={props.value} />
                )}
            </div>
            <div className={styles.editorHelp}>
                <span>You can use Markdown formatting. Files will be uploaded when you post.</span>
                <span>16000 character remaining</span>
            </div>
            <button className={styles.previewToggle} onClick={handlePreviewToggle} type='button'>
                {preview ? 'Edit Markdown' : 'Preview Markdown'}
            </button>
        </div>
    )
}

/**
 * Renders an individual post inside a topic.
 *
 * @param props Post data, current role and delete callback.
 * @returns Post card with reactions and role-aware actions.
 */
const PostCard: FC<PostCardProps> = (props: PostCardProps) => {
    const canModerate = props.role === 'admin'
    const canEdit = props.role === 'admin' || props.post.isEditable === true
    const handleDeleteClick = useCallback((): void => {
        props.onDeleteClick(props.post.id)
    }, [props])

    return (
        <article className={styles.postCard}>
            <AuthorLine author={props.post.author} />
            <p className={styles.postDate}>{props.post.createdAt}</p>
            <div className={styles.postBody}>
                <ReactMarkdown>{props.post.body}</ReactMarkdown>
            </div>
            <div className={styles.cardRule} />
            <div className={styles.postActions}>
                <span className={styles.vote}>
                    <IconOutline.ThumbUpIcon />
                    {props.post.upVotes}
                </span>
                <span className={styles.vote}>
                    <IconOutline.ThumbDownIcon />
                    {props.post.downVotes}
                </span>
                <button type='button'>
                    <IconOutline.ReplyIcon />
                    Reply
                </button>
                <button type='button'>Quote</button>
                {canEdit && (
                    <button type='button'>
                        <IconOutline.PencilIcon />
                        Edit
                    </button>
                )}
                {canModerate && (
                    <button className={styles.dangerAction} onClick={handleDeleteClick} type='button'>
                        <IconOutline.TrashIcon />
                        Delete
                    </button>
                )}
            </div>
        </article>
    )
}

/**
 * Renders the admin delete confirmation overlay.
 *
 * @param props Confirm and cancel callbacks.
 * @returns Modal overlay.
 */
const DeleteConfirmation: FC<DeleteConfirmationProps> = (props: DeleteConfirmationProps) => (
    <div className={styles.modalOverlay}>
        <section className={styles.deleteModal} role='dialog' aria-modal='true' aria-labelledby='delete-title'>
            <h2 id='delete-title'>Delete Confirmation</h2>
            <p>Are you sure you want to permanently delete this post? This action cannot be undone</p>
            <div className={styles.cardRule} />
            <div className={styles.formActions}>
                <Button className={styles.deleteButton} onClick={props.onDelete} primary>Delete</Button>
                <Button className={styles.outlinePill} onClick={props.onCancel} secondary>Cancel</Button>
            </div>
        </section>
    </div>
)

/**
 * Renders the topic-detail screen from sample data.
 *
 * @param props Current sample role.
 * @returns Topic detail layout.
 */
const TopicDetailView: FC<RoleAwareProps> = (props: RoleAwareProps) => {
    const [deletePostId, setDeletePostId] = useState<string>()
    const [comment, setComment] = useState('')
    const topic = sampleForumTopics.find(item => item.id === 'typescript-interface-definitions')
        ?? sampleForumTopics[0]
    const handleCancelDelete = useCallback((): void => {
        setDeletePostId(undefined)
    }, [])
    const handleConfirmDelete = useCallback((): void => {
        setDeletePostId(undefined)
    }, [])
    const handleDeleteClick = useCallback((postId: string): void => {
        setDeletePostId(postId)
    }, [])

    return (
        <div className={styles.detailStack}>
            <div className={styles.breadcrumbBar}>
                <Link to={getRoutePath(forumListingRouteId, props.role)}>Discussions</Link>
                <IconOutline.ChevronDownIcon />
                <span>{topic.title}</span>
            </div>
            <div className={styles.forumGrid}>
                <aside className={styles.sidebar}>
                    <section className={styles.sidebarCard}>
                        <h2>{topic.title}</h2>
                        <p>
                            {topic.postCount}
                            {' '}
                            post
                            <span aria-hidden='true'> | </span>
                            3 participant
                        </p>
                    </section>
                    <section className={styles.sidebarCard}>
                        <h3>Topic Info:</h3>
                        <AuthorLine author={topic.author} compact />
                        <div className={styles.cardRule} />
                        <p>
                            Last post:
                            {' '}
                            {topic.lastPostAt}
                        </p>
                        <p>
                            Created:
                            {' '}
                            {topic.createdAt}
                        </p>
                    </section>
                </aside>
                <main className={styles.postsColumn}>
                    {sampleForumPosts.map(post => (
                        <PostCard
                            key={post.id}
                            onDeleteClick={handleDeleteClick}
                            post={post}
                            role={props.role}
                        />
                    ))}
                    <section className={styles.commentComposer}>
                        <h2>Leave a Comment</h2>
                        <MarkdownEditor onChange={setComment} placeholder='Comment...' value={comment} />
                        <div className={styles.formActions}>
                            <Button className={styles.primaryPill} primary>Post Comment</Button>
                            <Button className={styles.outlinePill} secondary>Preview</Button>
                        </div>
                    </section>
                </main>
            </div>
            {deletePostId && (
                <DeleteConfirmation
                    onCancel={handleCancelDelete}
                    onDelete={handleConfirmDelete}
                />
            )}
        </div>
    )
}

/**
 * Renders the create-topic sample screen.
 *
 * @param props Current sample role.
 * @returns Create-topic form.
 */
const CreateTopicView: FC<RoleAwareProps> = (props: RoleAwareProps) => {
    const navigate = useNavigate()
    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const handleTitleChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        setTitle(event.target.value)
    }, [])
    const handleCreate = useCallback((): void => {
        navigate(getRoutePath(forumListingRouteId, props.role))
    }, [navigate, props.role])

    return (
        <div className={styles.detailStack}>
            <div className={styles.breadcrumbBar}>
                <Link to={getRoutePath(forumListingRouteId, props.role)}>Discussions</Link>
                <IconOutline.ChevronDownIcon />
                <span>New Discussion</span>
            </div>
            <div className={styles.createGrid}>
                <aside className={styles.sidebar}>
                    <section className={styles.sidebarCard}>
                        <h2>Start New Discussion</h2>
                        <p>
                            Create a new topic in
                            {' '}
                            <strong>React Component Library Development</strong>
                        </p>
                    </section>
                    <section className={styles.sidebarCard}>
                        <h3>Discussion Guidelines</h3>
                        <ul className={styles.guidelines}>
                            <li>Be clear and specific in your topic title</li>
                            <li>Provide context and details in your description</li>
                            <li>Search existing topics before creating duplicates</li>
                            <li>Use appropriate formatting to make your post readable</li>
                            <li>Be respectful and constructive in your communication</li>
                        </ul>
                    </section>
                </aside>
                <main className={styles.createForm}>
                    <label className={styles.fieldLabel}>
                        Topic Title
                        <input
                            onChange={handleTitleChange}
                            placeholder='Enter a clear, descriptive title about your topic ...'
                            type='text'
                            value={title}
                        />
                    </label>
                    <MarkdownEditor
                        minHeight={280}
                        onChange={setBody}
                        placeholder='Describe your question, share insights, or start a discussion about the challenge.'
                        value={body}
                    />
                    <div className={styles.formActions}>
                        <Button className={styles.primaryPill} onClick={handleCreate} primary>Create Topic</Button>
                        <Button className={styles.outlinePill} secondary>Preview</Button>
                        <p className={styles.visibilityNote}>
                            Your topic will be visible to all challenge participants
                        </p>
                    </div>
                </main>
            </div>
        </div>
    )
}

/**
 * Top-level sample forum page routed by mode.
 *
 * @param props Route mode to render list, detail, or create screens.
 * @returns Complete forum sample page with Figma-style shell.
 */
const ForumsPage: FC<ForumsPageProps> = (props: ForumsPageProps) => {
    const [searchParams] = useSearchParams()
    const { topicId }: { topicId?: string } = useParams<{ topicId: string }>()
    const role = useMemo(() => getRoleFromSearchParams(searchParams), [searchParams])
    const content = useMemo(() => {
        if (props.mode === ForumsPageMode.create) {
            return <CreateTopicView role={role} />
        }

        if (props.mode === ForumsPageMode.detail || topicId) {
            return <TopicDetailView role={role} />
        }

        return <TopicListView role={role} />
    }, [props.mode, role, topicId])

    return (
        <div className={styles.page}>
            <ForumTopBar />
            <main className={styles.main}>
                <ForumChallengeHeader role={role} />
                {content}
            </main>
            <ForumFooter />
        </div>
    )
}

export default ForumsPage
