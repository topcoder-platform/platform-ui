import { FC, useMemo } from 'react'
import classNames from 'classnames'

import { IconOutline } from '~/libs/ui'

import {
    sampleForumTopics,
} from '../../../forums/sample-data'
import {
    ForumAuthor,
    ForumTopic,
    ForumTopicKind,
} from '../../../forums/types'

import styles from './ChallengeDiscussion.module.scss'

interface ChallengeDiscussionProps {
    challengeName: string
}

interface TopicCardProps {
    topic: ForumTopic
}

const topicKindLabel: Record<ForumTopicKind, string> = {
    announcement: 'Announcement',
    discussion: 'Discussion',
}

/**
 * Returns the initials displayed in mock forum avatar placeholders.
 *
 * @param author Forum author metadata.
 * @returns Uppercase author initials.
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
 * Renders a compact forum author line for the mock discussion data.
 *
 * @param props Forum author metadata.
 * @returns Author identity row.
 */
const AuthorLine: FC<{ author: ForumAuthor }> = (
    props: { author: ForumAuthor },
) => (
    <div className={styles.authorLine}>
        <span className={classNames(styles.avatar, styles[props.author.avatarTone])}>
            {getAuthorInitials(props.author)}
        </span>
        <strong className={styles.handle}>{props.author.handle}</strong>
        <span className={styles.roleChip}>{props.author.role}</span>
    </div>
)

/**
 * Renders one mock forum topic summary.
 *
 * @param props Topic data to display.
 * @returns Topic card for the discussion tab.
 */
const TopicCard: FC<TopicCardProps> = (props: TopicCardProps) => (
    <article className={styles.topicCard}>
        <div className={styles.topicMain}>
            <h2>{props.topic.title}</h2>
            <div className={styles.topicMeta}>
                <span className={classNames(styles.kindChip, styles[props.topic.kind])}>
                    {topicKindLabel[props.topic.kind]}
                </span>
                <span>
                    {props.topic.postCount}
                    {' '}
                    posts
                </span>
                <span aria-hidden='true'>|</span>
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
                <AuthorLine author={props.topic.author} />
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
 * Renders the challenge discussion tab using temporary mock forum content.
 *
 * @param props Current challenge metadata for the discussion heading.
 * @returns Mock challenge discussion layout.
 */
const ChallengeDiscussion: FC<ChallengeDiscussionProps> = (
    props: ChallengeDiscussionProps,
) => {
    const totalPosts = useMemo(
        () => sampleForumTopics.reduce(
            (total: number, topic: ForumTopic) => total + topic.postCount,
            0,
        ),
        [],
    )

    return (
        <section className={styles.container}>
            <aside className={styles.sidebar}>
                <section className={styles.sidebarCard}>
                    <h2>{props.challengeName}</h2>
                    <p>
                        {sampleForumTopics.length}
                        {' '}
                        topics
                        <span aria-hidden='true'> | </span>
                        {totalPosts}
                        {' '}
                        posts
                    </p>
                    <h3>Links:</h3>
                    <a href='/community/forums'>General Forums</a>
                    <button className={styles.newTopicButton} type='button'>
                        <IconOutline.PlusIcon />
                        New Topic
                    </button>
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
                        {['All Topics', 'Unread', 'Announcements', 'Discussions'].map(label => (
                            <label key={label}>
                                <input defaultChecked={label === 'All Topics'} name='topic-filter' type='radio' />
                                {label}
                            </label>
                        ))}
                    </div>
                </section>
            </aside>

            <main className={styles.topicList}>
                {sampleForumTopics.map(topic => (
                    <TopicCard key={topic.id} topic={topic} />
                ))}
            </main>
        </section>
    )
}

export default ChallengeDiscussion
