import { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { UIMessage } from 'ai'

import { CustomerPortalAppContext } from '~/apps/customer-portal/src/lib/contexts'
import { CustomerPortalAppContextModel } from '~/apps/customer-portal/src/lib/models'

import { ChatThread } from './components/ChatThread'
import { ThreadSidebar } from './components/ThreadSidebar'
import { ChatThreadSummary, deleteChatThread, fetchChatThreadMessages, fetchChatThreads, toChatUIMessages } from './lib'
import styles from './TopScoutPage.module.scss'

function createThreadId(): string {
    return crypto.randomUUID()
}

const TopScoutPage: FC = () => {
    const { loginUserInfo }: CustomerPortalAppContextModel = useContext(CustomerPortalAppContext)
    const resourceId = useMemo(
        () => (loginUserInfo?.userId ? String(loginUserInfo.userId) : undefined),
        [loginUserInfo?.userId],
    )

    const [threads, setThreads] = useState<ChatThreadSummary[]>([])
    const [isLoadingThreads, setIsLoadingThreads] = useState<boolean>(true)
    const [activeThreadId, setActiveThreadId] = useState<string>(createThreadId)
    const [initialMessages, setInitialMessages] = useState<UIMessage[]>([])
    const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false)

    const refreshThreads = useCallback(async () => {
        if (!resourceId) {
            return
        }

        try {
            const fetchedThreads = await fetchChatThreads(resourceId)
            setThreads(fetchedThreads)
        } catch (error) {
            console.error('Failed to load TopScout threads:', (error as Error).message)
        } finally {
            setIsLoadingThreads(false)
        }
    }, [resourceId])

    useEffect(() => {
        setIsLoadingThreads(true)
        refreshThreads()
    }, [refreshThreads])

    const handleNewThread = useCallback(() => {
        setActiveThreadId(createThreadId())
        setInitialMessages([])
    }, [])

    const handleSelectThread = useCallback(async (threadId: string) => {
        setIsLoadingMessages(true)

        try {
            const messages = await fetchChatThreadMessages(threadId)
            setInitialMessages(toChatUIMessages(messages))
            setActiveThreadId(threadId)
        } catch (error) {
            console.error('Failed to load TopScout thread messages:', (error as Error).message)
        } finally {
            setIsLoadingMessages(false)
        }
    }, [])

    const handleDeleteThread = useCallback(async (threadId: string) => {
        try {
            await deleteChatThread(threadId)
            setThreads(current => current.filter(thread => thread.id !== threadId))

            if (threadId === activeThreadId) {
                handleNewThread()
            }
        } catch (error) {
            console.error('Failed to delete TopScout thread:', (error as Error).message)
        }
    }, [activeThreadId, handleNewThread])

    return (
        <main className={styles.page}>
            <h1>TopScout</h1>
            <p className={styles.subtitle}>
                Describe what you&apos;re looking for — TopScout asks clarifying questions,
                searches and refines on your behalf, and keeps results organized by project.
            </p>

            {!resourceId && (
                <div className={styles.status}>Sign in to chat with TopScout.</div>
            )}

            {resourceId && (
                <div className={styles.layout}>
                    <div className={styles.sidebar}>
                        <ThreadSidebar
                            activeThreadId={activeThreadId}
                            isLoading={isLoadingThreads}
                            threads={threads}
                            onDelete={handleDeleteThread}
                            onNew={handleNewThread}
                            onSelect={handleSelectThread}
                        />
                    </div>

                    <div className={styles.chatPanel}>
                        <ChatThread
                            initialMessages={initialMessages}
                            resourceId={resourceId}
                            threadId={activeThreadId}
                            onThreadActivity={refreshThreads}
                        />
                        {isLoadingMessages && (
                            <div className={styles.loadingOverlay}>Loading conversation…</div>
                        )}
                    </div>
                </div>
            )}
        </main>
    )
}

export default TopScoutPage
