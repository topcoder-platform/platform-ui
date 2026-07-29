/* eslint-disable react/jsx-no-bind, unicorn/no-null */
/**
 * Small accessible presentation components shared across Status pages.
 */
import {
    ChangeEvent,
    FC,
    PropsWithChildren,
    ReactNode,
} from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import {
    StatusMeta,
    StatusRequestError,
    StatusSeverity,
    StatusWindow,
} from '../../models'
import { formatTimestamp } from '../../utils'

import styles from './StatusUi.module.scss'

const SEVERITY_LABELS: Record<StatusSeverity, string> = {
    critical: 'Critical',
    healthy: 'Healthy',
    'healthy-change': 'Healthy · recent change',
    unknown: 'Unknown',
    warning: 'Warning',
}

const SEVERITY_SYMBOLS: Record<StatusSeverity, string> = {
    critical: '!',
    healthy: '✓',
    'healthy-change': '↻',
    unknown: '?',
    warning: '▲',
}

export interface HealthBadgeProps {
    severity: StatusSeverity
    label?: string
}

/**
 * Renders a non-color-only operational severity badge.
 *
 * @param props severity and optional server-facing label.
 * @returns icon-and-text health badge.
 * @throws Does not throw.
 */
export const HealthBadge: FC<HealthBadgeProps> = props => {
    const label = props.label || SEVERITY_LABELS[props.severity]
    return (
        <span
            aria-label={`Status: ${label}`}
            className={classNames(styles.badge, styles[props.severity])}
        >
            <span aria-hidden='true' className={styles.badgeIcon}>
                {SEVERITY_SYMBOLS[props.severity]}
            </span>
            {label}
        </span>
    )
}

export interface DataFreshnessProps {
    meta: StatusMeta
    refreshing?: boolean
    stale?: boolean
}

/**
 * Shows response sources, generation time, refresh state, and completeness.
 *
 * @param props response metadata plus current lifecycle flags.
 * @returns source and freshness line.
 * @throws Does not throw.
 */
export const DataFreshness: FC<DataFreshnessProps> = props => (
    <div className={styles.freshness} role='status'>
        <span>
            Sources:
            {' '}
            {props.meta.source.join(', ') || 'unknown'}
        </span>
        <span aria-hidden='true'>·</span>
        <span>
            As of
            {' '}
            <time dateTime={props.meta.generatedAt}>{formatTimestamp(props.meta.generatedAt)}</time>
        </span>
        {props.meta.window && (
            <>
                <span aria-hidden='true'>·</span>
                <span>
                    Window:
                    {' '}
                    {props.meta.window}
                </span>
            </>
        )}
        {props.refreshing && <strong>Refreshing…</strong>}
        {props.stale && <strong className={styles.stale}>Stale</strong>}
        {!props.meta.complete && <strong className={styles.incomplete}>Incomplete</strong>}
    </div>
)

export interface MetricCardProps {
    label: string
    value: ReactNode
    context?: ReactNode
    state?: StatusSeverity
}

/**
 * Renders one compact headline metric with optional context.
 *
 * @param props metric label, value, context, and health state.
 * @returns semantic metric card.
 * @throws Does not throw.
 */
export const MetricCard: FC<MetricCardProps> = props => (
    <article className={classNames(styles.metricCard, props.state && styles[`metric-${props.state}`])}>
        <h2>{props.label}</h2>
        <div className={styles.metricValue}>{props.value}</div>
        {props.context && <p>{props.context}</p>}
    </article>
)

export interface TimeWindowSelectProps {
    id: string
    value: StatusWindow
    windows?: StatusWindow[]
    onChange: (window: StatusWindow) => void
}

/**
 * Restricts monitoring queries to windows supported by status-api-v6.
 *
 * @param props control ID, selected value, optional allowed windows, and handler.
 * @returns labelled select control.
 * @throws Does not throw.
 */
export const TimeWindowSelect: FC<TimeWindowSelectProps> = props => {
    const windows = props.windows ?? ['15m', '1h', '3h', '6h', '12h', '24h', '7d']
    const handleChange = (event: ChangeEvent<HTMLSelectElement>): void => {
        props.onChange(event.target.value as StatusWindow)
    }

    return (
        <label className={styles.windowLabel} htmlFor={props.id}>
            Time window
            <select id={props.id} onChange={handleChange} value={props.value}>
                {windows.map(window => <option key={window} value={window}>{window}</option>)}
            </select>
        </label>
    )
}

export interface IncompleteDataNoticeProps {
    meta: StatusMeta
    message?: string
}

/**
 * Explains why partial monitoring data must not be interpreted as healthy zeroes.
 *
 * @param props incomplete response metadata and optional contextual message.
 * @returns warning notice, or nothing for complete data.
 * @throws Does not throw.
 */
