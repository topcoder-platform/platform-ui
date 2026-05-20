import { FC } from 'react'

import { EnvironmentConfig } from '~/config'
import { BaseModal, Button } from '~/libs/ui'
import { MarkdownReview } from '~/apps/review/src/lib/components/MarkdownReview'

import { AiWorkflow } from '../../lib/services/ai-workflows.service'

import styles from './WorkflowDetailsModal.module.scss'

interface SectionProps {
    workflow: AiWorkflow
}

const GeneralSection: FC<SectionProps> = (props: SectionProps) => (
    <div className={styles.section}>
        <h4 className={styles.sectionTitle}>General</h4>
        <div className={styles.grid}>
            <div className={styles.field}>
                <span className={styles.label}>ID</span>
                <span className={styles.value}>{props.workflow.id}</span>
            </div>
            <div className={styles.field}>
                <span className={styles.label}>Name</span>
                <span className={styles.value}>{props.workflow.name}</span>
            </div>
            <div className={styles.field}>
                <span className={styles.label}>Status</span>
                <span className={styles.value}>
                    {props.workflow.disabled ? 'Inactive' : 'Active'}
                </span>
            </div>
            <div className={styles.field}>
                <span className={styles.label}>Definition URL</span>
                <span className={styles.value}>
                    {props.workflow.defUrl ? (
                        <a className={styles.link} href={props.workflow.defUrl} target='_blank' rel='noreferrer'>
                            {props.workflow.defUrl}
                        </a>
                    ) : 'N/A'}
                </span>
            </div>
            <div className={styles.field}>
                <span className={styles.label}>Git Workflow ID</span>
                <span className={styles.value}>{props.workflow.gitWorkflowId || 'N/A'}</span>
            </div>
            <div className={styles.field}>
                <span className={styles.label}>Git Owner/Repo</span>
                <span className={styles.value}>{props.workflow.gitOwnerRepo || 'N/A'}</span>
            </div>
        </div>
        <div className={styles.descriptionField}>
            <span className={styles.label}>Description</span>
            <div className={styles.descriptionValue}>
                {props.workflow.description ? (
                    <MarkdownReview value={props.workflow.description} />
                ) : 'N/A'}
            </div>
        </div>
    </div>
)

const LlmSection: FC<SectionProps> = (props: SectionProps) => (
    <div className={styles.section}>
        <h4 className={styles.sectionTitle}>LLM Configuration</h4>
        <div className={styles.grid}>
            <div className={styles.field}>
                <span className={styles.label}>Provider</span>
                <span className={styles.value}>{props.workflow.llm?.provider?.name || 'N/A'}</span>
            </div>
            <div className={styles.field}>
                <span className={styles.label}>Model</span>
                <span className={styles.value}>{props.workflow.llm?.name || 'N/A'}</span>
            </div>
            <div className={styles.field}>
                <span className={styles.label}>LLM URL</span>
                <span className={styles.value}>
                    {props.workflow.llm?.url ? (
                        <a className={styles.link} href={props.workflow.llm.url} target='_blank' rel='noreferrer'>
                            {props.workflow.llm.url}
                        </a>
                    ) : 'N/A'}
                </span>
            </div>
        </div>
    </div>
)

const ScorecardSection: FC<SectionProps> = (props: SectionProps) => (
    <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Scorecard</h4>
        <div className={styles.grid}>
            <div className={styles.field}>
                <span className={styles.label}>Name</span>
                <span className={styles.value}>
                    {props.workflow.scorecard?.id ? (
                        <a
                            className={styles.link}
                            href={`${EnvironmentConfig.REVIEW_APP_URL}/scorecard/${props.workflow.scorecard.id}`}
                            target='_blank'
                            rel='noreferrer'
                        >
                            {props.workflow.scorecard.name}
                        </a>
                    ) : (props.workflow.scorecard?.name || 'N/A')}
                </span>
            </div>
            <div className={styles.field}>
                <span className={styles.label}>Type</span>
                <span className={styles.value}>{props.workflow.scorecard?.type || 'N/A'}</span>
            </div>
            <div className={styles.field}>
                <span className={styles.label}>Status</span>
                <span className={styles.value}>{props.workflow.scorecard?.status || 'N/A'}</span>
            </div>
        </div>
    </div>
)

interface MetadataSectionProps extends SectionProps {
    createdAt: string
    updatedAt: string
}

const MetadataSection: FC<MetadataSectionProps> = (props: MetadataSectionProps) => (
    <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Metadata</h4>
        <div className={styles.grid}>
            <div className={styles.field}>
                <span className={styles.label}>Created At</span>
                <span className={styles.value}>{props.createdAt}</span>
            </div>
            <div className={styles.field}>
                <span className={styles.label}>Created By</span>
                <span className={styles.value}>{props.workflow.createdBy || 'N/A'}</span>
            </div>
            <div className={styles.field}>
                <span className={styles.label}>Updated At</span>
                <span className={styles.value}>{props.updatedAt}</span>
            </div>
            <div className={styles.field}>
                <span className={styles.label}>Updated By</span>
                <span className={styles.value}>{props.workflow.updatedBy || 'N/A'}</span>
            </div>
        </div>
    </div>
)

interface WorkflowDetailsContentProps {
    workflow: AiWorkflow
    open: boolean
    onClose: () => void
}

const WorkflowDetailsContent: FC<WorkflowDetailsContentProps> = (
    props: WorkflowDetailsContentProps,
) => {
    const createdAtFormatted: string = props.workflow.createdAt
        ? new Date(props.workflow.createdAt)
            .toLocaleString()
        : 'N/A'

    const updatedAtFormatted: string = props.workflow.updatedAt
        ? new Date(props.workflow.updatedAt)
            .toLocaleString()
        : 'N/A'

    return (
        <BaseModal
            open={props.open}
            onClose={props.onClose}
            title='Workflow Details'
            size='body'
            buttons={(
                <Button
                    primary
                    size='lg'
                    label='Close'
                    onClick={props.onClose}
                />
            )}
        >
            <div className={styles.container}>
                <GeneralSection workflow={props.workflow} />
                <LlmSection workflow={props.workflow} />
                <ScorecardSection workflow={props.workflow} />
                <MetadataSection
                    workflow={props.workflow}
                    createdAt={createdAtFormatted}
                    updatedAt={updatedAtFormatted}
                />
            </div>
        </BaseModal>
    )
}

interface WorkflowDetailsModalProps {
    workflow?: AiWorkflow
    open: boolean
    onClose: () => void
}

export const WorkflowDetailsModal: FC<WorkflowDetailsModalProps> = (
    props: WorkflowDetailsModalProps,
) => {
    if (!props.workflow) {
        return <></>
    }

    return (
        <WorkflowDetailsContent
            workflow={props.workflow}
            open={props.open}
            onClose={props.onClose}
        />
    )
}
