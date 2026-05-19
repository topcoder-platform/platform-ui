import { ChangeEvent, FC, useCallback, useEffect, useMemo, useState } from 'react'

import { Button, InputSelect, InputSelectOption } from '~/libs/ui'

import { PageWrapper, TableLoading, TableNoRecord } from '../../lib'
import { TableWrapper } from '../../lib/components/common/TableWrapper'
import { ChallengeTrack, ChallengeType } from '../../lib/models'
import { getChallengeTracks, getChallengeTypes } from '../../lib/services/challenge-management.service'
import { AiWorkflow } from '../../lib/services/ai-workflows.service'
import {
    AiReviewTemplate,
    AiReviewTemplatesFilter,
    getAiReviewTemplates,
    TemplateWorkflowItem,
} from '../../lib/services/ai-templates.service'
import { WorkflowDetailsModal } from '../review-workflows/WorkflowDetailsModal'

import { CreateTemplateModal } from './CreateTemplateModal'
import styles from './AiReviewTemplatesPage.module.scss'

interface WorkflowItemProps {
    item: TemplateWorkflowItem
    onClick: (workflow: AiWorkflow) => void
}

const WorkflowItem: FC<WorkflowItemProps> = (props: WorkflowItemProps) => {
    const workflow: AiWorkflow = props.item.workflow

    const handleClick = useCallback(() => {
        props.onClick(workflow)
    }, [props, workflow])

    return (
        <div
            className={styles.workflowItem}
            onClick={handleClick}
            role='button'
            tabIndex={0}
        >
            <div className={styles.workflowLeft}>
                <span className={styles.treeLine}>└─</span>
                <div className={styles.workflowNameWrap}>
                    <span className={workflow.disabled ? styles.workflowNameDisabled : styles.workflowName}>
                        {workflow.name}
                    </span>
                    {workflow.disabled && (
                        <span className={styles.workflowHint}>This workflow is disabled</span>
                    )}
                </div>
            </div>
            <div className={styles.workflowRight}>
                {props.item.isGating && (
                    <span className={styles.workflowGating}>Gating</span>
                )}
                <span className={styles.workflowWeight}>
                    {props.item.weightPercent}
                    %
                </span>
            </div>
        </div>
    )
}

interface TemplateItemProps {
    template: AiReviewTemplate
    onWorkflowClick: (workflow: AiWorkflow) => void
}

