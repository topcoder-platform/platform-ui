import {
    ChangeEvent,
    FC,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import classNames from 'classnames'

import { Button } from '~/libs/ui'

import { ConfirmationModal } from '../../../../../lib/components'
import {
    useFetchChallengeTracks,
    useFetchChallengeTypes,
} from '../../../../../lib/hooks'
import {
    AiReviewConfig,
    AiReviewConfigWorkflow,
    AiReviewTemplate,
    Reviewer,
    Workflow,
} from '../../../../../lib/models'
import {
    createAiReviewConfig,
    deleteAiReviewConfig,
    fetchAiReviewConfigByChallenge,
    fetchAiReviewTemplates,
    fetchWorkflows,
    SaveAiReviewConfigInput,
    updateAiReviewConfig,
} from '../../../../../lib/services'
import {
    showErrorToast,
    showSuccessToast,
} from '../../../../../lib/utils'

import {
    aiReviewConfigHasChanges,
    AiReviewConfigurationDraft,
    isAiReviewer,
    normalizeReviewerText,
    normalizeTrackForAiTemplates,
    validateAiReviewConfiguration,
} from './reviewers-field.utils'
import styles from './AiReviewTab.module.scss'

interface AiReviewTabProps {
    challengeId?: string
    hasSubmissions?: boolean
    reviewers?: Reviewer[]
    trackId?: string
    typeId?: string
    onConfigPersisted?: (config: AiReviewConfig) => void
}

type ConfigurationMode = 'manual' | 'template'

interface WorkflowAssignmentRowProps {
    assignedWorkflowIds: Set<string>
    availableWorkflowMap: Map<string, Workflow>
    emptyMessage: string
    workflows: AiReviewConfigWorkflow[]
}

interface ManualWorkflowEditorProps {
    assignedWorkflowIds: Set<string>
    availableWorkflows: Workflow[]
    onRemove: (workflowKey: string) => void
    onUpdate: (
        workflowKey: string,
        field: keyof AiReviewConfigWorkflow,
        value: boolean | number | string,
    ) => void
    readOnly: boolean
    workflow: AiReviewConfigWorkflow
    workflowKey: string
    workflowNumber: number
}

interface ReviewSettingsProps {
    configuration: AiReviewConfigurationDraft
    onUpdate: <K extends keyof AiReviewConfigurationDraft>(
        field: K,
        value: AiReviewConfigurationDraft[K],
    ) => void
    readOnly: boolean
}

const DEFAULT_CONFIGURATION: AiReviewConfigurationDraft = {
    autoFinalize: false,
    minPassingThreshold: 75,
    mode: 'AI_GATING',
    templateId: undefined,
    workflows: [],
}

let workflowDraftIdCounter = 0

function getNextWorkflowDraftId(): string {
    workflowDraftIdCounter += 1

    return `ai-review-workflow-${workflowDraftIdCounter}`
}

function toDraftWorkflow(
    workflow: Partial<AiReviewConfigWorkflow>,
): AiReviewConfigWorkflow {
    return {
        ...workflow,
        id: normalizeReviewerText(workflow.id) || getNextWorkflowDraftId(),
        isGating: workflow.isGating === true,
        weightPercent: Number(workflow.weightPercent || 0),
        workflow: workflow.workflow,
        workflowId: normalizeReviewerText(workflow.workflowId),
    }
}

function getWorkflowDraftKey(
    workflow: AiReviewConfigWorkflow,
): string {
    return normalizeReviewerText(workflow.id) || getNextWorkflowDraftId()
}

function getWorkflowDisplayName(
    workflow: AiReviewConfigWorkflow,
    availableWorkflowMap: Map<string, Workflow>,
): string {
    const workflowId = normalizeReviewerText(workflow.workflowId)
    const workflowDetails = workflow.workflow || availableWorkflowMap.get(workflowId)

    return normalizeReviewerText(workflowDetails?.name) || workflowId || 'Unknown workflow'
}

function getWorkflowScorecardLabel(
    workflow: AiReviewConfigWorkflow,
    availableWorkflowMap: Map<string, Workflow>,
): string {
    const workflowId = normalizeReviewerText(workflow.workflowId)
    const workflowDetails = workflow.workflow || availableWorkflowMap.get(workflowId)
    const scorecardName = normalizeReviewerText(workflow.workflow?.scorecard?.name)
    const scorecardId = normalizeReviewerText(workflow.workflow?.scorecard?.id)
        || normalizeReviewerText(workflowDetails?.scorecardId)

    return scorecardName || scorecardId || 'Not linked'
}

function normalizeConfiguration(
    configuration: AiReviewConfigurationDraft,
    challengeId: string,
): SaveAiReviewConfigInput {
    return {
        autoFinalize: configuration.mode === 'AI_ONLY' && configuration.autoFinalize === true,
        challengeId,
        formula: undefined,
        minPassingThreshold: Number(configuration.minPassingThreshold || 0),
        mode: configuration.mode || 'AI_GATING',
        templateId: configuration.templateId || undefined,
        workflows: (configuration.workflows || [])
            .map(workflow => ({
                isGating: workflow.isGating === true,
                weightPercent: Number(workflow.weightPercent || 0),
                workflow: workflow.workflow,
                workflowId: normalizeReviewerText(workflow.workflowId),
            })),
    }
}

function mapConfigToDraft(config: AiReviewConfig): AiReviewConfigurationDraft {
    return {
        autoFinalize: config.autoFinalize,
        minPassingThreshold: config.minPassingThreshold,
        mode: config.mode,
        templateId: config.templateId || undefined,
        workflows: config.workflows.map(toDraftWorkflow),
    }
}

const WorkflowAssignmentTable: FC<WorkflowAssignmentRowProps> = (
    props: WorkflowAssignmentRowProps,
) => {
    if (!props.workflows.length) {
        return <div className={styles.emptyState}>{props.emptyMessage}</div>
    }

    return (
        <div className={styles.workflowTableWrapper}>
            <table className={styles.workflowTable}>
                <thead>
                    <tr>
                        <th>Workflow</th>
                        <th>Weight</th>
                        <th>Type</th>
                        <th>Scorecard</th>
                        <th>Challenge Sync</th>
                    </tr>
                </thead>
                <tbody>
                    {props.workflows.map(workflow => {
                        const workflowId = normalizeReviewerText(workflow.workflowId)
                        const isAssigned = props.assignedWorkflowIds.has(workflowId)

                        return (
                            <tr key={`${workflowId}-${workflow.weightPercent}-${workflow.isGating}`}>
                                <td>{getWorkflowDisplayName(workflow, props.availableWorkflowMap)}</td>
                                <td>
                                    {Number(workflow.weightPercent || 0)}
                                    %
                                </td>
                                <td>
                                    <span className={classNames(
                                        styles.workflowType,
                                        workflow.isGating
                                            ? styles.gatingType
                                            : styles.scoringType,
                                    )}
                                    >
                                        {workflow.isGating ? 'Gate' : 'Review'}
                                    </span>
                                </td>
                                <td>{getWorkflowScorecardLabel(workflow, props.availableWorkflowMap)}</td>
                                <td>
                                    <span className={classNames(
                                        styles.syncStatus,
                                        isAssigned
                                            ? styles.syncStatusAssigned
                                            : styles.syncStatusPending,
                                    )}
                                    >
                                        {isAssigned ? 'Assigned' : 'Pending sync'}
                                    </span>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

const ManualWorkflowEditor: FC<ManualWorkflowEditorProps> = (
    props: ManualWorkflowEditorProps,
) => {
    const workflowId = normalizeReviewerText(props.workflow.workflowId)
    const isAssigned = props.assignedWorkflowIds.has(workflowId)
    const handleWorkflowChange = useCallback(
        (event: ChangeEvent<HTMLSelectElement>): void => {
            props.onUpdate(props.workflowKey, 'workflowId', event.target.value)
        },
        [props],
    )
    const handleWeightChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>): void => {
            props.onUpdate(props.workflowKey, 'weightPercent', Number(event.target.value || 0))
        },
        [props],
    )
    const handleGatingChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>): void => {
            props.onUpdate(props.workflowKey, 'isGating', event.target.checked)
        },
        [props],
    )
    const handleRemove = useCallback((): void => {
        props.onRemove(props.workflowKey)
    }, [props])

    return (
        <div className={styles.workflowEditorCard}>
            <div className={styles.workflowEditorHeader}>
                <div>
                    <h4>
                        Workflow
                        {props.workflowNumber}
                    </h4>
                    <p>Choose the AI workflow, its scoring weight, and whether it acts as a gate.</p>
                </div>
                {!props.readOnly
                    ? (
                        <Button
                            label='Remove'
                            onClick={handleRemove}
                            secondary
                            size='sm'
                        />
                    )
                    : undefined}
            </div>

            <div className={styles.workflowEditorGrid}>
                <label className={styles.fieldGroup}>
                    <span>AI Workflow</span>
                    <select
                        disabled={props.readOnly}
                        onChange={handleWorkflowChange}
                        value={workflowId}
                    >
                        <option value=''>Select workflow</option>
                        {props.availableWorkflows.map(item => (
                            <option key={item.id} value={item.id}>
                                {item.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label className={styles.fieldGroup}>
                    <span>Weight (%)</span>
                    <input
                        disabled={props.readOnly}
                        max={100}
                        min={0}
                        onChange={handleWeightChange}
                        step={1}
                        type='number'
                        value={Number(props.workflow.weightPercent || 0)}
                    />
                </label>

                <label className={styles.checkboxField}>
                    <input
                        checked={props.workflow.isGating === true}
                        disabled={props.readOnly}
                        onChange={handleGatingChange}
                        type='checkbox'
                    />
                    <span>Use as gating workflow</span>
                </label>
            </div>

            {workflowId
                ? (
                    <div className={classNames(
                        styles.assignmentBanner,
                        isAssigned
                            ? styles.assignmentBannerAssigned
                            : styles.assignmentBannerPending,
                    )}
                    >
                        {isAssigned
                            ? 'This workflow is already synced to the challenge reviewer list.'
                            : 'This workflow will sync into the challenge reviewer list after autosave succeeds.'}
                    </div>
                )
                : undefined}
        </div>
    )
}

const ReviewSettings: FC<ReviewSettingsProps> = (
    props: ReviewSettingsProps,
) => {
    const minPassingThreshold = Number(props.configuration.minPassingThreshold || 0)
    const mode = props.configuration.mode || 'AI_GATING'
    const handleModeChange = useCallback(
        (event: ChangeEvent<HTMLSelectElement>): void => {
            props.onUpdate('mode', event.target.value as AiReviewConfigurationDraft['mode'])
        },
        [props],
    )
    const handleThresholdChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>): void => {
            props.onUpdate('minPassingThreshold', Number(event.target.value || 0))
        },
        [props],
    )
    const handleAutoFinalizeChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>): void => {
            props.onUpdate('autoFinalize', event.target.checked)
        },
        [props],
    )

    return (
        <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
                <h3>Review Settings</h3>
                <p>Define how AI review decisions should be weighted and applied.</p>
            </div>

            <div className={styles.settingsGrid}>
                <label className={styles.fieldGroup}>
                    <span>Review Mode</span>
                    <select
                        disabled={props.readOnly}
                        onChange={handleModeChange}
                        value={mode}
                    >
                        <option value='AI_GATING'>AI_GATING</option>
                        <option value='AI_ONLY'>AI_ONLY</option>
                    </select>
                    <small>
                        {mode === 'AI_GATING'
                            ? 'AI blocks low-quality submissions and lets the rest continue to human review.'
                            : 'AI makes the final decision for all submissions.'}
                    </small>
                </label>

                <label className={styles.fieldGroup}>
                    <span>Minimum Passing Threshold</span>
                    <input
                        disabled={props.readOnly}
                        max={100}
                        min={0}
                        onChange={handleThresholdChange}
                        step={1}
                        type='range'
                        value={minPassingThreshold}
                    />
                    <small>
                        {minPassingThreshold}
                        %
                    </small>
                </label>

                <label className={styles.checkboxField}>
                    <input
                        checked={props.configuration.autoFinalize === true}
                        disabled={props.readOnly || mode !== 'AI_ONLY'}
                        onChange={handleAutoFinalizeChange}
                        type='checkbox'
                    />
                    <span>Auto-finalize AI decisions</span>
                </label>
            </div>
        </section>
    )
}

// eslint-disable-next-line complexity
export const AiReviewTab: FC<AiReviewTabProps> = (
    props: AiReviewTabProps,
) => {
    const normalizedChallengeId = normalizeReviewerText(props.challengeId)
    const readOnly = props.hasSubmissions === true
    const onConfigPersisted = props.onConfigPersisted
    const reviewers = props.reviewers
    const trackId = props.trackId
    const typeId = props.typeId
    const lastSavedConfigurationRef = useRef<AiReviewConfig | AiReviewConfigurationDraft | undefined>()
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>()

    const [availableWorkflows, setAvailableWorkflows] = useState<Workflow[]>([])
    const [configuration, setConfiguration] = useState<AiReviewConfigurationDraft>(DEFAULT_CONFIGURATION)
    const [configurationMode, setConfigurationMode] = useState<ConfigurationMode | undefined>()
    const [configId, setConfigId] = useState<string | undefined>()
    const [isConfigLoading, setIsConfigLoading] = useState<boolean>(true)
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [isWorkflowsLoading, setIsWorkflowsLoading] = useState<boolean>(false)
    const [loadError, setLoadError] = useState<string | undefined>()
    const [pendingSwitchMode, setPendingSwitchMode] = useState<ConfigurationMode | undefined>()
    const [showSwitchConfirmation, setShowSwitchConfirmation] = useState<boolean>(false)
    const [templateError, setTemplateError] = useState<string | undefined>()
    const [templates, setTemplates] = useState<AiReviewTemplate[]>([])
    const [templatesLoading, setTemplatesLoading] = useState<boolean>(false)

    const challengeTracks = useFetchChallengeTracks().tracks
    const challengeTypes = useFetchChallengeTypes().challengeTypes

    const selectedTrackName = useMemo(
        () => challengeTracks.find(
            track => normalizeReviewerText(track.id) === normalizeReviewerText(trackId),
        )
            ?.track
            || challengeTracks.find(
                track => normalizeReviewerText(track.id) === normalizeReviewerText(trackId),
            )
                ?.name
            || challengeTracks.find(
                track => normalizeReviewerText(track.id) === normalizeReviewerText(trackId),
            )
                ?.abbreviation
            || '',
        [challengeTracks, trackId],
    )
    const selectedTypeName = useMemo(
        () => challengeTypes.find(
            type => normalizeReviewerText(type.id) === normalizeReviewerText(typeId),
        )
            ?.name
            || '',
        [challengeTypes, typeId],
    )
    const aiReviewers = useMemo(
        () => (reviewers || []).filter(isAiReviewer),
        [reviewers],
    )
    const assignedWorkflowIds = useMemo(
        () => new Set(
            aiReviewers
                .map(reviewer => normalizeReviewerText(reviewer.aiWorkflowId))
                .filter(Boolean),
        ),
        [aiReviewers],
    )
    const availableWorkflowMap = useMemo(
        () => new Map(availableWorkflows.map(workflow => [
            normalizeReviewerText(workflow.id),
            workflow,
        ])),
        [availableWorkflows],
    )
    const selectedTemplate = useMemo(
        () => templates.find(template => template.id === configuration.templateId),
        [configuration.templateId, templates],
    )
    const normalizedConfiguration = useMemo(
        (): SaveAiReviewConfigInput | undefined => (
            normalizedChallengeId
                ? normalizeConfiguration(configuration, normalizedChallengeId)
                : undefined
        ),
        [configuration, normalizedChallengeId],
    )
    const validationErrors = useMemo(
        () => (normalizedConfiguration
            ? validateAiReviewConfiguration(normalizedConfiguration)
            : []),
        [normalizedConfiguration],
    )
    const totalWorkflowWeight = useMemo(
        () => (configuration.workflows || [])
            .reduce((sum, workflow) => sum + Number(workflow.weightPercent || 0), 0),
        [configuration.workflows],
    )

    const updateConfiguration = useCallback(
        <K extends keyof AiReviewConfigurationDraft>(
            field: K,
            value: AiReviewConfigurationDraft[K],
        ): void => {
            setConfiguration(previousConfiguration => {
                if (field === 'mode') {
                    const nextMode = value as AiReviewConfigurationDraft['mode']

                    return {
                        ...previousConfiguration,
                        autoFinalize: nextMode === 'AI_ONLY'
                            ? previousConfiguration.autoFinalize
                            : false,
                        mode: nextMode,
                    }
                }

                return {
                    ...previousConfiguration,
                    [field]: value,
                }
            })
        },
        [],
    )

    const addWorkflow = useCallback((): void => {
        setConfiguration(previousConfiguration => ({
            ...previousConfiguration,
            workflows: [
                ...(previousConfiguration.workflows || []),
                toDraftWorkflow({
                    isGating: false,
                    weightPercent: 0,
                    workflowId: '',
                }),
            ],
        }))
    }, [])

    const updateWorkflow = useCallback(
        (
            workflowKey: string,
            field: keyof AiReviewConfigWorkflow,
            value: boolean | number | string,
        ): void => {
            setConfiguration(previousConfiguration => ({
                ...previousConfiguration,
                workflows: (previousConfiguration.workflows || []).map(workflow => {
                    if (getWorkflowDraftKey(workflow) !== workflowKey) {
                        return workflow
                    }

                    return {
                        ...workflow,
                        [field]: value,
                    }
                }),
            }))
        },
        [],
    )

    const removeWorkflow = useCallback((workflowKey: string): void => {
        setConfiguration(previousConfiguration => ({
            ...previousConfiguration,
            workflows: (previousConfiguration.workflows || []).filter(
                workflow => getWorkflowDraftKey(workflow) !== workflowKey,
            ),
        }))
    }, [])

    const resetConfiguration = useCallback((): void => {
        setConfiguration(DEFAULT_CONFIGURATION)
        setConfigId(undefined)
        lastSavedConfigurationRef.current = DEFAULT_CONFIGURATION
    }, [])

    const handleTemplateSelect = useCallback(
        (templateId: string): void => {
            const selected = templates.find(template => template.id === templateId)
            if (!selected) {
                setConfiguration(previousConfiguration => ({
                    ...previousConfiguration,
                    templateId: undefined,
                    workflows: [],
                }))
                return
            }

            setConfiguration({
                autoFinalize: selected.autoFinalize,
                minPassingThreshold: selected.minPassingThreshold,
                mode: selected.mode,
                templateId: selected.id,
                workflows: selected.workflows.map(toDraftWorkflow),
            })
        },
        [templates],
    )

    const performModeSwitch = useCallback(async (targetMode: ConfigurationMode): Promise<void> => {
        setPendingSwitchMode(undefined)
        setShowSwitchConfirmation(false)

        if (targetMode === 'template') {
            if (configId) {
                try {
                    await deleteAiReviewConfig(configId)
                } catch (error) {
                    showErrorToast(error instanceof Error
                        ? error.message
                        : 'Failed to remove AI review configuration')
                    return
                }
            }

            resetConfiguration()
            setConfigurationMode('template')
            return
        }

        setConfigurationMode('manual')
    }, [configId, resetConfiguration])

    const requestModeSwitch = useCallback(
        (targetMode: ConfigurationMode): void => {
            if (targetMode === configurationMode) {
                return
            }

            const hasChanges = aiReviewConfigHasChanges(
                lastSavedConfigurationRef.current,
                normalizedConfiguration,
            )
                || (targetMode === 'manual' && !!configuration.templateId)
            if (hasChanges) {
                setPendingSwitchMode(targetMode)
                setShowSwitchConfirmation(true)
                return
            }

            performModeSwitch(targetMode)
                .catch(() => undefined)
        },
        [configuration.templateId, configurationMode, normalizedConfiguration, performModeSwitch],
    )

    const handleRemoveConfiguration = useCallback(async (): Promise<void> => {
        if (configId) {
            try {
                await deleteAiReviewConfig(configId)
                showSuccessToast('AI review configuration removed')
            } catch (error) {
                showErrorToast(error instanceof Error
                    ? error.message
                    : 'Failed to remove AI review configuration')
                return
            }
        }

        resetConfiguration()
        setConfigurationMode(undefined)
    }, [configId, resetConfiguration])
    const handleChooseTemplateClick = useCallback((): void => {
        setConfigurationMode('template')
    }, [])
    const handleChooseManualClick = useCallback((): void => {
        setConfigurationMode('manual')
    }, [])
    const handleSwitchToManualClick = useCallback((): void => {
        requestModeSwitch('manual')
    }, [requestModeSwitch])
    const handleSwitchToTemplateClick = useCallback((): void => {
        requestModeSwitch('template')
    }, [requestModeSwitch])
    const handleTemplateChange = useCallback(
        (event: ChangeEvent<HTMLSelectElement>): void => {
            handleTemplateSelect(event.target.value)
        },
        [handleTemplateSelect],
    )
    const handleRemoveConfigurationClick = useCallback((): void => {
        handleRemoveConfiguration()
            .catch(() => undefined)
    }, [handleRemoveConfiguration])
    const handleCancelSwitchConfirmation = useCallback((): void => {
        setPendingSwitchMode(undefined)
        setShowSwitchConfirmation(false)
    }, [])
    const handleConfirmSwitchConfirmation = useCallback((): void => {
        if (!pendingSwitchMode) {
            return
        }

        performModeSwitch(pendingSwitchMode)
            .catch(() => undefined)
    }, [pendingSwitchMode, performModeSwitch])
    const templateSwitchMessage = 'Your current manual AI review configuration will be discarded before '
        + 'switching to template mode.'
    const manualSwitchMessage = 'The selected template values will be carried into manual mode so you can '
        + 'continue editing them.'

    useEffect(() => {
        let mounted = true

        setIsWorkflowsLoading(true)
        setLoadError(undefined)

        fetchWorkflows()
            .then(fetchedWorkflows => {
                if (!mounted) {
                    return
                }

                setAvailableWorkflows(fetchedWorkflows)
            })
            .catch(error => {
                if (!mounted) {
                    return
                }

                setLoadError(error instanceof Error
                    ? error.message
                    : 'Failed to load AI workflows')
            })
            .finally(() => {
                if (mounted) {
                    setIsWorkflowsLoading(false)
                }
            })

        return () => {
            mounted = false
        }
    }, [])

    useEffect(() => {
        let mounted = true

        if (!normalizedChallengeId) {
            setConfiguration(DEFAULT_CONFIGURATION)
            setConfigurationMode(undefined)
            setConfigId(undefined)
            setIsConfigLoading(false)
            lastSavedConfigurationRef.current = DEFAULT_CONFIGURATION
            return undefined
        }

        setIsConfigLoading(true)
        setLoadError(undefined)

        fetchAiReviewConfigByChallenge(normalizedChallengeId)
            .then(config => {
                if (!mounted) {
                    return
                }

                if (!config) {
                    setConfiguration(DEFAULT_CONFIGURATION)
                    setConfigurationMode(undefined)
                    setConfigId(undefined)
                    lastSavedConfigurationRef.current = DEFAULT_CONFIGURATION
                    return
                }

                const nextConfiguration = mapConfigToDraft(config)
                setConfiguration(nextConfiguration)
                setConfigurationMode(config.templateId ? 'template' : 'manual')
                setConfigId(config.id)
                lastSavedConfigurationRef.current = config
                onConfigPersisted?.(config)
            })
            .catch(error => {
                if (!mounted) {
                    return
                }

                setLoadError(error instanceof Error
                    ? error.message
                    : 'Failed to load AI review configuration')
            })
            .finally(() => {
                if (mounted) {
                    setIsConfigLoading(false)
                }
            })

        return () => {
            mounted = false
        }
    }, [normalizedChallengeId, onConfigPersisted])

    useEffect(() => {
        let mounted = true

        if (configurationMode !== 'template' || !selectedTrackName || !selectedTypeName) {
            setTemplates([])
            setTemplateError(undefined)
            return undefined
        }

        setTemplatesLoading(true)
        setTemplateError(undefined)

        fetchAiReviewTemplates({
            challengeTrack: normalizeTrackForAiTemplates(selectedTrackName),
            challengeType: selectedTypeName,
        })
            .then(fetchedTemplates => {
                if (!mounted) {
                    return
                }

                setTemplates(fetchedTemplates)
            })
            .catch(error => {
                if (!mounted) {
                    return
                }

                setTemplateError(error instanceof Error
                    ? error.message
                    : 'Failed to load AI review templates')
            })
            .finally(() => {
                if (mounted) {
                    setTemplatesLoading(false)
                }
            })

        return () => {
            mounted = false
        }
    }, [configurationMode, selectedTrackName, selectedTypeName])

    useEffect(() => {
        if (!normalizedChallengeId || !configurationMode || !normalizedConfiguration || readOnly) {
            return undefined
        }

        if (
            validationErrors.length
            || !aiReviewConfigHasChanges(lastSavedConfigurationRef.current, normalizedConfiguration)
        ) {
            return undefined
        }

        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current)
        }

        saveTimerRef.current = setTimeout(() => {
            setIsSaving(true)

            const persistConfiguration = async (): Promise<void> => {
                try {
                    const savedConfiguration = configId
                        ? await updateAiReviewConfig(configId, normalizedConfiguration)
                        : await createAiReviewConfig(normalizedConfiguration)
                    const nextConfiguration = mapConfigToDraft(savedConfiguration)

                    setConfigId(savedConfiguration.id)
                    setConfiguration(nextConfiguration)
                    lastSavedConfigurationRef.current = savedConfiguration
                    onConfigPersisted?.(savedConfiguration)
                } catch (error) {
                    showErrorToast(error instanceof Error
                        ? error.message
                        : 'Failed to autosave AI review configuration')
                } finally {
                    setIsSaving(false)
                }
            }

            persistConfiguration()
                .catch(() => undefined)
        }, 1500)

        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current)
            }
        }
    }, [
        configId,
        configurationMode,
        normalizedChallengeId,
        normalizedConfiguration,
        onConfigPersisted,
        readOnly,
        validationErrors,
    ])

    if (isConfigLoading || isWorkflowsLoading) {
        return <div className={styles.loading}>Loading AI review configuration...</div>
    }

    if (loadError) {
        return <div className={styles.error}>{loadError}</div>
    }

    return (
        <div className={styles.container}>
            <div className={styles.headerRow}>
                <div>
                    <h3>AI Review Configuration</h3>
                    <p>
                        Configure AI workflow weighting, gating, and templates for this challenge.
                    </p>
                </div>
                {isSaving
                    ? <span className={styles.saveIndicator}>Autosaving...</span>
                    : undefined}
            </div>

            {readOnly
                ? (
                    <div className={styles.infoBanner}>
                        AI review configuration is locked because this challenge already has submissions.
                    </div>
                )
                : undefined}

            {!configurationMode
                ? (
                    <div className={styles.initialState}>
                        {aiReviewers.length
                            ? (
                                <div className={styles.warningBanner}>
                                    AI workflows are already assigned to this challenge,
                                    but there is no saved AI review configuration yet.
                                </div>
                            )
                            : undefined}

                        <div className={styles.optionGrid}>
                            <div className={styles.optionCard}>
                                <h4>Use a Template</h4>
                                <p>Start from a template defined for this challenge track and type.</p>
                                <Button
                                    disabled={readOnly}
                                    label='Choose template'
                                    onClick={handleChooseTemplateClick}
                                    primary
                                    size='sm'
                                />
                            </div>
                            <div className={styles.optionCard}>
                                <h4>Configure Manually</h4>
                                <p>Build the AI reviewer setup from scratch and tune each workflow.</p>
                                <Button
                                    disabled={readOnly}
                                    label='Configure manually'
                                    onClick={handleChooseManualClick}
                                    primary
                                    size='sm'
                                />
                            </div>
                        </div>

                        <section className={styles.sectionCard}>
                            <div className={styles.sectionHeader}>
                                <h3>Assigned AI Workflows</h3>
                                <p>These workflow reviewers are currently attached to the challenge.</p>
                            </div>
                            <WorkflowAssignmentTable
                                assignedWorkflowIds={assignedWorkflowIds}
                                availableWorkflowMap={availableWorkflowMap}
                                emptyMessage='No AI reviewer workflows are currently assigned.'
                                workflows={aiReviewers
                                    .map(reviewer => ({
                                        isGating: false,
                                        weightPercent: 0,
                                        workflow: availableWorkflowMap.get(
                                            normalizeReviewerText(reviewer.aiWorkflowId),
                                        ),
                                        workflowId: normalizeReviewerText(reviewer.aiWorkflowId),
                                    }))
                                    .filter(workflow => !!workflow.workflowId)}
                            />
                        </section>
                    </div>
                )
                : undefined}

            {configurationMode === 'template'
                ? (
                    <>
                        <div className={styles.modeRow}>
                            <div className={styles.modePill}>Template configuration</div>
                            {!readOnly
                                ? (
                                    <Button
                                        label='Switch to manual'
                                        onClick={handleSwitchToManualClick}
                                        secondary
                                        size='sm'
                                    />
                                )
                                : undefined}
                        </div>

                        <section className={styles.sectionCard}>
                            <div className={styles.sectionHeader}>
                                <h3>Template</h3>
                                <p>Templates are filtered by the selected challenge track and type.</p>
                            </div>

                            <label className={styles.fieldGroup}>
                                <span>AI Review Template</span>
                                <select
                                    disabled={readOnly || templatesLoading}
                                    onChange={handleTemplateChange}
                                    value={configuration.templateId || ''}
                                >
                                    <option value=''>Select template</option>
                                    {templates.map(template => (
                                        <option key={template.id} value={template.id}>
                                            {template.title}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {templateError
                                ? <div className={styles.error}>{templateError}</div>
                                : undefined}
                            {selectedTemplate
                                ? <p className={styles.templateDescription}>{selectedTemplate.description}</p>
                                : undefined}
                        </section>

                        <section className={styles.sectionCard}>
                            <div className={styles.sectionHeader}>
                                <h3>Template Workflows</h3>
                                <p>
                                    Template workflows will sync into the challenge reviewers
                                    after autosave succeeds.
                                </p>
                            </div>
                            <WorkflowAssignmentTable
                                assignedWorkflowIds={assignedWorkflowIds}
                                availableWorkflowMap={availableWorkflowMap}
                                emptyMessage='Select a template to preview its workflows.'
                                workflows={configuration.workflows || []}
                            />
                        </section>
                    </>
                )
                : undefined}

            {configurationMode === 'manual'
                ? (
                    <>
                        <div className={styles.modeRow}>
                            <div className={styles.modePill}>Manual configuration</div>
                            {!readOnly
                                ? (
                                    <Button
                                        label='Switch to template'
                                        onClick={handleSwitchToTemplateClick}
                                        secondary
                                        size='sm'
                                    />
                                )
                                : undefined}
                        </div>

                        <ReviewSettings
                            configuration={configuration}
                            onUpdate={updateConfiguration}
                            readOnly={readOnly}
                        />

                        <section className={styles.sectionCard}>
                            <div className={styles.sectionHeader}>
                                <h3>AI Workflows</h3>
                                <p>Add one or more workflows and assign their scoring weights.</p>
                            </div>

                            <div className={styles.workflowEditors}>
                                {(configuration.workflows || []).map((workflow, index) => (
                                    <ManualWorkflowEditor
                                        assignedWorkflowIds={assignedWorkflowIds}
                                        availableWorkflows={availableWorkflows}
                                        key={getWorkflowDraftKey(workflow)}
                                        onRemove={removeWorkflow}
                                        onUpdate={updateWorkflow}
                                        readOnly={readOnly}
                                        workflow={workflow}
                                        workflowKey={getWorkflowDraftKey(workflow)}
                                        workflowNumber={index + 1}
                                    />
                                ))}
                            </div>

                            {!readOnly
                                ? (
                                    <Button
                                        label='Add AI workflow'
                                        onClick={addWorkflow}
                                        primary
                                        size='sm'
                                    />
                                )
                                : undefined}
                        </section>
                    </>
                )
                : undefined}

            {configurationMode
                ? (
                    <section className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <h3>Validation</h3>
                            <p>Workflow weights must total 100% before the configuration can be saved.</p>
                        </div>

                        <div className={classNames(
                            styles.validationCard,
                            validationErrors.length
                                ? styles.validationCardInvalid
                                : styles.validationCardValid,
                        )}
                        >
                            <div>
                                Total workflow weight:
                                {totalWorkflowWeight.toFixed(2)}
                                %
                            </div>
                            {validationErrors.length
                                ? (
                                    <ul className={styles.validationList}>
                                        {validationErrors.map(validationError => (
                                            <li key={validationError}>{validationError}</li>
                                        ))}
                                    </ul>
                                )
                                : <div>Configuration is valid and ready to autosave.</div>}
                        </div>
                    </section>
                )
                : undefined}

            {configurationMode
                ? (
                    <section className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <h3>Summary</h3>
                            <p>Quick overview of the current AI review setup.</p>
                        </div>

                        <div className={styles.summaryGrid}>
                            <div className={styles.summaryCard}>
                                <span className={styles.summaryLabel}>Mode</span>
                                <strong>{configuration.mode || 'AI_GATING'}</strong>
                            </div>
                            <div className={styles.summaryCard}>
                                <span className={styles.summaryLabel}>Threshold</span>
                                <strong>
                                    {Number(configuration.minPassingThreshold || 0)}
                                    %
                                </strong>
                            </div>
                            <div className={styles.summaryCard}>
                                <span className={styles.summaryLabel}>Workflows</span>
                                <strong>{(configuration.workflows || []).length}</strong>
                            </div>
                        </div>
                    </section>
                )
                : undefined}

            {configurationMode
                ? (
                    <section className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <h3>Workflow Summary</h3>
                            <p>
                                Saved AI config workflows and their challenge reviewer sync status.
                            </p>
                        </div>
                        <WorkflowAssignmentTable
                            assignedWorkflowIds={assignedWorkflowIds}
                            availableWorkflowMap={availableWorkflowMap}
                            emptyMessage='No workflows configured yet.'
                            workflows={configuration.workflows || []}
                        />
                    </section>
                )
                : undefined}

            {configurationMode && !readOnly
                ? (
                    <div className={styles.footerActions}>
                        <Button
                            label='Remove AI config'
                            onClick={handleRemoveConfigurationClick}
                            secondary
                            size='sm'
                        />
                    </div>
                )
                : undefined}

            {showSwitchConfirmation && pendingSwitchMode
                ? (
                    <ConfirmationModal
                        cancelText='Cancel'
                        confirmText={pendingSwitchMode === 'template'
                            ? 'Switch to template'
                            : 'Switch to manual'}
                        message={pendingSwitchMode === 'template'
                            ? templateSwitchMessage
                            : manualSwitchMessage}
                        onCancel={handleCancelSwitchConfirmation}
                        onConfirm={handleConfirmSwitchConfirmation}
                        title='Switch AI review mode?'
                    />
                )
                : undefined}
        </div>
    )
}

export default AiReviewTab
