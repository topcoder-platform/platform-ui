import { FC, MouseEvent, useCallback } from 'react'
import classNames from 'classnames'

import { IconOutline } from '~/libs/ui'

import { ChatThreadSummary } from '../../lib'

import styles from './ThreadSidebar.module.scss'

const threadDateFormatter = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
})

function getThreadDisplayTitle(thread: ChatThreadSummary): string {
    const title = thread.title?.trim()

    if (title) {
        return title
    }

    const threadDate = new Date(thread.updatedAt || thread.createdAt)

    if (Number.isNaN(threadDate.getTime())) {
        return 'Untitled thread'
    }

    return threadDateFormatter.format(threadDate)
}

interface ThreadSidebarProps {
    threads: ChatThreadSummary[]
    activeThreadId: string
    isLoading: boolean
    onSelect: (threadId: string) => void | Promise<void>
    onNew: () => void
    onDelete: (threadId: string) => void | Promise<void>
}

const ThreadSidebar: FC<ThreadSidebarProps> = props => {
    const handleSelectClick = useCallback(
        (event: MouseEvent<HTMLButtonElement>) => {
            const { threadId }: { threadId?: string }
                = event.currentTarget.dataset

            if (threadId) {
                props.onSelect(threadId)
            }
        },
        [props],
    )

    const handleDeleteClick = useCallback(
        (event: MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation()
            const { threadId }: { threadId?: string }
                = event.currentTarget.dataset

            if (threadId) {
                props.onDelete(threadId)
            }
        },
        [props],
    )

    return (
        <div className={styles.wrap}>
            <button
                className={styles.newThread}
                type='button'
                onClick={props.onNew}
            >
                <IconOutline.PlusIcon className={styles.newThreadIcon} />
                New
            </button>

            {props.isLoading && (
                <div className={styles.status}>Loading threads…</div>
            )}

            {!props.isLoading && (
                <ul className={styles.list}>
                    {props.threads.map(thread => (
                        <li
                            key={thread.id}
                            className={classNames(
                                styles.threadItem,
                                thread.id === props.activeThreadId
                                    ? styles.active
                                    : '',
                            )}
                        >
                            <button
                                className={styles.selectButton}
                                data-thread-id={thread.id}
                                type='button'
                                onClick={handleSelectClick}
                                title={getThreadDisplayTitle(thread)}
                            >
                                <span className={styles.threadTitle}>
                                    {getThreadDisplayTitle(thread)}
                                </span>
                            </button>
                            <button
                                aria-label='Delete thread'
                                className={styles.deleteButton}
                                data-thread-id={thread.id}
                                type='button'
                                onClick={handleDeleteClick}
                            >
                                <IconOutline.TrashIcon
                                    className={styles.deleteIcon}
                                />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default ThreadSidebar
