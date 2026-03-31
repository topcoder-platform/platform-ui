/* eslint-disable complexity, sort-keys */
import { FC } from 'react'

import type {
    DesignConfig,
    First2FinishConfig,
    FlowConfig,
    FlowVariant,
    FullChallengeConfig,
    TopgearConfig,
} from './types'

interface ConfigTableProps {
    config: FlowConfig
    flow: FlowVariant
}

type ConfigEntry = {
    label: string
    value: number | string
}

/**
 * Renders a compact summary of the active flow configuration.
 */
const ConfigTable: FC<ConfigTableProps> = (props: ConfigTableProps) => {
    const entries = (
        props.flow === 'full' || props.flow === 'designSingle'
            ? buildFullEntries(props.config as FullChallengeConfig)
            : props.flow === 'design'
                || props.flow === 'designFailScreening'
                || props.flow === 'designFailReview'
                ? buildDesignEntries(props.config as DesignConfig)
                : buildIterativeEntries(props.config as First2FinishConfig | TopgearConfig)
    )

    return (
        <div className='qa-card'>
            <h3 style={{ marginTop: 0 }}>Current Configuration</h3>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 12,
                    marginBottom: 12,
                }}
            >
                {entries.map(entry => (
                    <div
                        key={entry.label}
                        style={{
                            border: '1px solid #dbe3f0',
                            borderRadius: 10,
                            background: '#f8fafc',
                            padding: '10px 12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            minHeight: 60,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 12,
                                color: '#475569',
                                textTransform: 'uppercase',
                                letterSpacing: 0.4,
                            }}
                        >
                            {entry.label}
                        </span>
                        <span
                            style={{
                                fontSize: 14,
                                color: '#0f172a',
                                wordBreak: 'break-word',
                            }}
                        >
                            {entry.value}
                        </span>
                    </div>
                ))}
            </div>
            <small className='qa-inline-note'>
                Configuration is persisted per user in the QA service.
            </small>
        </div>
    )
}

/**
 * Builds the summary rows for full-style challenge configs.
 *
 * @param config Full challenge config.
 * @returns Config summary rows.
 */
function buildFullEntries(config: FullChallengeConfig): ConfigEntry[] {
    return [
        { label: 'Challenge name prefix', value: config.challengeNamePrefix.trim() || '-' },
        { label: 'Project ID', value: config.projectId || '-' },
        { label: 'Challenge Type ID', value: config.challengeTypeId || '-' },
        { label: 'Challenge Track ID', value: config.challengeTrackId || '-' },
        { label: 'Timeline Template ID', value: config.timelineTemplateId || '-' },
        { label: 'Copilot handle', value: config.copilotHandle.trim() || '-' },
        { label: 'Screener handle', value: (config.screener || '').trim() || '-' },
        {
            label: 'Reviewers',
            value: config.reviewers.length ? config.reviewers.join(', ') : '-',
        },
        {
            label: 'Submitters',
            value: config.submitters.length ? config.submitters.join(', ') : '-',
        },
        { label: 'Submissions per submitter', value: config.submissionsPerSubmitter || '-' },
        { label: 'Scorecard ID', value: config.scorecardId || '-' },
        {
            label: 'Prizes',
            value: config.prizes.length ? config.prizes.join(', ') : '-',
        },
        { label: 'Submission zip path', value: config.submissionZipPath.trim() || '-' },
    ]
}

/**
 * Builds the summary rows for iterative challenge configs.
 *
 * @param config Iterative flow config.
 * @returns Config summary rows.
 */
function buildIterativeEntries(
    config: First2FinishConfig | TopgearConfig,
): ConfigEntry[] {
    return [
        { label: 'Challenge name prefix', value: config.challengeNamePrefix.trim() || '-' },
        { label: 'Project ID', value: config.projectId || '-' },
        { label: 'Challenge Type ID', value: config.challengeTypeId || '-' },
        { label: 'Challenge Track ID', value: config.challengeTrackId || '-' },
        { label: 'Timeline Template ID', value: config.timelineTemplateId || '-' },
        { label: 'Copilot handle', value: config.copilotHandle.trim() || '-' },
        { label: 'Iterative Reviewer', value: config.reviewer.trim() || '-' },
        {
            label: 'Submitters',
            value: config.submitters.length ? config.submitters.join(', ') : '-',
        },
        { label: 'Scorecard ID', value: config.scorecardId || '-' },
        {
            label: 'Prize',
            value: typeof config.prize === 'number' ? config.prize : '-',
        },
        { label: 'Submission zip path', value: config.submissionZipPath.trim() || '-' },
    ]
}

/**
 * Builds the summary rows for design challenge configs.
 *
 * @param config Design flow config.
 * @returns Config summary rows.
 */
function buildDesignEntries(config: DesignConfig): ConfigEntry[] {
    return [
        { label: 'Challenge name prefix', value: config.challengeNamePrefix.trim() || '-' },
        { label: 'Project ID', value: config.projectId || '-' },
        { label: 'Challenge Type ID', value: config.challengeTypeId || '-' },
        { label: 'Challenge Track ID', value: config.challengeTrackId || '-' },
        { label: 'Timeline Template ID', value: config.timelineTemplateId || '-' },
        { label: 'Copilot handle', value: config.copilotHandle.trim() || '-' },
        { label: 'Reviewer', value: config.reviewer.trim() || '-' },
        {
            label: 'Screener',
            value: (config.screener || config.screeningReviewer || config.reviewer || '').trim() || '-',
        },
        {
            label: 'Approver',
            value: (config.approver || config.reviewer || '').trim() || '-',
        },
        {
            label: 'Checkpoint Screener',
            value: (
                config.checkpointScreener
                || config.screener
                || config.screeningReviewer
                || config.reviewer
                || ''
            ).trim() || '-',
        },
        {
            label: 'Checkpoint Reviewer',
            value: (config.checkpointReviewer || config.reviewer || '').trim() || '-',
        },
        {
            label: 'Submitters',
            value: config.submitters.length ? config.submitters.join(', ') : '-',
        },
        { label: 'Submissions per submitter', value: config.submissionsPerSubmitter || '-' },
        { label: 'Review Scorecard ID', value: config.reviewScorecardId || config.scorecardId || '-' },
        {
            label: 'Screening Scorecard ID',
            value: config.screeningScorecardId || config.scorecardId || '-',
        },
        {
            label: 'Approval Scorecard ID',
            value: config.approvalScorecardId || config.scorecardId || '-',
        },
        {
            label: 'Checkpoint Screening Scorecard ID',
            value: config.checkpointScreeningScorecardId || config.checkpointScorecardId || '-',
        },
        {
            label: 'Checkpoint Review Scorecard ID',
            value: config.checkpointReviewScorecardId || config.checkpointScorecardId || '-',
        },
        { label: 'Prizes', value: config.prizes.length ? config.prizes.join(', ') : '-' },
        { label: 'Submission zip path', value: config.submissionZipPath.trim() || '-' },
    ]
}

export default ConfigTable
