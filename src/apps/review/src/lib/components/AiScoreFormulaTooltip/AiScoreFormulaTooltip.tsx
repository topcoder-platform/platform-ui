import { FC } from 'react'
import classNames from 'classnames'

import { AiReviewConfig, AiReviewConfigWorkflow } from '../../models'

import styles from './AiScoreFormulaTooltip.module.scss'

interface AiScoreFormulaTooltipProps {
    aiReviewConfig: AiReviewConfig | undefined,
}

export function formatScore(value?: number | null): string {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '-'
    }

    return value.toFixed(2)
}

export function formatWeight(value?: number): string {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '-'
    }

    return `${value.toFixed(0)}%`
}

const AiScoreFormulaTooltip: FC<AiScoreFormulaTooltipProps> = props => {

    const configuredWorkflows: AiReviewConfigWorkflow[] = props.aiReviewConfig?.workflows ?? []

    if (!props.aiReviewConfig || !configuredWorkflows.length) {
        return <></>
    }

    const formulaLines = configuredWorkflows.map((workflow, i) => {
        const label = workflow.workflow?.name ?? 'AI Reviewer'
        return `${!i ? '' : '+ '}${formatWeight(workflow.weightPercent)} * ${label}`
    })

    return (
        <div className={styles.infoTooltipContent}>
            <div className={styles.infoTooltipRow}>
                <strong>Min Passing Score</strong>
                <span>{formatScore(props.aiReviewConfig.minPassingThreshold)}</span>
            </div>

            <div className={styles.infoTooltipTitle}>
                AI Score Formula
            </div>

            <div className={styles.infoTooltipLine}>
                Overall Score =
                {
                    formulaLines[0]
                }
            </div>

            {formulaLines.slice(1)
                .map(line => (
                    <div
                        key={line}
                        className={classNames(styles.infoTooltipLine, styles.indent)}
                    >
                        {line}
                    </div>
                ))}
        </div>
    )
}

export default AiScoreFormulaTooltip
