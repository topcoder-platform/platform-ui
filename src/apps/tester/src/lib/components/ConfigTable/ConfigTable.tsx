import { FC } from 'react'

import type {
    DesignConfig,
    First2FinishConfig,
    FlowConfigUnion,
    FlowVariant,
    FullChallengeConfig,
    TopgearConfig,
} from '../../types'

import styles from './ConfigTable.module.scss'

type ConfigEntry = {
    label: string
    value: string
}

type Props = {
    flow: FlowVariant
    config: FlowConfigUnion
}

const formatString = (value?: string): string => (
    value && value.trim().length > 0 ? value.trim() : '-'
)

const formatNumber = (value?: number): string => (
    typeof value === 'number' && !Number.isNaN(value) ? String(value) : '-'
)

const formatList = (items?: string[]): string => (
    Array.isArray(items) && items.length > 0 ? items.join(', ') : '-'
)

const formatPrizeList = (items?: number[]): string => (
    Array.isArray(items) && items.length > 0
        ? items.map(item => String(item))
            .join(', ')
        : '-'
)

const buildFullEntries = (config: FullChallengeConfig): ConfigEntry[] => ([
    { label: 'Challenge name prefix', value: formatString(config.challengeNamePrefix) },
    { label: 'Project ID', value: formatNumber(config.projectId) },
    { label: 'Challenge Type ID', value: formatString(config.challengeTypeId) },
    { label: 'Challenge Track ID', value: formatString(config.challengeTrackId) },
    { label: 'Timeline Template ID', value: formatString(config.timelineTemplateId) },
    { label: 'Copilot handle', value: formatString(config.copilotHandle) },
    { label: 'Screener handle', value: formatString(config.screener) },
    { label: 'Reviewers', value: formatList(config.reviewers) },
    { label: 'Submitters', value: formatList(config.submitters) },
    {
        label: 'Submissions per submitter',
        value: formatNumber(config.submissionsPerSubmitter),
    },
    { label: 'Scorecard ID', value: formatString(config.scorecardId) },
    { label: 'Prizes', value: formatPrizeList(config.prizes) },
    { label: 'Submission zip path', value: formatString(config.submissionZipPath) },
])

const buildIterativeEntries = (
    config: First2FinishConfig | TopgearConfig,
): ConfigEntry[] => ([
    { label: 'Challenge name prefix', value: formatString(config.challengeNamePrefix) },
    { label: 'Project ID', value: formatNumber(config.projectId) },
    { label: 'Challenge Type ID', value: formatString(config.challengeTypeId) },
    { label: 'Challenge Track ID', value: formatString(config.challengeTrackId) },
    { label: 'Timeline Template ID', value: formatString(config.timelineTemplateId) },
    { label: 'Copilot handle', value: formatString(config.copilotHandle) },
    { label: 'Iterative Reviewer', value: formatString(config.reviewer) },
    { label: 'Submitters', value: formatList(config.submitters) },
    { label: 'Scorecard ID', value: formatString(config.scorecardId) },
    { label: 'Prize', value: formatNumber(config.prize) },
    { label: 'Submission zip path', value: formatString(config.submissionZipPath) },
])

const buildDesignEntries = (config: DesignConfig): ConfigEntry[] => ([
    { label: 'Challenge name prefix', value: formatString(config.challengeNamePrefix) },
    { label: 'Project ID', value: formatNumber(config.projectId) },
    { label: 'Challenge Type ID', value: formatString(config.challengeTypeId) },
    { label: 'Challenge Track ID', value: formatString(config.challengeTrackId) },
    { label: 'Timeline Template ID', value: formatString(config.timelineTemplateId) },
    { label: 'Copilot handle', value: formatString(config.copilotHandle) },
    { label: 'Reviewer', value: formatString(config.reviewer) },
    {
        label: 'Screener',
        value: formatString(config.screener || config.screeningReviewer || config.reviewer),
    },
    {
        label: 'Approver',
        value: formatString(config.approver || config.reviewer),
    },
    {
        label: 'Checkpoint Screener',
        value: formatString(
            config.checkpointScreener
                || config.screener
                || config.screeningReviewer
                || config.reviewer,
        ),
    },
    {
        label: 'Checkpoint Reviewer',
        value: formatString(config.checkpointReviewer || config.reviewer),
    },
    { label: 'Submitters', value: formatList(config.submitters) },
    {
        label: 'Submissions per submitter',
        value: formatNumber(config.submissionsPerSubmitter),
    },
    {
        label: 'Review Scorecard ID',
        value: formatString(config.reviewScorecardId || config.scorecardId),
    },
    {
        label: 'Screening Scorecard ID',
        value: formatString(config.screeningScorecardId || config.scorecardId),
    },
    {
        label: 'Approval Scorecard ID',
        value: formatString(config.approvalScorecardId || config.scorecardId),
    },
    {
        label: 'Checkpoint Screening Scorecard ID',
        value: formatString(
            config.checkpointScreeningScorecardId || config.checkpointScorecardId,
        ),
    },
    {
        label: 'Checkpoint Review Scorecard ID',
        value: formatString(
            config.checkpointReviewScorecardId || config.checkpointScorecardId,
        ),
    },
    { label: 'Prizes', value: formatPrizeList(config.prizes) },
    { label: 'Submission zip path', value: formatString(config.submissionZipPath) },
])

export const ConfigTable: FC<Props> = (props: Props) => {
    const entries = props.flow === 'full' || props.flow === 'designSingle'
        ? buildFullEntries(props.config as FullChallengeConfig)
        : props.flow === 'design' || props.flow === 'designFailScreening' || props.flow === 'designFailReview'
            ? buildDesignEntries(props.config as DesignConfig)
            : buildIterativeEntries(props.config as First2FinishConfig | TopgearConfig)

    return (
        <div className={styles.container}>
            <h3>Current Configuration</h3>
            <div className={styles.grid}>
                {entries.map(entry => (
                    <div key={entry.label} className={styles.item}>
                        <span className={styles.label}>{entry.label}</span>
                        <span className={styles.value}>{entry.value}</span>
                    </div>
                ))}
            </div>
            <div className={styles.note}>
                Note: M2M token generation secrets are read from
                <code>server/secrets/m2m.json</code>
                .
            </div>
        </div>
    )
}

export default ConfigTable