const TemplateItem: FC<TemplateItemProps> = (props: TemplateItemProps) => {
    const [expanded, setExpanded] = useState(true)
    const workflows = props.template.workflows || []

    const handleToggleExpand = useCallback(() => {
        setExpanded(prev => !prev)
    }, [])

    return (
        <div className={styles.templateItem}>
            <div
                className={styles.templateHeader}
                onClick={handleToggleExpand}
                role='button'
                tabIndex={0}
            >
                <div className={styles.templateHeaderTop}>
                    <div className={styles.templateHeaderLeft}>
                        <span className={styles.expandIcon}>{expanded ? '▼' : '▶'}</span>
                        <span className={styles.templateName}>
                            {props.template.title || props.template.id}
                        </span>
                    </div>
                    <div className={styles.templateHeaderRight}>
                        <span className={styles.templateMeta}>
                            {props.template.challengeTrack}
                            {' / '}
                            {props.template.challengeType}
                        </span>
                        <span className={styles.modeBadge}>{props.template.mode}</span>
                        <span className={styles.thresholdBadge}>
                            Pass:
                            {' '}
                            {props.template.minPassingThreshold}
                            %
                        </span>
                    </div>
                </div>
                {props.template.description && (
                    <div className={styles.templateDescription}>
                        {props.template.description}
                    </div>
                )}
            </div>
            {expanded && workflows.length > 0 && (
                <div className={styles.workflowsTree}>
                    {workflows.map(item => (
                        <WorkflowItem
                            key={item.id}
                            item={item}
                            onClick={props.onWorkflowClick}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export const AiReviewTemplatesPage: FC = () => {
    const [isLoading, setIsLoading] = useState(true)
    const [templates, setTemplates] = useState<AiReviewTemplate[]>([])
    const [tracks, setTracks] = useState<ChallengeTrack[]>([])
    const [types, setTypes] = useState<ChallengeType[]>([])
    const [filter, setFilter] = useState<AiReviewTemplatesFilter>({})
    const [detailModal, setDetailModal] = useState<{ open: boolean; workflow?: AiWorkflow }>({
        open: false,
    })
    const [createModalOpen, setCreateModalOpen] = useState(false)

    const trackOptions: InputSelectOption[] = useMemo(() => [
        { label: 'All Tracks', value: '' },
        ...tracks.map(t => {
            const trackValue: string = (t as ChallengeTrack & { track?: string }).track || t.name.toUpperCase()
            return { label: t.name, value: trackValue }
        }),
    ], [tracks])

    const typeOptions: InputSelectOption[] = useMemo(() => [
        { label: 'All Types', value: '' },
        ...types.map(t => ({ label: t.name, value: t.abbreviation })),
    ], [types])

    useEffect(() => {
        getChallengeTracks()
            .then(setTracks)
            .catch(() => setTracks([]))
        getChallengeTypes()
            .then(setTypes)
            .catch(() => setTypes([]))
    }, [])

    const loadTemplates = useCallback((filterParams: AiReviewTemplatesFilter) => {
        setIsLoading(true)
        getAiReviewTemplates(filterParams)
            .then(data => {
                setTemplates(data || [])
            })
            .catch(() => {
                setTemplates([])
            })
            .finally(() => setIsLoading(false))
    }, [])

    useEffect(() => {
        loadTemplates(filter)
    }, [filter, loadTemplates])

    const handleTrackChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setFilter(prev => ({ ...prev, challengeTrack: event.target.value || undefined }))
    }, [])

    const handleTypeChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setFilter(prev => ({ ...prev, challengeType: event.target.value || undefined }))
    }, [])

    const handleReset = useCallback(() => {
        setFilter({})
    }, [])

    const handleWorkflowClick = useCallback((workflow: AiWorkflow) => {
        setDetailModal({ open: true, workflow })
    }, [])

    const handleCloseDetail = useCallback(() => {
        setDetailModal({ open: false })
    }, [])

    const handleOpenCreateModal = useCallback(() => {
        setCreateModalOpen(true)
    }, [])

    const handleCloseCreateModal = useCallback(() => {
        setCreateModalOpen(false)
    }, [])

    const handleTemplateCreated = useCallback(() => {
        loadTemplates(filter)
    }, [filter, loadTemplates])

    const hasFilters: boolean = !!filter.challengeTrack || !!filter.challengeType

    return (
        <PageWrapper pageTitle='AI Review Templates'>
            <div className={styles.filtersWrapper}>
                <div className={styles.filters}>
                    <InputSelect
                        name='challengeTrack'
                        label='Challenge Track'
                        options={trackOptions}
                        value={filter.challengeTrack || ''}
                        onChange={handleTrackChange}
                        tabIndex={0}
                    />
                    <InputSelect
                        name='challengeType'
                        label='Challenge Type'
                        options={typeOptions}
                        value={filter.challengeType || ''}
                        onChange={handleTypeChange}
                        tabIndex={0}
                    />
                    {hasFilters && (
                        <Button
                            secondary
                            size='md'
                            label='Reset'
                            onClick={handleReset}
                        />
                    )}
                </div>
                <Button
                    primary
                    size='md'
                    label='Create Template'
                    onClick={handleOpenCreateModal}
                />
            </div>

            <TableWrapper>

                {isLoading && <TableLoading />}

                {!isLoading && templates.length === 0 && (
                    <TableNoRecord message='No templates found.' />
                )}

                {!isLoading && templates.length > 0 && (
                    <div className={styles.templatesList}>
                        {templates.map(template => (
                            <TemplateItem
                                key={template.id}
                                template={template}
                                onWorkflowClick={handleWorkflowClick}
                            />
                        ))}
                    </div>
                )}
            </TableWrapper>

            <WorkflowDetailsModal
                workflow={detailModal.workflow}
                open={detailModal.open}
                onClose={handleCloseDetail}
            />

            <CreateTemplateModal
                open={createModalOpen}
                onClose={handleCloseCreateModal}
                onCreated={handleTemplateCreated}
            />
        </PageWrapper>
    )
}

export default AiReviewTemplatesPage
