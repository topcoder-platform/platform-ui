/* eslint-disable ordered-imports/ordered-imports */
import { FC } from 'react'
import { NavLink } from 'react-router-dom'
import classNames from 'classnames'

import { OpportunityKind, OpportunitySummary } from '../models'

import { ReactComponent as CompetitionIcon } from '../assets/competition.svg'
import { ReactComponent as CopilotIcon } from '../assets/copilot.svg'
import { ReactComponent as EngagementIcon } from '../assets/engagement.svg'
import { ReactComponent as ReviewIcon } from '../assets/review.svg'
import styles from './OpportunityHero.module.scss'

interface OpportunityHeroProps {
    active: OpportunityKind
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
 * Renders the dark Opportunities masthead and the four Figma navigation cells.
 *
 * @param props active cell and the single-call aggregation summary.
 * @returns hero navigation for all opportunity types.
 * @throws Does not throw.
 */
export const OpportunityHero: FC<OpportunityHeroProps> = props => (
    <section className={styles.hero}>
        <div className={styles.map} aria-hidden='true' />
        <div className={styles.inner}>
            <div className={styles.breadcrumbs}>
                <NavLink to='/opportunities'>Opportunities</NavLink>
                <span>/</span>
                <span>{cells.find(cell => cell.kind === props.active)?.label}</span>
            </div>
            <h1>
                Find your next
                {' '}
                <span>opportunity</span>
            </h1>
            <p className={styles.subtitle}>
                Explore and participate in opportunities that match your skills and interests.
            </p>
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
                            <Icon />
                            <span className={styles.cellCopy}>
                                <strong>{cell.label}</strong>
                                <span>{cell.description}</span>
                                <span className={styles.metrics}>
                                    <small>{`${summary?.count ?? 0} open`}</small>
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
        </div>
    </section>
)
