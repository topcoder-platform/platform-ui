import { DefaultChatTransport, UIMessage } from 'ai'
import { FC, useCallback, useMemo } from 'react'
import classNames from 'classnames'

import { useChat } from '@ai-sdk/react'
import {
    AssistantRuntimeProvider,
    ComposerPrimitive,
    MessagePrimitive,
    ThreadPrimitive,
    type ToolCallMessagePartProps,
} from '@assistant-ui/react'
import { useAISDKRuntime } from '@assistant-ui/react-ai-sdk'
import { IconOutline } from '~/libs/ui'

import { authFetch, CHAT_ENDPOINT_URL } from '../../lib'

import MarkdownText from './MarkdownText'
import styles from './ChatThread.module.scss'

const SUGGESTIONS: ReadonlyArray<{ label: string; prompt: string }> = [
    {
        label: 'Help me figure it out',
        prompt: "I want to find a challenge to work on but I'm not sure what yet — can you help me figure it out?",
    },
    {
        label: 'Real-time chat feature',
        prompt: 'Find a challenge involving a real-time chat feature with websockets.',
    },
    {
        label: 'Design track only Figma',
        prompt: 'Show me challenges on the Design track only which use Figma.',
    },
]

// Matches `lastMessages` on the challengeSearchAgent's Memory config
// (tc-ai-api/src/mastra/agents/challenge/challenge-search-agent.ts).
const MEMORY_MESSAGE_LIMIT = 25

interface ChatThreadProps {
    threadId: string
    resourceId: string
    initialMessages: UIMessage[]
    onThreadActivity?: () => void | Promise<void>
}

function formatJson(value: unknown): string {
    if (value === undefined) {
        return ''
    }

    try {
        return JSON.stringify(value, undefined, 2)
    } catch {
        return String(value)
    }
}

interface ThinkingDotsProps {
    className?: string
}

const ThinkingDots: FC<ThinkingDotsProps> = props => (
    <span className={classNames(styles.thinkingDots, props.className)}>
        <span className={styles.thinkingDot} />
        <span className={styles.thinkingDot} />
        <span className={styles.thinkingDot} />
    </span>
)

const ToolCallView: FC<ToolCallMessagePartProps> = props => {
    const isRunning = !props.isError && props.result === undefined
    const statusLabel = props.isError
        ? 'Error'
        : props.result !== undefined
            ? 'Complete'
            : 'Running'

    return (
        <details className={styles.toolCall}>
            <summary className={styles.toolCallHeader}>
                <IconOutline.ChevronDownIcon
                    className={styles.toolCallChevron}
                />
                <span className={styles.toolCallName}>{props.toolName}</span>
                <span
                    className={classNames(
                        styles.toolCallStatus,
                        props.isError ? styles.toolCallError : '',
                    )}
                >
                    {statusLabel}
                    {isRunning && <ThinkingDots className={styles.toolCallDots} />}
                </span>
            </summary>

            <div className={styles.toolCallSection}>
                <div className={styles.toolCallLabel}>Input</div>
                <pre className={styles.toolCallBody}>
                    {formatJson(props.args)}
                </pre>
            </div>

            {props.result !== undefined && (
                <div className={styles.toolCallSection}>
                    <div className={styles.toolCallLabel}>Output</div>
                    <pre className={styles.toolCallBody}>
                        {formatJson(props.result)}
                    </pre>
                </div>
            )}
        </details>
    )
}

const UserMessage: FC = () => (
    <>
        <MessagePrimitive.Root className={styles.userMessage}>
            <MessagePrimitive.Parts />
        </MessagePrimitive.Root>
        <ThreadPrimitive.If running>
            <MessagePrimitive.If last>
                <div className={classNames(styles.assistantMessage, styles.thinking)}>
                    <ThinkingDots />
                </div>
            </MessagePrimitive.If>
        </ThreadPrimitive.If>
    </>
)

const AssistantMessage: FC = () => (
    <MessagePrimitive.Root className={styles.assistantMessage}>
        <MessagePrimitive.Parts
            components={{ Text: MarkdownText, tools: { Fallback: ToolCallView } }}
        />
        <ThreadPrimitive.If running>
            <MessagePrimitive.If hasContent={false} last>
                <ThinkingDots />
            </MessagePrimitive.If>
        </ThreadPrimitive.If>
    </MessagePrimitive.Root>
)

const ChatThread: FC<ChatThreadProps> = props => {
    const transport = useMemo(
        () => new DefaultChatTransport({
            api: CHAT_ENDPOINT_URL,
            body: {
                memory: {
                    resource: props.resourceId,
                    thread: props.threadId,
                },
            },
            fetch: authFetch,
        }),
        [props.resourceId, props.threadId],
    )

    const handleFinish = useCallback(() => {
        props.onThreadActivity?.()
    }, [props.onThreadActivity])

    const chat = useChat({
        id: props.threadId,
        messages: props.initialMessages,
        onFinish: handleFinish,
        transport,
    })

    const runtime = useAISDKRuntime(chat)

    return (
        <AssistantRuntimeProvider runtime={runtime}>
            <ThreadPrimitive.Root className={styles.root}>
                <ThreadPrimitive.Viewport className={styles.viewport}>
                    <ThreadPrimitive.Empty>
                        <div className={styles.empty}>
                            <h4>Hello from TopScout 👋🏻</h4>
                            <p>
                                Ask TopScout to find challenges by skill, track,
                                type, and/or query in natural language.
                            </p>

                            <div className={styles.suggestions}>
                                {SUGGESTIONS.map(suggestion => (
                                    <ThreadPrimitive.Suggestion
                                        key={suggestion.label}
                                        className={styles.suggestion}
                                        prompt={suggestion.prompt}
                                        send
                                    >
                                        {suggestion.label}
                                    </ThreadPrimitive.Suggestion>
                                ))}
                            </div>
                        </div>
                    </ThreadPrimitive.Empty>

                    <ThreadPrimitive.Messages
                        components={{
                            AssistantMessage,
                            UserMessage,
                        }}
                    />
                </ThreadPrimitive.Viewport>

                <ComposerPrimitive.Root className={styles.composer}>
                    <ComposerPrimitive.Input
                        className={styles.input}
                        placeholder='Ask about Topcoder challenges…'
                        rows={1}
                    />
                    <ThreadPrimitive.If running={false}>
                        <ComposerPrimitive.Send className={styles.send}>
                            Send
                        </ComposerPrimitive.Send>
                    </ThreadPrimitive.If>
                    <ThreadPrimitive.If running>
                        <ComposerPrimitive.Cancel className={styles.cancel}>
                            Stop
                        </ComposerPrimitive.Cancel>
                    </ThreadPrimitive.If>
                </ComposerPrimitive.Root>

                <p className={styles.memoryHint}>
                    TopScout only remembers the last
                    {' '}
                    {MEMORY_MESSAGE_LIMIT}
                    {' '}
                    messages
                    in this conversation — earlier messages are no longer visible to it.
                </p>
            </ThreadPrimitive.Root>
        </AssistantRuntimeProvider>
    )
}

export default ChatThread
