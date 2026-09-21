/* eslint-disable ordered-imports/ordered-imports, react/jsx-no-bind */
import { FC } from 'react'
import { NavLink } from 'react-router-dom'
import classNames from 'classnames'

import {
    OpportunityKind,
    OpportunitySummary,
} from '../models'

import { ReactComponent as CompetitionIcon } from '../assets/competition.svg'
import { ReactComponent as CopilotIcon } from '../assets/copilot.svg'
import { ReactComponent as EngagementIcon } from '../assets/engagement.svg'
import { ReactComponent as ReviewIcon } from '../assets/review.svg'
import styles from './OpportunityHero.module.scss'

interface OpportunityHeroProps {
    active: OpportunityKind
    error?: boolean
    loading?: boolean
    onRetry?: () => void
    summary?: OpportunitySummary
}

interface CellConfig {
    description: string
    icon: FC
    kind: OpportunityKind
    label: string
}

const cells: CellConfig[] = [
    {
        description: 'Compete & win prizes',
        icon: CompetitionIcon,
        kind: 'competitions',
        label: 'Competitions',
    },
    {
        description: 'Contract work with clients',
        icon: EngagementIcon,
        kind: 'engagements',
        label: 'Engagements',
    },
    {
        description: 'Lead & coordinate competitions',
        icon: CopilotIcon,
        kind: 'copilots',
        label: 'Copilot Opportunities',
    },
    {
        description: 'Evaluate submissions to earn',
        icon: ReviewIcon,
        kind: 'reviews',
        label: 'Review Opportunities',
    },
]

/**
 * Formats compact currency used in the opportunity summary cells.
 *
 * @param value amount in US dollars.
 * @returns compact currency text such as `$38.5k`.
 * @throws Does not throw.
 */
function formatCompactCurrency(value?: number): string | undefined {
    if (value === undefined) return undefined
    return new Intl.NumberFormat('en-US', {
        currency: 'USD',
        maximumFractionDigits: 1,
        notation: 'compact',
        style: 'currency',
    })
        .format(value)
        .replace('K', 'k')
}

/**
 * Renders the canonical Opportunities masthead and compact category selector.
 * Member-owned results remain available through each category's filters.
 *
 * @param props active category, public summaries, and retry callback.
 * @returns dark masthead followed by the four opportunity category cards.
 * @throws Does not throw.
 */
export const OpportunityHero: FC<OpportunityHeroProps> = props => (
    <div className={styles.shell}>
        <section className={styles.hero}>
            <div className={styles.inner}>
                <div className={styles.breadcrumbs}>
                    <NavLink to='/opportunities'>Opportunities</NavLink>
                    <span>/</span>
                    <span>{cells.find(cell => cell.kind === props.active)?.label}</span>
                </div>
                <div className={styles.titleBlock}>
                    <h1>
                        Find your next
                        {' '}
                        <span>opportunity</span>
                    </h1>
                    <p className={styles.subtitle}>
                        Explore and participate in opportunities that match your skills and interests.
                    </p>
                </div>
                {props.error && (
                    <div className={styles.summaryError} role='alert'>
                        <span>Live opportunity totals are temporarily unavailable.</span>
                        <button onClick={props.onRetry} type='button'>Try again</button>
                    </div>
                )}
            </div>
        </section>
        <section className={styles.browseTypes}>
            <div className={styles.map} aria-hidden='true' />
            <nav aria-label='Opportunity types' className={styles.cells}>
                {cells.map((cell: CellConfig) => {
                    const Icon = cell.icon
                    const summary = props.summary?.[cell.kind]
                    const amount = summary?.amountLabel ?? formatCompactCurrency(summary?.amount)
                    return (
                        <NavLink
                            aria-current={props.active === cell.kind ? 'page' : undefined}
                            className={classNames(styles.cell, {
                                [styles.active]: props.active === cell.kind,
                            })}
                            key={cell.kind}
                            to={`/opportunities/${cell.kind}`}
                        >
                            <Icon aria-hidden='true' />
                            <span className={styles.cellContent}>
                                <span className={styles.cellCopy}>
                                    <strong>{cell.label}</strong>
                                    <span>{cell.description}</span>
                                </span>
                                <span className={styles.metrics}>
                                    <small>
                                        {`${(props.loading || props.error) && !summary
                                            ? '—'
                                            : summary?.count ?? 0} open`}
                                    </small>
                                    {amount && (
                                        <small>
                                            {`${amount} ${cell.kind === 'copilots' ? 'available' : 'prizes'}`}
                                        </small>
                                    )}
                                    {summary?.tag && <small>{summary.tag}</small>}
                                </span>
                            </span>
                        </NavLink>
                    )
                })}
            </nav>
        </section>
    </div>
)
