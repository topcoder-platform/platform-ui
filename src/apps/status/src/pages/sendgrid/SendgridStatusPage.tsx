/* eslint-disable ordered-imports/ordered-imports, react/jsx-no-bind */
/**
 * SendGrid terminal acceptance aggregates and lazy sanitized provider activity.
 */
import { FC, useMemo, useState } from 'react'

import {
    CompleteEmptyState,
    DataFreshness,
    IncompleteDataNotice,
    RefreshButton,
    RetryableErrorState,
    StatusColumn,
    StatusLoading,
    StatusPage,
    StatusPanel,
    StatusTable,
} from '../../lib/components'
import { useSendgridMessages, useSendgridStatus } from '../../lib/hooks'
import { SendgridWindowSummary } from '../../lib/models'
import { formatRatio, formatTimestamp } from '../../lib/utils'

import styles from '../StatusPages.module.scss'

const WINDOW_ORDER = ['15m', '1h', '3h', '6h', '12h', '24h']

/**
 * Renders exact logical-send acceptance counts and on-demand provider records.
 *
 * @returns active SendGrid Status page.
 * @throws Does not throw; request failures render in the page state.
 */
export const SendgridStatusPage: FC = () => {
    const summaryResource = useSendgridStatus()
    const [activityOpen, setActivityOpen] = useState(false)
    const messageResource = useSendgridMessages(activityOpen)
    const windows = useMemo(
        () => [...(summaryResource.data?.data.windows ?? [])]
            .sort((left, right) => WINDOW_ORDER.indexOf(left.window) - WINDOW_ORDER.indexOf(right.window)),
        [summaryResource.data],
    )
    const columns = useMemo<StatusColumn<SendgridWindowSummary>[]>(() => [
        {
            id: 'window',
            label: 'Cumulative window',
            render: row => <span className={styles.primaryText}>{row.window}</span>,
        },
        {
            id: 'accepted',
            label: 'Accepted recipient messages',
            render: row => row.acceptedMessages?.toLocaleString() ?? '—',
        },
        {
            id: 'failed',
            label: 'Permanently failed recipient messages',
            render: row => row.failedMessages?.toLocaleString() ?? '—',
        },
        {
            id: 'ratio',
            label: 'Success / failure ratio',
            render: row => (
                <>
                    <span className={styles.primaryText}>
                        {formatRatio(row.successRatio)}
                        {' '}
                        /
                        {formatRatio(row.failureRatio)}
                    </span>
                    <span className={styles.sourceLabel}>Weighted by recipient count</span>
                </>
            ),
        },
        {
            id: 'operations',
            label: 'Accepted / failed operations',
            render: row => (
                <>
                    {row.acceptedOperations?.toLocaleString() ?? '—'}
                    {' / '}
                    {row.failedOperations?.toLocaleString() ?? '—'}
                </>
            ),
        },
        {
            id: 'latest',
            label: 'Last terminal send',
            render: row => formatTimestamp(row.lastTerminalSendAt),
        },
    ], [])

    return (
        <StatusPage
            actions={(
                <RefreshButton
                    onRefresh={summaryResource.refresh}
                    refreshing={summaryResource.refreshing}
                />
            )}
            description={'Terminal logical-send outcomes and bounded provider diagnostics without '
                + 'recipient addresses or message content.'}
            title='SendGrid status'
        >
            <p className={styles.sendgridIntro}>
                <strong>SendGrid API acceptance.</strong>
                {' '}
                Accepted means SendGrid accepted the API request after retries; it does not mean
                final recipient delivery.
                Recipient-message totals are weighted by safe recipient counts and retries share one logical operation.
            </p>
            {summaryResource.error && (
                <RetryableErrorState
                    error={summaryResource.error}
                    hasStaleData={Boolean(summaryResource.data)}
                    onRetry={summaryResource.refresh}
                />
            )}
            {summaryResource.loading && !summaryResource.data && <StatusLoading />}
            {summaryResource.data && (
                <>
                    <DataFreshness
                        meta={summaryResource.data.meta}
                        refreshing={summaryResource.refreshing}
                        stale={summaryResource.stale}
                    />
                    <IncompleteDataNotice meta={summaryResource.data.meta} />
                    <StatusPanel title='Cumulative acceptance windows'>
                        {windows.length > 0
                            ? (
                                <StatusTable
                                    caption='SendGrid API acceptance by cumulative window'
                                    columns={columns}
                                    getKey={row => row.window}
                                    rows={windows}
                                />
                            )
                            : (
                                <CompleteEmptyState>
                                    No terminal send operations were recorded in these complete windows.
                                </CompleteEmptyState>
                            )}
                    </StatusPanel>
                </>
            )}
            <StatusPanel>
                <div className={styles.activityDisclosure}>
                    <div className={styles.activityHeader}>
                        <div>
                            <h2>Recent provider activity</h2>
                            <p>Up to 50 sanitized records, fetched only when this section is open.</p>
                        </div>
                        <button
                            aria-controls='sendgrid-provider-activity'
                            aria-expanded={activityOpen}
                            className={styles.disclosureButton}
                            onClick={() => setActivityOpen(open => !open)}
                            type='button'
                        >
                            {activityOpen ? 'Hide activity' : 'Show activity'}
                        </button>
                    </div>
                    {activityOpen && (
                        <div id='sendgrid-provider-activity'>
                            {messageResource.error && (
                                <RetryableErrorState
                                    error={messageResource.error}
                                    hasStaleData={Boolean(messageResource.data)}
                                    onRetry={messageResource.refresh}
                                />
                            )}
                            {messageResource.loading && !messageResource.data && <StatusLoading />}
                            {messageResource.data && (
                                <>
                                    <DataFreshness
                                        meta={messageResource.data.meta}
                                        refreshing={messageResource.refreshing}
                                        stale={messageResource.stale}
                                    />
                                    <IncompleteDataNotice
                                        message={'Provider activity may be capped or rate limited. '
                                            + 'It is diagnostic and is not used for acceptance totals.'}
                                        meta={messageResource.data.meta}
                                    />
                                    {messageResource.data.data.messages.length > 0
                                        ? (
                                            <ul className={styles.messageList}>
                                                {messageResource.data.data.messages.map(message => (
                                                    <li key={message.id}>
                                                        <time dateTime={message.timestamp || undefined}>
                                                            {formatTimestamp(message.timestamp)}
                                                        </time>
                                                        <span className={styles.statusValue}>{message.status}</span>
                                                        <span>{message.toMasked || 'Recipient unavailable'}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )
                                        : (
                                            <CompleteEmptyState>
                                                No recent provider activity was returned.
                                            </CompleteEmptyState>
                                        )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </StatusPanel>
        </StatusPage>
    )
}

export default SendgridStatusPage
