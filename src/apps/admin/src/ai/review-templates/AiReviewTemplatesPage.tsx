import { ChangeEvent, FC, useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import _ from 'lodash'

import { BaseModal, Button, FormToggleSwitch, IconOutline, InputSelect, InputSelectOption } from '~/libs/ui'

import { ConfirmModal, PageWrapper, TableLoading, TableNoRecord } from '../../lib'
import { TableWrapper } from '../../lib/components/common/TableWrapper'
import { ChallengeTrack, ChallengeType } from '../../lib/models'
import { getChallengeTracks, getChallengeTypes } from '../../lib/services/challenge-management.service'
import { AiWorkflow } from '../../lib/services/ai-workflows.service'
import {
    AiReviewTemplate,
    AiReviewTemplatesFilter,
    deleteAiReviewTemplate,
    getAiReviewTemplates,
    TemplateWorkflowItem,
    updateAiReviewTemplate,
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
    onEdit: (template: AiReviewTemplate) => void
    onDelete: (template: AiReviewTemplate) => void
    onToggleDisabled: (template: AiReviewTemplate) => void
}

const TemplateItem: FC<TemplateItemProps> = (props: TemplateItemProps) => {
    const [expanded, setExpanded] = useState(true)
    const workflows = props.template.workflows || []

    const handleToggleExpand = useCallback(() => {
        setExpanded(prev => !prev)
    }, [])

    const handleEditClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        props.onEdit(props.template)
    }, [props])

    const handleDeleteClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        props.onDelete(props.template)
    }, [props])

    const handleToggleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        props.onToggleDisabled(props.template)
    }, [props])

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
                        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,
                            jsx-a11y/no-static-element-interactions */}
                        <div className={styles.toggleWrapper} onClick={handleToggleClick}>
                            <span className={styles.toggleLabel}>Active</span>
                            <FormToggleSwitch
                                name={`active-${props.template.id}`}
                                value={!props.template.disabled}
                                onChange={_.noop}
                            />
                        </div>
                        <button
                            type='button'
                            className={styles.editButton}
                            onClick={handleEditClick}
                            title='Edit template'
                        >
                            <IconOutline.PencilIcon />
                        </button>
                        <button
                            type='button'
                            className={styles.deleteButton}
                            onClick={handleDeleteClick}
                            title='Delete template'
                        >
                            <IconOutline.TrashIcon />
                        </button>
                    </div>
                </div>
                {props.template.description && (
                    <div className={styles.templateDescription}>
                        {props.template.description}
                    </div>
                )}
                <div className={styles.templateMetas}>
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
    const [editTemplate, setEditTemplate] = useState<AiReviewTemplate | undefined>(undefined)
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; template?: AiReviewTemplate }>({
        open: false,
    })
    const [isDeleting, setIsDeleting] = useState(false)
    const [toggleModal, setToggleModal] = useState<{ open: boolean; template?: AiReviewTemplate }>({
        open: false,
    })
    const [isToggling, setIsToggling] = useState(false)
    const [disabledWorkflowsModal, setDisabledWorkflowsModal] = useState<{
        open: boolean;
        workflowNames: string[];
    }>({ open: false, workflowNames: [] })

    const trackOptions: InputSelectOption[] = useMemo(() => {
        const seen = new Set<string>()
        const options: InputSelectOption[] = [{ label: 'All Tracks', value: '' }]
        for (const t of tracks) {
            const trackValue: string = (t as ChallengeTrack & { track?: string }).track || t.name.toUpperCase()
            if (!seen.has(trackValue)) {
                seen.add(trackValue)
                options.push({ label: t.name, value: trackValue })
            }
        }

        return options
    }, [tracks])

    const typeOptions: InputSelectOption[] = useMemo(() => {
        const seen = new Set<string>()
        const options: InputSelectOption[] = [{ label: 'All Types', value: '' }]
        for (const t of types) {
            if (!seen.has(t.name)) {
                seen.add(t.name)
                options.push({ label: t.name, value: t.name })
            }
        }

        return options
    }, [types])

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
        setEditTemplate(undefined)
        setCreateModalOpen(true)
    }, [])

    const handleCloseCreateModal = useCallback(() => {
        setCreateModalOpen(false)
        setEditTemplate(undefined)
    }, [])

    const handleEditClick = useCallback((template: AiReviewTemplate) => {
        setEditTemplate(template)
        setCreateModalOpen(true)
    }, [])

    const handleTemplateCreated = useCallback(() => {
        loadTemplates(filter)
    }, [filter, loadTemplates])

    const handleDeleteClick = useCallback((template: AiReviewTemplate) => {
        setDeleteModal({ open: true, template })
    }, [])

    const handleCloseDeleteModal = useCallback(() => {
        setDeleteModal({ open: false })
    }, [])

    const handleConfirmDelete = useCallback(async () => {
        if (!deleteModal.template) return
        setIsDeleting(true)
        try {
            await deleteAiReviewTemplate(deleteModal.template.id)
            setDeleteModal({ open: false })
            loadTemplates(filter)
        } catch {
            // Error handling can be added here
        } finally {
            setIsDeleting(false)
        }
    }, [deleteModal.template, filter, loadTemplates])

    const handleToggleClick = useCallback((template: AiReviewTemplate) => {
        // When trying to activate a disabled template, check for disabled workflows
        if (template.disabled) {
            const disabledWorkflows = (template.workflows || [])
                .filter(item => item.workflow.disabled)
                .map(item => item.workflow.name)

            if (disabledWorkflows.length > 0) {
                setDisabledWorkflowsModal({ open: true, workflowNames: disabledWorkflows })

                return
            }
        }

        setToggleModal({ open: true, template })
    }, [])

    const handleCloseToggleModal = useCallback(() => {
        setToggleModal({ open: false })
    }, [])

    const handleCloseDisabledWorkflowsModal = useCallback(() => {
        setDisabledWorkflowsModal({ open: false, workflowNames: [] })
    }, [])

    const handleConfirmToggle = useCallback(async () => {
        if (!toggleModal.template) return
        setIsToggling(true)
        const newDisabledState = !toggleModal.template.disabled
        try {
            await updateAiReviewTemplate(toggleModal.template.id, {
                disabled: newDisabledState,
            })
            setTemplates(prev => prev.map(t => (
                t.id === toggleModal.template?.id
                    ? { ...t, disabled: newDisabledState }
                    : t
            )))
            toast.success(`Template ${newDisabledState ? 'deactivated' : 'activated'} successfully`)
            setToggleModal({ open: false })
        } catch (error) {
            toast.error('Failed to update template')
        } finally {
            setIsToggling(false)
        }
    }, [toggleModal.template])

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
                                onEdit={handleEditClick}
                                onDelete={handleDeleteClick}
                                onToggleDisabled={handleToggleClick}
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
                template={editTemplate}
            />

            <BaseModal
                title='Delete Template'
                open={deleteModal.open}
                onClose={handleCloseDeleteModal}
                buttons={(
                    <>
                        <Button
                            secondary
                            size='lg'
                            label='Cancel'
                            onClick={handleCloseDeleteModal}
                            disabled={isDeleting}
                        />
                        <Button
                            primary
                            variant='danger'
                            size='lg'
                            label='Delete'
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            loading={isDeleting}
                        />
                    </>
                )}
            >
                Are you sure you want to delete the template
                {' '}
                &quot;
                {deleteModal.template?.title || deleteModal.template?.id}
                &quot;? This action cannot be undone.
            </BaseModal>

            <ConfirmModal
                title='Confirm Status Change'
                action={toggleModal.template?.disabled ? 'Activate' : 'Deactivate'}
                open={toggleModal.open}
                onClose={handleCloseToggleModal}
                onConfirm={handleConfirmToggle}
                isLoading={isToggling}
            >
                <p>
                    Are you sure you want to
                    {' '}
                    <strong>{toggleModal.template?.disabled ? 'activate' : 'deactivate'}</strong>
                    {' '}
                    the template
                    {' '}
                    <strong>{toggleModal.template?.title || toggleModal.template?.id}</strong>
                    ?
                </p>
            </ConfirmModal>

            <BaseModal
                title='Cannot Activate Template'
                open={disabledWorkflowsModal.open}
                onClose={handleCloseDisabledWorkflowsModal}
                buttons={(
                    <Button
                        primary
                        size='lg'
                        label='OK'
                        onClick={handleCloseDisabledWorkflowsModal}
                    />
                )}
            >
                <p>
                    This template cannot be activated because the following workflow(s) are disabled:
                </p>
                <ul>
                    {disabledWorkflowsModal.workflowNames.map(name => (
                        <li key={name}><strong>{name}</strong></li>
                    ))}
                </ul>
                <p>
                    Please enable these workflows first before activating this template.
                </p>
            </BaseModal>
        </PageWrapper>
    )
}

export default AiReviewTemplatesPage