export const IncompleteDataNotice: FC<IncompleteDataNoticeProps> = props => {
    if (props.meta.complete) {
        return null
    }

    const fallbackMessage = 'Some sources are unavailable or still warming. '
        + 'Missing values are unknown, not zero.'

    return (
        <aside className={styles.notice} role='alert'>
            <strong>Incomplete monitoring data</strong>
            <p>{props.message || fallbackMessage}</p>
            {props.meta.warnings.length > 0 && (
                <ul>
                    {props.meta.warnings.map(warning => (
                        <li key={`${warning.code}:${warning.source || 'general'}:${warning.message}`}>
                            <strong>{warning.code}</strong>
                            {': '}
                            {warning.message}
                            {warning.source ? ` (${warning.source})` : ''}
                        </li>
                    ))}
                </ul>
            )}
        </aside>
    )
}

export interface RetryableErrorStateProps {
    error: StatusRequestError
    hasStaleData?: boolean
    onRetry: () => void
}

/**
 * Renders a categorized request failure and explicit retry action.
 *
 * @param props safe error, stale-data flag, and retry handler.
 * @returns accessible error notice.
 * @throws Does not throw.
 */
export const RetryableErrorState: FC<RetryableErrorStateProps> = props => (
    <div className={styles.errorState} role='alert'>
        <strong>
            {props.error.kind === 'authorization' ? 'Access unavailable' : 'Monitoring source unavailable'}
        </strong>
        <p>{props.error.message}</p>
        {props.hasStaleData && <p>The last successful result remains visible below.</p>}
        <button onClick={props.onRetry} type='button'>Retry</button>
    </div>
)

export interface ExternalAwsLinkProps {
    href?: string | null
    children?: ReactNode
    ariaLabel?: string
}

/**
 * Validates and renders a safe AWS Console link in a new tab.
 *
 * @param props candidate URL, label, and optional accessible name.
 * @returns safe external anchor or an unavailable marker.
 * @throws Does not throw; invalid URLs render as unavailable.
 */
export const ExternalAwsLink: FC<ExternalAwsLinkProps> = props => {
    let safeHref: string | undefined
    try {
        if (props.href) {
            const parsed = new URL(props.href)
            const isAwsConsole = parsed.hostname === 'console.aws.amazon.com'
                || parsed.hostname.endsWith('.console.aws.amazon.com')
            if (parsed.protocol === 'https:' && isAwsConsole) {
                safeHref = parsed.toString()
            }
        }
    } catch {
        safeHref = undefined
    }

    if (!safeHref) {
        return <span className={styles.unavailable}>Unavailable</span>
    }

    return (
        <a
            aria-label={props.ariaLabel}
            className={styles.awsLink}
            href={safeHref}
            rel='noopener noreferrer'
            target='_blank'
        >
            {props.children || 'Open in AWS'}
            {' '}
            <span aria-hidden='true'>↗</span>
        </a>
    )
}

export interface StatusPageProps extends PropsWithChildren {
    title: string
    description: string
    backTo?: string
    backLabel?: string
    actions?: ReactNode
}

/**
 * Provides consistent headings, breadcrumbs/back links, and page actions.
 *
 * @param props page title, description, navigation, actions, and body.
 * @returns Status page frame.
 * @throws Does not throw.
 */
export const StatusPage: FC<StatusPageProps> = props => (
    <section className={styles.page}>
        {props.backTo && (
            <Link className={styles.backLink} to={props.backTo}>
                <span aria-hidden='true'>←</span>
                {' '}
                {props.backLabel || 'Back'}
            </Link>
        )}
        <header className={styles.pageHeader}>
            <div>
                <h1>{props.title}</h1>
                <p>{props.description}</p>
            </div>
            {props.actions && <div className={styles.actions}>{props.actions}</div>}
        </header>
        {props.children}
    </section>
)

/**
 * Renders a restrained initial loading state that respects reduced motion.
 *
 * @returns accessible loading panel.
 * @throws Does not throw.
 */
export const StatusLoading: FC = () => (
    <div aria-live='polite' className={styles.loading} role='status'>
        <span aria-hidden='true' />
        Loading status data…
    </div>
)

/**
 * Renders a complete, source-backed empty result distinct from unavailable data.
 *
 * @param props explanatory empty-state content.
 * @returns empty-state panel.
 * @throws Does not throw.
 */
export const CompleteEmptyState: FC<PropsWithChildren> = props => (
    <div className={styles.emptyState} role='status'>{props.children}</div>
)

/**
 * Renders a standard read-only refresh button.
 *
 * @param props refresh handler and in-progress state.
 * @returns refresh control.
 * @throws Does not throw.
 */
export const RefreshButton: FC<{ onRefresh: () => void; refreshing?: boolean }> = props => (
    <button
        aria-label='Refresh status data'
        className={styles.refreshButton}
        disabled={props.refreshing}
        onClick={props.onRefresh}
        type='button'
    >
        <span aria-hidden='true'>↻</span>
        {' '}
        {props.refreshing ? 'Refreshing…' : 'Refresh'}
    </button>
)

/**
 * Visually groups related Status content under an accessible heading.
 *
 * @param props heading and child content.
 * @returns content panel.
 * @throws Does not throw.
 */
export const StatusPanel: FC<PropsWithChildren<{ title?: string }>> = props => (
    <section className={styles.panel}>
        {props.title && <h2 className={styles.panelTitle}>{props.title}</h2>}
        {props.children}
    </section>
)
